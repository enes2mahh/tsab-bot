const {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys')
const QRCode = require('qrcode')
const { createClient } = require('@supabase/supabase-js')
const pino = require('pino')
const path = require('path')
const fs = require('fs')
const Bull = require('bull')
const { SUPABASE_URL, SUPABASE_SERVICE_KEY, REDIS_URL } = require('../config')

const logger = pino({ level: 'silent' })
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const sessions = new Map() // deviceId -> socket

// Bull Queue for bulk sending
const campaignQueue = new Bull('campaigns', REDIS_URL)

class WhatsAppService {
  // ===== INIT DEVICE =====
  async initDevice(deviceId, userId) {
    try {
      const sessionDir = path.join(process.cwd(), 'sessions', deviceId)
      if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true })

      const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
      const { version } = await fetchLatestBaileysVersion()

      const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
      })

      sessions.set(deviceId, sock)

      // Update status to connecting
      await supabase.from('devices').update({ status: 'connecting' }).eq('id', deviceId)

      // QR event
      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
          try {
            const qrBase64 = await QRCode.toDataURL(qr)
            // Emit via Socket.IO
            if (global.io) {
              global.io.to(`device-${deviceId}`).emit('qr', { deviceId, qr: qrBase64 })
            }
          } catch (err) {
            console.error('QR generation error:', err)
          }
        }

        if (connection === 'close') {
          const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
          await supabase.from('devices').update({ status: 'disconnected' }).eq('id', deviceId)

          if (global.io) {
            global.io.to(`device-${deviceId}`).emit('device:disconnected', { deviceId })
          }

          if (shouldReconnect) {
            console.log('Reconnecting device:', deviceId)
            setTimeout(() => this.restoreSession(deviceId), 3000)
          } else {
            sessions.delete(deviceId)
          }
        }

        if (connection === 'open') {
          const phone = sock.user?.id?.split(':')[0]
          await supabase.from('devices').update({
            status: 'connected',
            phone: phone || null,
            last_seen: new Date().toISOString(),
          }).eq('id', deviceId)

          if (global.io) {
            global.io.to(`device-${deviceId}`).emit('device:connected', { deviceId, phone })
          }
          console.log('✅ Device connected:', deviceId, phone)
        }
      })

      // Save credentials
      sock.ev.on('creds.update', saveCreds)

      // Handle incoming messages
      sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return
        for (const msg of messages) {
          if (msg.key.fromMe) continue
          await this.handleIncomingMessage(deviceId, userId, msg, sock)
        }
      })

      return sock
    } catch (err) {
      console.error('initDevice error:', err)
      await supabase.from('devices').update({ status: 'disconnected' }).eq('id', deviceId)
    }
  }

  // ===== GET QR =====
  async getQR(deviceId) {
    // The QR is emitted via events; just ensure session is initialized
    const { data: device } = await supabase.from('devices').select('*').eq('id', deviceId).single()
    if (!device) return null

    if (!sessions.has(deviceId)) {
      await this.initDevice(deviceId, device.user_id)
    }
    return null
  }

  // ===== RESTORE SESSION =====
  async restoreSession(deviceId) {
    const sessionDir = path.join(process.cwd(), 'sessions', deviceId)
    if (!fs.existsSync(sessionDir)) return false

    const { data: device } = await supabase.from('devices').select('*').eq('id', deviceId).single()
    if (!device) return false

    await this.initDevice(deviceId, device.user_id)
    return true
  }

  // ===== RESTORE ALL SESSIONS =====
  async restoreAllSessions() {
    const { data: devices } = await supabase
      .from('devices')
      .select('id, user_id')
      .eq('is_active', true)

    if (!devices) return
    for (const device of devices) {
      try {
        await this.restoreSession(device.id)
      } catch (err) {
        console.error('Restore session error for:', device.id, err)
      }
    }
  }

  // ===== DISCONNECT =====
  async disconnectDevice(deviceId) {
    const sock = sessions.get(deviceId)
    if (sock) {
      await sock.logout()
      sessions.delete(deviceId)
    }
    await supabase.from('devices').update({ status: 'disconnected' }).eq('id', deviceId)

    // Clean session files
    const sessionDir = path.join(process.cwd(), 'sessions', deviceId)
    if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true })
  }

  // ===== HANDLE INCOMING MESSAGE =====
  async handleIncomingMessage(deviceId, userId, msg, sock) {
    const from = msg.key.remoteJid
    const text = msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption || ''

    // Save to DB
    await supabase.from('messages').insert({
      device_id: deviceId,
      user_id: userId,
      direction: 'incoming',
      from_number: from?.split('@')[0],
      type: 'text',
      content: { text },
      status: 'read',
    })

    // Check auto_replies
    const { data: replies } = await supabase
      .from('auto_replies')
      .select('*')
      .eq('device_id', deviceId)
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (replies) {
      for (const reply of replies) {
        let match = false

        if (reply.trigger_type === 'all') match = true
        else if (reply.trigger_type === 'keyword' && text.trim() === reply.trigger_value) match = true
        else if (reply.trigger_type === 'contains' && text.includes(reply.trigger_value)) match = true
        else if (reply.trigger_type === 'starts_with' && text.startsWith(reply.trigger_value)) match = true
        else if (reply.trigger_type === 'first_message') match = true // TODO: check if first

        if (match) {
          const content = reply.response_content
          if (reply.response_type === 'text') {
            await sock.sendMessage(from, { text: content.text })
          }
          // Increment uses_count
          await supabase
            .from('auto_replies')
            .update({ uses_count: reply.uses_count + 1 })
            .eq('id', reply.id)
          break
        }
      }
    }

    // Emit to socket
    if (global.io) {
      global.io.to(`device-${deviceId}`).emit('message:incoming', { deviceId, from, text })
    }

    // Webhook
    const { data: device } = await supabase.from('devices').select('webhook_url').eq('id', deviceId).single()
    if (device?.webhook_url) {
      try {
        const axios = require('axios')
        await axios.post(device.webhook_url, { deviceId, from, text, timestamp: Date.now() }, { timeout: 5000 })
      } catch {}
    }

    // Update messages_received
    await supabase.from('devices').update({ messages_received: supabase.raw('messages_received + 1') }).eq('id', deviceId)
  }

  // ===== SEND FUNCTIONS =====
  async sendText(deviceId, phone, text) {
    const sock = sessions.get(deviceId)
    if (!sock) throw new Error('Device not connected')
    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`
    await sock.sendMessage(jid, { text })
    await supabase.from('devices').update({ messages_sent: supabase.raw('messages_sent + 1') }).eq('id', deviceId)
  }

  async sendImage(deviceId, phone, url, caption = '') {
    const sock = sessions.get(deviceId)
    if (!sock) throw new Error('Device not connected')
    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`
    await sock.sendMessage(jid, { image: { url }, caption })
  }

  async sendDocument(deviceId, phone, url, filename, mimetype) {
    const sock = sessions.get(deviceId)
    if (!sock) throw new Error('Device not connected')
    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`
    await sock.sendMessage(jid, { document: { url }, fileName: filename, mimetype })
  }

  async sendLocation(deviceId, phone, lat, lng, name = '') {
    const sock = sessions.get(deviceId)
    if (!sock) throw new Error('Device not connected')
    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`
    await sock.sendMessage(jid, { location: { degreesLatitude: lat, degreesLongitude: lng, name } })
  }

  async sendButtons(deviceId, phone, data) {
    const sock = sessions.get(deviceId)
    if (!sock) throw new Error('Device not connected')
    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`
    await sock.sendMessage(jid, {
      text: data.body,
      footer: data.footer,
      buttons: data.buttons.map((b, i) => ({ buttonId: `btn${i}`, buttonText: { displayText: b }, type: 1 })),
      headerType: 1,
    })
  }

  async sendList(deviceId, phone, data) {
    const sock = sessions.get(deviceId)
    if (!sock) throw new Error('Device not connected')
    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`
    await sock.sendMessage(jid, {
      text: data.body,
      footer: data.footer,
      title: data.title,
      buttonText: data.button_text,
      sections: data.sections,
    })
  }

  // ===== BULK SEND (Campaign) =====
  async createCampaignJobs(campaignId, contacts, message, delayMin = 3, delayMax = 7) {
    const jobs = contacts.map((contact, i) => ({
      data: { campaignId, contact, message },
      opts: {
        delay: i * (delayMin + Math.random() * (delayMax - delayMin)) * 1000,
        attempts: 3,
        backoff: 5000,
      },
    }))

    await campaignQueue.addBulk(jobs)
  }
}

// Campaign queue processor
const whatsappService = new WhatsAppService()

campaignQueue.process(async (job) => {
  const { campaignId, contact, message } = job.data
  const { data: campaign } = await supabase.from('campaigns').select('device_id').eq('id', campaignId).single()
  if (!campaign) return

  try {
    await whatsappService.sendText(campaign.device_id, contact.phone, message.text)
    await supabase
      .from('campaigns')
      .update({ sent_count: supabase.raw('sent_count + 1') })
      .eq('id', campaignId)

    if (global.io) {
      global.io.emit('campaign:progress', { campaignId, status: 'sent', phone: contact.phone })
    }
  } catch (err) {
    await supabase
      .from('campaigns')
      .update({ failed_count: supabase.raw('failed_count + 1') })
      .eq('id', campaignId)
    throw err
  }
})

module.exports = { whatsappService }

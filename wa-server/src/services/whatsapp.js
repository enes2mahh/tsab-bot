const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys')
const QRCode = require('qrcode')
const { createClient } = require('@supabase/supabase-js')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const pino = require('pino')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const { SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY } = require('../config')

const logger = pino({ level: 'silent' })
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// In-memory state
const sessions = new Map()        // deviceId -> sock
const pendingQRs = new Map()      // deviceId -> { qr, expiresAt }
const qrWaiters = new Map()       // deviceId -> [resolveFns waiting for QR]

// In-memory campaign queue (replaces Bull/Redis)
const campaignQueue = []
let campaignWorkerRunning = false

class WhatsAppService {
  // ========== INIT DEVICE ==========
  async initDevice(deviceId, userId = null) {
    // If already running, just trigger a fresh QR if needed
    if (sessions.has(deviceId)) {
      const existing = sessions.get(deviceId)
      // If already connected, do nothing
      if (existing?.user) {
        return { alreadyConnected: true }
      }
    }

    const sessionDir = path.join(process.cwd(), 'sessions', deviceId)
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true })

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      browser: ['Tsab Bot', 'Chrome', '1.0.0'],
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      markOnlineOnConnect: false,
    })

    sessions.set(deviceId, sock)

    // Set status to connecting
    await supabase.from('devices').update({ status: 'connecting' }).eq('id', deviceId)

    // Connection events
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      // QR received
      if (qr) {
        try {
          const qrBase64 = await QRCode.toDataURL(qr, { width: 320, margin: 1 })
          pendingQRs.set(deviceId, { qr: qrBase64, expiresAt: Date.now() + 60000 })

          // Resolve waiters
          const waiters = qrWaiters.get(deviceId) || []
          waiters.forEach((resolve) => resolve(qrBase64))
          qrWaiters.delete(deviceId)

          // Emit via Socket.IO
          if (global.io) {
            global.io.to(`device-${deviceId}`).emit('qr', { deviceId, qr: qrBase64 })
          }
        } catch (err) {
          console.error('QR generation error:', err)
        }
      }

      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode
        const loggedOut = code === DisconnectReason.loggedOut

        await supabase.from('devices').update({ status: 'disconnected' }).eq('id', deviceId)

        if (global.io) {
          global.io.to(`device-${deviceId}`).emit('device:disconnected', { deviceId })
        }

        sessions.delete(deviceId)
        pendingQRs.delete(deviceId)

        // Auto-reconnect unless logged out
        if (!loggedOut && code !== 401) {
          console.log(`[${deviceId}] Reconnecting in 3s...`)
          setTimeout(() => this.restoreSession(deviceId).catch(() => {}), 3000)
        } else if (loggedOut) {
          // Clean session files
          try {
            if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true })
          } catch {}
        }
      }

      if (connection === 'open') {
        const phone = sock.user?.id?.split(':')[0]?.split('@')[0]
        await supabase.from('devices').update({
          status: 'connected',
          phone: phone || null,
          last_seen: new Date().toISOString(),
        }).eq('id', deviceId)

        pendingQRs.delete(deviceId)

        if (global.io) {
          global.io.to(`device-${deviceId}`).emit('device:connected', { deviceId, phone })
        }
        console.log(`[${deviceId}] ✅ Connected: ${phone}`)
      }
    })

    // Save credentials on update
    sock.ev.on('creds.update', saveCreds)

    // Incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return
      for (const msg of messages) {
        if (msg.key.fromMe) continue
        try {
          await this.handleIncomingMessage(deviceId, userId, msg, sock)
        } catch (err) {
          console.error(`[${deviceId}] handleIncomingMessage error:`, err.message)
        }
      }
    })

    return sock
  }

  // ========== WAIT FOR QR (Promise-based) ==========
  async waitForQR(deviceId, timeoutMs = 15000) {
    // If we already have a fresh QR, return it
    const cached = pendingQRs.get(deviceId)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.qr
    }

    // Otherwise, register waiter
    return new Promise((resolve) => {
      const waiters = qrWaiters.get(deviceId) || []
      const timer = setTimeout(() => {
        const list = qrWaiters.get(deviceId) || []
        qrWaiters.set(deviceId, list.filter((fn) => fn !== resolveFn))
        resolve(null)
      }, timeoutMs)

      const resolveFn = (qr) => {
        clearTimeout(timer)
        resolve(qr)
      }
      waiters.push(resolveFn)
      qrWaiters.set(deviceId, waiters)
    })
  }

  // ========== RESTORE SESSION ==========
  async restoreSession(deviceId) {
    const sessionDir = path.join(process.cwd(), 'sessions', deviceId)
    if (!fs.existsSync(sessionDir)) return false

    const { data: device } = await supabase.from('devices').select('id, user_id').eq('id', deviceId).single()
    if (!device) return false

    await this.initDevice(deviceId, device.user_id)
    return true
  }

  // ========== RESTORE ALL ==========
  async restoreAllSessions() {
    const { data: devices } = await supabase
      .from('devices')
      .select('id, user_id, status')
      .eq('is_active', true)

    if (!devices) return
    for (const device of devices) {
      const sessionDir = path.join(process.cwd(), 'sessions', device.id)
      if (!fs.existsSync(sessionDir)) continue
      try {
        await this.restoreSession(device.id)
      } catch (err) {
        console.error(`Restore failed for ${device.id}:`, err.message)
      }
    }
  }

  // ========== DISCONNECT ==========
  async disconnectDevice(deviceId) {
    const sock = sessions.get(deviceId)
    if (sock) {
      try { await sock.logout() } catch {}
      sessions.delete(deviceId)
    }
    pendingQRs.delete(deviceId)

    await supabase.from('devices').update({ status: 'disconnected', phone: null }).eq('id', deviceId)

    const sessionDir = path.join(process.cwd(), 'sessions', deviceId)
    try {
      if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true })
    } catch {}
  }

  // ========== HANDLE INCOMING MESSAGE ==========
  async handleIncomingMessage(deviceId, userId, msg, sock) {
    const from = msg.key.remoteJid
    if (!from || from.endsWith('@g.us')) return  // Skip groups for now

    const text =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      ''

    // Get device info if userId not passed
    if (!userId) {
      const { data: dev } = await supabase.from('devices').select('user_id').eq('id', deviceId).single()
      userId = dev?.user_id
    }

    const phoneOnly = from.split('@')[0]

    // Save incoming message
    await supabase.from('messages').insert({
      device_id: deviceId,
      user_id: userId,
      direction: 'incoming',
      from_number: phoneOnly,
      type: 'text',
      content: { text },
      status: 'read',
    })

    // === STEP 1: Mark as read (ticks become blue) ===
    try {
      await sock.readMessages([msg.key])
    } catch {}

    // === STEP 2: Check auto_replies ===
    let handled = false
    const { data: replies } = await supabase
      .from('auto_replies')
      .select('*')
      .eq('device_id', deviceId)
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (replies?.length) {
      for (const reply of replies) {
        let match = false
        const t = (text || '').trim().toLowerCase()
        const v = (reply.trigger_value || '').toLowerCase()

        if (reply.trigger_type === 'all') match = true
        else if (reply.trigger_type === 'keyword' && t === v) match = true
        else if (reply.trigger_type === 'contains' && t.includes(v)) match = true
        else if (reply.trigger_type === 'starts_with' && t.startsWith(v)) match = true
        else if (reply.trigger_type === 'ends_with' && t.endsWith(v)) match = true

        if (match) {
          const content = reply.response_content || {}
          if (reply.response_type === 'text' && content.text) {
            // Show typing indicator
            try { await sock.sendPresenceUpdate('composing', from) } catch {}
            await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200))
            try { await sock.sendPresenceUpdate('paused', from) } catch {}

            await sock.sendMessage(from, { text: content.text })

            await supabase.from('messages').insert({
              device_id: deviceId,
              user_id: userId,
              direction: 'outgoing',
              to_number: phoneOnly,
              type: 'text',
              content: { text: content.text },
              status: 'sent',
            })
          }
          await supabase
            .from('auto_replies')
            .update({ uses_count: (reply.uses_count || 0) + 1 })
            .eq('id', reply.id)
          handled = true
          break
        }
      }
    }

    // === STEP 3: AI Fallback ===
    if (!handled && text) {
      await this.handleAIReply(deviceId, userId, from, phoneOnly, text, sock)
    }

    // === STEP 4: Emit + Webhook ===
    if (global.io) {
      global.io.to(`device-${deviceId}`).emit('message:incoming', { deviceId, from: phoneOnly, text })
    }

    const { data: device } = await supabase.from('devices').select('webhook_url').eq('id', deviceId).single()
    if (device?.webhook_url) {
      axios.post(device.webhook_url, { deviceId, from: phoneOnly, text, timestamp: Date.now() }, { timeout: 5000 })
        .catch(() => {})
    }
  }

  // ========== HANDLE AI REPLY ==========
  async handleAIReply(deviceId, userId, jid, phoneOnly, text, sock) {
    try {
      const { data: device } = await supabase
        .from('devices')
        .select('ai_enabled, ai_prompt, ai_model')
        .eq('id', deviceId)
        .single()

      if (!device?.ai_enabled) return

      // Get API key (user's gemini key from system_settings, or env fallback)
      const { data: settings } = await supabase
        .from('system_settings')
        .select('settings')
        .eq('id', 'global')
        .single()

      const apiKey = settings?.settings?.gemini_api_key || GEMINI_API_KEY
      if (!apiKey) {
        console.warn('No Gemini API key configured')
        return
      }

      // === Show typing indicator immediately ===
      try { await sock.sendPresenceUpdate('composing', jid) } catch {}

      // Pull last 20 messages for context (memory)
      const { data: history } = await supabase
        .from('messages')
        .select('direction, content, created_at')
        .eq('device_id', deviceId)
        .or(`from_number.eq.${phoneOnly},to_number.eq.${phoneOnly}`)
        .order('created_at', { ascending: false })
        .limit(20)

      const chatHistory = (history || [])
        .reverse()
        .slice(0, -1)  // Exclude the current message (we'll send it via sendMessage)
        .map((m) => ({
          role: m.direction === 'incoming' ? 'user' : 'model',
          parts: [{ text: typeof m.content === 'object' ? (m.content?.text || '') : (m.content || '') }],
        }))
        .filter((m) => m.parts[0].text)

      const systemPrompt =
        device.ai_prompt ||
        settings?.settings?.default_system_prompt ||
        'أنت مساعد ذكي ومحترف لخدمة العملاء. أجب باللغة التي يكتب بها العميل، بشكل ودود ومختصر.'

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: device.ai_model || 'gemini-2.0-flash',
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
      })

      const chat = model.startChat({ history: chatHistory })
      const result = await chat.sendMessage(text)
      const reply = result.response.text()

      if (!reply) {
        try { await sock.sendPresenceUpdate('paused', jid) } catch {}
        return
      }

      // === Pause typing, send reply ===
      try { await sock.sendPresenceUpdate('paused', jid) } catch {}

      // Small delay to feel natural
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 800))

      await sock.sendMessage(jid, { text: reply })

      // Save outgoing message
      await supabase.from('messages').insert({
        device_id: deviceId,
        user_id: userId,
        direction: 'outgoing',
        to_number: phoneOnly,
        type: 'text',
        content: { text: reply },
        status: 'sent',
      })

      // Log AI usage
      await supabase.from('ai_usage_logs').insert({
        user_id: userId,
        device_id: deviceId,
        model: device.ai_model || 'gemini-2.0-flash',
      })
    } catch (err) {
      console.error(`[${deviceId}] AI reply error:`, err.message)
      try { await sock.sendPresenceUpdate('paused', jid) } catch {}
    }
  }

  // ========== SEND FUNCTIONS ==========
  async sendText(deviceId, phone, text) {
    const sock = sessions.get(deviceId)
    if (!sock) throw new Error('Device not connected')
    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`
    await sock.sendMessage(jid, { text })
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
      footer: data.footer || '',
      buttons: (data.buttons || []).map((b, i) => ({ buttonId: `btn${i}`, buttonText: { displayText: b }, type: 1 })),
      headerType: 1,
    })
  }

  async sendList(deviceId, phone, data) {
    const sock = sessions.get(deviceId)
    if (!sock) throw new Error('Device not connected')
    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`
    await sock.sendMessage(jid, {
      text: data.body,
      footer: data.footer || '',
      title: data.title || '',
      buttonText: data.button_text || 'عرض',
      sections: data.sections || [],
    })
  }

  // ========== IN-MEMORY CAMPAIGN QUEUE ==========
  async createCampaignJobs(campaignId, contacts, message, delayMin = 3, delayMax = 7) {
    contacts.forEach((contact, i) => {
      const delay = (delayMin + Math.random() * (delayMax - delayMin)) * 1000
      campaignQueue.push({ campaignId, contact, message, runAt: Date.now() + i * delay })
    })
    if (!campaignWorkerRunning) this.startCampaignWorker()
  }

  startCampaignWorker() {
    campaignWorkerRunning = true
    const tick = async () => {
      const now = Date.now()
      const idx = campaignQueue.findIndex((j) => j.runAt <= now)
      if (idx === -1) {
        if (campaignQueue.length === 0) {
          campaignWorkerRunning = false
          return
        }
        setTimeout(tick, 1000)
        return
      }

      const [job] = campaignQueue.splice(idx, 1)
      try {
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('device_id, sent_count')
          .eq('id', job.campaignId)
          .single()

        if (campaign) {
          await this.sendText(campaign.device_id, job.contact.phone, job.message.text || '')
          await supabase
            .from('campaigns')
            .update({ sent_count: (campaign.sent_count || 0) + 1 })
            .eq('id', job.campaignId)

          if (global.io) {
            global.io.emit('campaign:progress', { campaignId: job.campaignId, status: 'sent', phone: job.contact.phone })
          }
        }
      } catch (err) {
        const { data: c2 } = await supabase
          .from('campaigns')
          .select('failed_count')
          .eq('id', job.campaignId)
          .single()
        if (c2) {
          await supabase
            .from('campaigns')
            .update({ failed_count: (c2.failed_count || 0) + 1 })
            .eq('id', job.campaignId)
        }
      }
      setImmediate(tick)
    }
    tick()
  }

  // ========== UTIL ==========
  isConnected(deviceId) {
    const sock = sessions.get(deviceId)
    return !!sock?.user
  }
}

const whatsappService = new WhatsAppService()
module.exports = { whatsappService }

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
const sessions = new Map()          // deviceId -> { sock, generation, userId }
const initLocks = new Map()         // deviceId -> Promise (concurrent init protection)
const pendingReconnects = new Map() // deviceId -> NodeJS.Timeout
const pendingQRs = new Map()        // deviceId -> { qr, expiresAt }
const qrWaiters = new Map()         // deviceId -> [resolveFn]

// In-memory campaign queue
const campaignQueue = []
let campaignWorkerRunning = false

class WhatsAppService {
  // ========== INIT (with concurrent protection) ==========
  async initDevice(deviceId, userId = null) {
    if (initLocks.has(deviceId)) {
      console.log(`[init] ${deviceId} ⏳ awaiting existing init`)
      return initLocks.get(deviceId)
    }
    const p = this._doInitDevice(deviceId, userId)
    initLocks.set(deviceId, p)
    try {
      return await p
    } finally {
      initLocks.delete(deviceId)
    }
  }

  async _doInitDevice(deviceId, userId) {
    console.log(`[init] ${deviceId} START userId=${userId}`)

    // Already connected? Skip.
    const existing = sessions.get(deviceId)
    if (existing?.sock?.user) {
      console.log(`[init] ${deviceId} already connected as ${existing.sock.user.id}`)
      return { alreadyConnected: true }
    }

    // Cleanup any stale socket BEFORE creating new
    if (existing?.sock) {
      console.log(`[init] ${deviceId} cleaning stale socket gen=${existing.generation}`)
      this._cleanupSocket(existing.sock)
      sessions.delete(deviceId)
    }

    // Cancel any scheduled reconnect (we're doing it now)
    if (pendingReconnects.has(deviceId)) {
      clearTimeout(pendingReconnects.get(deviceId))
      pendingReconnects.delete(deviceId)
    }

    // Unique generation ID for this session
    const generation = `${Date.now()}-${Math.floor(Math.random() * 100000)}`

    const sessionDir = path.join(process.cwd(), 'sessions', deviceId)
    try {
      if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true })
    } catch (err) {
      console.error(`[init] ${deviceId} mkdir failed: ${err.message}`)
      throw new Error(`Cannot create session dir: ${err.message}`)
    }

    console.log(`[init] ${deviceId} loading auth state...`)
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir)

    console.log(`[init] ${deviceId} fetching Baileys version...`)
    const { version } = await fetchLatestBaileysVersion()
    console.log(`[init] ${deviceId} Baileys ${version.join('.')}`)

    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      browser: ['Tsab Bot', 'Chrome', '1.0.0'],
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      connectTimeoutMs: 30_000,
      defaultQueryTimeoutMs: 60_000,
      keepAliveIntervalMs: 30_000,
    })

    // Register BEFORE setting in map (so we don't miss events)
    sessions.set(deviceId, { sock, generation, userId })

    await supabase.from('devices').update({ status: 'connecting' }).eq('id', deviceId)

    // ========== Connection events ==========
    sock.ev.on('connection.update', async (update) => {
      // Verify this is still the active socket (not orphan)
      const current = sessions.get(deviceId)
      if (current?.generation !== generation) {
        console.log(`[${deviceId}] [gen=${generation}] event ignored (current=${current?.generation})`)
        return
      }

      const { connection, lastDisconnect, qr } = update

      if (qr) {
        console.log(`[${deviceId}] 📷 QR raw received`)
        try {
          const qrBase64 = await QRCode.toDataURL(qr, { width: 320, margin: 1 })
          pendingQRs.set(deviceId, { qr: qrBase64, expiresAt: Date.now() + 60000 })
          const waiters = qrWaiters.get(deviceId) || []
          waiters.forEach((r) => r(qrBase64))
          qrWaiters.delete(deviceId)
          if (global.io) global.io.to(`device-${deviceId}`).emit('qr', { deviceId, qr: qrBase64 })
          console.log(`[${deviceId}] ✅ QR cached, ${waiters.length} waiter(s) resolved`)
        } catch (err) {
          console.error(`[${deviceId}] QR encode error: ${err.message}`)
        }
      }

      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode
        const reason = lastDisconnect?.error?.message || 'unknown'
        console.log(`[${deviceId}] [gen=${generation}] 🔻 close code=${code} reason=${reason}`)

        const loggedOut = code === DisconnectReason.loggedOut
        const conflict = code === DisconnectReason.connectionReplaced || code === 440

        await supabase.from('devices').update({ status: 'disconnected' }).eq('id', deviceId)
        if (global.io) global.io.to(`device-${deviceId}`).emit('device:disconnected', { deviceId })

        sessions.delete(deviceId)
        pendingQRs.delete(deviceId)

        if (loggedOut) {
          console.log(`[${deviceId}] LoggedOut — cleaning session files`)
          try {
            if (fs.existsSync(sessionDir)) fs.rmSync(sessionDir, { recursive: true, force: true })
          } catch {}
          return // don't reconnect
        }

        if (conflict) {
          console.log(`[${deviceId}] ⚠️ Connection replaced/conflict — NOT reconnecting (another session is taking over)`)
          return // someone else (or another instance) connected; don't fight it
        }

        // Schedule a single reconnect (debounced)
        this._scheduleReconnect(deviceId, 5000)
      }

      if (connection === 'open') {
        const phone = sock.user?.id?.split(':')[0]?.split('@')[0]
        console.log(`[${deviceId}] ✅ Connected as ${phone}`)
        await supabase.from('devices').update({
          status: 'connected',
          phone: phone || null,
          last_seen: new Date().toISOString(),
        }).eq('id', deviceId)
        pendingQRs.delete(deviceId)
        if (global.io) global.io.to(`device-${deviceId}`).emit('device:connected', { deviceId, phone })
      }
    })

    // Save credentials on update
    sock.ev.on('creds.update', saveCreds)

    // Incoming messages
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      // Verify this is the active socket
      const current = sessions.get(deviceId)
      if (current?.generation !== generation) {
        console.log(`[${deviceId}] [gen=${generation}] msg event ignored (orphan socket)`)
        return
      }
      if (type !== 'notify') return

      for (const msg of messages) {
        if (msg.key.fromMe) continue
        try {
          await this.handleIncomingMessage(deviceId, current.userId || userId, msg, sock)
        } catch (err) {
          console.error(`[${deviceId}] handleIncomingMessage error:`, err.message, err.stack)
        }
      }
    })

    return sock
  }

  // Properly tear down a socket: detach listeners + end
  _cleanupSocket(sock) {
    try { sock.ev?.removeAllListeners?.() } catch {}
    try { sock.end?.(undefined) } catch {}
    try { sock.ws?.close?.() } catch {}
  }

  // Single, debounced reconnect per device
  _scheduleReconnect(deviceId, delayMs = 5000) {
    if (pendingReconnects.has(deviceId)) {
      console.log(`[${deviceId}] reconnect already scheduled`)
      return
    }
    console.log(`[${deviceId}] reconnect scheduled in ${delayMs}ms`)
    const t = setTimeout(() => {
      pendingReconnects.delete(deviceId)
      this.restoreSession(deviceId).catch((err) => {
        console.error(`[${deviceId}] restoreSession failed:`, err.message)
      })
    }, delayMs)
    pendingReconnects.set(deviceId, t)
  }

  // ========== WAIT FOR QR ==========
  async waitForQR(deviceId, timeoutMs = 40000) {
    const cached = pendingQRs.get(deviceId)
    if (cached && cached.expiresAt > Date.now()) return cached.qr

    return new Promise((resolve) => {
      const waiters = qrWaiters.get(deviceId) || []
      let resolved = false
      const resolveFn = (qr) => {
        if (resolved) return
        resolved = true
        clearTimeout(timer)
        resolve(qr)
      }
      const timer = setTimeout(() => {
        const list = qrWaiters.get(deviceId) || []
        qrWaiters.set(deviceId, list.filter((fn) => fn !== resolveFn))
        if (!resolved) resolve(null)
        resolved = true
      }, timeoutMs)
      waiters.push(resolveFn)
      qrWaiters.set(deviceId, waiters)
    })
  }

  // ========== RESTORE ==========
  async restoreSession(deviceId) {
    const sessionDir = path.join(process.cwd(), 'sessions', deviceId)
    if (!fs.existsSync(sessionDir)) {
      console.log(`[${deviceId}] no session dir, cannot restore`)
      return false
    }
    const { data: device } = await supabase.from('devices').select('id, user_id').eq('id', deviceId).single()
    if (!device) return false
    await this.initDevice(deviceId, device.user_id)
    return true
  }

  async restoreAllSessions() {
    const { data: devices } = await supabase
      .from('devices')
      .select('id, user_id')
      .eq('is_active', true)

    if (!devices?.length) {
      console.log('[restoreAll] no devices to restore')
      return
    }
    console.log(`[restoreAll] checking ${devices.length} devices`)
    for (const device of devices) {
      const sessionDir = path.join(process.cwd(), 'sessions', device.id)
      if (!fs.existsSync(sessionDir)) continue
      try {
        await this.restoreSession(device.id)
      } catch (err) {
        console.error(`[restoreAll] ${device.id} failed: ${err.message}`)
      }
    }
  }

  // ========== DISCONNECT ==========
  async disconnectDevice(deviceId) {
    console.log(`[disconnect] ${deviceId}`)
    if (pendingReconnects.has(deviceId)) {
      clearTimeout(pendingReconnects.get(deviceId))
      pendingReconnects.delete(deviceId)
    }
    const entry = sessions.get(deviceId)
    if (entry?.sock) {
      try { await entry.sock.logout() } catch {}
      this._cleanupSocket(entry.sock)
    }
    sessions.delete(deviceId)
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
    if (!from) return
    if (from.endsWith('@g.us')) return  // Skip groups
    if (from === 'status@broadcast') return

    const text =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      ''

    if (!userId) {
      const { data: dev } = await supabase.from('devices').select('user_id').eq('id', deviceId).single()
      userId = dev?.user_id
    }

    const phoneOnly = from.split('@')[0]
    console.log(`[msg] ${deviceId} from=${phoneOnly} text="${text.substring(0, 80)}"`)

    // Save incoming
    await supabase.from('messages').insert({
      device_id: deviceId,
      user_id: userId,
      direction: 'incoming',
      from_number: phoneOnly,
      type: 'text',
      content: { text },
      status: 'read',
    })

    // Mark as read (blue ticks)
    try { await sock.readMessages([msg.key]) } catch (err) { console.warn(`[msg] read failed: ${err.message}`) }

    // Auto-replies
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
            try { await sock.sendPresenceUpdate('composing', from) } catch {}
            await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200))
            try { await sock.sendPresenceUpdate('paused', from) } catch {}
            await sock.sendMessage(from, { text: content.text })
            await supabase.from('messages').insert({
              device_id: deviceId, user_id: userId, direction: 'outgoing',
              to_number: phoneOnly, type: 'text', content: { text: content.text }, status: 'sent',
            })
          }
          await supabase.from('auto_replies').update({ uses_count: (reply.uses_count || 0) + 1 }).eq('id', reply.id)
          handled = true
          break
        }
      }
    }

    // AI fallback
    if (!handled && text) {
      await this.handleAIReply(deviceId, userId, from, phoneOnly, text, sock)
    }

    // Webhook
    if (global.io) global.io.to(`device-${deviceId}`).emit('message:incoming', { deviceId, from: phoneOnly, text })
    const { data: device } = await supabase.from('devices').select('webhook_url').eq('id', deviceId).single()
    if (device?.webhook_url) {
      axios.post(device.webhook_url, { deviceId, from: phoneOnly, text, timestamp: Date.now() }, { timeout: 5000 }).catch(() => {})
    }
  }

  // ========== AI REPLY (defensive) ==========
  async handleAIReply(deviceId, userId, jid, phoneOnly, text, sock) {
    console.log(`[AI] === START === device=${deviceId} from=${phoneOnly}`)

    try {
      const { data: device, error: devErr } = await supabase
        .from('devices').select('ai_enabled, ai_prompt, ai_model').eq('id', deviceId).single()

      if (devErr) {
        console.error(`[AI] DB error fetching device:`, devErr.message)
        return
      }
      if (!device?.ai_enabled) {
        console.log(`[AI] ❌ AI disabled for ${deviceId}`)
        return
      }
      console.log(`[AI] ✅ AI enabled. model=${device.ai_model} prompt="${(device.ai_prompt || '').substring(0, 50)}..."`)

      const { data: settings } = await supabase
        .from('system_settings').select('settings').eq('id', 'global').single()

      const apiKey = settings?.settings?.gemini_api_key || GEMINI_API_KEY
      if (!apiKey) {
        console.error(`[AI] ❌ No Gemini API key (env GEMINI_API_KEY missing AND system_settings empty)`)
        return
      }
      console.log(`[AI] Key prefix: ${apiKey.substring(0, 12)}...`)

      // Show typing
      try {
        await sock.sendPresenceUpdate('composing', jid)
        console.log(`[AI] ⌨️ Typing indicator sent`)
      } catch (err) { console.warn(`[AI] typing failed: ${err.message}`) }

      // Build chat history with strict alternation rule
      const { data: history } = await supabase
        .from('messages')
        .select('direction, content, created_at')
        .eq('device_id', deviceId)
        .or(`from_number.eq.${phoneOnly},to_number.eq.${phoneOnly}`)
        .order('created_at', { ascending: false })
        .limit(20)

      let chatHistory = (history || [])
        .reverse()
        .slice(0, -1) // exclude current incoming msg
        .map((m) => ({
          role: m.direction === 'incoming' ? 'user' : 'model',
          parts: [{ text: typeof m.content === 'object' ? (m.content?.text || '') : String(m.content || '') }],
        }))
        .filter((m) => m.parts[0].text && m.parts[0].text.trim().length > 0)

      while (chatHistory.length > 0 && chatHistory[0].role !== 'user') chatHistory.shift()
      chatHistory = chatHistory.reduce((acc, m) => {
        if (acc.length === 0 || acc[acc.length - 1].role !== m.role) acc.push(m)
        return acc
      }, [])

      console.log(`[AI] history: ${chatHistory.length} msgs`)

      const systemPrompt =
        device.ai_prompt ||
        settings?.settings?.default_system_prompt ||
        'أنت مساعد ذكي ومحترف لخدمة العملاء. أجب باللغة التي يكتب بها العميل، بشكل ودود ومختصر.'

      const primaryModel = device.ai_model || 'gemini-1.5-flash'
      const fallbackModels = [primaryModel, 'gemini-1.5-flash', 'gemini-1.5-flash-latest']
        .filter((v, i, arr) => arr.indexOf(v) === i)

      const genAI = new GoogleGenerativeAI(apiKey)
      let reply = null
      let usedModel = null
      let lastErr = null

      for (const modelName of fallbackModels) {
        try {
          console.log(`[AI] 🤖 Trying ${modelName}...`)
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt,
            generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
          })
          const chat = model.startChat({ history: chatHistory })
          const result = await chat.sendMessage(text)
          reply = result.response.text()
          usedModel = modelName
          console.log(`[AI] ✅ ${modelName} replied: "${(reply || '').substring(0, 80)}"`)
          if (reply && reply.trim()) break
        } catch (err) {
          lastErr = err
          console.warn(`[AI] ❌ ${modelName} failed: ${err.message}`)
        }
      }

      if (!reply || !reply.trim()) {
        console.error(`[AI] ❌ All models failed. Last error: ${lastErr?.message || 'empty'}`)
        try { await sock.sendPresenceUpdate('paused', jid) } catch {}
        return
      }

      try { await sock.sendPresenceUpdate('paused', jid) } catch {}
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 800))

      // Verify socket still active before sending
      const current = sessions.get(deviceId)
      if (!current?.sock?.user) {
        console.error(`[AI] ❌ Socket not active when ready to send`)
        return
      }

      try {
        await current.sock.sendMessage(jid, { text: reply })
        console.log(`[AI] ✅ Reply sent via ${usedModel}`)
      } catch (sendErr) {
        console.error(`[AI] ❌ Send failed: ${sendErr.message}`)
        return
      }

      await supabase.from('messages').insert({
        device_id: deviceId, user_id: userId, direction: 'outgoing',
        to_number: phoneOnly, type: 'text', content: { text: reply }, status: 'sent',
      })
      await supabase.from('ai_usage_logs').insert({ user_id: userId, device_id: deviceId, model: usedModel })

      console.log(`[AI] === END === ✅`)
    } catch (err) {
      console.error(`[AI] FATAL [${deviceId}]:`, err.message, err.stack)
      try { await sock.sendPresenceUpdate('paused', jid) } catch {}
    }
  }

  // ========== SEND HELPERS ==========
  _getSock(deviceId) {
    const entry = sessions.get(deviceId)
    if (!entry?.sock?.user) throw new Error('Device not connected')
    return entry.sock
  }

  async sendText(deviceId, phone, text) {
    const sock = this._getSock(deviceId)
    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`
    await sock.sendMessage(jid, { text })
  }

  async sendImage(deviceId, phone, url, caption = '') {
    const sock = this._getSock(deviceId)
    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`
    await sock.sendMessage(jid, { image: { url }, caption })
  }

  async sendDocument(deviceId, phone, url, filename, mimetype) {
    const sock = this._getSock(deviceId)
    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`
    await sock.sendMessage(jid, { document: { url }, fileName: filename, mimetype })
  }

  async sendLocation(deviceId, phone, lat, lng, name = '') {
    const sock = this._getSock(deviceId)
    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`
    await sock.sendMessage(jid, { location: { degreesLatitude: lat, degreesLongitude: lng, name } })
  }

  async sendButtons(deviceId, phone, data) {
    const sock = this._getSock(deviceId)
    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`
    await sock.sendMessage(jid, {
      text: data.body, footer: data.footer || '',
      buttons: (data.buttons || []).map((b, i) => ({ buttonId: `btn${i}`, buttonText: { displayText: b }, type: 1 })),
      headerType: 1,
    })
  }

  async sendList(deviceId, phone, data) {
    const sock = this._getSock(deviceId)
    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`
    await sock.sendMessage(jid, {
      text: data.body, footer: data.footer || '', title: data.title || '',
      buttonText: data.button_text || 'عرض', sections: data.sections || [],
    })
  }

  // ========== CAMPAIGN QUEUE ==========
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
        if (campaignQueue.length === 0) { campaignWorkerRunning = false; return }
        setTimeout(tick, 1000); return
      }
      const [job] = campaignQueue.splice(idx, 1)
      try {
        const { data: campaign } = await supabase.from('campaigns').select('device_id, sent_count').eq('id', job.campaignId).single()
        if (campaign) {
          await this.sendText(campaign.device_id, job.contact.phone, job.message.text || '')
          await supabase.from('campaigns').update({ sent_count: (campaign.sent_count || 0) + 1 }).eq('id', job.campaignId)
          if (global.io) global.io.emit('campaign:progress', { campaignId: job.campaignId, status: 'sent', phone: job.contact.phone })
        }
      } catch (err) {
        const { data: c2 } = await supabase.from('campaigns').select('failed_count').eq('id', job.campaignId).single()
        if (c2) await supabase.from('campaigns').update({ failed_count: (c2.failed_count || 0) + 1 }).eq('id', job.campaignId)
      }
      setImmediate(tick)
    }
    tick()
  }

  isConnected(deviceId) {
    const entry = sessions.get(deviceId)
    return !!entry?.sock?.user
  }
}

const whatsappService = new WhatsAppService()
module.exports = { whatsappService }

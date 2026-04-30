const {
  default: makeWASocket,
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
const axios = require('axios')
const { SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY } = require('../config')

// ========== Direct REST call to Gemini (no SDK = no surprises) ==========
async function callGeminiREST({ apiKey, model, apiVersion, systemPrompt, history, userText }) {
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`

  const body = {
    contents: [...history, { role: 'user', parts: [{ text: userText }] }],
    generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
  }
  if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] }

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const raw = await r.text()
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${raw.substring(0, 250)}`)
  const data = JSON.parse(raw)
  const candidate = data.candidates?.[0]
  if (!candidate) throw new Error(`No candidate. Response: ${raw.substring(0, 150)}`)
  return candidate.content?.parts?.[0]?.text || ''
}

// Same as above but without systemInstruction (legacy models)
async function callGeminiRESTLegacy({ apiKey, model, apiVersion, systemPrompt, history, userText }) {
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`

  // Inject system prompt into the first message
  const prefixedHistory = systemPrompt && history.length === 0
    ? [{ role: 'user', parts: [{ text: `[تعليمات النظام]: ${systemPrompt}\n\n[السؤال]: ${userText}` }] }]
    : [...history, { role: 'user', parts: [{ text: userText }] }]

  const body = {
    contents: prefixedHistory,
    generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
  }

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const raw = await r.text()
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${raw.substring(0, 250)}`)
  const data = JSON.parse(raw)
  const candidate = data.candidates?.[0]
  if (!candidate) throw new Error(`No candidate. Response: ${raw.substring(0, 150)}`)
  return candidate.content?.parts?.[0]?.text || ''
}

// List models available to this key (for diagnostics)
async function listGeminiModels(apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  const r = await fetch(url)
  if (!r.ok) {
    const t = await r.text()
    throw new Error(`HTTP ${r.status}: ${t.substring(0, 200)}`)
  }
  const data = await r.json()
  return (data.models || [])
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => m.name.replace('models/', ''))
}
module.exports.listGeminiModels = listGeminiModels

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

// ===== System Prompt Cache (per device, 5 min TTL) =====
const promptCache = new Map() // deviceId -> { prompt, builtAt }
const PROMPT_TTL_MS = 5 * 60 * 1000

function getCachedPrompt(deviceId) {
  const entry = promptCache.get(deviceId)
  if (entry && Date.now() - entry.builtAt < PROMPT_TTL_MS) return entry.prompt
  return null
}
function setCachedPrompt(deviceId, prompt) {
  promptCache.set(deviceId, { prompt, builtAt: Date.now() })
}
function invalidatePromptCache(deviceId) {
  promptCache.delete(deviceId)
}
module.exports.invalidatePromptCache = invalidatePromptCache

// ===== Gemini Rate Limiter Queue (max 55 req/min) =====
const geminiQueue = []
let geminiCallsThisMinute = 0
let geminiWindowStart = Date.now()
let geminiWorkerRunning = false

function callGeminiQueued(params) {
  return new Promise((resolve, reject) => {
    geminiQueue.push({ params, resolve, reject })
    if (!geminiWorkerRunning) processGeminiQueue()
  })
}

async function processGeminiQueue() {
  if (geminiQueue.length === 0) { geminiWorkerRunning = false; return }
  geminiWorkerRunning = true

  const now = Date.now()
  if (now - geminiWindowStart > 60000) {
    geminiCallsThisMinute = 0
    geminiWindowStart = now
  }

  if (geminiCallsThisMinute >= 55) {
    const waitMs = 60000 - (now - geminiWindowStart) + 200
    setTimeout(processGeminiQueue, waitMs)
    return
  }

  const { params, resolve, reject } = geminiQueue.shift()
  geminiCallsThisMinute++

  try {
    const fn = params.legacy ? callGeminiRESTLegacy : callGeminiREST
    resolve(await fn(params))
  } catch (e) {
    reject(e)
  }

  setImmediate(processGeminiQueue)
}

// ===== Per-Device Message Queue (prevent concurrent processing) =====
const deviceMessageQueues = new Map() // deviceId -> task[]

async function enqueueMessageTask(deviceId, task) {
  if (!deviceMessageQueues.has(deviceId)) deviceMessageQueues.set(deviceId, [])
  const q = deviceMessageQueues.get(deviceId)
  q.push(task)
  if (q.length === 1) processDeviceQueue(deviceId)
}

async function processDeviceQueue(deviceId) {
  const q = deviceMessageQueues.get(deviceId)
  if (!q || q.length === 0) { deviceMessageQueues.delete(deviceId); return }
  try { await q[0]() } catch (e) { console.error(`[queue] ${deviceId} task error:`, e.message) }
  q.shift()
  if (q.length > 0) setImmediate(() => processDeviceQueue(deviceId))
  else deviceMessageQueues.delete(deviceId)
}

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
      browser: ['Sends Bot', 'Chrome', '1.0.0'],
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

    // === SMART REPLIES (no AI tokens used) ===
    // 1) Bot FAQs (manually added by merchant OR auto-learned from repeated questions)
    if (!handled && text) {
      handled = await this.tryFAQReply(deviceId, userId, from, phoneOnly, text, sock)
    }
    // 2) Greeting patterns (السلام عليكم، مرحبا، hi, hello...)
    if (!handled && text) {
      handled = await this.tryGreetingReply(deviceId, userId, from, phoneOnly, text, sock)
    }

    // === AI fallback (uses Gemini tokens) ===
    if (!handled && text) {
      const aiAnswer = await this.handleAIReply(deviceId, userId, from, phoneOnly, text, sock)
      // Track for auto-learning if AI generated a reply
      if (aiAnswer) {
        this.trackQuestionForLearning(deviceId, text, aiAnswer).catch(() => {})
      }
    }

    // Webhook
    if (global.io) global.io.to(`device-${deviceId}`).emit('message:incoming', { deviceId, from: phoneOnly, text })
    const { data: device } = await supabase.from('devices').select('webhook_url').eq('id', deviceId).single()
    if (device?.webhook_url) {
      axios.post(device.webhook_url, { deviceId, from: phoneOnly, text, timestamp: Date.now() }, { timeout: 5000 }).catch(() => {})
    }
  }

  // ========== SMART REPLY HELPERS ==========

  // Normalize Arabic + English text for FAQ matching
  _normalize(text) {
    return (text || '')
      .trim()
      .toLowerCase()
      // Strip diacritics (tashkeel)
      .replace(/[ً-ٰٟ]/g, '')
      // Normalize alef variants
      .replace(/[آأإ]/g, 'ا')
      // Normalize yeh
      .replace(/ى/g, 'ي')
      // Normalize teh marbuta
      .replace(/ة/g, 'ه')
      // Collapse whitespace
      .replace(/\s+/g, ' ')
      // Strip trailing punctuation
      .replace(/[?!.,،؟،]+$/, '')
  }

  // Try matching merchant's manual or auto-learned FAQs
  async tryFAQReply(deviceId, userId, jid, phoneOnly, text, sock) {
    const normalized = this._normalize(text)
    if (!normalized) return false

    const { data: faqs } = await supabase
      .from('bot_faqs')
      .select('*')
      .eq('device_id', deviceId)
      .eq('is_active', true)

    if (!faqs?.length) return false

    // Exact match first
    let match = faqs.find((f) => f.question_normalized === normalized)
    // Then prefix/contains match
    if (!match) {
      match = faqs.find((f) =>
        normalized.startsWith(f.question_normalized) ||
        normalized.includes(f.question_normalized) ||
        f.question_normalized.includes(normalized)
      )
    }

    if (!match) return false

    console.log(`[FAQ] ✅ Matched "${match.question_normalized}" → "${match.answer.substring(0, 50)}..."`)

    // Send with typing indicator
    try { await sock.sendPresenceUpdate('composing', jid) } catch {}
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 800))
    try { await sock.sendPresenceUpdate('paused', jid) } catch {}

    await sock.sendMessage(jid, { text: match.answer })

    // Save outgoing
    await supabase.from('messages').insert({
      device_id: deviceId, user_id: userId, direction: 'outgoing',
      to_number: phoneOnly, type: 'text', content: { text: match.answer }, status: 'sent',
      metadata: { source: 'faq', faq_id: match.id, faq_source: match.source },
    })

    // Increment hits
    await supabase.from('bot_faqs').update({ hits_count: (match.hits_count || 0) + 1 }).eq('id', match.id)

    return true
  }

  // Try matching common greetings (no AI needed)
  async tryGreetingReply(deviceId, userId, jid, phoneOnly, text, sock) {
    const normalized = this._normalize(text)
    if (!normalized || normalized.length > 60) return false  // Greetings are short

    const { data: greetings } = await supabase
      .from('global_greetings')
      .select('*')
      .eq('is_active', true)

    if (!greetings?.length) return false

    const match = greetings.find((g) => {
      const gNorm = this._normalize(g.pattern)
      return normalized === gNorm || normalized.startsWith(gNorm) || normalized.endsWith(gNorm)
    })

    if (!match) return false

    console.log(`[Greeting] 👋 Matched "${match.pattern}"`)

    // Check if business has custom greeting
    const { data: device } = await supabase.from('devices').select('user_id').eq('id', deviceId).single()
    let response = match.default_response
    if (device?.user_id) {
      const { data: profile } = await supabase
        .from('business_profile')
        .select('greeting_message, business_name')
        .eq('user_id', device.user_id)
        .single()
      if (profile?.greeting_message) response = profile.greeting_message
      else if (profile?.business_name) {
        response = response.replace('كيف أقدر أساعدك', `مرحباً بك في ${profile.business_name}، كيف أقدر أساعدك`)
      }
    }

    try { await sock.sendPresenceUpdate('composing', jid) } catch {}
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 700))
    try { await sock.sendPresenceUpdate('paused', jid) } catch {}

    await sock.sendMessage(jid, { text: response })

    await supabase.from('messages').insert({
      device_id: deviceId, user_id: userId, direction: 'outgoing',
      to_number: phoneOnly, type: 'text', content: { text: response }, status: 'sent',
      metadata: { source: 'greeting', pattern: match.pattern },
    })

    return true
  }

  // Track repeated questions; auto-promote to FAQ when seen 3+ times
  async trackQuestionForLearning(deviceId, question, aiAnswer) {
    const normalized = this._normalize(question)
    if (!normalized || normalized.length < 5) return  // Skip too-short

    const { data: existing } = await supabase
      .from('faq_learning_queue')
      .select('id, count, promoted')
      .eq('device_id', deviceId)
      .eq('question_normalized', normalized)
      .single()

    if (existing) {
      const newCount = (existing.count || 1) + 1
      await supabase.from('faq_learning_queue').update({
        count: newCount,
        last_question: question,
        last_ai_answer: aiAnswer,
        last_seen_at: new Date().toISOString(),
      }).eq('id', existing.id)

      // Promote to bot_faqs at 3+ repeats
      if (newCount >= 3 && !existing.promoted) {
        const { data: device } = await supabase.from('devices').select('user_id').eq('id', deviceId).single()
        if (device) {
          await supabase.from('bot_faqs').insert({
            device_id: deviceId,
            user_id: device.user_id,
            question_normalized: normalized,
            question_original: question,
            answer: aiAnswer,
            source: 'auto_learned',
            hits_count: 0,
            is_active: true,
          }).then(() =>
            supabase.from('faq_learning_queue').update({ promoted: true }).eq('id', existing.id)
          )
          console.log(`[Learning] 🧠 Auto-promoted to FAQ: "${normalized.substring(0, 50)}..."`)
        }
      }
    } else {
      await supabase.from('faq_learning_queue').insert({
        device_id: deviceId,
        question_normalized: normalized,
        last_question: question,
        last_ai_answer: aiAnswer,
        count: 1,
      })
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
        return null
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

      // Build context-aware system prompt from business_profile
      const { data: bizProfile } = await supabase
        .from('business_profile')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Use cached system prompt if still fresh (saves ~70% of tokens)
      let systemPrompt = getCachedPrompt(deviceId)

      if (!systemPrompt) {
      systemPrompt =
        device.ai_prompt ||
        settings?.settings?.default_system_prompt ||
        'أنت مساعد ذكي ومحترف لخدمة العملاء. أجب باللغة التي يكتب بها العميل، بشكل ودود ومختصر.'

      // Inject business context if available
      if (bizProfile) {
        const contextParts = []
        if (bizProfile.business_name) contextParts.push(`اسم المتجر: ${bizProfile.business_name}`)
        if (bizProfile.business_type) contextParts.push(`نوع النشاط: ${bizProfile.business_type}`)
        if (bizProfile.description) contextParts.push(`عن المتجر: ${bizProfile.description}`)
        if (bizProfile.bot_personality) contextParts.push(`أسلوبك: ${bizProfile.bot_personality}`)

        const services = Array.isArray(bizProfile.services) ? bizProfile.services : []
        if (services.length > 0) {
          contextParts.push('الخدمات/المنتجات المتاحة:')
          services.forEach((s) => {
            const parts = [`- ${s.name}`]
            if (s.description) parts.push(`(${s.description})`)
            if (s.price) parts.push(`السعر: ${s.price}`)
            if (s.link) parts.push(`الرابط: ${s.link}`)
            contextParts.push(parts.join(' '))
          })
        }

        if (bizProfile.payment_info) contextParts.push(`طرق الدفع: ${bizProfile.payment_info}`)
        if (bizProfile.working_hours) contextParts.push(`ساعات العمل: ${bizProfile.working_hours}`)
        if (bizProfile.handoff_message) contextParts.push(`عند موافقة العميل على خدمة معينة، قل بالضبط: "${bizProfile.handoff_message}"`)
        if (bizProfile.off_topic_response) contextParts.push(`عند سؤال خارج نطاق المتجر، قل: "${bizProfile.off_topic_response}"`)
        if (bizProfile.custom_rules) contextParts.push(`قواعد إضافية: ${bizProfile.custom_rules}`)

        contextParts.push('قواعد عامة: 1) لا تخترع منتجات أو أسعار غير موجودة 2) عند الموافقة على شراء، اذكر رابط المنتج وأخبر العميل أن خدمة العملاء ستتواصل معه قريباً 3) كن مختصراً ومباشراً 4) استخدم لغة العميل')

        systemPrompt = contextParts.join('\n')
      }

      setCachedPrompt(deviceId, systemPrompt)
      } // end if (!cached)

      // === On first AI call ever, list available models for diagnostics ===
      try {
        const available = await listGeminiModels(apiKey)
        console.log(`[AI] 📋 Models available to this API key: ${available.slice(0, 15).join(', ')}${available.length > 15 ? ` ... (+${available.length - 15} more)` : ''}`)
      } catch (listErr) {
        console.warn(`[AI] ⚠️ Could not list models: ${listErr.message}`)
      }

      // Try direct REST API (bypassing SDK quirks)
      const primaryModel = device.ai_model
      const attempts = [
        ...(primaryModel ? [
          { model: primaryModel, apiVersion: 'v1beta', legacy: false },
          { model: primaryModel, apiVersion: 'v1', legacy: false },
        ] : []),
        // Current generation
        { model: 'gemini-2.5-flash', apiVersion: 'v1beta', legacy: false },
        { model: 'gemini-2.5-flash-lite', apiVersion: 'v1beta', legacy: false },
        { model: 'gemini-2.0-flash', apiVersion: 'v1beta', legacy: false },
        { model: 'gemini-2.0-flash-exp', apiVersion: 'v1beta', legacy: false },
        { model: 'gemini-2.0-flash-001', apiVersion: 'v1beta', legacy: false },
        // 1.5 fallbacks
        { model: 'gemini-1.5-flash-002', apiVersion: 'v1beta', legacy: false },
        { model: 'gemini-1.5-flash-8b', apiVersion: 'v1beta', legacy: false },
        // Legacy without systemInstruction support
        { model: 'gemini-pro', apiVersion: 'v1beta', legacy: true },
      ]
      // dedupe
      const seenAttempts = new Set()
      const dedupedAttempts = attempts.filter((a) => {
        const k = `${a.model}|${a.apiVersion}`
        if (seenAttempts.has(k)) return false
        seenAttempts.add(k)
        return true
      })

      let reply = null
      let usedModel = null
      let lastErr = null

      for (const att of dedupedAttempts) {
        try {
          console.log(`[AI] 🤖 Trying ${att.model} (${att.apiVersion})${att.legacy ? ' [legacy]' : ''}...`)
          const fn = att.legacy ? callGeminiRESTLegacy : callGeminiREST
          reply = await fn({
            apiKey,
            model: att.model,
            apiVersion: att.apiVersion,
            systemPrompt,
            history: chatHistory,
            userText: text,
          })
          usedModel = `${att.model}@${att.apiVersion}`
          console.log(`[AI] ✅ ${usedModel} replied: "${(reply || '').substring(0, 80)}"`)
          if (reply && reply.trim()) break
        } catch (err) {
          lastErr = err
          // Print full first line so we can see HTTP status
          const short = (err.message || '').substring(0, 250).replace(/\s+/g, ' ')
          console.warn(`[AI] ❌ ${att.model}@${att.apiVersion}: ${short}`)
        }
      }

      if (!reply || !reply.trim()) {
        console.error(`[AI] ❌ All models failed. Last error: ${lastErr?.message || 'empty'}`)
        try { await sock.sendPresenceUpdate('paused', jid) } catch {}
        return null
      }

      try { await sock.sendPresenceUpdate('paused', jid) } catch {}
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 800))

      // Verify socket still active before sending
      const current = sessions.get(deviceId)
      if (!current?.sock?.user) {
        console.error(`[AI] ❌ Socket not active when ready to send`)
        return null
      }

      try {
        await current.sock.sendMessage(jid, { text: reply })
        console.log(`[AI] ✅ Reply sent via ${usedModel}`)
      } catch (sendErr) {
        console.error(`[AI] ❌ Send failed: ${sendErr.message}`)
        return null
      }

      await supabase.from('messages').insert({
        device_id: deviceId, user_id: userId, direction: 'outgoing',
        to_number: phoneOnly, type: 'text', content: { text: reply }, status: 'sent',
        metadata: { source: 'ai', model: usedModel },
      })
      await supabase.from('ai_usage_logs').insert({ user_id: userId, device_id: deviceId, model: usedModel })

      console.log(`[AI] === END === ✅`)
      return reply  // Return for auto-learning
    } catch (err) {
      console.error(`[AI] FATAL [${deviceId}]:`, err.message, err.stack)
      try { await sock.sendPresenceUpdate('paused', jid) } catch {}
      return null
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

  async getGroups(deviceId) {
    const entry = sessions.get(deviceId)
    if (!entry?.sock) throw new Error('جهاز غير متصل')
    try {
      const groupMap = await entry.sock.groupFetchAllParticipating()
      return Object.values(groupMap).map(g => ({
        id: g.id,
        name: g.subject || g.id,
        participants: (g.participants || []).map(p => ({
          id: p.id?.replace('@s.whatsapp.net', '').replace('@g.us', '') || p,
          admin: p.admin || null,
        })),
        size: (g.participants || []).length,
      }))
    } catch (err) {
      console.error('[getGroups] error:', err.message)
      return []
    }
  }

  // ========== STORIES (status@broadcast) ==========
  // Best-effort posting via Baileys. Unofficial — may break.
  async postStory({ deviceId, type, caption, mediaUrl, textColor, backgroundColor }) {
    const sock = this._getSock(deviceId)
    const jid = 'status@broadcast'
    let payload

    if (type === 'image') {
      if (!mediaUrl) throw new Error('mediaUrl required for image stories')
      payload = { image: { url: mediaUrl }, caption: caption || '' }
    } else if (type === 'video') {
      if (!mediaUrl) throw new Error('mediaUrl required for video stories')
      payload = { video: { url: mediaUrl }, caption: caption || '' }
    } else {
      // Text story
      payload = {
        text: caption || '',
        backgroundColor: backgroundColor || '#7C3AED',
        font: 0,
      }
    }

    await sock.sendMessage(jid, payload, {
      backgroundColor: backgroundColor || '#7C3AED',
    })
    return { posted: true }
  }

  // Polls scheduled_stories table every minute and posts due stories
  startStoriesWorker() {
    setInterval(async () => {
      try {
        const nowIso = new Date().toISOString()
        const { data: due } = await supabase
          .from('scheduled_stories')
          .select('*')
          .eq('status', 'pending')
          .lte('scheduled_at', nowIso)
          .limit(20)

        if (!due?.length) return

        for (const s of due) {
          try {
            if (!this.isConnected(s.device_id)) {
              await supabase.from('scheduled_stories').update({
                status: 'failed',
                error_message: 'الجهاز غير متصل',
              }).eq('id', s.id)
              continue
            }
            await this.postStory({
              deviceId: s.device_id,
              type: s.type,
              caption: s.caption,
              mediaUrl: s.media_url,
              textColor: s.text_color,
              backgroundColor: s.background_color,
            })
            await supabase.from('scheduled_stories').update({
              status: 'sent',
              posted_at: new Date().toISOString(),
            }).eq('id', s.id)
            console.log(`[stories] ✅ posted ${s.id}`)
          } catch (err) {
            console.error(`[stories] ❌ ${s.id}:`, err.message)
            await supabase.from('scheduled_stories').update({
              status: 'failed',
              error_message: err.message?.substring(0, 250),
            }).eq('id', s.id)
          }
        }
      } catch (err) {
        console.error('[stories worker] error:', err.message)
      }
    }, 60_000) // every 60 seconds
  }

  getSessionCount() {
    return sessions.size
  }
}

const whatsappService = new WhatsAppService()
module.exports = { whatsappService }

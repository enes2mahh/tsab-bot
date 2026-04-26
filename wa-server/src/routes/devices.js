const express = require('express')
const router = express.Router()
const { whatsappService } = require('../services/whatsapp')
const { createClient } = require('@supabase/supabase-js')
const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = require('../config')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// POST /devices/init - Start a session (boot)
router.post('/init', async (req, res) => {
  const { deviceId, userId } = req.body
  if (!deviceId) return res.status(400).json({ error: 'deviceId required' })

  try {
    await whatsappService.initDevice(deviceId, userId)
    res.json({ success: true, message: 'Device initializing' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /devices/qr - Get QR (waits up to 40s for QR to be generated)
router.post('/qr', async (req, res) => {
  const { deviceId } = req.body
  if (!deviceId) return res.status(400).json({ error: 'deviceId required' })

  try {
    console.log(`[QR] Request for device: ${deviceId}`)

    // Already connected? skip
    if (whatsappService.isConnected(deviceId)) {
      console.log(`[QR] Device ${deviceId} already connected`)
      return res.json({ success: true, alreadyConnected: true })
    }

    // Init session if not started, then wait for QR
    console.log(`[QR] Initializing device ${deviceId}...`)
    await whatsappService.initDevice(deviceId, null)

    console.log(`[QR] Waiting for QR (up to 40s)...`)
    const qr = await whatsappService.waitForQR(deviceId, 40000)

    if (!qr) {
      console.warn(`[QR] Timeout for device ${deviceId}`)
      return res.status(504).json({ error: 'QR generation timed out - try again in a moment' })
    }

    console.log(`[QR] ✅ QR generated for ${deviceId}`)
    res.json({ success: true, qr })
  } catch (err) {
    console.error('[QR] Route error:', err)
    res.status(500).json({ error: err.message || 'Failed to generate QR' })
  }
})

// POST /devices/disconnect
router.post('/disconnect', async (req, res) => {
  const { deviceId } = req.body
  if (!deviceId) return res.status(400).json({ error: 'deviceId required' })
  try {
    await whatsappService.disconnectDevice(deviceId)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /devices/:id/status
router.get('/:id/status', async (req, res) => {
  const { data: device } = await supabase
    .from('devices')
    .select('id, status, phone, last_seen')
    .eq('id', req.params.id)
    .single()
  if (!device) return res.status(404).json({ error: 'Device not found' })
  res.json({ ...device, sessionAlive: whatsappService.isConnected(req.params.id) })
})

// POST /devices/restore-all
router.post('/restore-all', async (req, res) => {
  try {
    await whatsappService.restoreAllSessions()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /devices/import-contacts
// Body: { deviceId, source: 'chats' | 'phonebook' }
// Imports contacts from the device's WA session into the contacts table
router.post('/import-contacts', async (req, res) => {
  const { deviceId, source = 'chats' } = req.body
  if (!deviceId) return res.status(400).json({ error: 'deviceId required' })

  try {
    if (!whatsappService.isConnected(deviceId)) {
      return res.status(400).json({ error: 'الجهاز غير متصل' })
    }

    const { data: device } = await supabase.from('devices').select('user_id').eq('id', deviceId).single()
    if (!device) return res.status(404).json({ error: 'Device not found' })

    let contactsToImport = []

    if (source === 'chats') {
      // Pull unique sender numbers from messages table (people who DM'd this device)
      const { data: rows } = await supabase
        .from('messages')
        .select('from_number, contact_name')
        .eq('device_id', deviceId)
        .eq('direction', 'incoming')
        .not('from_number', 'is', null)

      const seen = new Map()
      for (const r of rows || []) {
        if (r.from_number && !seen.has(r.from_number)) {
          seen.set(r.from_number, r.contact_name || null)
        }
      }
      contactsToImport = Array.from(seen.entries()).map(([phone, name]) => ({ phone, name }))
    }

    if (contactsToImport.length === 0) {
      return res.json({ success: true, imported: 0, message: 'لا توجد جهات اتصال للاستيراد' })
    }

    // Detect country code (simple heuristic: first 1-3 digits)
    const detectCountry = (phone) => {
      const p = String(phone).replace(/\D/g, '')
      if (p.startsWith('966')) return '+966'
      if (p.startsWith('971')) return '+971'
      if (p.startsWith('20')) return '+20'
      if (p.startsWith('962')) return '+962'
      if (p.startsWith('965')) return '+965'
      if (p.startsWith('974')) return '+974'
      if (p.startsWith('973')) return '+973'
      if (p.startsWith('968')) return '+968'
      if (p.startsWith('963')) return '+963'
      if (p.startsWith('964')) return '+964'
      if (p.startsWith('961')) return '+961'
      if (p.startsWith('970')) return '+970'
      if (p.startsWith('212')) return '+212'
      if (p.startsWith('213')) return '+213'
      if (p.startsWith('216')) return '+216'
      if (p.startsWith('218')) return '+218'
      if (p.startsWith('249')) return '+249'
      if (p.startsWith('1')) return '+1'
      if (p.startsWith('44')) return '+44'
      return null
    }

    const rows = contactsToImport.map(c => ({
      user_id: device.user_id,
      phone: c.phone,
      name: c.name || null,
      country_code: detectCountry(c.phone),
      source: source === 'chats' ? 'wa_chats' : 'wa_phonebook',
      tags: [],
      metadata: { imported_at: new Date().toISOString(), device_id: deviceId },
    }))

    // Upsert (skip duplicates by user+phone unique constraint)
    const { data: inserted, error } = await supabase
      .from('contacts')
      .upsert(rows, { onConflict: 'user_id,phone', ignoreDuplicates: true })
      .select('id')

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json({ success: true, imported: inserted?.length || 0, total: rows.length })
  } catch (err) {
    console.error('import-contacts error:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /devices/:id/groups — fetch all groups for a connected device
router.get('/:id/groups', async (req, res) => {
  const deviceId = req.params.id
  try {
    if (!whatsappService.isConnected(deviceId)) {
      return res.status(400).json({ error: 'الجهاز غير متصل', groups: [] })
    }
    const groups = await whatsappService.getGroups(deviceId)
    res.json({ success: true, groups })
  } catch (err) {
    console.error('[groups] error:', err)
    res.status(500).json({ error: err.message, groups: [] })
  }
})

module.exports = router

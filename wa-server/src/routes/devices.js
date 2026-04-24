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

// POST /devices/qr - Get QR (waits up to 15s for QR to be generated)
router.post('/qr', async (req, res) => {
  const { deviceId } = req.body
  if (!deviceId) return res.status(400).json({ error: 'deviceId required' })

  try {
    // Already connected? skip
    if (whatsappService.isConnected(deviceId)) {
      return res.json({ success: true, alreadyConnected: true })
    }

    // Init session if not started, then wait for QR
    await whatsappService.initDevice(deviceId, null)
    const qr = await whatsappService.waitForQR(deviceId, 15000)

    if (!qr) {
      return res.status(504).json({ error: 'QR generation timed out' })
    }

    res.json({ success: true, qr })
  } catch (err) {
    console.error('QR route error:', err)
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

module.exports = router

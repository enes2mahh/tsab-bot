const express = require('express')
const router = express.Router()
const { whatsappService } = require('../services/whatsapp')
const { createClient } = require('@supabase/supabase-js')
const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = require('../config')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// POST /devices/init - بدء جلسة
router.post('/init', async (req, res) => {
  const { deviceId, userId } = req.body
  if (!deviceId) return res.status(400).json({ error: 'deviceId required' })

  try {
    await whatsappService.initDevice(deviceId, userId)
    res.json({ success: true, message: 'Device initializing...' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /devices/qr - جلب QR
router.post('/qr', async (req, res) => {
  const { deviceId } = req.body
  if (!deviceId) return res.status(400).json({ error: 'deviceId required' })

  try {
    // If not initialized, init now and return success (QR comes via socket)
    await whatsappService.initDevice(deviceId, null)
    res.json({ success: true, message: 'QR will be emitted via socket' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /devices/disconnect - قطع الاتصال
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

// GET /devices/:id/status - حالة جهاز
router.get('/:id/status', async (req, res) => {
  const { data: device } = await supabase
    .from('devices')
    .select('id, status, phone, last_seen')
    .eq('id', req.params.id)
    .single()

  if (!device) return res.status(404).json({ error: 'Device not found' })
  res.json(device)
})

// POST /devices/restore-all - استعادة كل الجلسات
router.post('/restore-all', async (req, res) => {
  try {
    await whatsappService.restoreAllSessions()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router

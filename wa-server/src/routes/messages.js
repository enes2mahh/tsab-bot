const express = require('express')
const router = express.Router()
const { whatsappService } = require('../services/whatsapp')

// POST /messages/text
router.post('/text', async (req, res) => {
  const { deviceId, phone, text } = req.body
  try {
    await whatsappService.sendText(deviceId, phone, text)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /messages/image
router.post('/image', async (req, res) => {
  const { deviceId, phone, url, caption } = req.body
  try {
    await whatsappService.sendImage(deviceId, phone, url, caption)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /messages/document
router.post('/document', async (req, res) => {
  const { deviceId, phone, url, filename, mimetype } = req.body
  try {
    await whatsappService.sendDocument(deviceId, phone, url, filename, mimetype)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /messages/location
router.post('/location', async (req, res) => {
  const { deviceId, phone, lat, lng, name } = req.body
  try {
    await whatsappService.sendLocation(deviceId, phone, lat, lng, name)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /messages/button
router.post('/button', async (req, res) => {
  const { deviceId, phone, data } = req.body
  try {
    await whatsappService.sendButtons(deviceId, phone, data)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /messages/list
router.post('/list', async (req, res) => {
  const { deviceId, phone, data } = req.body
  try {
    await whatsappService.sendList(deviceId, phone, data)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /messages/story - post a WhatsApp Status (best-effort, unofficial)
router.post('/story', async (req, res) => {
  const { deviceId, type, caption, mediaUrl, textColor, backgroundColor } = req.body
  if (!deviceId) return res.status(400).json({ error: 'deviceId required' })
  try {
    const result = await whatsappService.postStory({ deviceId, type, caption, mediaUrl, textColor, backgroundColor })
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router

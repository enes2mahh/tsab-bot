const express = require('express')
const router = express.Router()
const { whatsappService } = require('../services/whatsapp')
const { createClient } = require('@supabase/supabase-js')
const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = require('../config')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const WARMER_MESSAGES = [
  'مرحبا! كيف حالك؟', 'أهلاً وسهلاً!', 'السلام عليكم ورحمة الله',
  'صباح الخير ☀️', 'مساء النور 🌙', 'كيف يومك؟', 'تحياتي!',
  'أتمنى لك يوم سعيد', 'شكراً لتواصلك', 'أسعد الله أوقاتك',
  'كيف أمورك؟', 'يسعد مساك', 'صباح الورد 🌹', 'هلا والله',
  'كل عام وأنت بخير', 'تمام الحمد لله', 'الله يحفظك', 'طيب شكراً',
]

// POST /warmer/tick - Called by cron or interval
router.post('/tick', async (req, res) => {
  try {
    const { data: configs } = await supabase
      .from('warmer_config')
      .select('*')
      .eq('is_active', true)

    if (!configs || configs.length === 0) return res.json({ processed: 0 })

    const now = new Date()
    const currentHour = now.getHours()
    let processed = 0

    for (const config of configs) {
      if (currentHour < config.start_hour || currentHour >= config.end_hour) continue
      if (config.messages_today >= config.daily_target) continue
      if (!config.device_ids || config.device_ids.length < 2) continue

      // Pick two random devices
      const shuffled = [...config.device_ids].sort(() => Math.random() - 0.5)
      const fromDevice = shuffled[0]
      const toDevice = shuffled[1]

      // Get phone numbers
      const { data: fromDev } = await supabase.from('devices').select('phone, status').eq('id', fromDevice).single()
      const { data: toDev } = await supabase.from('devices').select('phone, status').eq('id', toDevice).single()

      if (!fromDev?.phone || !toDev?.phone || fromDev.status !== 'connected') continue

      const msg = WARMER_MESSAGES[Math.floor(Math.random() * WARMER_MESSAGES.length)]
      try {
        await whatsappService.sendText(fromDevice, toDev.phone, msg)
        await supabase.from('warmer_config').update({
          messages_today: (config.messages_today || 0) + 1,
          total_messages: (config.total_messages || 0) + 1,
        }).eq('id', config.id)
        processed++
      } catch (err) {
        console.error('Warmer send error:', err.message)
      }
    }

    res.json({ processed })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /warmer/reset-daily - Reset daily counters (call at midnight)
router.post('/reset-daily', async (req, res) => {
  await supabase.from('warmer_config').update({ messages_today: 0 }).eq('is_active', true)
  // Increment days_running
  await supabase.rpc('increment_warmer_days')
  res.json({ success: true })
})

module.exports = router

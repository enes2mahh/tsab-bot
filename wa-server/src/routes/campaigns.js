const express = require('express')
const router = express.Router()
const { whatsappService } = require('../services/whatsapp')
const { createClient } = require('@supabase/supabase-js')
const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = require('../config')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// POST /campaigns/start - بدء حملة
router.post('/start', async (req, res) => {
  const { campaignId } = req.body
  if (!campaignId) return res.status(400).json({ error: 'campaignId required' })

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (!campaign) return res.status(404).json({ error: 'Campaign not found' })

  const recipients = campaign.recipients || []
  await supabase
    .from('campaigns')
    .update({ status: 'running', started_at: new Date().toISOString(), total_count: recipients.length })
    .eq('id', campaignId)

  try {
    await whatsappService.createCampaignJobs(
      campaignId,
      recipients,
      campaign.message_content,
      campaign.delay_min,
      campaign.delay_max
    )
    res.json({ success: true, total: recipients.length })
  } catch (err) {
    await supabase.from('campaigns').update({ status: 'failed' }).eq('id', campaignId)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router

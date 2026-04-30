const express = require('express')
const router = express.Router()

// GET /health — public endpoint for Railway health checks and monitoring
router.get('/', (req, res) => {
  const mem = process.memoryUsage()
  const uptime = process.uptime()

  res.json({
    status: 'ok',
    uptime_seconds: Math.round(uptime),
    memory: {
      heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
      rss_mb: Math.round(mem.rss / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
  })
})

module.exports = router
 
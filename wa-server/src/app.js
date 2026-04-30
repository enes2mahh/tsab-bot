require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
const pino = require('pino')

// Use pretty logs only in dev (when pino-pretty is installed)
const logger = process.env.NODE_ENV === 'development'
  ? pino({ transport: { target: 'pino-pretty' } })
  : pino()
const { whatsappService } = require('./services/whatsapp')
const devicesRouter = require('./routes/devices')
const messagesRouter = require('./routes/messages')
const campaignsRouter = require('./routes/campaigns')
const warmerRouter = require('./routes/warmer')
const { authMiddleware } = require('./middleware/auth')

const app = express()
const server = http.createServer(app)

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
})

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }))
app.use(express.json({ limit: '50mb' }))

// Health check (no auth) — includes memory and session stats
app.get('/health', (req, res) => {
  const mem = process.memoryUsage()
  const activeSessions = whatsappService.getSessionCount ? whatsappService.getSessionCount() : 0
  res.json({
    status: 'ok',
    uptime_seconds: Math.round(process.uptime()),
    sessions: activeSessions,
    memory: {
      heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
      rss_mb: Math.round(mem.rss / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
  })
})

// Auth middleware for all other routes
app.use(authMiddleware)

// Routes
app.use('/devices', devicesRouter)
app.use('/messages', messagesRouter)
app.use('/campaigns', campaignsRouter)
app.use('/warmer', warmerRouter)

// Socket.IO
io.on('connection', (socket) => {
  logger.info('Socket connected:', socket.id)

  socket.on('join-device', (deviceId) => {
    socket.join(`device-${deviceId}`)
    logger.info(`Socket joined device room: ${deviceId}`)
  })

  socket.on('disconnect', () => {
    logger.info('Socket disconnected:', socket.id)
  })
})

// Make io available globally
global.io = io

// Restore sessions on startup
const PORT = process.env.PORT || 8080
server.listen(PORT, async () => {
  logger.info(`🚀 WA Server running on port ${PORT}`)
  await whatsappService.restoreAllSessions()
  logger.info('✅ Sessions restored')
  whatsappService.startStoriesWorker()
  logger.info('📸 Stories worker started')
})

module.exports = { app, io }

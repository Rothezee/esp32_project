import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import dotenv from 'dotenv'
import { initDatabase } from './database'
import authRoutes from './routes/auth'
import deviceRoutes from './routes/devices'
import reportRoutes from './routes/reports'
import analyticsRoutes from './routes/analytics'
import esp32Routes from './routes/esp32'

dotenv.config()

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}))
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}))
app.use(express.json())

// Initialize database
initDatabase()

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/esp32', esp32Routes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket')
  
  ws.on('close', () => {
    console.log('Client disconnected from WebSocket')
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
})

// Broadcast function for real-time updates
export function broadcast(data: any) {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      try {
        client.send(JSON.stringify(data))
      } catch (error) {
        console.error('Error broadcasting to client:', error)
      }
    }
  })
}

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Dashboard: http://localhost:${PORT}`)
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Process terminated')
  })
})
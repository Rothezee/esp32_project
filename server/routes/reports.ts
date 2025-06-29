import { Router } from 'express'
import { getDatabase } from '../database'

const router = Router()

router.get('/', (req, res) => {
  const { deviceId, startDate, endDate } = req.query
  const db = getDatabase()

  if (!deviceId) {
    return res.status(400).json({ error: 'Device ID is required' })
  }

  let query = `
    SELECT 
      id,
      device_id,
      pesos,
      coin,
      premios,
      banco,
      fichas,
      dinero,
      tickets,
      timestamp
    FROM device_data 
    WHERE device_id = ?
  `
  const params: any[] = [deviceId]

  if (startDate && endDate) {
    query += ' AND date(timestamp) BETWEEN ? AND ?'
    params.push(startDate, endDate)
  }

  query += ' ORDER BY timestamp DESC LIMIT 1000'

  db.all(query, params, (err, rows: any[]) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }

    const reports = rows.map(row => ({
      id: row.id,
      deviceId: row.device_id,
      timestamp: row.timestamp,
      data: {
        pesos: row.pesos,
        coin: row.coin,
        premios: row.premios,
        banco: row.banco,
        fichas: row.fichas,
        dinero: row.dinero,
        tickets: row.tickets,
      }
    }))

    res.json(reports)
  })
})

export default router
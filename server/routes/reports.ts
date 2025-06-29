import { Router } from 'express'
import { getDatabase } from '../database'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { deviceId, startDate, endDate } = req.query
    const db = getDatabase()

    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' })
    }

    let query = `
      SELECT 
        id,
        device_id,
        data,
        timestamp
      FROM device_data 
      WHERE device_id = $1
    `
    const params: any[] = [deviceId]

    if (startDate && endDate) {
      query += ' AND DATE(timestamp) BETWEEN $2 AND $3'
      params.push(startDate, endDate)
    }

    query += ' ORDER BY timestamp DESC LIMIT 1000'

    const result = await db.query(query, params)

    const reports = result.rows.map(row => ({
      id: row.id,
      deviceId: row.device_id,
      timestamp: row.timestamp,
      data: row.data,
    }))

    res.json(reports)
  } catch (error) {
    console.error('Error fetching reports:', error)
    res.status(500).json({ error: 'Database error' })
  }
})

export default router
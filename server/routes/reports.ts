import { Router } from 'express'
import { dbAll } from '../database'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { deviceId, startDate, endDate } = req.query
    
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
      WHERE device_id = ?
    `
    const params: any[] = [deviceId]

    if (startDate && endDate) {
      query += ' AND DATE(timestamp) BETWEEN ? AND ?'
      params.push(startDate, endDate)
    }

    query += ' ORDER BY timestamp DESC LIMIT 1000'

    const result = await dbAll(query, params)

    const reports = result.map(row => ({
      id: row.id,
      deviceId: row.device_id,
      timestamp: row.timestamp,
      data: JSON.parse(row.data || '{}'),
    }))

    res.json(reports)
  } catch (error) {
    console.error('Error fetching reports:', error)
    res.status(500).json({ error: 'Database error' })
  }
})

export default router
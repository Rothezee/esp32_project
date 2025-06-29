import { Router } from 'express'
import { getDatabase } from '../database'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { deviceId, period = '7d' } = req.query
    const db = getDatabase()

    // Calculate date range based on period
    let dateFilter = ''
    switch (period) {
      case '24h':
        dateFilter = "timestamp >= NOW() - INTERVAL '24 hours'"
        break
      case '7d':
        dateFilter = "timestamp >= NOW() - INTERVAL '7 days'"
        break
      case '30d':
        dateFilter = "timestamp >= NOW() - INTERVAL '30 days'"
        break
      case '90d':
        dateFilter = "timestamp >= NOW() - INTERVAL '90 days'"
        break
      default:
        dateFilter = "timestamp >= NOW() - INTERVAL '7 days'"
    }

    // Base query
    let baseQuery = `FROM device_data WHERE ${dateFilter}`
    const params: any[] = []

    if (deviceId) {
      baseQuery += ' AND device_id = $1'
      params.push(deviceId)
    }

    // Get total events
    const totalEventsResult = await db.query(`
      SELECT COUNT(*) as total ${baseQuery}
    `, params)

    // Get daily averages
    const dailyAverageResult = await db.query(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as events
      ${baseQuery}
      GROUP BY DATE(timestamp)
      ORDER BY date
    `, params)

    // Get device type distribution
    const deviceTypeResult = await db.query(`
      SELECT 
        d.type,
        COUNT(DISTINCT d.id) as count
      FROM devices d
      GROUP BY d.type
    `)

    // Get status distribution
    const statusResult = await db.query(`
      SELECT 
        CASE 
          WHEN EXTRACT(EPOCH FROM (NOW() - last_heartbeat)) <= 300 THEN 'online'
          WHEN EXTRACT(EPOCH FROM (NOW() - last_heartbeat)) <= 3600 THEN 'offline'
          ELSE 'unknown'
        END as status,
        COUNT(*) as count
      FROM devices
      GROUP BY status
    `)

    const totalEvents = parseInt(totalEventsResult.rows[0]?.total || '0')
    const dailyEvents = dailyAverageResult.rows
    const averageDaily = dailyEvents.length > 0 
      ? Math.round(dailyEvents.reduce((sum, day) => sum + parseInt(day.events), 0) / dailyEvents.length)
      : 0

    const metrics = [
      {
        title: 'Total de Eventos',
        value: totalEvents.toLocaleString(),
        change: 0,
        changeType: 'increase',
        icon: 'Activity',
        color: 'from-blue-500 to-blue-600',
      },
      {
        title: 'Promedio Diario',
        value: averageDaily.toLocaleString(),
        change: 0,
        changeType: 'increase',
        icon: 'TrendingUp',
        color: 'from-green-500 to-green-600',
      },
    ]

    const chartData = {
      daily: {
        labels: dailyEvents.map(d => d.date),
        datasets: [{
          label: 'Eventos',
          data: dailyEvents.map(d => parseInt(d.events)),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        }],
      },
      deviceTypes: {
        labels: deviceTypeResult.rows.map(d => d.type),
        datasets: [{
          data: deviceTypeResult.rows.map(d => parseInt(d.count)),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)',
          ],
        }],
      },
      status: {
        labels: statusResult.rows.map(d => d.status),
        datasets: [{
          data: statusResult.rows.map(d => parseInt(d.count)),
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(156, 163, 175, 0.8)',
          ],
        }],
      },
    }

    res.json({
      metrics,
      chartData,
      trends: {
        totalEvents,
        averageDaily,
        deviceTypes: deviceTypeResult.rows,
        status: statusResult.rows,
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    res.status(500).json({ error: 'Database error' })
  }
})

export default router
import { Router } from 'express'
import { dbAll } from '../database'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { deviceId, period = '7d' } = req.query

    // Calculate date range based on period
    let dateFilter = ''
    switch (period) {
      case '24h':
        dateFilter = "timestamp >= datetime('now', '-1 day')"
        break
      case '7d':
        dateFilter = "timestamp >= datetime('now', '-7 days')"
        break
      case '30d':
        dateFilter = "timestamp >= datetime('now', '-30 days')"
        break
      case '90d':
        dateFilter = "timestamp >= datetime('now', '-90 days')"
        break
      default:
        dateFilter = "timestamp >= datetime('now', '-7 days')"
    }

    // Base query
    let baseQuery = `FROM device_data WHERE ${dateFilter}`
    const params: any[] = []

    if (deviceId) {
      baseQuery += ' AND device_id = ?'
      params.push(deviceId)
    }

    // Get total events
    const totalEventsResult = await dbAll(`
      SELECT COUNT(*) as total ${baseQuery}
    `, params)

    // Get daily averages
    const dailyAverageResult = await dbAll(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as events
      ${baseQuery}
      GROUP BY DATE(timestamp)
      ORDER BY date
    `, params)

    // Get device type distribution
    const deviceTypeResult = await dbAll(`
      SELECT 
        type,
        COUNT(*) as count
      FROM devices
      GROUP BY type
    `)

    // Get status distribution
    const statusResult = await dbAll(`
      SELECT 
        CASE 
          WHEN (julianday('now') - julianday(last_heartbeat)) * 24 * 60 * 60 <= 300 THEN 'online'
          WHEN (julianday('now') - julianday(last_heartbeat)) * 24 * 60 * 60 <= 3600 THEN 'offline'
          ELSE 'unknown'
        END as status,
        COUNT(*) as count
      FROM devices
      GROUP BY status
    `)

    const totalEvents = parseInt(totalEventsResult[0]?.total || '0')
    const dailyEvents = dailyAverageResult
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
        labels: deviceTypeResult.map(d => d.type),
        datasets: [{
          data: deviceTypeResult.map(d => parseInt(d.count)),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)',
          ],
        }],
      },
      status: {
        labels: statusResult.map(d => d.status),
        datasets: [{
          data: statusResult.map(d => parseInt(d.count)),
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
        deviceTypes: deviceTypeResult,
        status: statusResult,
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    res.status(500).json({ error: 'Database error' })
  }
})

export default router
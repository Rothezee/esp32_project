import { Router } from 'express'
import { getDatabase } from '../database'

const router = Router()

router.get('/', (req, res) => {
  const db = getDatabase()

  // Get all devices with their latest data
  db.all(`
    SELECT 
      d.id,
      d.name,
      d.type,
      d.last_heartbeat,
      dd.pesos,
      dd.coin,
      dd.premios,
      dd.banco,
      dd.fichas,
      dd.dinero,
      dd.tickets,
      CASE 
        WHEN (julianday('now') - julianday(d.last_heartbeat)) * 24 * 60 <= 5 THEN 'online'
        WHEN (julianday('now') - julianday(d.last_heartbeat)) * 24 * 60 <= 60 THEN 'offline'
        ELSE 'unknown'
      END as status
    FROM devices d
    LEFT JOIN (
      SELECT DISTINCT device_id,
        FIRST_VALUE(pesos) OVER (PARTITION BY device_id ORDER BY timestamp DESC) as pesos,
        FIRST_VALUE(coin) OVER (PARTITION BY device_id ORDER BY timestamp DESC) as coin,
        FIRST_VALUE(premios) OVER (PARTITION BY device_id ORDER BY timestamp DESC) as premios,
        FIRST_VALUE(banco) OVER (PARTITION BY device_id ORDER BY timestamp DESC) as banco,
        FIRST_VALUE(fichas) OVER (PARTITION BY device_id ORDER BY timestamp DESC) as fichas,
        FIRST_VALUE(dinero) OVER (PARTITION BY device_id ORDER BY timestamp DESC) as dinero,
        FIRST_VALUE(tickets) OVER (PARTITION BY device_id ORDER BY timestamp DESC) as tickets
      FROM device_data
    ) dd ON d.id = dd.device_id
    ORDER BY d.name
  `, (err, rows: any[]) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }

    const devices = rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      lastHeartbeat: row.last_heartbeat,
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

    res.json(devices)
  })
})

export default router
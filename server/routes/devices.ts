import { Router } from 'express'
import { getDatabase } from '../database'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

const router = Router()

const deviceFieldSchema = z.object({
  name: z.string(),
  key: z.string(),
  type: z.enum(['number', 'text', 'boolean']),
  required: z.boolean(),
  defaultValue: z.any().optional(),
})

const createDeviceSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  fields: z.array(deviceFieldSchema),
})

// Get all devices
router.get('/', async (req, res) => {
  try {
    const db = getDatabase()
    
    // Get all devices with their latest data
    const devicesResult = await db.query(`
      SELECT 
        d.id,
        d.name,
        d.type,
        d.fields,
        d.last_heartbeat,
        d.created_at,
        CASE 
          WHEN EXTRACT(EPOCH FROM (NOW() - d.last_heartbeat)) <= 300 THEN 'online'
          WHEN EXTRACT(EPOCH FROM (NOW() - d.last_heartbeat)) <= 3600 THEN 'offline'
          ELSE 'unknown'
        END as status
      FROM devices d
      ORDER BY d.name
    `)

    const devices = []
    
    for (const device of devicesResult.rows) {
      // Get latest data for each device
      const dataResult = await db.query(`
        SELECT data 
        FROM device_data 
        WHERE device_id = $1 
        ORDER BY timestamp DESC 
        LIMIT 1
      `, [device.id])

      const latestData = dataResult.rows[0]?.data || {}

      devices.push({
        id: device.id,
        name: device.name,
        type: device.type,
        status: device.status,
        lastHeartbeat: device.last_heartbeat,
        fields: device.fields || [],
        data: latestData,
        createdAt: device.created_at,
      })
    }

    res.json(devices)
  } catch (error) {
    console.error('Error fetching devices:', error)
    res.status(500).json({ error: 'Database error' })
  }
})

// Create device
router.post('/', async (req, res) => {
  try {
    const deviceData = createDeviceSchema.parse(req.body)
    const db = getDatabase()
    
    const id = uuidv4()
    const fieldsWithIds = deviceData.fields.map(field => ({
      ...field,
      id: uuidv4(),
    }))

    await db.query(`
      INSERT INTO devices (id, name, type, fields) 
      VALUES ($1, $2, $3, $4)
    `, [id, deviceData.name, deviceData.type, JSON.stringify(fieldsWithIds)])

    res.json({ 
      id, 
      ...deviceData, 
      fields: fieldsWithIds,
      status: 'unknown',
      lastHeartbeat: new Date().toISOString(),
      data: {},
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error creating device:', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid device data', details: error.errors })
    } else {
      res.status(500).json({ error: 'Database error' })
    }
  }
})

// Update device
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const deviceData = createDeviceSchema.parse(req.body)
    const db = getDatabase()
    
    const fieldsWithIds = deviceData.fields.map(field => ({
      ...field,
      id: field.id || uuidv4(),
    }))

    const result = await db.query(`
      UPDATE devices 
      SET name = $1, type = $2, fields = $3 
      WHERE id = $4
      RETURNING *
    `, [deviceData.name, deviceData.type, JSON.stringify(fieldsWithIds), id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' })
    }

    res.json({ 
      id, 
      ...deviceData, 
      fields: fieldsWithIds,
    })
  } catch (error) {
    console.error('Error updating device:', error)
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid device data', details: error.errors })
    } else {
      res.status(500).json({ error: 'Database error' })
    }
  }
})

// Delete device
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const db = getDatabase()

    const result = await db.query('DELETE FROM devices WHERE id = $1', [id])

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Device not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting device:', error)
    res.status(500).json({ error: 'Database error' })
  }
})

export default router
import { Router } from 'express'
import { dbGet, dbAll, dbRun } from '../database'
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
    // Get all devices
    const devices = await dbAll(`
      SELECT 
        id,
        name,
        type,
        fields,
        last_heartbeat,
        created_at,
        CASE 
          WHEN (julianday('now') - julianday(last_heartbeat)) * 24 * 60 * 60 <= 300 THEN 'online'
          WHEN (julianday('now') - julianday(last_heartbeat)) * 24 * 60 * 60 <= 3600 THEN 'offline'
          ELSE 'unknown'
        END as status
      FROM devices
      ORDER BY name
    `)

    const devicesWithData = []
    
    for (const device of devices) {
      // Get latest data for each device
      const latestData = await dbGet(`
        SELECT data 
        FROM device_data 
        WHERE device_id = ? 
        ORDER BY timestamp DESC 
        LIMIT 1
      `, [device.id])

      let parsedData = {}
      let parsedFields = []

      try {
        parsedData = latestData ? JSON.parse(latestData.data) : {}
      } catch (e) {
        parsedData = {}
      }

      try {
        parsedFields = device.fields ? JSON.parse(device.fields) : []
      } catch (e) {
        parsedFields = []
      }

      devicesWithData.push({
        id: device.id,
        name: device.name,
        type: device.type,
        status: device.status,
        lastHeartbeat: device.last_heartbeat,
        fields: parsedFields,
        data: parsedData,
        createdAt: device.created_at,
      })
    }

    res.json(devicesWithData)
  } catch (error) {
    console.error('Error fetching devices:', error)
    res.status(500).json({ error: 'Database error' })
  }
})

// Create device
router.post('/', async (req, res) => {
  try {
    const deviceData = createDeviceSchema.parse(req.body)
    
    const id = uuidv4()
    const fieldsWithIds = deviceData.fields.map(field => ({
      ...field,
      id: uuidv4(),
    }))

    await dbRun(`
      INSERT INTO devices (id, name, type, fields) 
      VALUES (?, ?, ?, ?)
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
    
    const fieldsWithIds = deviceData.fields.map(field => ({
      ...field,
      id: field.id || uuidv4(),
    }))

    const result = await dbRun(`
      UPDATE devices 
      SET name = ?, type = ?, fields = ? 
      WHERE id = ?
    `, [deviceData.name, deviceData.type, JSON.stringify(fieldsWithIds), id])

    if (result.changes === 0) {
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

    const result = await dbRun('DELETE FROM devices WHERE id = ?', [id])

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Device not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting device:', error)
    res.status(500).json({ error: 'Database error' })
  }
})

export default router
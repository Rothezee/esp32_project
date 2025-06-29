import { Router } from 'express'
import { dbRun } from '../database'
import { broadcast } from '../index'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// Heartbeat endpoint
router.post('/heartbeat', async (req, res) => {
  try {
    const { device_id } = req.body

    if (!device_id) {
      return res.status(400).json({ error: 'Missing device_id' })
    }

    await dbRun(
      'UPDATE devices SET last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?',
      [device_id]
    )

    // Broadcast device update
    broadcast({ type: 'device_update', deviceId: device_id })
    
    res.json({ success: 'Heartbeat updated' })
  } catch (error) {
    console.error('Error updating heartbeat:', error)
    res.status(500).json({ error: 'Database error' })
  }
})

// Generic data insertion endpoint
router.post('/data', async (req, res) => {
  try {
    const { device_id, ...data } = req.body

    if (!device_id) {
      return res.status(400).json({ error: 'Missing device_id' })
    }

    const id = uuidv4()
    
    await dbRun(`
      INSERT INTO device_data (id, device_id, data) 
      VALUES (?, ?, ?)
    `, [id, device_id, JSON.stringify(data)])

    // Update device heartbeat
    await dbRun(
      'UPDATE devices SET last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?',
      [device_id]
    )

    // Broadcast device update
    broadcast({ type: 'device_update', deviceId: device_id })
    
    res.json({ success: 'Data inserted successfully' })
  } catch (error) {
    console.error('Error inserting data:', error)
    res.status(500).json({ error: 'Database error' })
  }
})

// Legacy endpoints for backward compatibility
router.post('/expendedora/data', async (req, res) => {
  try {
    const { device_id, dato1, dato2 } = req.body

    if (!device_id || dato1 === undefined || dato2 === undefined) {
      return res.status(400).json({ error: 'Missing required data' })
    }

    const id = uuidv4()
    const data = { fichas: dato1, dinero: dato2 }
    
    await dbRun(`
      INSERT INTO device_data (id, device_id, data) 
      VALUES (?, ?, ?)
    `, [id, device_id, JSON.stringify(data)])

    // Update device heartbeat
    await dbRun(
      'UPDATE devices SET last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?',
      [device_id]
    )

    // Broadcast device update
    broadcast({ type: 'device_update', deviceId: device_id })
    
    res.json({ success: 'Data inserted successfully' })
  } catch (error) {
    console.error('Error inserting expendedora data:', error)
    res.status(500).json({ error: 'Database error' })
  }
})

router.post('/videojuego/data', async (req, res) => {
  try {
    const { device_id, dato2 } = req.body

    if (!device_id || dato2 === undefined) {
      return res.status(400).json({ error: 'Missing required data' })
    }

    const id = uuidv4()
    const data = { coin: dato2 }
    
    await dbRun(`
      INSERT INTO device_data (id, device_id, data) 
      VALUES (?, ?, ?)
    `, [id, device_id, JSON.stringify(data)])

    // Update device heartbeat
    await dbRun(
      'UPDATE devices SET last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?',
      [device_id]
    )

    // Broadcast device update
    broadcast({ type: 'device_update', deviceId: device_id })
    
    res.json({ success: 'Data inserted successfully' })
  } catch (error) {
    console.error('Error inserting videojuego data:', error)
    res.status(500).json({ error: 'Database error' })
  }
})

router.post('/ticketera/data', async (req, res) => {
  try {
    const { device_id, dato2, dato5 } = req.body

    if (!device_id || dato2 === undefined || dato5 === undefined) {
      return res.status(400).json({ error: 'Missing required data' })
    }

    const id = uuidv4()
    const data = { coin: dato2, tickets: dato5 }
    
    await dbRun(`
      INSERT INTO device_data (id, device_id, data) 
      VALUES (?, ?, ?)
    `, [id, device_id, JSON.stringify(data)])

    // Update device heartbeat
    await dbRun(
      'UPDATE devices SET last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?',
      [device_id]
    )

    // Broadcast device update
    broadcast({ type: 'device_update', deviceId: device_id })
    
    res.json({ success: 'Data inserted successfully' })
  } catch (error) {
    console.error('Error inserting ticketera data:', error)
    res.status(500).json({ error: 'Database error' })
  }
})

export default router
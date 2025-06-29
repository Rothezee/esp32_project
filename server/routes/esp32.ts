import { Router } from 'express'
import { getDatabase } from '../database'
import { broadcast } from '../index'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// Heartbeat endpoint
router.post('/heartbeat', (req, res) => {
  const { device_id } = req.body
  const db = getDatabase()

  if (!device_id) {
    return res.status(400).json({ error: 'Missing device_id' })
  }

  db.run(
    'UPDATE devices SET last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?',
    [device_id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' })
      }

      // Broadcast device update
      broadcast({ type: 'device_update', deviceId: device_id })
      
      res.json({ success: 'Heartbeat updated' })
    }
  )
})

// Data insertion for different device types
router.post('/data', (req, res) => {
  const { device_id, dato1, dato2, dato3, dato4, dato5 } = req.body
  const db = getDatabase()

  if (!device_id) {
    return res.status(400).json({ error: 'Missing device_id' })
  }

  const id = uuidv4()
  
  db.run(`
    INSERT INTO device_data (
      id, device_id, pesos, coin, premios, banco, tickets
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [id, device_id, dato1, dato2, dato3, dato4, dato5], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }

    // Update device heartbeat
    db.run(
      'UPDATE devices SET last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?',
      [device_id]
    )

    // Broadcast device update
    broadcast({ type: 'device_update', deviceId: device_id })
    
    res.json({ success: 'Data inserted successfully' })
  })
})

// Expendedora specific data insertion
router.post('/expendedora/data', (req, res) => {
  const { device_id, dato1, dato2 } = req.body
  const db = getDatabase()

  if (!device_id || dato1 === undefined || dato2 === undefined) {
    return res.status(400).json({ error: 'Missing required data' })
  }

  const id = uuidv4()
  
  db.run(`
    INSERT INTO device_data (
      id, device_id, fichas, dinero
    ) VALUES (?, ?, ?, ?)
  `, [id, device_id, dato1, dato2], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }

    // Update device heartbeat
    db.run(
      'UPDATE devices SET last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?',
      [device_id]
    )

    // Broadcast device update
    broadcast({ type: 'device_update', deviceId: device_id })
    
    res.json({ success: 'Data inserted successfully' })
  })
})

// Videojuego specific data insertion
router.post('/videojuego/data', (req, res) => {
  const { device_id, dato2 } = req.body
  const db = getDatabase()

  if (!device_id || dato2 === undefined) {
    return res.status(400).json({ error: 'Missing required data' })
  }

  const id = uuidv4()
  
  db.run(`
    INSERT INTO device_data (
      id, device_id, coin
    ) VALUES (?, ?, ?)
  `, [id, device_id, dato2], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }

    // Update device heartbeat
    db.run(
      'UPDATE devices SET last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?',
      [device_id]
    )

    // Broadcast device update
    broadcast({ type: 'device_update', deviceId: device_id })
    
    res.json({ success: 'Data inserted successfully' })
  })
})

// Ticketera specific data insertion
router.post('/ticketera/data', (req, res) => {
  const { device_id, dato2, dato5 } = req.body
  const db = getDatabase()

  if (!device_id || dato2 === undefined || dato5 === undefined) {
    return res.status(400).json({ error: 'Missing required data' })
  }

  const id = uuidv4()
  
  db.run(`
    INSERT INTO device_data (
      id, device_id, coin, tickets
    ) VALUES (?, ?, ?, ?)
  `, [id, device_id, dato2, dato5], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' })
    }

    // Update device heartbeat
    db.run(
      'UPDATE devices SET last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?',
      [device_id]
    )

    // Broadcast device update
    broadcast({ type: 'device_update', deviceId: device_id })
    
    res.json({ success: 'Data inserted successfully' })
  })
})

export default router
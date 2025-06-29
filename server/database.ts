import sqlite3 from 'sqlite3'
import bcrypt from 'bcryptjs'
import { promisify } from 'util'

let db: sqlite3.Database

export function initDatabase() {
  db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
      console.error('Error opening database:', err)
    } else {
      console.log('Connected to SQLite database')
    }
  })

  // Create tables
  createTables()
}

async function createTables() {
  const run = promisify(db.run.bind(db))
  
  try {
    // Users table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Devices table
    await run(`
      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        fields TEXT DEFAULT '[]',
        last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Device data table
    await run(`
      CREATE TABLE IF NOT EXISTS device_data (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE
      )
    `)

    // Daily closes table
    await run(`
      CREATE TABLE IF NOT EXISTS daily_closes (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        date TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE
      )
    `)

    // Create default admin user
    const hashedPassword = bcrypt.hashSync('admin123', 10)
    await run(`
      INSERT OR IGNORE INTO users (id, username, password) 
      VALUES (?, ?, ?)
    `, ['admin', 'admin', hashedPassword])

    // Create sample devices
    const sampleDevices = [
      { 
        id: 'ESP32_001', 
        name: 'Máquina 1', 
        type: 'grua',
        fields: [
          { id: '1', name: 'Pesos', key: 'pesos', type: 'number', required: true },
          { id: '2', name: 'Coin', key: 'coin', type: 'number', required: true },
          { id: '3', name: 'Premios', key: 'premios', type: 'number', required: true },
          { id: '4', name: 'Banco', key: 'banco', type: 'number', required: true },
        ]
      },
      { 
        id: 'ESP32_002', 
        name: 'Máquina 2', 
        type: 'grua',
        fields: [
          { id: '1', name: 'Pesos', key: 'pesos', type: 'number', required: true },
          { id: '2', name: 'Coin', key: 'coin', type: 'number', required: true },
          { id: '3', name: 'Premios', key: 'premios', type: 'number', required: true },
          { id: '4', name: 'Banco', key: 'banco', type: 'number', required: true },
        ]
      },
      { 
        id: 'EXPENDEDORA_1', 
        name: 'Expendedora 1', 
        type: 'expendedora',
        fields: [
          { id: '1', name: 'Fichas', key: 'fichas', type: 'number', required: true },
          { id: '2', name: 'Dinero', key: 'dinero', type: 'number', required: true },
        ]
      },
      { 
        id: 'Videojuego_1', 
        name: 'Videojuego 1', 
        type: 'videojuego',
        fields: [
          { id: '1', name: 'Coin', key: 'coin', type: 'number', required: true },
        ]
      },
      { 
        id: 'Ticket_1', 
        name: 'Ticketera 1', 
        type: 'ticketera',
        fields: [
          { id: '1', name: 'Coin', key: 'coin', type: 'number', required: true },
          { id: '2', name: 'Tickets', key: 'tickets', type: 'number', required: true },
        ]
      },
    ]

    for (const device of sampleDevices) {
      await run(`
        INSERT OR IGNORE INTO devices (id, name, type, fields) 
        VALUES (?, ?, ?, ?)
      `, [device.id, device.name, device.type, JSON.stringify(device.fields)])
    }

    console.log('Database tables created successfully')
  } catch (error) {
    console.error('Error creating tables:', error)
  }
}

export function getDatabase(): sqlite3.Database {
  return db
}

// Helper function to promisify database operations
export function dbGet(query: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

export function dbAll(query: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

export function dbRun(query: string, params: any[] = []): Promise<sqlite3.RunResult> {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err)
      else resolve(this)
    })
  })
}
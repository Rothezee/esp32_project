import sqlite3 from 'sqlite3'
import { Database } from 'sqlite3'
import bcrypt from 'bcryptjs'

let db: Database

export function initDatabase() {
  db = new sqlite3.Database(process.env.DATABASE_URL || './database.sqlite')

  // Create tables
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Devices table
    db.run(`
      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Device data table
    db.run(`
      CREATE TABLE IF NOT EXISTS device_data (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        pesos INTEGER,
        coin INTEGER,
        premios INTEGER,
        banco INTEGER,
        fichas INTEGER,
        dinero INTEGER,
        tickets INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (id)
      )
    `)

    // Daily closes table
    db.run(`
      CREATE TABLE IF NOT EXISTS daily_closes (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        date TEXT NOT NULL,
        pesos INTEGER,
        coin INTEGER,
        premios INTEGER,
        banco INTEGER,
        fichas INTEGER,
        dinero INTEGER,
        tickets INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (id)
      )
    `)

    // Create default admin user
    const hashedPassword = bcrypt.hashSync('admin123', 10)
    db.run(
      'INSERT OR IGNORE INTO users (id, username, password) VALUES (?, ?, ?)',
      ['admin', 'admin', hashedPassword]
    )

    // Create sample devices
    const sampleDevices = [
      { id: 'ESP32_001', name: 'Máquina 1', type: 'grua' },
      { id: 'ESP32_002', name: 'Máquina 2', type: 'grua' },
      { id: 'ESP32_003', name: 'Máquina 3', type: 'grua' },
      { id: 'ESP32_004', name: 'Máquina 4', type: 'grua' },
      { id: 'ESP32_005', name: 'Máquina 5', type: 'grua' },
      { id: 'EXPENDEDORA_1', name: 'Expendedora 1', type: 'expendedora' },
      { id: 'EXPENDEDORA_2', name: 'Expendedora 2', type: 'expendedora' },
      { id: 'Videojuego_1', name: 'Videojuego 1', type: 'videojuego' },
      { id: 'Videojuego_2', name: 'Videojuego 2', type: 'videojuego' },
      { id: 'Ticket_1', name: 'Ticketera 1', type: 'ticketera' },
      { id: 'Ticket_2', name: 'Ticketera 2', type: 'ticketera' },
    ]

    sampleDevices.forEach(device => {
      db.run(
        'INSERT OR IGNORE INTO devices (id, name, type) VALUES (?, ?, ?)',
        [device.id, device.name, device.type]
      )
    })
  })
}

export function getDatabase(): Database {
  return db
}
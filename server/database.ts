import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

let pool: Pool

export function initDatabase() {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  // Create tables
  createTables()
}

async function createTables() {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Devices table
    await client.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        fields JSONB DEFAULT '[]',
        last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Device data table
    await client.query(`
      CREATE TABLE IF NOT EXISTS device_data (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        data JSONB NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE
      )
    `)

    // Daily closes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_closes (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        date TEXT NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE
      )
    `)

    // Create default admin user
    const hashedPassword = bcrypt.hashSync('admin123', 10)
    await client.query(`
      INSERT INTO users (id, username, password) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (username) DO NOTHING
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
      await client.query(`
        INSERT INTO devices (id, name, type, fields) 
        VALUES ($1, $2, $3, $4) 
        ON CONFLICT (id) DO NOTHING
      `, [device.id, device.name, device.type, JSON.stringify(device.fields)])
    }

    await client.query('COMMIT')
    console.log('Database tables created successfully')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error creating tables:', error)
  } finally {
    client.release()
  }
}

export function getDatabase(): Pool {
  return pool
}
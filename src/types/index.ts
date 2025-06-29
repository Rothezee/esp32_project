export interface Device {
  id: string
  name: string
  type: 'grua' | 'expendedora' | 'videojuego' | 'ticketera'
  status: 'online' | 'offline' | 'unknown'
  lastHeartbeat: string
  data: DeviceData
}

export interface DeviceData {
  pesos?: number
  coin?: number
  premios?: number
  banco?: number
  fichas?: number
  dinero?: number
  tickets?: number
}

export interface Report {
  id: string
  deviceId: string
  timestamp: string
  data: DeviceData
}

export interface DailyClose {
  id: string
  deviceId: string
  date: string
  data: DeviceData
}

export interface User {
  id: string
  username: string
}

export interface AuthResponse {
  user: User
  token: string
}
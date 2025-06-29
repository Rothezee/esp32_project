export interface Device {
  id: string
  name: string
  type: 'grua' | 'expendedora' | 'videojuego' | 'ticketera'
  status: 'online' | 'offline' | 'unknown'
  lastHeartbeat: string
  data: DeviceData
  fields: DeviceField[]
  createdAt: string
}

export interface DeviceField {
  id: string
  name: string
  key: string
  type: 'number' | 'text' | 'boolean'
  required: boolean
  defaultValue?: any
}

export interface DeviceData {
  [key: string]: any
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

export interface CreateDeviceRequest {
  name: string
  type: string
  fields: Omit<DeviceField, 'id'>[]
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
    fill?: boolean
  }[]
}

export interface MetricCard {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease'
  icon: string
  color: string
}
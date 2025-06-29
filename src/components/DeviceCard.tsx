import { Link } from 'react-router-dom'
import { Activity, Zap, Coins, Trophy, CreditCard, Ticket } from 'lucide-react'
import { Device } from '../types'
import { clsx } from 'clsx'

interface DeviceCardProps {
  device: Device
}

export default function DeviceCard({ device }: DeviceCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'status-online'
      case 'offline':
        return 'status-offline'
      default:
        return 'status-unknown'
    }
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'grua':
        return Activity
      case 'expendedora':
        return Coins
      case 'videojuego':
        return Zap
      case 'ticketera':
        return Ticket
      default:
        return Activity
    }
  }

  const Icon = getDeviceIcon(device.type)

  const renderDeviceData = () => {
    switch (device.type) {
      case 'grua':
        return (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">PESOS:</span>
              <span className="font-medium">{device.data.pesos ?? 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">COIN:</span>
              <span className="font-medium">{device.data.coin ?? 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">PREMIOS:</span>
              <span className="font-medium">{device.data.premios ?? 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">BANCO:</span>
              <span className={clsx(
                'font-medium',
                device.data.banco && device.data.banco <= -10 
                  ? 'text-red-600 font-bold' 
                  : ''
              )}>
                {device.data.banco ?? 'N/A'}
              </span>
            </div>
          </>
        )
      case 'expendedora':
        return (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">FICHAS:</span>
              <span className="font-medium">{device.data.fichas ?? 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">DINERO:</span>
              <span className="font-medium">{device.data.dinero ?? 'N/A'}</span>
            </div>
          </>
        )
      case 'videojuego':
        return (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">COIN:</span>
            <span className="font-medium">{device.data.coin ?? 'N/A'}</span>
          </div>
        )
      case 'ticketera':
        return (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">COIN:</span>
              <span className="font-medium">{device.data.coin ?? 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">TICKETS:</span>
              <span className="font-medium">{device.data.tickets ?? 'N/A'}</span>
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className={clsx(
      'card p-6 transition-all duration-200 hover:shadow-md',
      device.data.banco && device.data.banco <= -10 
        ? 'bg-red-50 border-red-200' 
        : ''
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Icon className="w-6 h-6 text-gray-600 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">{device.name}</h3>
        </div>
        <span className={clsx(
          'px-2 py-1 text-xs font-medium rounded-full border',
          getStatusColor(device.status)
        )}>
          {device.status === 'online' ? 'Conectado' : 
           device.status === 'offline' ? 'Desconectado' : 'Desconocido'}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {renderDeviceData()}
      </div>

      <Link
        to={`/reports/${device.id}`}
        className="btn btn-primary w-full py-2 px-4"
      >
        Ver Reporte
      </Link>
    </div>
  )
}
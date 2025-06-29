import { Link } from 'react-router-dom'
import { 
  Activity, 
  Zap, 
  Coins, 
  Trophy, 
  CreditCard, 
  Ticket,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  BarChart3
} from 'lucide-react'
import { Device } from '../types'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useDeleteDevice } from '../hooks/useDevices'

interface DeviceCardProps {
  device: Device
  onEdit?: (device: Device) => void
}

export default function DeviceCard({ device, onEdit }: DeviceCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const deleteDevice = useDeleteDevice()

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

  const handleDelete = async () => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar ${device.name}?`)) {
      try {
        await deleteDevice.mutateAsync(device.id)
      } catch (error) {
        console.error('Error deleting device:', error)
      }
    }
  }

  const renderDeviceData = () => {
    return device.fields.map((field) => {
      const value = device.data[field.key]
      const isWarning = field.key === 'banco' && value && value <= -10

      return (
        <div key={field.id} className="flex items-center justify-between">
          <span className="text-sm text-gray-600">{field.name}:</span>
          <span className={clsx(
            'font-medium',
            isWarning ? 'text-red-600 font-bold' : ''
          )}>
            {value ?? 'N/A'}
          </span>
        </div>
      )
    })
  }

  const hasWarning = device.fields.some(field => 
    field.key === 'banco' && device.data[field.key] && device.data[field.key] <= -10
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        'card p-6 relative',
        hasWarning ? 'bg-red-50 border-red-200' : '',
        device.status === 'online' ? 'ring-2 ring-success-200' : ''
      )}
    >
      {/* Menu dropdown */}
      <div className="absolute top-4 right-4">
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
              <div className="py-1">
                <Link
                  to={`/reports/${device.id}`}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowMenu(false)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Reportes
                </Link>
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(device)
                      setShowMenu(false)
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </button>
                )}
                <button
                  onClick={() => {
                    handleDelete()
                    setShowMenu(false)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={clsx(
            'p-2 rounded-lg',
            device.status === 'online' ? 'bg-success-100' : 'bg-gray-100'
          )}>
            <Icon className={clsx(
              'w-6 h-6',
              device.status === 'online' ? 'text-success-600' : 'text-gray-600'
            )} />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">{device.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{device.type}</p>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="mb-4">
        <span className={clsx(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          getStatusColor(device.status)
        )}>
          <span className={clsx(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            device.status === 'online' ? 'bg-success-400' : 
            device.status === 'offline' ? 'bg-danger-400' : 'bg-gray-400'
          )} />
          {device.status === 'online' ? 'Conectado' : 
           device.status === 'offline' ? 'Desconectado' : 'Desconocido'}
        </span>
      </div>

      {/* Device data */}
      <div className="space-y-3 mb-6">
        {renderDeviceData()}
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <Link
          to={`/reports/${device.id}`}
          className="btn btn-primary flex-1 py-2 px-4 text-center"
        >
          Ver Reportes
        </Link>
        <Link
          to={`/analytics?device=${device.id}`}
          className="btn btn-secondary py-2 px-4"
        >
          <BarChart3 className="w-4 h-4" />
        </Link>
      </div>

      {/* Last update */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Última actualización: {new Date(device.lastHeartbeat).toLocaleString()}
        </p>
      </div>
    </motion.div>
  )
}
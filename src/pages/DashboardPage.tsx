import { useState } from 'react'
import { useDevices } from '../hooks/useDevices'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAnalytics } from '../hooks/useAnalytics'
import DeviceCard from '../components/DeviceCard'
import Chart from '../components/Chart'
import { 
  Loader2, 
  AlertCircle, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Filter,
  Search
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function DashboardPage() {
  const { data: devices, isLoading, error } = useDevices()
  const { data: analytics } = useAnalytics()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  
  useWebSocket() // Enable real-time updates

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner w-8 h-8" />
        <span className="ml-3 text-gray-600">Cargando dispositivos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircle className="w-8 h-8 text-red-600" />
        <span className="ml-3 text-red-600">Error al cargar los dispositivos</span>
      </div>
    )
  }

  // Filter devices
  const filteredDevices = devices?.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || device.type === filterType
    const matchesStatus = filterStatus === 'all' || device.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  }) || []

  const devicesByType = {
    grua: filteredDevices.filter(d => d.type === 'grua'),
    expendedora: filteredDevices.filter(d => d.type === 'expendedora'),
    videojuego: filteredDevices.filter(d => d.type === 'videojuego'),
    ticketera: filteredDevices.filter(d => d.type === 'ticketera'),
  }

  const totalDevices = devices?.length || 0
  const onlineDevices = devices?.filter(d => d.status === 'online').length || 0
  const offlineDevices = devices?.filter(d => d.status === 'offline').length || 0

  const metrics = [
    {
      title: 'Total Dispositivos',
      value: totalDevices,
      icon: Activity,
      color: 'from-blue-500 to-blue-600',
      change: 0,
    },
    {
      title: 'En Línea',
      value: onlineDevices,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      change: 0,
    },
    {
      title: 'Desconectados',
      value: offlineDevices,
      icon: TrendingDown,
      color: 'from-red-500 to-red-600',
      change: 0,
    },
    {
      title: 'Eficiencia',
      value: totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0,
      icon: Zap,
      color: 'from-purple-500 to-purple-600',
      change: 0,
      suffix: '%',
    },
  ]

  const renderDeviceSection = (title: string, devices: any[]) => {
    if (devices.length === 0) return null

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {devices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Monitoreo en tiempo real de todas las máquinas ESP32
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`metric-card bg-gradient-to-r ${metric.color}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">{metric.title}</p>
                  <p className="text-2xl font-bold text-white">
                    {metric.value}{metric.suffix || ''}
                  </p>
                </div>
                <Icon className="w-8 h-8 text-white/80" />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar dispositivos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input"
            >
              <option value="all">Todos los tipos</option>
              <option value="grua">Grúas</option>
              <option value="expendedora">Expendedoras</option>
              <option value="videojuego">Videojuegos</option>
              <option value="ticketera">Ticketeras</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input"
            >
              <option value="all">Todos los estados</option>
              <option value="online">En línea</option>
              <option value="offline">Desconectado</option>
              <option value="unknown">Desconocido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Device Sections */}
      {renderDeviceSection('Máquinas de Grúa', devicesByType.grua)}
      {renderDeviceSection('Expendedoras', devicesByType.expendedora)}
      {renderDeviceSection('Videojuegos', devicesByType.videojuego)}
      {renderDeviceSection('Ticketeras', devicesByType.ticketera)}

      {/* Empty State */}
      {filteredDevices.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {devices?.length === 0 
              ? 'No hay dispositivos configurados'
              : 'No se encontraron dispositivos'
            }
          </h3>
          <p className="text-gray-600">
            {devices?.length === 0
              ? 'Conecta tus dispositivos ESP32 para comenzar el monitoreo'
              : 'Intenta ajustar los filtros de búsqueda'
            }
          </p>
        </motion.div>
      )}
    </div>
  )
}
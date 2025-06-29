import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDevices } from '../hooks/useDevices'
import { useAnalytics } from '../hooks/useAnalytics'
import Chart from '../components/Chart'
import Calendar from '../components/Calendar'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap,
  Calendar as CalendarIcon,
  Download,
  Filter
} from 'lucide-react'
import { motion } from 'framer-motion'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export default function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const deviceId = searchParams.get('device')
  const [period, setPeriod] = useState('7d')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showCalendar, setShowCalendar] = useState(false)

  const { data: devices } = useDevices()
  const { data: analytics, isLoading } = useAnalytics(deviceId || undefined, period)

  const selectedDevice = deviceId ? devices?.find(d => d.id === deviceId) : null

  const periods = [
    { value: '24h', label: 'Últimas 24h' },
    { value: '7d', label: 'Última semana' },
    { value: '30d', label: 'Último mes' },
    { value: '90d', label: 'Últimos 3 meses' },
  ]

  const handleDeviceChange = (newDeviceId: string) => {
    if (newDeviceId === 'all') {
      searchParams.delete('device')
    } else {
      searchParams.set('device', newDeviceId)
    }
    setSearchParams(searchParams)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setShowCalendar(false)
    // You can implement custom date range logic here
  }

  // Mock chart data - replace with real data from analytics
  const chartData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Actividad',
        data: [12, 19, 3, 5, 2, 3, 9],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
      },
    ],
  }

  const barChartData = {
    labels: ['Grúas', 'Expendedoras', 'Videojuegos', 'Ticketeras'],
    datasets: [
      {
        label: 'Dispositivos Activos',
        data: [5, 2, 3, 2],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
      },
    ],
  }

  const doughnutData = {
    labels: ['En línea', 'Desconectado', 'Desconocido'],
    datasets: [
      {
        data: [8, 3, 1],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(156, 163, 175, 0.8)',
        ],
      },
    ],
  }

  const metrics = [
    {
      title: 'Total de Eventos',
      value: '1,234',
      change: 12.5,
      changeType: 'increase' as const,
      icon: Activity,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Promedio Diario',
      value: '176',
      change: -2.3,
      changeType: 'decrease' as const,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Pico Máximo',
      value: '89',
      change: 8.1,
      changeType: 'increase' as const,
      icon: Zap,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Eficiencia',
      value: '94.2%',
      change: 1.2,
      changeType: 'increase' as const,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-gray-600">
            Análisis detallado y métricas de rendimiento
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="btn btn-secondary"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            {format(selectedDate, 'dd/MM/yyyy')}
          </button>
          <button className="btn btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dispositivo
            </label>
            <select
              value={deviceId || 'all'}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="input"
            >
              <option value="all">Todos los dispositivos</option>
              {devices?.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="input"
            >
              {periods.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowCalendar(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full mx-4"
          >
            <Calendar
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />
          </motion.div>
        </motion.div>
      )}

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
              <div className="flex items-center justify-between mb-4">
                <Icon className="w-8 h-8 text-white/80" />
                <div className="flex items-center text-white/80">
                  {metric.changeType === 'increase' ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  <span className="text-sm font-medium">
                    {Math.abs(metric.change)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">{metric.title}</p>
                <p className="text-2xl font-bold text-white">{metric.value}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Actividad en el Tiempo
          </h3>
          <Chart type="line" data={chartData} height={300} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Dispositivos por Tipo
          </h3>
          <Chart type="bar" data={barChartData} height={300} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estado de Dispositivos
          </h3>
          <Chart type="doughnut" data={doughnutData} height={300} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tendencias Semanales
          </h3>
          <Chart type="line" data={chartData} height={300} />
        </motion.div>
      </div>

      {/* Device Details */}
      {selectedDevice && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Detalles de {selectedDevice.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Tipo</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {selectedDevice.type}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Estado</p>
              <p className={`text-lg font-semibold ${
                selectedDevice.status === 'online' ? 'text-green-600' :
                selectedDevice.status === 'offline' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {selectedDevice.status === 'online' ? 'En línea' :
                 selectedDevice.status === 'offline' ? 'Desconectado' : 'Desconocido'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Última actualización</p>
              <p className="text-lg font-semibold text-gray-900">
                {format(new Date(selectedDevice.lastHeartbeat), 'dd/MM/yyyy HH:mm')}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
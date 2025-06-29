import { useDevices } from '../hooks/useDevices'
import { useWebSocket } from '../hooks/useWebSocket'
import DeviceCard from '../components/DeviceCard'
import { Loader2, AlertCircle } from 'lucide-react'

export default function DashboardPage() {
  const { data: devices, isLoading, error } = useDevices()
  useWebSocket() // Enable real-time updates

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Cargando dispositivos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircle className="w-8 h-8 text-red-600" />
        <span className="ml-2 text-red-600">Error al cargar los dispositivos</span>
      </div>
    )
  }

  const devicesByType = {
    grua: devices?.filter(d => d.type === 'grua') || [],
    expendedora: devices?.filter(d => d.type === 'expendedora') || [],
    videojuego: devices?.filter(d => d.type === 'videojuego') || [],
    ticketera: devices?.filter(d => d.type === 'ticketera') || [],
  }

  const renderDeviceSection = (title: string, devices: any[]) => {
    if (devices.length === 0) return null

    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {devices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Monitoreo en tiempo real de todas las máquinas ESP32
        </p>
      </div>

      {renderDeviceSection('Máquinas de Grúa', devicesByType.grua)}
      {renderDeviceSection('Expendedoras', devicesByType.expendedora)}
      {renderDeviceSection('Videojuegos', devicesByType.videojuego)}
      {renderDeviceSection('Ticketeras', devicesByType.ticketera)}

      {devices?.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay dispositivos configurados
          </h3>
          <p className="text-gray-600">
            Conecta tus dispositivos ESP32 para comenzar el monitoreo
          </p>
        </div>
      )}
    </div>
  )
}
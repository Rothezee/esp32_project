import { useState } from 'react'
import { useDevices, useCreateDevice, useUpdateDevice } from '../hooks/useDevices'
import DeviceForm from '../components/DeviceForm'
import DeviceCard from '../components/DeviceCard'
import { Plus, Grid, List } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Device, CreateDeviceRequest } from '../types'

export default function DeviceManagerPage() {
  const { data: devices, isLoading } = useDevices()
  const createDevice = useCreateDevice()
  const updateDevice = useUpdateDevice()
  
  const [showForm, setShowForm] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const handleCreateDevice = async (data: CreateDeviceRequest) => {
    try {
      await createDevice.mutateAsync(data)
      setShowForm(false)
    } catch (error) {
      console.error('Error creating device:', error)
    }
  }

  const handleUpdateDevice = async (data: CreateDeviceRequest) => {
    if (!editingDevice) return
    
    try {
      await updateDevice.mutateAsync({
        id: editingDevice.id,
        ...data,
      })
      setEditingDevice(null)
    } catch (error) {
      console.error('Error updating device:', error)
    }
  }

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingDevice(null)
  }

  if (showForm || editingDevice) {
    return (
      <DeviceForm
        device={editingDevice || undefined}
        onSubmit={editingDevice ? handleUpdateDevice : handleCreateDevice}
        onCancel={handleCancelForm}
        isLoading={createDevice.isPending || updateDevice.isPending}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Dispositivos</h1>
          <p className="mt-2 text-gray-600">
            Crea, edita y administra tus dispositivos ESP32
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex rounded-lg border border-gray-300">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-gray-500'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-gray-500'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Dispositivo
          </button>
        </div>
      </div>

      {/* Device List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner w-8 h-8" />
          <span className="ml-3 text-gray-600">Cargando dispositivos...</span>
        </div>
      ) : devices?.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay dispositivos configurados
          </h3>
          <p className="text-gray-600 mb-6">
            Comienza creando tu primer dispositivo ESP32
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Dispositivo
          </button>
        </motion.div>
      ) : (
        <AnimatePresence>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {devices?.map((device) => (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <DeviceCard device={device} onEdit={handleEditDevice} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header">Dispositivo</th>
                    <th className="table-header">Tipo</th>
                    <th className="table-header">Estado</th>
                    <th className="table-header">Última Actualización</th>
                    <th className="table-header">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {devices?.map((device) => (
                    <motion.tr
                      key={device.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="table-cell">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {device.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {device.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {device.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="capitalize text-sm text-gray-900">
                          {device.type}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          device.status === 'online' ? 'status-online' :
                          device.status === 'offline' ? 'status-offline' : 'status-unknown'
                        }`}>
                          {device.status === 'online' ? 'En línea' :
                           device.status === 'offline' ? 'Desconectado' : 'Desconocido'}
                        </span>
                      </td>
                      <td className="table-cell text-sm text-gray-500">
                        {new Date(device.lastHeartbeat).toLocaleString()}
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => handleEditDevice(device)}
                          className="btn btn-secondary text-xs py-1 px-2"
                        >
                          Editar
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
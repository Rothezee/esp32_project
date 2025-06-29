import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, X } from 'lucide-react'
import { CreateDeviceRequest, Device, DeviceField } from '../types'
import { motion, AnimatePresence } from 'framer-motion'

const deviceFieldSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  key: z.string().min(1, 'La clave es requerida').regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Clave inválida'),
  type: z.enum(['number', 'text', 'boolean']),
  required: z.boolean(),
  defaultValue: z.any().optional(),
})

const deviceSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.string().min(1, 'El tipo es requerido'),
  fields: z.array(deviceFieldSchema).min(1, 'Al menos un campo es requerido'),
})

interface DeviceFormProps {
  device?: Device
  onSubmit: (data: CreateDeviceRequest) => void
  onCancel: () => void
  isLoading?: boolean
}

export default function DeviceForm({ device, onSubmit, onCancel, isLoading }: DeviceFormProps) {
  const [showPreview, setShowPreview] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateDeviceRequest>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      name: device?.name || '',
      type: device?.type || '',
      fields: device?.fields || [
        { name: 'Coin', key: 'coin', type: 'number', required: true }
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fields',
  })

  const watchedFields = watch()

  const deviceTypes = [
    { value: 'grua', label: 'Máquina de Grúa' },
    { value: 'expendedora', label: 'Expendedora' },
    { value: 'videojuego', label: 'Videojuego' },
    { value: 'ticketera', label: 'Ticketera' },
    { value: 'custom', label: 'Personalizado' },
  ]

  const fieldTypes = [
    { value: 'number', label: 'Número' },
    { value: 'text', label: 'Texto' },
    { value: 'boolean', label: 'Booleano' },
  ]

  const addField = () => {
    append({
      name: '',
      key: '',
      type: 'number',
      required: false,
    })
  }

  const generateKey = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card-elevated p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {device ? 'Editar Dispositivo' : 'Crear Nuevo Dispositivo'}
            </h2>
            <p className="text-gray-600 mt-1">
              Configure los campos y propiedades del dispositivo
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="btn btn-secondary"
            >
              {showPreview ? 'Ocultar' : 'Vista Previa'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-ghost"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Dispositivo
                  </label>
                  <input
                    {...register('name')}
                    className={`input ${errors.name ? 'input-error' : ''}`}
                    placeholder="Ej: Máquina de Grúa 1"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Dispositivo
                  </label>
                  <select
                    {...register('type')}
                    className={`input ${errors.type ? 'input-error' : ''}`}
                  >
                    <option value="">Seleccionar tipo</option>
                    {deviceTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Campos de Datos</h3>
                  <button
                    type="button"
                    onClick={addField}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Campo
                  </button>
                </div>

                <AnimatePresence>
                  {fields.map((field, index) => (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border border-gray-200 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">Campo {index + 1}</h4>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre
                          </label>
                          <input
                            {...register(`fields.${index}.name`)}
                            className="input"
                            placeholder="Ej: Monedas"
                            onChange={(e) => {
                              const key = generateKey(e.target.value)
                              register(`fields.${index}.key`).onChange({
                                target: { value: key }
                              })
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Clave
                          </label>
                          <input
                            {...register(`fields.${index}.key`)}
                            className="input"
                            placeholder="coin"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo
                          </label>
                          <select
                            {...register(`fields.${index}.type`)}
                            className="input"
                          >
                            {fieldTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...register(`fields.${index}.required`)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Requerido</span>
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {errors.fields && (
                  <p className="text-sm text-red-600">{errors.fields.message}</p>
                )}
              </div>

              {/* Submit */}
              <div className="flex space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary flex-1"
                >
                  {isLoading ? 'Guardando...' : device ? 'Actualizar' : 'Crear Dispositivo'}
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>

          {/* Preview */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="lg:sticky lg:top-8"
              >
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa</h3>
                  
                  {watchedFields.name && (
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="p-2 rounded-lg bg-primary-100">
                          <div className="w-6 h-6 bg-primary-600 rounded" />
                        </div>
                        <div className="ml-3">
                          <h4 className="font-semibold text-gray-900">{watchedFields.name}</h4>
                          <p className="text-sm text-gray-500 capitalize">{watchedFields.type}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {watchedFields.fields?.map((field, index) => (
                          field.name && (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{field.name}:</span>
                              <span className="font-medium">
                                {field.type === 'number' ? '0' : 
                                 field.type === 'boolean' ? 'false' : 'N/A'}
                              </span>
                            </div>
                          )
                        ))}
                      </div>

                      <button className="btn btn-primary w-full" disabled>
                        Ver Reportes
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Download } from 'lucide-react'
import { useReports } from '../hooks/useReports'
import { useDevices } from '../hooks/useDevices'
import { format, subDays } from 'date-fns'

export default function ReportsPage() {
  const { deviceId } = useParams<{ deviceId: string }>()
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  
  const { data: devices } = useDevices()
  const { data: reports, isLoading } = useReports(deviceId!, startDate, endDate)
  
  const device = devices?.find(d => d.id === deviceId)

  if (!device) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Dispositivo no encontrado</h2>
        <Link to="/dashboard" className="btn btn-primary mt-4">
          Volver al Dashboard
        </Link>
      </div>
    )
  }

  const renderReportColumns = () => {
    switch (device.type) {
      case 'grua':
        return (
          <>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pesos
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Coin
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Premios
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Banco
            </th>
          </>
        )
      case 'expendedora':
        return (
          <>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fichas
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dinero
            </th>
          </>
        )
      case 'videojuego':
        return (
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Coin
          </th>
        )
      case 'ticketera':
        return (
          <>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Coin
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tickets
            </th>
          </>
        )
      default:
        return null
    }
  }

  const renderReportData = (report: any) => {
    switch (device.type) {
      case 'grua':
        return (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {report.data.pesos ?? 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {report.data.coin ?? 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {report.data.premios ?? 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {report.data.banco ?? 'N/A'}
            </td>
          </>
        )
      case 'expendedora':
        return (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {report.data.fichas ?? 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {report.data.dinero ?? 'N/A'}
            </td>
          </>
        )
      case 'videojuego':
        return (
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {report.data.coin ?? 'N/A'}
          </td>
        )
      case 'ticketera':
        return (
          <>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {report.data.coin ?? 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {report.data.tickets ?? 'N/A'}
            </td>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver al Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{device.name}</h1>
        <p className="mt-2 text-gray-600">Reportes y análisis de datos</p>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-gray-400 mr-2" />
            <label htmlFor="startDate" className="text-sm font-medium text-gray-700 mr-2">
              Desde:
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex items-center">
            <label htmlFor="endDate" className="text-sm font-medium text-gray-700 mr-2">
              Hasta:
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
          <button className="btn btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha y Hora
                </th>
                {renderReportColumns()}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    Cargando reportes...
                  </td>
                </tr>
              ) : reports?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No hay reportes para el período seleccionado
                  </td>
                </tr>
              ) : (
                reports?.map((report) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(report.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                    </td>
                    {renderReportData(report)}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
import { useQuery } from '@tanstack/react-query'
import { Report } from '../types'

export function useReports(deviceId: string, startDate?: string, endDate?: string) {
  return useQuery<Report[]>({
    queryKey: ['reports', deviceId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ deviceId })
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      
      const response = await fetch(`/api/reports?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }
      return response.json()
    },
  })
}
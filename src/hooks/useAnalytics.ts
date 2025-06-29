import { useQuery } from '@tanstack/react-query'
import { MetricCard } from '../types'

export function useAnalytics(deviceId?: string, period: string = '7d') {
  return useQuery<{
    metrics: MetricCard[]
    chartData: any
    trends: any
  }>({
    queryKey: ['analytics', deviceId, period],
    queryFn: async () => {
      const params = new URLSearchParams({ period })
      if (deviceId) params.append('deviceId', deviceId)
      
      const response = await fetch(`/api/analytics?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      return response.json()
    },
    refetchInterval: 60000, // Refetch every minute
  })
}
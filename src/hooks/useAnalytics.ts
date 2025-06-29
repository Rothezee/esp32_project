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
      
      try {
        const response = await fetch(`/api/analytics?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch analytics')
        }
        return response.json()
      } catch (error) {
        // Return default data if API fails
        console.warn('Analytics API not available, using default data')
        return {
          metrics: [],
          chartData: {},
          trends: {}
        }
      }
    },
    refetchInterval: 60000, // Refetch every minute
    retry: 1, // Only retry once
    staleTime: 30000, // Consider data stale after 30 seconds
  })
}
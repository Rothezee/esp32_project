import { useQuery } from '@tanstack/react-query'
import { Device } from '../types'

export function useDevices() {
  return useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await fetch('/api/devices')
      if (!response.ok) {
        throw new Error('Failed to fetch devices')
      }
      return response.json()
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}
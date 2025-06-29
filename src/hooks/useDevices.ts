import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Device, CreateDeviceRequest } from '../types'

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

export function useCreateDevice() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (device: CreateDeviceRequest) => {
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(device),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create device')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useUpdateDevice() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...device }: Partial<Device> & { id: string }) => {
      const response = await fetch(`/api/devices/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(device),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update device')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}

export function useDeleteDevice() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/devices/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete device')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    },
  })
}
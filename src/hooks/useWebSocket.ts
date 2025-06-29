import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    
    wsRef.current = new WebSocket(wsUrl)

    wsRef.current.onopen = () => {
      console.log('WebSocket connected')
    }

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'device_update') {
          // Invalidate devices query to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['devices'] })
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected')
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          // Reconnect logic would go here
        }
      }, 5000)
    }

    return () => {
      wsRef.current?.close()
    }
  }, [queryClient])

  return wsRef.current
}
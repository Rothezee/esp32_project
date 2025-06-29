import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const queryClient = useQueryClient()
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const connect = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsUrl = `${protocol}//${window.location.host}/ws`
        
        wsRef.current = new WebSocket(wsUrl)

        wsRef.current.onopen = () => {
          console.log('WebSocket connected')
          // Clear any existing reconnect timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
          }
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
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
              connect()
            }
          }, 5000)
        }

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error)
        }
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error)
        // Retry connection after 5 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [queryClient])

  return wsRef.current
}
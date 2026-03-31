import { useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface UseSessionTimeoutOptions {
  timeoutMinutes?: number
  warningMinutes?: number
  onWarning?: (remainingMinutes: number) => void
}

export const useSessionTimeout = ({
  timeoutMinutes = 15,
  warningMinutes = 2,
  onWarning,
}: UseSessionTimeoutOptions = {}) => {
  const { logout, isAuthenticated } = useAuth()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const eventsRef = useRef<string[]>([
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
  ])

  const resetTimeout = useCallback(() => {
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
    }

    if (!isAuthenticated) {
      return
    }

    // Set warning timeout
    const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000
    warningRef.current = setTimeout(() => {
      if (onWarning) {
        onWarning(warningMinutes)
      }
    }, warningTime)

    // Set logout timeout
    const timeoutTime = timeoutMinutes * 60 * 1000
    timeoutRef.current = setTimeout(() => {
      logout()
    }, timeoutTime)
  }, [timeoutMinutes, warningMinutes, logout, isAuthenticated, onWarning])

  const handleUserActivity = useCallback(() => {
    resetTimeout()
  }, [resetTimeout])

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear timeouts when not authenticated
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current)
      }
      return
    }

    // Add event listeners for user activity
    eventsRef.current.forEach(event => {
      document.addEventListener(event, handleUserActivity, true)
    })

    // Initialize timeout
    resetTimeout()

    // Cleanup
    return () => {
      eventsRef.current.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true)
      })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current)
      }
    }
  }, [isAuthenticated, handleUserActivity, resetTimeout])

  return {
    resetTimeout,
  }
}

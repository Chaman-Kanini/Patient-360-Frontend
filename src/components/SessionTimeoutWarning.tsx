import React, { useState, useEffect } from 'react'
import { AlertTriangle, Clock, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface SessionTimeoutWarningProps {
  remainingMinutes: number
  onDismiss: () => void
}

export const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  remainingMinutes,
  onDismiss,
}) => {
  const [countdown, setCountdown] = useState(remainingMinutes * 60)
  const { logout } = useAuth()

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Time's up - logout
          logout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [logout])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleLogout = async () => {
    await logout()
    onDismiss()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Session Timeout Warning
            </h3>
            <p className="text-sm text-gray-500">
              Your session will expire soon
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  Your session will expire in{' '}
                  <span className="font-semibold">{formatTime(countdown)}</span>
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  You will be automatically logged out when the timer reaches zero.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleLogout}
            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout Now
          </button>
          <button
            onClick={onDismiss}
            className="flex-1 inline-flex justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continue Session
          </button>
        </div>
      </div>
    </div>
  )
}

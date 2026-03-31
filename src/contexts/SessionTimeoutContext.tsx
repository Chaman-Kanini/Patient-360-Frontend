import React, { createContext, useContext, useState, ReactNode } from 'react'
import { useSessionTimeout } from '../hooks/useSessionTimeout'
import { SessionTimeoutWarning } from '../components/SessionTimeoutWarning'

interface SessionTimeoutContextType {
  resetTimeout: () => void
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType | undefined>(undefined)

interface SessionTimeoutProviderProps {
  children: ReactNode
}

export const SessionTimeoutProvider: React.FC<SessionTimeoutProviderProps> = ({ children }) => {
  const [showWarning, setShowWarning] = useState(false)
  const [remainingMinutes, setRemainingMinutes] = useState(0)

  const handleWarning = (minutes: number) => {
    setRemainingMinutes(minutes)
    setShowWarning(true)
  }

  const handleDismiss = () => {
    setShowWarning(false)
  }

  const { resetTimeout } = useSessionTimeout({
    timeoutMinutes: 15,
    warningMinutes: 2,
    onWarning: handleWarning,
  })

  const value: SessionTimeoutContextType = {
    resetTimeout,
  }

  return (
    <SessionTimeoutContext.Provider value={value}>
      {children}
      {showWarning && (
        <SessionTimeoutWarning
          remainingMinutes={remainingMinutes}
          onDismiss={handleDismiss}
        />
      )}
    </SessionTimeoutContext.Provider>
  )
}

export const useSessionTimeoutContext = (): SessionTimeoutContextType => {
  const context = useContext(SessionTimeoutContext)
  if (context === undefined) {
    throw new Error('useSessionTimeoutContext must be used within a SessionTimeoutProvider')
  }
  return context
}

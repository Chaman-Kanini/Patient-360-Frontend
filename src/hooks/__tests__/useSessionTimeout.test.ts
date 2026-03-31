import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import { useSessionTimeout } from '../useSessionTimeout'

function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      BrowserRouter,
      null,
      React.createElement(AuthProvider, null, children)
    )
  }
}

describe('useSessionTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('should return resetTimeout function', () => {
    const { result } = renderHook(
      () => useSessionTimeout({ timeoutMinutes: 15 }),
      { wrapper: createWrapper() }
    )

    expect(result.current.resetTimeout).toBeDefined()
    expect(typeof result.current.resetTimeout).toBe('function')
  })

  it('should not set timers when user is not authenticated', () => {
    localStorage.clear()

    const onWarning = vi.fn()
    renderHook(
      () => useSessionTimeout({ timeoutMinutes: 15, warningMinutes: 2, onWarning }),
      { wrapper: createWrapper() }
    )

    vi.advanceTimersByTime(16 * 60 * 1000)

    expect(onWarning).not.toHaveBeenCalled()
  })

  it('should call onWarning before timeout when authenticated', async () => {
    const mockUser = {
      id: '1',
      email: 'user@test.com',
      role: 'StandardUser',
      lastLoginAt: new Date().toISOString(),
    }
    localStorage.setItem('auth_token', 'valid-token')
    localStorage.setItem('auth_user', JSON.stringify(mockUser))

    const onWarning = vi.fn()
    renderHook(
      () =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          onWarning,
        }),
      { wrapper: createWrapper() }
    )

    // Advance to warning time (15 - 2 = 13 minutes)
    act(() => {
      vi.advanceTimersByTime(13 * 60 * 1000 + 100)
    })

    expect(onWarning).toHaveBeenCalledWith(2)
  })

  it('should clean up timers on unmount', () => {
    const mockUser = {
      id: '1',
      email: 'user@test.com',
      role: 'StandardUser',
      lastLoginAt: new Date().toISOString(),
    }
    localStorage.setItem('auth_token', 'valid-token')
    localStorage.setItem('auth_user', JSON.stringify(mockUser))

    const onWarning = vi.fn()
    const { unmount } = renderHook(
      () =>
        useSessionTimeout({
          timeoutMinutes: 15,
          warningMinutes: 2,
          onWarning,
        }),
      { wrapper: createWrapper() }
    )

    unmount()

    act(() => {
      vi.advanceTimersByTime(16 * 60 * 1000)
    })

    expect(onWarning).not.toHaveBeenCalled()
  })

  it('should use default timeout of 15 minutes', () => {
    const { result } = renderHook(
      () => useSessionTimeout(),
      { wrapper: createWrapper() }
    )

    expect(result.current.resetTimeout).toBeDefined()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '../AuthContext'

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  )
}

describe('AuthContext', () => {
  it('should have initial state with null user and isAuthenticated false', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should update auth state on successful login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({
        email: 'user@test.com',
        password: 'Test@1234',
      })
    })

    expect(result.current.user).not.toBeNull()
    expect(result.current.user?.email).toBe('user@test.com')
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.token).toBe('mock-jwt-token')
  })

  it('should clear auth state on logout', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({
        email: 'user@test.com',
        password: 'Test@1234',
      })
    })

    expect(result.current.isAuthenticated).toBe(true)

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.token).toBeNull()
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(localStorage.getItem('auth_user')).toBeNull()
  })

  it('should restore auth state from localStorage on init', async () => {
    const mockUser = {
      id: '1',
      email: 'user@test.com',
      role: 'StandardUser',
      lastLoginAt: new Date().toISOString(),
    }
    localStorage.setItem('auth_token', 'stored-token')
    localStorage.setItem('auth_user', JSON.stringify(mockUser))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user?.email).toBe('user@test.com')
    })
  })

  it('should clear invalid stored data on init', async () => {
    localStorage.setItem('auth_token', 'some-token')
    localStorage.setItem('auth_user', 'invalid-json')

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })

    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(localStorage.getItem('auth_user')).toBeNull()
  })

  it('should set error on login failure', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      try {
        await result.current.login({
          email: 'user@test.com',
          password: 'WrongPassword',
        })
      } catch {
        // Expected to throw
      }
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('should clear error with clearError', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      try {
        await result.current.login({
          email: 'user@test.com',
          password: 'WrongPassword',
        })
      } catch {
        // Expected
      }
    })

    expect(result.current.error).toBeTruthy()

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })

  it('should throw error when useAuth is used outside AuthProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })
})

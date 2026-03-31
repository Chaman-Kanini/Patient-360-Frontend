import { describe, it, expect } from 'vitest'
import { authService } from '../authService'
import { server } from '../../test-utils/mocks/server'
import { http, HttpResponse } from 'msw'

const API_BASE_URL = '/api'

describe('authService', () => {
  describe('login', () => {
    it('should return token and user on successful login', async () => {
      const result = await authService.login({
        email: 'user@test.com',
        password: 'Test@1234',
      })

      expect(result.token).toBe('mock-jwt-token')
      expect(result.user).toBeDefined()
      expect(result.user.email).toBe('user@test.com')
      expect(result.user.role).toBe('StandardUser')
    })

    it('should throw error on invalid credentials', async () => {
      await expect(
        authService.login({ email: 'user@test.com', password: 'WrongPass' })
      ).rejects.toThrow('Invalid email or password')
    })

    it('should throw error on locked account', async () => {
      await expect(
        authService.login({ email: 'locked@test.com', password: 'Test@1234' })
      ).rejects.toThrow('locked')
    })

    it('should throw error on network failure', async () => {
      server.use(
        http.post(`${API_BASE_URL}/auth/login`, () => {
          return HttpResponse.error()
        })
      )

      await expect(
        authService.login({ email: 'user@test.com', password: 'Test@1234' })
      ).rejects.toThrow()
    })

    it('should throw error on 500 server error', async () => {
      server.use(
        http.post(`${API_BASE_URL}/auth/login`, () => {
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          )
        })
      )

      await expect(
        authService.login({ email: 'user@test.com', password: 'Test@1234' })
      ).rejects.toThrow()
    })
  })

  describe('logout', () => {
    it('should not throw on successful logout', async () => {
      await expect(authService.logout()).resolves.toBeUndefined()
    })

    it('should not throw even if API call fails', async () => {
      server.use(
        http.post(`${API_BASE_URL}/auth/logout`, () => {
          return HttpResponse.json(
            { message: 'Server error' },
            { status: 500 }
          )
        })
      )

      await expect(authService.logout()).resolves.toBeUndefined()
    })
  })

  describe('forgotPassword', () => {
    it('should complete successfully for valid email', async () => {
      await expect(
        authService.forgotPassword('user@test.com')
      ).resolves.toBeUndefined()
    })

    it('should throw error on API failure', async () => {
      server.use(
        http.post(`${API_BASE_URL}/auth/forgot-password`, () => {
          return HttpResponse.json(
            { message: 'Server error' },
            { status: 500 }
          )
        })
      )

      await expect(
        authService.forgotPassword('user@test.com')
      ).rejects.toThrow()
    })
  })

  describe('resetPassword', () => {
    it('should complete successfully with valid token', async () => {
      await expect(
        authService.resetPassword('valid-token', 'NewPass@123', 'NewPass@123')
      ).resolves.toBeUndefined()
    })

    it('should throw error for expired token', async () => {
      await expect(
        authService.resetPassword(
          'expired-token',
          'NewPass@123',
          'NewPass@123'
        )
      ).rejects.toThrow()
    })
  })

  describe('validateResetToken', () => {
    it('should return true for valid token', async () => {
      const result = await authService.validateResetToken('valid-token')
      expect(result).toBe(true)
    })

    it('should return false for invalid token', async () => {
      const result = await authService.validateResetToken('invalid-token')
      expect(result).toBe(false)
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user data', async () => {
      const result = await authService.getCurrentUser()
      expect(result).toBeDefined()
      expect(result.email).toBe('user@test.com')
    })

    it('should throw error on unauthorized', async () => {
      server.use(
        http.get(`${API_BASE_URL}/auth/me`, () => {
          return HttpResponse.json(
            { message: 'Unauthorized' },
            { status: 401 }
          )
        })
      )

      await expect(authService.getCurrentUser()).rejects.toThrow()
    })
  })
})

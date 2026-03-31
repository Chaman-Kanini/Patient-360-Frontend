import { http, HttpResponse } from 'msw'

const API_BASE_URL = '/api'

export const authHandlers = [
  // Login
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }

    if (body.email === 'locked@test.com') {
      return HttpResponse.json(
        { message: 'Account is locked until 2:30 PM' },
        { status: 403 }
      )
    }

    if (body.email === 'user@test.com' && body.password === 'Test@1234') {
      return HttpResponse.json({
        token: 'mock-jwt-token',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        user: {
          id: '1',
          email: 'user@test.com',
          role: 'StandardUser',
          lastLoginAt: new Date().toISOString(),
        },
      })
    }

    if (body.email === 'admin@test.com' && body.password === 'Admin@1234') {
      return HttpResponse.json({
        token: 'mock-admin-jwt-token',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        user: {
          id: '2',
          email: 'admin@test.com',
          role: 'Admin',
          lastLoginAt: new Date().toISOString(),
        },
      })
    }

    return HttpResponse.json(
      { message: 'Invalid email or password' },
      { status: 401 }
    )
  }),

  // Logout
  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({ message: 'Logout successful' })
  }),

  // Forgot password
  http.post(`${API_BASE_URL}/auth/forgot-password`, async () => {
    return HttpResponse.json({
      message: 'Password reset link sent to your email if account exists',
    })
  }),

  // Reset password
  http.post(`${API_BASE_URL}/auth/reset-password`, async ({ request }) => {
    const body = (await request.json()) as {
      token: string
      newPassword: string
      confirmPassword: string
    }

    if (body.token === 'expired-token') {
      return HttpResponse.json(
        { message: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    return HttpResponse.json({ message: 'Password reset successful' })
  }),

  // Validate reset token
  http.get(`${API_BASE_URL}/auth/validate-token`, ({ request }) => {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')

    if (token === 'valid-token') {
      return HttpResponse.json({ valid: true })
    }

    return HttpResponse.json(
      { valid: false, message: 'Invalid or expired token' },
      { status: 400 }
    )
  }),

  // Get current user
  http.get(`${API_BASE_URL}/auth/me`, () => {
    return HttpResponse.json({
      id: '1',
      email: 'user@test.com',
      role: 'StandardUser',
    })
  }),
]

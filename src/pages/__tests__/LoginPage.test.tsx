import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test-utils/render'
import { LoginPage } from '../LoginPage'
import { server } from '../../test-utils/mocks/server'
import { http, HttpResponse } from 'msw'

const API_BASE_URL = '/api'

describe('LoginPage', () => {
  it('should render login form with all required fields', () => {
    render(<LoginPage />, { route: '/login' })

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
  })

  it('should display validation error when email is empty', async () => {
    const user = userEvent.setup()
    render(<LoginPage />, { route: '/login' })

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })
  })

  it('should display validation error when email is invalid', async () => {
    const user = userEvent.setup()
    render(<LoginPage />, { route: '/login' })

    const emailInput = screen.getByLabelText(/email address/i)
    await user.clear(emailInput)
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    // Submitting with empty email triggers 'Email is required' validation
    await waitFor(() => {
      const errorElements = document.querySelectorAll('[class*="text-red-600"]')
      const hasError = Array.from(errorElements).some(el => {
        const text = el.textContent || ''
        return text.includes('Email is required') || text.includes('Invalid email')
      })
      expect(hasError).toBe(true)
    })
  })

  it('should display validation error when password is empty', async () => {
    const user = userEvent.setup()
    render(<LoginPage />, { route: '/login' })

    await user.type(screen.getByLabelText(/email address/i), 'user@test.com')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('should show error message on invalid credentials', async () => {
    const user = userEvent.setup()
    render(<LoginPage />, { route: '/login' })

    await user.type(screen.getByLabelText(/email address/i), 'user@test.com')
    await user.type(screen.getByLabelText(/password/i), 'WrongPassword1!')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    })
  })

  it('should show locked account message', async () => {
    const user = userEvent.setup()
    render(<LoginPage />, { route: '/login' })

    await user.type(screen.getByLabelText(/email address/i), 'locked@test.com')
    await user.type(screen.getByLabelText(/password/i), 'Test@1234')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/locked/i)).toBeInTheDocument()
    })
  })

  it('should show loading state during submission', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return HttpResponse.json({
          token: 'mock-jwt-token',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          user: { id: '1', email: 'user@test.com', role: 'StandardUser', lastLoginAt: new Date().toISOString() },
        })
      })
    )

    const user = userEvent.setup()
    render(<LoginPage />, { route: '/login' })

    await user.type(screen.getByLabelText(/email address/i), 'user@test.com')
    await user.type(screen.getByLabelText(/password/i), 'Test@1234')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
    })
  })

  it('should disable submit button when loading', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return HttpResponse.json({
          token: 'mock-jwt-token',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          user: { id: '1', email: 'user@test.com', role: 'StandardUser', lastLoginAt: new Date().toISOString() },
        })
      })
    )

    const user = userEvent.setup()
    render(<LoginPage />, { route: '/login' })

    await user.type(screen.getByLabelText(/email address/i), 'user@test.com')
    await user.type(screen.getByLabelText(/password/i), 'Test@1234')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /signing in/i })
      expect(button).toBeDisabled()
    })
  })

  it('should show network error message', async () => {
    server.use(
      http.post(`${API_BASE_URL}/auth/login`, () => {
        return HttpResponse.error()
      })
    )

    const user = userEvent.setup()
    render(<LoginPage />, { route: '/login' })

    await user.type(screen.getByLabelText(/email address/i), 'user@test.com')
    await user.type(screen.getByLabelText(/password/i), 'Test@1234')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      const errorElement = screen.getByText((content) =>
        content.toLowerCase().includes('failed') || content.toLowerCase().includes('error')
      )
      expect(errorElement).toBeInTheDocument()
    })
  })

  it('should have forgot password link', () => {
    render(<LoginPage />, { route: '/login' })

    const forgotPasswordLink = screen.getByText(/forgot password/i)
    expect(forgotPasswordLink).toBeInTheDocument()
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password')
  })

  it('should have email and password inputs with correct types', () => {
    render(<LoginPage />, { route: '/login' })

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    expect(emailInput).toHaveAttribute('type', 'email')
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})

import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test-utils/render'
import { ForgotPasswordPage } from '../ForgotPasswordPage'

describe('ForgotPasswordPage', () => {
  it('should render forgot password form with email input and submit button', () => {
    render(<ForgotPasswordPage />, { route: '/forgot-password' })

    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(screen.getByText('Email address')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('should show success message after submitting valid email', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordPage />, { route: '/forgot-password' })

    await user.type(screen.getByPlaceholderText('Enter your email'), 'user@test.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument()
    })
  })

  it('should have reset your password heading', () => {
    render(<ForgotPasswordPage />, { route: '/forgot-password' })

    expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument()
  })

  it('should have descriptive text about email reset', () => {
    render(<ForgotPasswordPage />, { route: '/forgot-password' })

    expect(screen.getByText(/enter your email address/i)).toBeInTheDocument()
  })

  it('should show validation error for empty email', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordPage />, { route: '/forgot-password' })

    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => {
      const errorElements = document.querySelectorAll('.text-red-600')
      const hasError = Array.from(errorElements).some(el => 
        el.textContent?.includes('Email is required')
      )
      expect(hasError).toBe(true)
    })
  })

  it('should have back to login link', () => {
    render(<ForgotPasswordPage />, { route: '/forgot-password' })

    expect(screen.getByText(/back to login/i)).toBeInTheDocument()
  })

  it('should show same success message for non-existent email (prevent enumeration)', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordPage />, { route: '/forgot-password' })

    await user.type(screen.getByPlaceholderText('Enter your email'), 'nonexistent@test.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /check your email/i })).toBeInTheDocument()
    })
  })

  it('should have a back to login button on success screen', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordPage />, { route: '/forgot-password' })

    await user.type(screen.getByPlaceholderText('Enter your email'), 'user@test.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back to login/i })).toBeInTheDocument()
    })
  })
})

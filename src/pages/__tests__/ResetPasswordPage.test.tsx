import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test-utils/render'
import { ResetPasswordPage } from '../ResetPasswordPage'

describe('ResetPasswordPage', () => {
  it('should show loading state while validating token', () => {
    render(<ResetPasswordPage />, { route: '/reset-password?token=valid-token' })

    expect(screen.getByText(/validating/i)).toBeInTheDocument()
  })

  it('should show invalid token message for missing token', async () => {
    render(<ResetPasswordPage />, { route: '/reset-password' })

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired/i)).toBeInTheDocument()
    })
  })

  it('should show invalid token message for expired token', async () => {
    render(<ResetPasswordPage />, { route: '/reset-password?token=expired-token' })

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired/i)).toBeInTheDocument()
    })
  })

  it('should render password form when token is valid', async () => {
    render(<ResetPasswordPage />, { route: '/reset-password?token=valid-token' })

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter new password')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show password mismatch error', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordPage />, { route: '/reset-password?token=valid-token' })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument()
    }, { timeout: 3000 })

    await user.type(screen.getByPlaceholderText('Enter new password'), 'Test@1234')
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'Different@1234')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => {
      expect(screen.getByText(/don't match/i)).toBeInTheDocument()
    })
  })

  it('should show password complexity error for weak password', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordPage />, { route: '/reset-password?token=valid-token' })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument()
    }, { timeout: 3000 })

    await user.type(screen.getByPlaceholderText('Enter new password'), 'weakpass')
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'weakpass')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => {
      const errorElements = document.querySelectorAll('.text-red-600')
      const hasError = Array.from(errorElements).some(el => {
        const text = el.textContent?.toLowerCase() || ''
        return text.includes('uppercase') ||
          text.includes('must contain') ||
          text.includes('special character') ||
          text.includes('8 characters')
      })
      expect(hasError).toBe(true)
    })
  })

  it('should show success message after successful reset', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordPage />, { route: '/reset-password?token=valid-token' })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument()
    }, { timeout: 3000 })

    await user.type(screen.getByPlaceholderText('Enter new password'), 'NewPass@123')
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'NewPass@123')
    await user.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => {
      expect(screen.getByText(/password reset successful/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('should have password visibility toggle buttons', async () => {
    render(<ResetPasswordPage />, { route: '/reset-password?token=valid-token' })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument()
    }, { timeout: 3000 })

    const toggleButtons = screen.getAllByRole('button').filter(
      (btn) => btn.getAttribute('type') === 'button'
    )
    // Should have at least 2 toggle buttons (one for each password field)
    // plus the back to login button
    expect(toggleButtons.length).toBeGreaterThanOrEqual(2)
  })

  it('should have request new link option on expired token page', async () => {
    render(<ResetPasswordPage />, { route: '/reset-password?token=expired-token' })

    await waitFor(() => {
      expect(screen.getByText(/request new link/i)).toBeInTheDocument()
    })
  })

  it('should display set new password heading when token is valid', async () => {
    render(<ResetPasswordPage />, { route: '/reset-password?token=valid-token' })

    await waitFor(() => {
      expect(screen.getByText(/set new password/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

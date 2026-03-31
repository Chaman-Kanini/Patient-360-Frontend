import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PasswordStrengthIndicator } from '../../PasswordStrengthIndicator'

describe('PasswordStrengthIndicator', () => {
  it('should not render when password is empty', () => {
    const { container } = render(<PasswordStrengthIndicator password="" />)
    expect(container.firstChild).toBeNull()
  })

  it('should show Very Weak for single character password', () => {
    render(<PasswordStrengthIndicator password="a" />)
    expect(screen.getByText(/very weak/i)).toBeInTheDocument()
  })

  it('should show Weak for password with only lowercase and numbers', () => {
    render(<PasswordStrengthIndicator password="test1234" />)
    const strengthText = screen.getByText((content) =>
      content.toLowerCase().includes('weak') || content.toLowerCase().includes('fair')
    )
    expect(strengthText).toBeInTheDocument()
  })

  it('should show Strong for password meeting all requirements', () => {
    render(<PasswordStrengthIndicator password="Test@1234" />)
    expect(screen.getByText(/strong/i)).toBeInTheDocument()
  })

  it('should display all requirement items', () => {
    render(<PasswordStrengthIndicator password="Test@1234" />)

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    expect(screen.getByText(/uppercase/i)).toBeInTheDocument()
    expect(screen.getByText(/lowercase/i)).toBeInTheDocument()
    expect(screen.getByText(/number/i)).toBeInTheDocument()
    expect(screen.getByText(/special character/i)).toBeInTheDocument()
  })

  it('should show requirements checklist updates as password changes', () => {
    const { rerender } = render(<PasswordStrengthIndicator password="t" />)
    expect(screen.getByText(/very weak/i)).toBeInTheDocument()

    rerender(<PasswordStrengthIndicator password="Test" />)
    const afterUppercase = screen.getByText((content) =>
      content.toLowerCase().includes('weak') || content.toLowerCase().includes('fair')
    )
    expect(afterUppercase).toBeInTheDocument()

    rerender(<PasswordStrengthIndicator password="Test@1234" />)
    expect(screen.getByText(/strong/i)).toBeInTheDocument()
  })

  it('should show security tip when not all requirements are met', () => {
    render(<PasswordStrengthIndicator password="weak" />)
    expect(screen.getByText(/security tip/i)).toBeInTheDocument()
  })

  it('should not show security tip when all requirements are met', () => {
    render(<PasswordStrengthIndicator password="Test@1234" />)
    expect(screen.queryByText(/security tip/i)).not.toBeInTheDocument()
  })

  it('should show password strength label', () => {
    render(<PasswordStrengthIndicator password="Test@1234" />)
    expect(screen.getByText(/password strength/i)).toBeInTheDocument()
  })
})

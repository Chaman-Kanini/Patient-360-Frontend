import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// Mock the useAuth hook to control auth state directly
const mockUseAuth = vi.fn()
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

// Import after mock setup
import { ProtectedRoute } from '../../ProtectedRoute'

function renderWithRouter(
  ui: React.ReactElement,
  { initialEntries = ['/'] }: { initialEntries?: string[] } = {}
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        <Route path="/protected" element={ui} />
        <Route path="/admin" element={ui} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('should redirect unauthenticated user to login', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      { initialEntries: ['/protected'] }
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('should show loading indicator when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      { initialEntries: ['/protected'] }
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should render children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'user@test.com', role: 'StandardUser' },
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      { initialEntries: ['/protected'] }
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should allow admin user to access admin route', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '2', email: 'admin@test.com', role: 'Admin' },
    })

    renderWithRouter(
      <ProtectedRoute requiredRole="Admin">
        <div>Admin Content</div>
      </ProtectedRoute>,
      { initialEntries: ['/admin'] }
    )

    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('should redirect non-admin user from admin route', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '1', email: 'user@test.com', role: 'StandardUser' },
    })

    renderWithRouter(
      <ProtectedRoute requiredRole="Admin">
        <div>Admin Content</div>
      </ProtectedRoute>,
      { initialEntries: ['/admin'] }
    )

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument()
  })

  it('should accept array of roles', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: '2', email: 'admin@test.com', role: 'Admin' },
    })

    renderWithRouter(
      <ProtectedRoute requiredRole={['Admin', 'SuperAdmin']}>
        <div>Multi-Role Content</div>
      </ProtectedRoute>,
      { initialEntries: ['/admin'] }
    )

    expect(screen.getByText('Multi-Role Content')).toBeInTheDocument()
  })
})

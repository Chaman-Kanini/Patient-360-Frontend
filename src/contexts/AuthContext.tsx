import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useMemo } from 'react'
import { authService } from '../services/authService'
import { User, LoginRequest } from '../types/auth'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, newPassword: string, confirmPassword: string) => Promise<void>
  clearError: () => void
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT_SUCCESS' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean }

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,
}

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      }
    case 'LOGOUT_SUCCESS':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    default:
      return state
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const userStr = localStorage.getItem('auth_user')
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } })
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    dispatch({ type: 'LOGIN_START' })
    
    try {
      const response = await authService.login(credentials)
      
      // Store in localStorage
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('auth_user', JSON.stringify(response.user))
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { user: response.user, token: response.token } 
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      dispatch({ type: 'LOGIN_FAILURE', payload: message })
      throw error
    }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      if (state.token) {
        await authService.logout()
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error)
    } finally {
      // Clear local storage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      dispatch({ type: 'LOGOUT_SUCCESS' })
    }
  }, [state.token])

  const forgotPassword = useCallback(async (email: string): Promise<void> => {
    try {
      await authService.forgotPassword(email)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset request failed'
      dispatch({ type: 'LOGIN_FAILURE', payload: message })
      throw error
    }
  }, [])

  const resetPassword = useCallback(async (
    token: string, 
    newPassword: string, 
    confirmPassword: string
  ): Promise<void> => {
    try {
      await authService.resetPassword(token, newPassword, confirmPassword)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed'
      dispatch({ type: 'LOGIN_FAILURE', payload: message })
      throw error
    }
  }, [])

  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' })
  }, [])

  const value: AuthContextType = useMemo(() => ({
    ...state,
    login,
    logout,
    forgotPassword,
    resetPassword,
    clearError,
  }), [state, login, logout, forgotPassword, resetPassword, clearError])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

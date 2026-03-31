import axios, { AxiosResponse } from 'axios'
import { LoginRequest, LoginResponse, ForgotPasswordRequest, ResetPasswordRequest } from '../types/auth'

const API_BASE_URL = 'https://dotnetbackend-patient-360.onrender.com'

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
       // Check if this is a login request - don't redirect for login failures
      const isLoginRequest = error.config?.url?.includes('/api/auth/login')
 
      if (!isLoginRequest) {
        // Token expired or invalid - clear local storage
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        // Redirect to login page
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response: AxiosResponse<LoginResponse> = await apiClient.post('/api/auth/login', credentials)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message || 'Login failed'
        throw new Error(message)
      }
      throw new Error('Login failed')
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout')
    } catch (error) {
      // Don't throw error for logout - it should always succeed locally
      console.error('Logout API call failed:', error)
    }
  },

  async forgotPassword(email: string): Promise<void> {
    try {
      const request: ForgotPasswordRequest = { email }
      await apiClient.post('/api/auth/forgot-password', request)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message || 'Password reset request failed'
        throw new Error(message)
      }
      throw new Error('Password reset request failed')
    }
  },

  async resetPassword(token: string, newPassword: string, confirmPassword: string): Promise<void> {
    try {
      const request: ResetPasswordRequest = { token, newPassword, confirmPassword }
      await apiClient.post('/api/auth/reset-password', request)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message || 'Password reset failed'
        throw new Error(message)
      }
      throw new Error('Password reset failed')
    }
  },

  async validateResetToken(token: string): Promise<boolean> {
    try {
      const response = await apiClient.get(`/api/auth/validate-token?token=${encodeURIComponent(token)}`)
      return response.data.valid
    } catch (error) {
      return false
    }
  },

  async getCurrentUser(): Promise<any> {
    try {
      const response = await apiClient.get('/api/auth/me')
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message || 'Failed to get user data'
        throw new Error(message)
      }
      throw new Error('Failed to get user data')
    }
  },
}

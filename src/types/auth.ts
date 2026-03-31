export interface User {
  id: string
  email: string
  role: string
  lastLoginAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  expiresAt: string
  user: User
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
  confirmPassword: string
}

export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
}

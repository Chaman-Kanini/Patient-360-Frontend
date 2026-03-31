export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'Admin' | 'StandardUser'
  status: 'Active' | 'Pending' | 'Inactive' | 'Rejected'
  createdAt: string
  lastLoginAt?: string
  phoneNumber?: string
  department?: string
  approvedAt?: string
  deactivatedAt?: string
}

export interface CreateUserRequest {
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  department?: string
}

export interface UserFilterRequest {
  searchTerm?: string
  role?: 'Admin' | 'StandardUser'
  status?: 'Active' | 'Pending' | 'Inactive'
  page?: number
  pageSize?: number
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  currentPage: number
  pageSize: number
  totalPages: number
}

export interface DeactivateUserRequest {
  reason: string
}

export interface RejectUserRequest {
  reason: string
}

export interface RegistrationResult {
  success: boolean
  message: string
  user?: User
}

export interface PublicRegistrationRequest {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  phoneNumber?: string
  department?: string
}

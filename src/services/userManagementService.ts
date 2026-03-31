import axios, { AxiosResponse } from 'axios'
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserFilterRequest, 
  PagedResult
} from '../types/user'

const API_BASE_URL = 'https://dotnetbackend-patient-360.onrender.com'

// Create axios instance for user management
const userManagementApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
userManagementApi.interceptors.request.use(
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
userManagementApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const userManagementService = {
  // Get users with pagination and filtering
  async getUsers(filter: UserFilterRequest = {}): Promise<PagedResult<User>> {
    try {
      const params = new URLSearchParams()
      
      if (filter.searchTerm) params.append('searchTerm', filter.searchTerm)
      if (filter.role) params.append('role', filter.role)
      if (filter.status) params.append('status', filter.status)
      params.append('page', (filter.page || 1).toString())
      params.append('pageSize', (filter.pageSize || 10).toString())

      const response: AxiosResponse<PagedResult<User>> = await userManagementApi.get(
        `/usermanagement?${params.toString()}`
      )
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch users')
      }
      throw new Error('Failed to fetch users')
    }
  },

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    try {
      const response: AxiosResponse<User> = await userManagementApi.get(`/usermanagement/${id}`)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch user')
      }
      throw new Error('Failed to fetch user')
    }
  },

  // Create new user
  async createUser(request: CreateUserRequest): Promise<User> {
    try {
      const response: AxiosResponse<User> = await userManagementApi.post('/usermanagement/create', request)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to create user')
      }
      throw new Error('Failed to create user')
    }
  },

  // Update user
  async updateUser(id: string, request: UpdateUserRequest): Promise<User> {
    try {
      const response: AxiosResponse<User> = await userManagementApi.put(`/usermanagement/${id}`, request)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update user')
      }
      throw new Error('Failed to update user')
    }
  },

  // Update user role
  async updateUserRole(id: string, role: 'Admin' | 'StandardUser'): Promise<void> {
    try {
      await userManagementApi.put(`/usermanagement/${id}/role`, { role })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update user role')
      }
      throw new Error('Failed to update user role')
    }
  },

  // Deactivate user
  async deactivateUser(id: string, reason: string): Promise<void> {
    try {
      await userManagementApi.post(`/usermanagement/${id}/deactivate`, { reason })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to deactivate user')
      }
      throw new Error('Failed to deactivate user')
    }
  },

  // Reactivate user
  async reactivateUser(id: string): Promise<void> {
    try {
      await userManagementApi.post(`/usermanagement/${id}/reactivate`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to reactivate user')
      }
      throw new Error('Failed to reactivate user')
    }
  },

  // Approve user
  async approveUser(id: string): Promise<User> {
    try {
      const response: AxiosResponse<User> = await userManagementApi.post(`/usermanagement/${id}/approve`)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to approve user')
      }
      throw new Error('Failed to approve user')
    }
  },

  // Reject user
  async rejectUser(id: string, reason: string): Promise<void> {
    try {
      await userManagementApi.post(`/usermanagement/${id}/reject`, { reason })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to reject user')
      }
      throw new Error('Failed to reject user')
    }
  },

  // Get pending users
  async getPendingUsers(): Promise<User[]> {
    try {
      const response: AxiosResponse<User[]> = await userManagementApi.get('/usermanagement/pending')
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch pending users')
      }
      throw new Error('Failed to fetch pending users')
    }
  },
}

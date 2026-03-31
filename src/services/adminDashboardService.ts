import axios, { AxiosResponse } from 'axios'
import {
  AuditLog,
  AuditLogFilter,
  AuditLogExportFilter,
  PagedAuditLogs,
  DashboardSummary,
  UserGrowthTrend,
  DocumentUploadTrend,
  DocumentStatusDistribution,
  DocumentTypeDistribution,
  PatientConflictTrend,
  ChatbotUsageTrend,
  LoginActivityTrend,
  UsersByDepartment,
  UsersByStatus,
  HourlyActivity,
  ProcessingPerformance,
  TopActiveUser,
  SecurityEvent,
  StorageUsage,
  BatchProcessingSummary,
  AuditActionBreakdown,
} from '../types/admin'

const API_BASE_URL = 'https://dotnetbackend-patient-360.onrender.com'

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

adminApi.interceptors.response.use(
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

export const adminDashboardService = {
  // Audit Logs
  async getAuditLogs(filter: AuditLogFilter = {}): Promise<PagedAuditLogs> {
    const params = new URLSearchParams()
    if (filter.searchTerm) params.append('searchTerm', filter.searchTerm)
    if (filter.action) params.append('action', filter.action)
    if (filter.userId) params.append('userId', filter.userId)
    if (filter.startDate) params.append('startDate', filter.startDate)
    if (filter.endDate) params.append('endDate', filter.endDate)
    if (filter.ipAddress) params.append('ipAddress', filter.ipAddress)
    params.append('page', (filter.page || 1).toString())
    params.append('pageSize', (filter.pageSize || 25).toString())
    if (filter.sortBy) params.append('sortBy', filter.sortBy)
    if (filter.sortDirection) params.append('sortDirection', filter.sortDirection)

    const response: AxiosResponse<PagedAuditLogs> = await adminApi.get(
      `/api/admin/audit-logs?${params.toString()}`
    )
    return response.data
  },

  async exportAuditLogs(filter: AuditLogExportFilter = {}): Promise<AuditLog[]> {
    const params = new URLSearchParams()
    if (filter.searchTerm) params.append('searchTerm', filter.searchTerm)
    if (filter.action) params.append('action', filter.action)
    if (filter.userId) params.append('userId', filter.userId)
    if (filter.startDate) params.append('startDate', filter.startDate)
    if (filter.endDate) params.append('endDate', filter.endDate)
    if (filter.ipAddress) params.append('ipAddress', filter.ipAddress)

    const response: AxiosResponse<AuditLog[]> = await adminApi.get(
      `/api/admin/audit-logs/export?${params.toString()}`
    )
    return response.data
  },

  async getDistinctActions(): Promise<string[]> {
    const response: AxiosResponse<string[]> = await adminApi.get('/api/admin/audit-logs/actions')
    return response.data
  },

  // Dashboard Summary
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response: AxiosResponse<DashboardSummary> = await adminApi.get('/api/admin/dashboard/summary')
    return response.data
  },

  // User Analytics
  async getUserGrowthTrend(days: number = 30): Promise<UserGrowthTrend[]> {
    const response: AxiosResponse<UserGrowthTrend[]> = await adminApi.get(
      `/api/admin/analytics/user-growth?days=${days}`
    )
    return response.data
  },

  async getUsersByDepartment(): Promise<UsersByDepartment[]> {
    const response: AxiosResponse<UsersByDepartment[]> = await adminApi.get(
      '/api/admin/analytics/users-by-department'
    )
    return response.data
  },

  async getUsersByStatus(): Promise<UsersByStatus[]> {
    const response: AxiosResponse<UsersByStatus[]> = await adminApi.get(
      '/api/admin/analytics/users-by-status'
    )
    return response.data
  },

  async getTopUsers(days: number = 30, limit: number = 10): Promise<TopActiveUser[]> {
    const response: AxiosResponse<TopActiveUser[]> = await adminApi.get(
      `/api/admin/analytics/top-users?days=${days}&limit=${limit}`
    )
    return response.data
  },

  // Document Analytics
  async getDocumentTrends(days: number = 30): Promise<DocumentUploadTrend[]> {
    const response: AxiosResponse<DocumentUploadTrend[]> = await adminApi.get(
      `/api/admin/analytics/document-trends?days=${days}`
    )
    return response.data
  },

  async getDocumentStatus(): Promise<DocumentStatusDistribution[]> {
    const response: AxiosResponse<DocumentStatusDistribution[]> = await adminApi.get(
      '/api/admin/analytics/document-status'
    )
    return response.data
  },

  async getDocumentTypes(): Promise<DocumentTypeDistribution[]> {
    const response: AxiosResponse<DocumentTypeDistribution[]> = await adminApi.get(
      '/api/admin/analytics/document-types'
    )
    return response.data
  },

  async getStorageUsage(): Promise<StorageUsage> {
    const response: AxiosResponse<StorageUsage> = await adminApi.get(
      '/api/admin/analytics/storage-usage'
    )
    return response.data
  },

  async getProcessingPerformance(days: number = 30): Promise<ProcessingPerformance[]> {
    const response: AxiosResponse<ProcessingPerformance[]> = await adminApi.get(
      `/api/admin/analytics/processing-performance?days=${days}`
    )
    return response.data
  },

  async getBatchSummary(): Promise<BatchProcessingSummary> {
    const response: AxiosResponse<BatchProcessingSummary> = await adminApi.get(
      '/api/admin/analytics/batch-summary'
    )
    return response.data
  },

  // Patient Analytics
  async getPatientConflicts(days: number = 30): Promise<PatientConflictTrend[]> {
    const response: AxiosResponse<PatientConflictTrend[]> = await adminApi.get(
      `/api/admin/analytics/patient-conflicts?days=${days}`
    )
    return response.data
  },

  // Chatbot Analytics
  async getChatbotUsage(days: number = 30): Promise<ChatbotUsageTrend[]> {
    const response: AxiosResponse<ChatbotUsageTrend[]> = await adminApi.get(
      `/api/admin/analytics/chatbot-usage?days=${days}`
    )
    return response.data
  },

  // Security Analytics
  async getLoginActivity(days: number = 30): Promise<LoginActivityTrend[]> {
    const response: AxiosResponse<LoginActivityTrend[]> = await adminApi.get(
      `/api/admin/analytics/login-activity?days=${days}`
    )
    return response.data
  },

  async getSecurityEvents(days: number = 30): Promise<SecurityEvent[]> {
    const response: AxiosResponse<SecurityEvent[]> = await adminApi.get(
      `/api/admin/analytics/security-events?days=${days}`
    )
    return response.data
  },

  async getHourlyActivity(days: number = 30): Promise<HourlyActivity[]> {
    const response: AxiosResponse<HourlyActivity[]> = await adminApi.get(
      `/api/admin/analytics/hourly-activity?days=${days}`
    )
    return response.data
  },

  async getActionBreakdown(days: number = 30): Promise<AuditActionBreakdown[]> {
    const response: AxiosResponse<AuditActionBreakdown[]> = await adminApi.get(
      `/api/admin/analytics/action-breakdown?days=${days}`
    )
    return response.data
  },
}

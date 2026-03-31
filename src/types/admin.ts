export interface AuditLog {
  id: string
  userId: string | null
  userEmail: string
  userName: string
  action: string
  occurredAt: string
  ipAddress: string
  metadata: Record<string, unknown> | null
}

export interface AuditLogFilter {
  searchTerm?: string
  action?: string
  userId?: string
  startDate?: string
  endDate?: string
  ipAddress?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

export interface AuditLogExportFilter {
  searchTerm?: string
  action?: string
  userId?: string
  startDate?: string
  endDate?: string
  ipAddress?: string
}

export interface PagedAuditLogs {
  items: AuditLog[]
  totalCount: number
  currentPage: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface DashboardSummary {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  pendingUsers: number
  totalDocuments: number
  documentsToday: number
  documentsThisWeek: number
  documentsThisMonth: number
  totalPatientContexts: number
  patientsWithConflicts: number
  totalConflictsIdentified: number
  activeSessions: number
  totalChatbotQueries: number
  documentProcessingSuccessRate: number
  avgDocumentsPerUser: number
}

export interface UserGrowthTrend {
  date: string
  newUsers: number
  totalUsers: number
}

export interface DocumentUploadTrend {
  date: string
  uploaded: number
  processed: number
  failed: number
}

export interface DocumentStatusDistribution {
  status: string
  count: number
  percentage: number
}

export interface DocumentTypeDistribution {
  fileExtension: string
  count: number
  totalSizeBytes: number
}

export interface PatientConflictTrend {
  date: string
  patientsCreated: number
  conflictsDetected: number
}

export interface ChatbotUsageTrend {
  date: string
  queriesCount: number
  uniqueUsers: number
}

export interface LoginActivityTrend {
  date: string
  successfulLogins: number
  failedLogins: number
  accountLockouts: number
}

export interface UsersByDepartment {
  department: string
  count: number
}

export interface UsersByStatus {
  status: string
  count: number
}

export interface HourlyActivity {
  hour: number
  actionCount: number
}

export interface ProcessingPerformance {
  date: string
  avgProcessingTimeMs: number
  documentsProcessed: number
}

export interface TopActiveUser {
  userId: string
  email: string
  name: string
  department: string
  documentsUploaded: number
  patientsCreated: number
  chatbotQueries: number
  lastActive: string | null
}

export interface SecurityEvent {
  date: string
  failedLogins: number
  accountLockouts: number
  passwordResets: number
  userDeactivations: number
}

export interface StorageUsage {
  totalSizeBytes: number
  documentCount: number
  avgFileSizeBytes: number
}

export interface BatchProcessingSummary {
  totalBatches: number
  completedBatches: number
  failedBatches: number
  avgDocsPerBatch: number
}

export interface AuditActionBreakdown {
  category: string
  action: string
  count: number
}

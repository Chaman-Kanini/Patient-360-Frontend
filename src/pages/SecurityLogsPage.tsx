import React, { useState, useEffect, useCallback } from 'react'
import { Shield } from 'lucide-react'
import { AdminLayout } from '../components/admin/AdminLayout'
import { AuditLogTable } from '../components/admin/AuditLogTable'
import { AuditLogFilters } from '../components/admin/AuditLogFilters'
import { ExportButton } from '../components/admin/ExportButton'
import { adminDashboardService } from '../services/adminDashboardService'
import { AuditLogFilter, PagedAuditLogs } from '../types/admin'

export const SecurityLogsPage: React.FC = () => {
  const [data, setData] = useState<PagedAuditLogs | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<AuditLogFilter>({
    page: 1,
    pageSize: 25,
    sortBy: 'OccurredAt',
    sortDirection: 'desc',
  })

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const result = await adminDashboardService.getAuditLogs(filter)
      setData(result)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const handleFilterChange = (newFilter: AuditLogFilter) => {
    setFilter({ ...filter, ...newFilter })
  }

  const handlePageChange = (page: number) => {
    setFilter((prev) => ({ ...prev, page }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setFilter((prev) => ({ ...prev, pageSize, page: 1 }))
  }

  const handleSort = (field: string) => {
    setFilter((prev) => ({
      ...prev,
      sortBy: field,
      sortDirection: prev.sortBy === field && prev.sortDirection === 'desc' ? 'asc' : 'desc',
      page: 1,
    }))
  }

  const handleExport = async () => {
    const logs = await adminDashboardService.exportAuditLogs({
      searchTerm: filter.searchTerm,
      action: filter.action,
      userId: filter.userId,
      startDate: filter.startDate,
      endDate: filter.endDate,
      ipAddress: filter.ipAddress,
    })
    return logs.map((log) => ({
      Timestamp: log.occurredAt,
      User: log.userName || log.userEmail || 'System',
      Email: log.userEmail,
      Action: log.action,
      IP_Address: log.ipAddress,
      Details: log.metadata ? JSON.stringify(log.metadata) : '',
    }))
  }

  return (
    <AdminLayout title="Security Logs" subtitle="Immutable audit trail of all platform actions">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-slate-600" />
            <span className="text-sm text-slate-600">
              {data ? `${data.totalCount.toLocaleString()} total records` : 'Loading...'}
            </span>
          </div>
          <ExportButton onExport={handleExport} filename="security-audit-logs" />
        </div>

        <AuditLogFilters filter={filter} onFilterChange={handleFilterChange} />

        <AuditLogTable
          data={data}
          loading={loading}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onSort={handleSort}
          sortBy={filter.sortBy || 'OccurredAt'}
          sortDirection={filter.sortDirection || 'desc'}
        />
      </div>
    </AdminLayout>
  )
}

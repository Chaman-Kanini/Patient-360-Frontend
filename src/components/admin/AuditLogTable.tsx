import React, { useState } from 'react'
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { AuditLog, PagedAuditLogs } from '../../types/admin'

interface AuditLogTableProps {
  data: PagedAuditLogs | null
  loading: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onSort: (field: string) => void
  sortBy: string
  sortDirection: 'asc' | 'desc'
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN_SUCCESS: 'bg-green-100 text-green-800',
  LOGIN_FAILED: 'bg-red-100 text-red-800',
  ACCOUNT_LOCKED: 'bg-red-100 text-red-800',
  LOGOUT: 'bg-slate-100 text-slate-700',
  USER_CREATED: 'bg-blue-100 text-blue-800',
  USER_UPDATED: 'bg-blue-100 text-blue-800',
  USER_DEACTIVATED: 'bg-orange-100 text-orange-800',
  USER_REACTIVATED: 'bg-green-100 text-green-800',
  USER_APPROVED: 'bg-green-100 text-green-800',
  USER_REJECTED: 'bg-red-100 text-red-800',
  USER_ROLE_CHANGED: 'bg-purple-100 text-purple-800',
  USER_REGISTERED: 'bg-blue-100 text-blue-800',
  PASSWORD_RESET_REQUESTED: 'bg-yellow-100 text-yellow-800',
  PASSWORD_RESET_COMPLETED: 'bg-yellow-100 text-yellow-800',
  DOCUMENT_UPLOAD_SUCCESS: 'bg-green-100 text-green-800',
  DOCUMENT_UPLOAD_FAILED: 'bg-red-100 text-red-800',
  DOCUMENT_VALIDATION_REJECTED: 'bg-red-100 text-red-800',
  DOCUMENT_DOWNLOADED: 'bg-cyan-100 text-cyan-800',
  DOCUMENT_DELETED: 'bg-orange-100 text-orange-800',
  DOCUMENT_PROCESSING_STARTED: 'bg-blue-100 text-blue-800',
  DOCUMENT_PROCESSING_COMPLETED: 'bg-green-100 text-green-800',
  DOCUMENT_PROCESSING_FAILED: 'bg-red-100 text-red-800',
  CONSOLIDATION_COMPLETED: 'bg-green-100 text-green-800',
  CONSOLIDATION_FAILED: 'bg-red-100 text-red-800',
  VIEW_PATIENT: 'bg-indigo-100 text-indigo-800',
  CHATBOT_QUERY: 'bg-violet-100 text-violet-800',
  AUDIT_LOG_VIEWED: 'bg-slate-100 text-slate-700',
  AUDIT_LOG_EXPORTED: 'bg-slate-100 text-slate-700',
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  data,
  loading,
  onPageChange,
  onPageSizeChange,
  onSort,
  sortBy,
  sortDirection,
}) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getActionBadge = (action: string) => {
    const color = ACTION_COLORS[action] || 'bg-slate-100 text-slate-700'
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>
        {action}
      </span>
    )
  }

  const SortHeader: React.FC<{ field: string; label: string }> = ({ field, label }) => (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-xs font-medium text-slate-500 uppercase tracking-wider hover:text-slate-700"
    >
      {label}
      {sortBy === field && (
        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      )}
    </button>
  )

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-3 text-sm text-slate-500">Loading audit logs...</p>
      </div>
    )
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-sm text-slate-500">No audit logs found matching your filters.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <SortHeader field="OccurredAt" label="Timestamp" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader field="Action" label="Action" />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader field="IpAddress" label="IP Address" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((log: AuditLog) => (
              <React.Fragment key={log.id}>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                    {formatDate(log.occurredAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">
                      {log.userName || 'System'}
                    </div>
                    <div className="text-xs text-slate-500">{log.userEmail || '—'}</div>
                  </td>
                  <td className="px-4 py-3">{getActionBadge(log.action)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                    {log.ipAddress}
                  </td>
                  <td className="px-4 py-3">
                    {log.metadata && Object.keys(log.metadata).length > 0 ? (
                      <button
                        onClick={() =>
                          setExpandedRow(expandedRow === log.id ? null : log.id)
                        }
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      >
                        {expandedRow === log.id ? 'Hide' : 'View'}
                        {expandedRow === log.id ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
                {expandedRow === log.id && log.metadata && (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 bg-slate-50">
                      <pre className="text-xs text-slate-700 bg-slate-100 rounded-lg p-3 overflow-x-auto max-h-48">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">
            Showing {(data.currentPage - 1) * data.pageSize + 1} to{' '}
            {Math.min(data.currentPage * data.pageSize, data.totalCount)} of{' '}
            {data.totalCount}
          </span>
          <select
            value={data.pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(data.currentPage - 1)}
            disabled={!data.hasPreviousPage}
            className="p-1.5 rounded-md border border-slate-300 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-3 py-1.5 text-sm text-slate-700">
            Page {data.currentPage} of {data.totalPages}
          </span>
          <button
            onClick={() => onPageChange(data.currentPage + 1)}
            disabled={!data.hasNextPage}
            className="p-1.5 rounded-md border border-slate-300 text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

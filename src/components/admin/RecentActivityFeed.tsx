import React from 'react'
import {
  LogIn,
  LogOut,
  UserPlus,
  UserX,
  UserCheck,
  Upload,
  FileText,
  Download,
  Trash2,
  Eye,
  MessageSquare,
  Shield,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
} from 'lucide-react'
import { AuditLog } from '../../types/admin'

interface RecentActivityFeedProps {
  logs: AuditLog[]
  loading?: boolean
}

const ACTION_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  LOGIN_SUCCESS: { icon: LogIn, color: 'text-green-500' },
  LOGIN_FAILED: { icon: XCircle, color: 'text-red-500' },
  ACCOUNT_LOCKED: { icon: Lock, color: 'text-red-600' },
  LOGOUT: { icon: LogOut, color: 'text-slate-500' },
  USER_CREATED: { icon: UserPlus, color: 'text-blue-500' },
  USER_UPDATED: { icon: Settings, color: 'text-blue-500' },
  USER_DEACTIVATED: { icon: UserX, color: 'text-orange-500' },
  USER_REACTIVATED: { icon: UserCheck, color: 'text-green-500' },
  USER_APPROVED: { icon: CheckCircle, color: 'text-green-500' },
  USER_REJECTED: { icon: XCircle, color: 'text-red-500' },
  USER_REGISTERED: { icon: UserPlus, color: 'text-blue-500' },
  PASSWORD_RESET_REQUESTED: { icon: Key, color: 'text-yellow-500' },
  PASSWORD_RESET_COMPLETED: { icon: Key, color: 'text-green-500' },
  DOCUMENT_UPLOAD_SUCCESS: { icon: Upload, color: 'text-green-500' },
  DOCUMENT_UPLOAD_FAILED: { icon: AlertTriangle, color: 'text-red-500' },
  DOCUMENT_DOWNLOADED: { icon: Download, color: 'text-cyan-500' },
  DOCUMENT_DELETED: { icon: Trash2, color: 'text-orange-500' },
  DOCUMENT_PROCESSING_STARTED: { icon: FileText, color: 'text-blue-500' },
  DOCUMENT_PROCESSING_COMPLETED: { icon: CheckCircle, color: 'text-green-500' },
  DOCUMENT_PROCESSING_FAILED: { icon: XCircle, color: 'text-red-500' },
  VIEW_PATIENT: { icon: Eye, color: 'text-indigo-500' },
  CHATBOT_QUERY: { icon: MessageSquare, color: 'text-violet-500' },
  AUDIT_LOG_VIEWED: { icon: Shield, color: 'text-slate-500' },
  AUDIT_LOG_EXPORTED: { icon: Download, color: 'text-slate-500' },
}

const getRelativeTime = (dateStr: string): string => {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ logs, loading }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center gap-3">
            <div className="h-8 w-8 bg-slate-200 rounded-full" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-slate-200 rounded w-3/4" />
              <div className="h-2 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-4">No recent activity</p>
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const actionInfo = ACTION_ICONS[log.action] || { icon: FileText, color: 'text-slate-400' }
        const Icon = actionInfo.icon
        return (
          <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
            <div className={`mt-0.5 ${actionInfo.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-800 truncate">
                {log.action.replace(/_/g, ' ')}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {log.userName || log.userEmail || 'System'} &middot; {log.ipAddress}
              </p>
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">
              {getRelativeTime(log.occurredAt)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

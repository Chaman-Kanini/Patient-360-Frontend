import React, { useState, useEffect } from 'react'
import {
  Activity,
  Wifi,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  FileText,
  Database,
} from 'lucide-react'
import { AdminLayout } from '../components/admin/AdminLayout'
import { SummaryCard } from '../components/admin/SummaryCard'
import { ChartCard } from '../components/admin/ChartCard'
import { RecentActivityFeed } from '../components/admin/RecentActivityFeed'
import { adminDashboardService } from '../services/adminDashboardService'
import {
  DashboardSummary,
  StorageUsage,
  BatchProcessingSummary,
  DocumentStatusDistribution,
  AuditLog,
} from '../types/admin'

export const SystemHealthPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [storage, setStorage] = useState<StorageUsage | null>(null)
  const [batchSummary, setBatchSummary] = useState<BatchProcessingSummary | null>(null)
  const [docStatus, setDocStatus] = useState<DocumentStatusDistribution[]>([])
  const [errorLogs, setErrorLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const results = await Promise.allSettled([
        adminDashboardService.getDashboardSummary(),
        adminDashboardService.getStorageUsage(),
        adminDashboardService.getBatchSummary(),
        adminDashboardService.getDocumentStatus(),
        adminDashboardService.getAuditLogs({
          page: 1,
          pageSize: 20,
          sortBy: 'OccurredAt',
          sortDirection: 'desc',
          action: undefined,
          searchTerm: 'FAILED',
        }),
      ])
      if (results[0].status === 'fulfilled') setSummary(results[0].value)
      if (results[1].status === 'fulfilled') setStorage(results[1].value)
      if (results[2].status === 'fulfilled') setBatchSummary(results[2].value)
      if (results[3].status === 'fulfilled') setDocStatus(results[3].value)
      if (results[4].status === 'fulfilled') setErrorLogs(results[4].value.items)
      results.forEach((r, i) => {
        if (r.status === 'rejected') console.error(`System health request ${i} failed:`, r.reason)
      })
    } catch (error) {
      console.error('Failed to load system health data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fmtBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`
    return `${(bytes / 1073741824).toFixed(2)} GB`
  }

  const pendingDocs = docStatus.find((d) => d.status === 'Pending')?.count ?? 0
  const processingDocs = docStatus.find((d) => d.status === 'Processing')?.count ?? 0
  const failedDocs = docStatus.find((d) => d.status === 'Failed')?.count ?? 0
  const completedDocs = docStatus.find((d) => d.status === 'Completed')?.count ?? 0
  const totalProcessed = completedDocs + failedDocs
  const errorRate24h = totalProcessed > 0 ? ((failedDocs / totalProcessed) * 100).toFixed(1) : '0'

  return (
    <AdminLayout title="System Health" subtitle="Real-time platform health and monitoring">
      <div className="flex items-center justify-end mb-6">
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Health Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="Active Sessions"
          value={summary?.activeSessions ?? '—'}
          icon={Wifi}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          subtitle="Currently online"
        />
        <SummaryCard
          title="Processing Queue"
          value={pendingDocs + processingDocs}
          icon={Clock}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100"
          subtitle={`${pendingDocs} pending, ${processingDocs} processing`}
        />
        <SummaryCard
          title="Error Rate"
          value={`${errorRate24h}%`}
          icon={AlertTriangle}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
          subtitle={`${failedDocs} failed of ${totalProcessed} processed`}
        />
        <SummaryCard
          title="Processing Success"
          value={summary ? `${summary.documentProcessingSuccessRate}%` : '—'}
          icon={CheckCircle}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          subtitle="Overall success rate"
        />
      </div>

      {/* Storage & Batch Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="Total Storage"
          value={storage ? fmtBytes(storage.totalSizeBytes) : '—'}
          icon={HardDrive}
          iconColor="text-indigo-600"
          iconBgColor="bg-indigo-100"
          subtitle={`${storage?.documentCount ?? 0} files`}
        />
        <SummaryCard
          title="Avg File Size"
          value={storage ? fmtBytes(storage.avgFileSizeBytes) : '—'}
          icon={FileText}
          iconColor="text-cyan-600"
          iconBgColor="bg-cyan-100"
          subtitle="Per document"
        />
        <SummaryCard
          title="Batch Success"
          value={batchSummary ? `${batchSummary.completedBatches}/${batchSummary.totalBatches}` : '—'}
          icon={Database}
          iconColor="text-teal-600"
          iconBgColor="bg-teal-100"
          subtitle={`${batchSummary?.failedBatches ?? 0} failed`}
        />
        <SummaryCard
          title="Avg Docs/Batch"
          value={batchSummary?.avgDocsPerBatch ?? '—'}
          icon={Activity}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          subtitle="Documents per batch"
        />
      </div>

      {/* Document Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Document Pipeline Status" subtitle="Current status of all documents" loading={loading}>
          <div className="space-y-3">
            {docStatus.map((status) => {
              const colors: Record<string, string> = {
                Completed: 'bg-green-500',
                Processing: 'bg-blue-500',
                Pending: 'bg-amber-500',
                Validated: 'bg-cyan-500',
                Failed: 'bg-red-500',
                Rejected: 'bg-orange-500',
              }
              const icons: Record<string, React.ElementType> = {
                Completed: CheckCircle,
                Processing: RefreshCw,
                Pending: Clock,
                Failed: XCircle,
                Rejected: AlertTriangle,
              }
              const Icon = icons[status.status] || FileText
              const barColor = colors[status.status] || 'bg-slate-400'

              return (
                <div key={status.status} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-slate-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{status.status}</span>
                      <span className="text-sm text-slate-500">{status.count} ({status.percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`${barColor} h-2 rounded-full transition-all`}
                        style={{ width: `${Math.max(status.percentage, 1)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
            {docStatus.length === 0 && !loading && (
              <p className="text-sm text-slate-400 text-center py-4">No documents in system</p>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Recent Errors" subtitle="Latest failed operations" loading={loading}>
          <RecentActivityFeed logs={errorLogs} />
        </ChartCard>
      </div>
    </AdminLayout>
  )
}

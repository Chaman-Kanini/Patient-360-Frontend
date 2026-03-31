import React, { useState, useEffect } from 'react'
import {
  Users,
  UserCheck,
  UserX,
  FileText,
  Upload,
  Database,
  Activity,
  MessageSquare,
  CheckCircle,
} from 'lucide-react'
import { AdminLayout } from '../components/admin/AdminLayout'
import { SummaryCard } from '../components/admin/SummaryCard'
import { ChartCard } from '../components/admin/ChartCard'
import { RecentActivityFeed } from '../components/admin/RecentActivityFeed'
import { adminDashboardService } from '../services/adminDashboardService'
import {
  DashboardSummary,
  DocumentUploadTrend,
  LoginActivityTrend,
  ChatbotUsageTrend,
  AuditLog,
} from '../types/admin'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export const AdminDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [docTrend, setDocTrend] = useState<DocumentUploadTrend[]>([])
  const [loginTrend, setLoginTrend] = useState<LoginActivityTrend[]>([])
  const [chatTrend, setChatTrend] = useState<ChatbotUsageTrend[]>([])
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const results = await Promise.allSettled([
        adminDashboardService.getDashboardSummary(),
        adminDashboardService.getDocumentTrends(7),
        adminDashboardService.getLoginActivity(7),
        adminDashboardService.getChatbotUsage(7),
        adminDashboardService.getAuditLogs({ page: 1, pageSize: 10, sortBy: 'OccurredAt', sortDirection: 'desc' }),
      ])
      if (results[0].status === 'fulfilled') setSummary(results[0].value)
      if (results[1].status === 'fulfilled') setDocTrend(results[1].value)
      if (results[2].status === 'fulfilled') setLoginTrend(results[2].value)
      if (results[3].status === 'fulfilled') setChatTrend(results[3].value)
      if (results[4].status === 'fulfilled') setRecentLogs(results[4].value.items)
      results.forEach((r, i) => {
        if (r.status === 'rejected') console.error(`Dashboard request ${i} failed:`, r.reason)
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const tooltipLabelFormatter = (label: unknown) => formatShortDate(String(label))

  return (
    <AdminLayout title="Admin Dashboard" subtitle="Platform overview and key metrics">
      
      {/* Summary Cards — Row 1: Users */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          title="Total Users"
          value={summary?.totalUsers ?? '—'}
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          subtitle="All registered users"
        />
        <SummaryCard
          title="Active Users"
          value={summary?.activeUsers ?? '—'}
          icon={UserCheck}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          subtitle="Currently active"
        />
        <SummaryCard
          title="Inactive Users"
          value={summary?.inactiveUsers ?? '—'}
          icon={UserX}
          iconColor="text-red-600"
          iconBgColor="bg-red-100"
          subtitle="Deactivated accounts"
        />
      </div>

      {/* Summary Cards — Row 2: Platform */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="Total Documents"
          value={summary?.totalDocuments ?? '—'}
          icon={FileText}
          iconColor="text-indigo-600"
          iconBgColor="bg-indigo-100"
          subtitle={`${summary?.documentsToday ?? 0} today`}
        />
        <SummaryCard
          title="Documents This Week"
          value={summary?.documentsThisWeek ?? '—'}
          icon={Upload}
          iconColor="text-cyan-600"
          iconBgColor="bg-cyan-100"
          subtitle={`${summary?.documentsThisMonth ?? 0} this month`}
        />
        <SummaryCard
          title="Patient Contexts"
          value={summary?.totalPatientContexts ?? '—'}
          icon={Database}
          iconColor="text-teal-600"
          iconBgColor="bg-teal-100"
          subtitle={`${summary?.patientsWithConflicts ?? 0} with conflicts`}
        />
        <SummaryCard
          title="Active Sessions"
          value={summary?.activeSessions ?? '—'}
          icon={Activity}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          subtitle="Currently online"
        />
      </div>

      {/* Summary Cards — Row 3: AI/Quality */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
        <SummaryCard
          title="Processing Success Rate"
          value={summary ? `${summary.documentProcessingSuccessRate}%` : '—'}
          icon={CheckCircle}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          subtitle="Completed / Total processed"
        />
        <SummaryCard
          title="Chatbot Queries"
          value={summary?.totalChatbotQueries ?? '—'}
          icon={MessageSquare}
          iconColor="text-violet-600"
          iconBgColor="bg-violet-100"
          subtitle="Total AI assistant queries"
        />
      </div>

      {/* Mini Charts + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ChartCard title="Document Uploads" subtitle="Last 7 days" loading={loading}>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={docTrend}>
              <defs>
                <linearGradient id="docGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                labelFormatter={tooltipLabelFormatter}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Area type="monotone" dataKey="uploaded" stroke="#3b82f6" fill="url(#docGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="processed" stroke="#10b981" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Login Activity" subtitle="Last 7 days" loading={loading}>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={loginTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                labelFormatter={tooltipLabelFormatter}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="successfulLogins" fill="#10b981" radius={[2, 2, 0, 0]} name="Success" />
              <Bar dataKey="failedLogins" fill="#ef4444" radius={[2, 2, 0, 0]} name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Chatbot Usage" subtitle="Last 7 days" loading={loading}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chatTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tickFormatter={formatShortDate} tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                labelFormatter={tooltipLabelFormatter}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Line type="monotone" dataKey="queriesCount" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Queries" />
              <Line type="monotone" dataKey="uniqueUsers" stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Unique Users" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <ChartCard title="Recent Activity" subtitle="Latest platform events" loading={loading}>
          <RecentActivityFeed logs={recentLogs} />
        </ChartCard>
      </div>
    </AdminLayout>
  )
}

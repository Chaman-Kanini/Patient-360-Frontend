import React, { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '../components/admin/AdminLayout'
import { ChartCard } from '../components/admin/ChartCard'
import { TimeRangeSelector } from '../components/admin/TimeRangeSelector'
import { SummaryCard } from '../components/admin/SummaryCard'
import { adminDashboardService } from '../services/adminDashboardService'
import {
  UserGrowthTrend,
  UsersByStatus,
  TopActiveUser,
  DocumentUploadTrend,
  DocumentStatusDistribution,
  DocumentTypeDistribution,
  StorageUsage,
  ProcessingPerformance,
  BatchProcessingSummary,
  PatientConflictTrend,
  ChatbotUsageTrend,
  LoginActivityTrend,
  SecurityEvent,
  HourlyActivity,
  AuditActionBreakdown,
} from '../types/admin'
import {
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Users, FileText, Stethoscope, Shield,
  HardDrive, Package, Database,
} from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316']
const TABS = ['Users', 'Documents', 'Patient & Clinical', 'Security & Compliance']

export const BusinessAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  // User analytics
  const [userGrowth, setUserGrowth] = useState<UserGrowthTrend[]>([])
  const [usersByStatus, setUsersByStatus] = useState<UsersByStatus[]>([])
  const [topUsers, setTopUsers] = useState<TopActiveUser[]>([])

  // Document analytics
  const [docTrend, setDocTrend] = useState<DocumentUploadTrend[]>([])
  const [docStatus, setDocStatus] = useState<DocumentStatusDistribution[]>([])
  const [docTypes, setDocTypes] = useState<DocumentTypeDistribution[]>([])
  const [storage, setStorage] = useState<StorageUsage | null>(null)
  const [procPerf, setProcPerf] = useState<ProcessingPerformance[]>([])
  const [batchSummary, setBatchSummary] = useState<BatchProcessingSummary | null>(null)

  // Patient analytics
  const [patientConflicts, setPatientConflicts] = useState<PatientConflictTrend[]>([])
  const [chatUsage, setChatUsage] = useState<ChatbotUsageTrend[]>([])

  // Security analytics
  const [loginActivity, setLoginActivity] = useState<LoginActivityTrend[]>([])
  const [secEvents, setSecEvents] = useState<SecurityEvent[]>([])
  const [hourlyAct, setHourlyAct] = useState<HourlyActivity[]>([])
  const [actionBreakdown, setActionBreakdown] = useState<AuditActionBreakdown[]>([])

  const loadTabData = useCallback(async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 0: {
          const [g, s, t] = await Promise.all([
            adminDashboardService.getUserGrowthTrend(days),
            adminDashboardService.getUsersByStatus(),
            adminDashboardService.getTopUsers(days, 10),
          ])
          setUserGrowth(g); setUsersByStatus(s); setTopUsers(t)
          break
        }
        case 1: {
          const [dt, ds, dty, st, pp, bs] = await Promise.all([
            adminDashboardService.getDocumentTrends(days),
            adminDashboardService.getDocumentStatus(),
            adminDashboardService.getDocumentTypes(),
            adminDashboardService.getStorageUsage(),
            adminDashboardService.getProcessingPerformance(days),
            adminDashboardService.getBatchSummary(),
          ])
          setDocTrend(dt); setDocStatus(ds); setDocTypes(dty); setStorage(st); setProcPerf(pp); setBatchSummary(bs)
          break
        }
        case 2: {
          const [pc, cu] = await Promise.all([
            adminDashboardService.getPatientConflicts(days),
            adminDashboardService.getChatbotUsage(days),
          ])
          setPatientConflicts(pc); setChatUsage(cu)
          break
        }
        case 3: {
          const [la, se, ha, ab] = await Promise.all([
            adminDashboardService.getLoginActivity(days),
            adminDashboardService.getSecurityEvents(days),
            adminDashboardService.getHourlyActivity(days),
            adminDashboardService.getActionBreakdown(days),
          ])
          setLoginActivity(la); setSecEvents(se); setHourlyAct(ha); setActionBreakdown(ab)
          break
        }
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab, days])

  useEffect(() => { loadTabData() }, [loadTabData])

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const tooltipLabel = (label: unknown) => fmtDate(String(label))
  const fmtBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`
    return `${(bytes / 1073741824).toFixed(2)} GB`
  }

  const tabIcons = [Users, FileText, Stethoscope, Shield]

  return (
    <AdminLayout title="Business Analytics" subtitle="Comprehensive platform analytics and insights">
      {/* Tab Bar + Time Range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 overflow-x-auto">
          {TABS.map((tab, i) => {
            const Icon = tabIcons[i]
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  activeTab === i
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab}
              </button>
            )
          })}
        </div>
        <TimeRangeSelector value={days} onChange={setDays} />
      </div>

      {/* Tab 0: User Analytics */}
      {activeTab === 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="User Growth Trend" subtitle={`Last ${days} days`} loading={loading}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip labelFormatter={tooltipLabel} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="totalUsers" stroke="#3b82f6" strokeWidth={2} name="Total Users" dot={false} />
                  <Line type="monotone" dataKey="newUsers" stroke="#10b981" strokeWidth={2} name="New Users" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

                      </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Users by Status" loading={loading}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={usersByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} label={({ name, value }: { name?: string; value?: number }) => `${name ?? ''}: ${value ?? 0}`}>
                    {usersByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Top Active Users" subtitle={`Last ${days} days`} loading={loading} className="lg:col-span-2">
              <div className="overflow-x-auto max-h-56">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">User</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Dept</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-slate-500">Docs</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-slate-500">Patients</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-slate-500">Chat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topUsers.map((u) => (
                      <tr key={u.userId} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <div className="font-medium text-slate-800">{u.name || u.email}</div>
                          <div className="text-xs text-slate-400">{u.email}</div>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{u.department}</td>
                        <td className="px-3 py-2 text-center font-medium">{u.documentsUploaded}</td>
                        <td className="px-3 py-2 text-center font-medium">{u.patientsCreated}</td>
                        <td className="px-3 py-2 text-center font-medium">{u.chatbotQueries}</td>
                      </tr>
                    ))}
                    {topUsers.length === 0 && !loading && (
                      <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">No data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        </div>
      )}

      {/* Tab 1: Document Analytics */}
      {activeTab === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Total Storage" value={storage ? fmtBytes(storage.totalSizeBytes) : '—'} icon={HardDrive} iconColor="text-indigo-600" iconBgColor="bg-indigo-100" subtitle={`${storage?.documentCount ?? 0} files`} />
            <SummaryCard title="Avg File Size" value={storage ? fmtBytes(storage.avgFileSizeBytes) : '—'} icon={FileText} iconColor="text-cyan-600" iconBgColor="bg-cyan-100" />
            <SummaryCard title="Total Batches" value={batchSummary?.totalBatches ?? '—'} icon={Package} iconColor="text-teal-600" iconBgColor="bg-teal-100" subtitle={`${batchSummary?.completedBatches ?? 0} completed`} />
            <SummaryCard title="Avg Docs/Batch" value={batchSummary?.avgDocsPerBatch ?? '—'} icon={Database} iconColor="text-purple-600" iconBgColor="bg-purple-100" subtitle={`${batchSummary?.failedBatches ?? 0} failed`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Document Upload Trend" subtitle={`Last ${days} days`} loading={loading}>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={docTrend}>
                  <defs>
                    <linearGradient id="upGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip labelFormatter={tooltipLabel} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="uploaded" stroke="#3b82f6" fill="url(#upGrad)" strokeWidth={2} name="Uploaded" />
                  <Area type="monotone" dataKey="processed" stroke="#10b981" fill="none" strokeWidth={1.5} name="Processed" />
                  <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="none" strokeWidth={1.5} name="Failed" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Processing Performance" subtitle={`Avg time (ms) — last ${days} days`} loading={loading}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={procPerf}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip labelFormatter={tooltipLabel} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="avgProcessingTimeMs" stroke="#f59e0b" strokeWidth={2} name="Avg Time (ms)" dot={false} />
                  <Line type="monotone" dataKey="documentsProcessed" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 4" name="Docs Processed" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Document Status Distribution" loading={loading}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={docStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} label={({ name, value }: { name?: string; value?: number }) => `${name ?? ''}: ${value ?? 0}`}>
                    {docStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="File Type Distribution" loading={loading}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={docTypes} dataKey="count" nameKey="fileExtension" cx="50%" cy="50%" outerRadius={85} label={({ name, value }: { name?: string; value?: number }) => `${name ?? ''}: ${value ?? 0}`}>
                    {docTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {/* Tab 2: Patient & Clinical Analytics */}
      {activeTab === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Patient Contexts vs Conflicts" subtitle={`Last ${days} days`} loading={loading}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={patientConflicts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip labelFormatter={tooltipLabel} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="patientsCreated" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Patients Created" />
                  <Bar dataKey="conflictsDetected" fill="#f59e0b" radius={[2, 2, 0, 0]} name="Conflicts Detected" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Chatbot Usage Trend" subtitle={`Last ${days} days`} loading={loading}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chatUsage}>
                  <defs>
                    <linearGradient id="chatGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip labelFormatter={tooltipLabel} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="queriesCount" stroke="#8b5cf6" fill="url(#chatGrad)" strokeWidth={2} name="Queries" />
                  <Area type="monotone" dataKey="uniqueUsers" stroke="#06b6d4" fill="none" strokeWidth={1.5} name="Unique Users" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Compliance */}
      {activeTab === 3 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Login Activity" subtitle={`Last ${days} days`} loading={loading}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={loginActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip labelFormatter={tooltipLabel} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="successfulLogins" stackId="a" fill="#10b981" name="Successful" />
                  <Bar dataKey="failedLogins" stackId="a" fill="#ef4444" name="Failed" />
                  <Bar dataKey="accountLockouts" stackId="a" fill="#7c3aed" name="Lockouts" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Security Events Trend" subtitle={`Last ${days} days`} loading={loading}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={secEvents}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip labelFormatter={tooltipLabel} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="failedLogins" stroke="#ef4444" strokeWidth={2} name="Failed Logins" />
                  <Line type="monotone" dataKey="accountLockouts" stroke="#7c3aed" strokeWidth={2} name="Lockouts" />
                  <Line type="monotone" dataKey="passwordResets" stroke="#f59e0b" strokeWidth={1.5} name="Password Resets" />
                  <Line type="monotone" dataKey="userDeactivations" stroke="#f97316" strokeWidth={1.5} name="Deactivations" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Activity by Hour of Day" subtitle={`Last ${days} days`} loading={loading}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={hourlyAct}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={(h) => `${h}:00`} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} labelFormatter={(h) => `${h}:00 - ${Number(h) + 1}:00`} />
                  <Bar dataKey="actionCount" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Actions" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Audit Action Breakdown" subtitle={`Top actions — last ${days} days`} loading={loading}>
              <div className="overflow-x-auto max-h-56">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Category</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Action</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {actionBreakdown.slice(0, 15).map((a, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-3 py-1.5">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{a.category}</span>
                        </td>
                        <td className="px-3 py-1.5 text-xs font-mono text-slate-700">{a.action}</td>
                        <td className="px-3 py-1.5 text-right font-medium text-slate-800">{a.count.toLocaleString()}</td>
                      </tr>
                    ))}
                    {actionBreakdown.length === 0 && !loading && (
                      <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-400">No data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

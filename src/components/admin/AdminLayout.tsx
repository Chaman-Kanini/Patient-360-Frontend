import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard,
  Users,
  Shield,
  BarChart3,
  Activity,
  LogOut,
  Heart,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  User,
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'User Management', icon: Users },
  { path: '/admin/security-logs', label: 'Security Logs', icon: Shield },
  { path: '/admin/analytics', label: 'Business Analytics', icon: BarChart3 },
  { path: '/admin/system-health', label: 'System Health', icon: Activity },
]

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const isActive = (path: string) => location.pathname === path

  const SidebarContent = () => (
    <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.path)
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              active
                ? 'bg-blue-50 text-blue-700 border-l-3 border-blue-600'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title={collapsed ? item.label : undefined}
          >
            <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Heart className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">Admin Panel</p>
              <p className="text-xs text-slate-500 truncate">Trust First Platform</p>
            </div>
          )}
        </div>

        <SidebarContent />

        <div className="border-t border-slate-200 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm font-bold text-slate-900">Admin Panel</p>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-900">{title}</h1>
                {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="text-xs text-blue-600 hover:text-blue-800 font-medium hidden sm:block"
              >
                Back to Main Dashboard
              </Link>
              <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg">
                <User className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-medium text-slate-700">{user?.email}</span>
                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                  Admin
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

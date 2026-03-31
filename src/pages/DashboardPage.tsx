import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, User, Shield, Activity, Heart, Stethoscope, TrendingUp, Users, Calendar, BarChart3, Upload, Database } from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Medical Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Heart className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Trust First Platform
                </h1>
                <p className="text-sm text-slate-600 font-medium">Clinical Intelligence System</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-2 bg-slate-50 px-4 py-2 rounded-lg">
                <User className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between">
              
              {/* Left Content */}
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  {user?.role === 'Admin' ? 'Administrator Dashboard' : 'Clinical Intelligence Dashboard'}
                </h2>

                <p className="text-blue-100 text-lg">
                  {user?.role === 'Admin' ? 'Manage and monitor the Trust First Platform' : 'What would you like to do today?'}
                </p>
              </div>

              {/* Right Card (unchanged) */}
              <div className="hidden lg:block">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <Stethoscope className="h-16 w-16 text-white mb-4" />
                  <p className="text-sm text-blue-100">
                    Secure Healthcare Platform
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 mb-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <Activity className="h-6 w-6 mr-2 text-blue-600" />
            Quick Actions
          </h3>
          
          {user?.role !== 'Admin' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/documents/upload"
                className="group relative bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 rounded-lg p-3">
                    <Upload className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Upload Documents</h4>
                    <p className="text-green-100 text-sm">Add clinical documents</p>
                  </div>
                </div>
              </Link>

              <Link
                to="/patient-contexts"
                className="group relative bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:scale-105"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 rounded-lg p-3">
                    <Database className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Patient Records</h4>
                    <p className="text-blue-100 text-sm">View patient data</p>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {user?.role === 'Admin' && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="text-lg font-semibold text-slate-900 mb-4">Administrator Actions</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/admin/dashboard"
                  className="flex items-center justify-center px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                >
                  <Activity className="h-5 w-5 mr-2" />
                  Admin Dashboard
                </Link>
                <Link
                  to="/admin/users"
                  className="flex items-center justify-center px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  <Users className="h-5 w-5 mr-2" />
                  User Management
                </Link>
                <Link
                  to="/admin/security-logs"
                  className="flex items-center justify-center px-6 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
                >
                  <Shield className="h-5 w-5 mr-2" />
                  Security Logs
                </Link>
                <Link
                  to="/admin/analytics"
                  className="flex items-center justify-center px-6 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium"
                >
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Business Analytics
                </Link>
                <Link
                  to="/admin/system-health"
                  className="flex items-center justify-center px-6 py-3 bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors font-medium"
                >
                  <Heart className="h-5 w-5 mr-2" />
                  System Health
                </Link>
                              </div>
            </div>
          )}
        </div>

        {user?.role === 'Admin' ? (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <Heart className="h-6 w-6 mr-2 text-red-500" />
              Platform Features
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-lg p-2 mt-1">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">User Management</h4>
                  <p className="text-sm text-slate-600 mt-1">Create, edit, and manage user accounts and permissions</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 rounded-lg p-2 mt-1">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Security Monitoring</h4>
                  <p className="text-sm text-slate-600 mt-1">Real-time security logs and threat detection</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-green-100 rounded-lg p-2 mt-1">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Business Analytics</h4>
                  <p className="text-sm text-slate-600 mt-1">Comprehensive reports and business insights</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-teal-100 rounded-lg p-2 mt-1">
                  <Activity className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">System Health</h4>
                  <p className="text-sm text-slate-600 mt-1">Monitor platform performance and availability</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-amber-100 rounded-lg p-2 mt-1">
                  <Calendar className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Audit & Compliance</h4>
                  <p className="text-sm text-slate-600 mt-1">Complete audit trails and regulatory compliance</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-red-100 rounded-lg p-2 mt-1">
                  <TrendingUp className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">System Configuration</h4>
                  <p className="text-sm text-slate-600 mt-1">Manage platform settings and configurations</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <Heart className="h-6 w-6 mr-2 text-red-500" />
              What You Can Do
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 rounded-lg p-2 mt-1">
                  <Upload className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Upload Documents</h4>
                  <p className="text-sm text-slate-600 mt-1">Add clinical documents and patient records</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-lg p-2 mt-1">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">View Patient Data</h4>
                  <p className="text-sm text-slate-600 mt-1">Access and manage patient information</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-purple-100 rounded-lg p-2 mt-1">
                  <Stethoscope className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Get AI Insights</h4>
                  <p className="text-sm text-slate-600 mt-1">Receive AI-powered clinical analysis</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-teal-100 rounded-lg p-2 mt-1">
                  <Calendar className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Track Activity</h4>
                  <p className="text-sm text-slate-600 mt-1">Monitor your recent actions and history</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-amber-100 rounded-lg p-2 mt-1">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Secure Access</h4>
                  <p className="text-sm text-slate-600 mt-1">Login safely with protected credentials</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-red-100 rounded-lg p-2 mt-1">
                  <Heart className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Medical Coding</h4>
                  <p className="text-sm text-slate-600 mt-1">Use ICD-10 and CPT coding tools</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

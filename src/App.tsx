import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { RegistrationPage } from './pages/RegistrationPage'
import { UserManagementPage } from './pages/UserManagementPage'
import { DocumentUploadPage } from './pages/DocumentUploadPage'
import { DocumentListPage } from './pages/DocumentListPage'
import { PatientContextsPage } from './pages/PatientContextsPage'
import { PatientViewPage } from './pages/PatientViewPage'
import { OutputPage } from './pages/OutputPage'
import { ClinicalCodesDemo } from './components/ClinicalCodesDemo'
import { SessionTimeoutProvider } from './contexts/SessionTimeoutContext'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { SecurityLogsPage } from './pages/SecurityLogsPage'
import { BusinessAnalyticsPage } from './pages/BusinessAnalyticsPage'
import { SystemHealthPage } from './pages/SystemHealthPage'

function App() {
  return (
    <AuthProvider>
      <SessionTimeoutProvider>
        <div className="min-h-screen bg-background font-sans antialiased">
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />
                        <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/security-logs"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <SecurityLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <BusinessAnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/system-health"
              element={
                <ProtectedRoute requiredRole="Admin">
                  <SystemHealthPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents/upload"
              element={
                <ProtectedRoute>
                  <DocumentUploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <DocumentListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient-contexts"
              element={
                <ProtectedRoute>
                  <PatientContextsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/output"
              element={
                <ProtectedRoute>
                  <OutputPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/:id"
              element={
                <ProtectedRoute>
                  <PatientViewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clinical-codes-demo"
              element={
                <ProtectedRoute>
                  <ClinicalCodesDemo />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </SessionTimeoutProvider>
    </AuthProvider>
  )
}

export default App

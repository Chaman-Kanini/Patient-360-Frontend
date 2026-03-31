import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { userManagementService } from '../services/userManagementService'
import { User, UserFilterRequest, PagedResult } from '../types/user'
import { CreateUserModal } from '../components/CreateUserModal'
import { EditUserModal } from '../components/EditUserModal'
import { DeactivateUserDialog } from '../components/DeactivateUserDialog'
import { ReactivateUserDialog } from '../components/ReactivateUserDialog'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  UserCheck, 
  UserX, 
  RefreshCw,
  Shield,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'

export const UserManagementPage: React.FC = () => {
  const { user, logout } = useAuth()
  const [users, setUsers] = useState<PagedResult<User> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<UserFilterRequest>({
    page: 1,
    pageSize: 10,
  })
  const [searchTerm, setSearchTerm] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editUserId, setEditUserId] = useState<string | null>(null)
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null)
  const [reactivateUser, setReactivateUser] = useState<User | null>(null)

  // Load users on component mount and when filter changes
  useEffect(() => {
    loadUsers()
  }, [filter])

  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await userManagementService.getUsers(filter)
      setUsers(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setFilter(prev => ({
      ...prev,
      searchTerm: searchTerm.trim(),
      page: 1,
    }))
  }

  const handleRoleFilter = (role: 'Admin' | 'StandardUser' | undefined) => {
    setFilter(prev => ({
      ...prev,
      role,
      page: 1,
    }))
  }

  const handleStatusFilter = (status: 'Active' | 'Pending' | 'Inactive' | undefined) => {
    setFilter(prev => ({
      ...prev,
      status,
      page: 1,
    }))
  }

  const handlePageChange = (newPage: number) => {
    setFilter(prev => ({
      ...prev,
      page: newPage,
    }))
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      Active: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Inactive: 'bg-red-100 text-red-800',
      Rejected: 'bg-gray-100 text-gray-800',
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
        {status}
      </span>
    )
  }

  const getRoleBadge = (role: string) => {
    const roleStyles = {
      Admin: 'bg-purple-100 text-purple-800',
      StandardUser: 'bg-blue-100 text-blue-800',
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleStyles[role as keyof typeof roleStyles]}`}>
        {role === 'Admin' ? <Shield className="w-3 h-3 mr-1" /> : <UserIcon className="w-3 h-3 mr-1" />}
        {role}
      </span>
    )
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  const handleCreateSuccess = () => {
    loadUsers()
    setShowCreateModal(false)
  }

  const handleEditSuccess = () => {
    loadUsers()
    setEditUserId(null)
  }

  const handleDeactivateSuccess = () => {
    loadUsers()
    setDeactivateUser(null)
  }

  const handleReactivateSuccess = () => {
    loadUsers()
    setReactivateUser(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-sm text-gray-500">Manage users, roles, and permissions</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Dashboard
              </button>
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">{user?.email}</span>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setError(null)}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg mb-6 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search users by name, email..."
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">Role:</span>
                <select
                  value={filter.role || ''}
                  onChange={(e) => handleRoleFilter(e.target.value as 'Admin' | 'StandardUser' | undefined)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="StandardUser">Standard User</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Status:</span>
                <select
                  value={filter.status || ''}
                  onChange={(e) => handleStatusFilter(e.target.value as 'Active' | 'Pending' | 'Inactive' | undefined)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <button
                onClick={handleSearch}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </button>
              <button
                onClick={loadUsers}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading users...</span>
            </div>
          ) : users && users.items.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.items.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              {user.phoneNumber && (
                                <div className="text-sm text-gray-400">{user.phoneNumber}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(user.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.lastLoginAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setEditUserId(user.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit User"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {user.status === 'Active' ? (
                              <button
                                onClick={() => setDeactivateUser(user)}
                                className="text-red-600 hover:text-red-900"
                                title="Deactivate User"
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                            ) : user.status === 'Inactive' ? (
                              <button
                                onClick={() => setReactivateUser(user)}
                                className="text-green-600 hover:text-green-900"
                                title="Reactivate User"
                              >
                                <UserCheck className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(Math.max(1, filter.page! - 1))}
                    disabled={filter.page! <= 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(Math.min(users.totalPages, filter.page! + 1))}
                    disabled={filter.page! >= users.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {(filter.page! - 1) * filter.pageSize! + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(filter.page! * filter.pageSize!, users.totalCount)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{users.totalCount}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(Math.max(1, filter.page! - 1))}
                        disabled={filter.page! <= 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        Page {filter.page} of {users.totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(Math.min(users.totalPages, filter.page! + 1))}
                        disabled={filter.page! >= users.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filter.role || filter.status
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating a new user'}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {editUserId && (
        <EditUserModal
          isOpen={true}
          onClose={() => setEditUserId(null)}
          onSuccess={handleEditSuccess}
          userId={editUserId}
        />
      )}

      {deactivateUser && (
        <DeactivateUserDialog
          isOpen={true}
          onClose={() => setDeactivateUser(null)}
          onSuccess={handleDeactivateSuccess}
          user={deactivateUser}
        />
      )}

      {reactivateUser && (
        <ReactivateUserDialog
          isOpen={true}
          onClose={() => setReactivateUser(null)}
          onSuccess={handleReactivateSuccess}
          user={reactivateUser}
        />
      )}
    </div>
  )
}

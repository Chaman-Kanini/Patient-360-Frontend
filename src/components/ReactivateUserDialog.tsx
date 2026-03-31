import React, { useState } from 'react'
import { userManagementService } from '../services/userManagementService'
import { User } from '../types/user'
import { X, AlertTriangle, AlertCircle, UserCheck } from 'lucide-react'

interface ReactivateUserDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: User) => void
  user: User
}

export const ReactivateUserDialog: React.FC<ReactivateUserDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    setError(null)

    try {
      await userManagementService.reactivateUser(user.id)
      
      // Create updated user object with active status
      const updatedUser: User = {
        ...user,
        status: 'Active',
        deactivatedAt: undefined,
      }
      
      onSuccess(updatedUser)
      handleClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reactivate user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Reactivate User
                    </h3>
                    <p className="text-sm text-gray-500">
                      {user.firstName} {user.lastName} ({user.email})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Info Alert */}
              <div className="mb-6 rounded-md bg-blue-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Reactivation Information
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>• The user will regain access to the platform</p>
                      <p>• Their previous credentials will remain valid</p>
                      <p>• The user will receive a notification email</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-6 rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        {error}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* User Details */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">User Details</h4>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="text-sm text-gray-900">{user.firstName} {user.lastName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Role</dt>
                    <dd className="text-sm text-gray-900">{user.role}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Department</dt>
                    <dd className="text-sm text-gray-900">{user.department || 'Not specified'}</dd>
                  </div>
                  {user.deactivatedAt && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Deactivated On</dt>
                      <dd className="text-sm text-gray-900">
                        {new Date(user.deactivatedAt).toLocaleDateString()} at {new Date(user.deactivatedAt).toLocaleTimeString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Confirmation Message */}
              <div className="mb-6">
                <p className="text-sm text-gray-700">
                  Are you sure you want to reactivate this user account? The user will be able to login immediately after reactivation.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Reactivating...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Reactivate User
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

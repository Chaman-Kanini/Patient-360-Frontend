import React, { useState } from 'react'
import { userManagementService } from '../services/userManagementService'
import { User } from '../types/user'
import { X, AlertTriangle, AlertCircle, UserX } from 'lucide-react'

interface DeactivateUserDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: User) => void
  user: User
}

export const DeactivateUserDialog: React.FC<DeactivateUserDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
}) => {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateReason = (): boolean => {
    if (!reason.trim()) {
      setError('Deactivation reason is required')
      return false
    }
    if (reason.trim().length < 10) {
      setError('Please provide a more detailed reason (at least 10 characters)')
      return false
    }
    if (reason.length > 500) {
      setError('Reason cannot exceed 500 characters')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateReason()) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await userManagementService.deactivateUser(user.id, reason.trim())
      
      // Create updated user object with deactivated status
      const updatedUser: User = {
        ...user,
        status: 'Inactive',
        deactivatedAt: new Date().toISOString(),
      }
      
      onSuccess(updatedUser)
      handleClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to deactivate user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setReason('')
    setError(null)
    onClose()
  }

  const handleReasonChange = (value: string) => {
    setReason(value)
    if (error) {
      setError(null)
    }
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
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <UserX className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Deactivate User
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

              {/* Warning Alert */}
              <div className="mb-6 rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Important Warning
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>• The user will immediately lose access to the platform</p>
                      <p>• All active sessions will be terminated</p>
                      <p>• This action can be reversed by reactivating the user</p>
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

              {/* Reason Input */}
              <div className="mb-6">
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                  Deactivation Reason <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <textarea
                    id="reason"
                    rows={4}
                    value={reason}
                    onChange={(e) => handleReasonChange(e.target.value)}
                    className={`block w-full px-3 py-2 border ${error ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="Please provide a detailed reason for deactivating this user account..."
                  />
                </div>
                <div className="mt-2 flex justify-between">
                  <p className="text-sm text-gray-500">
                    {error ? (
                      <span className="text-red-600">{error}</span>
                    ) : (
                      'Minimum 10 characters, maximum 500 characters'
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    {reason.length}/500
                  </p>
                </div>
              </div>

              {/* Common Reasons */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Common reasons:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Policy violation',
                    'Security concern',
                    'End of employment',
                    'Account compromised',
                    'Inactivity',
                    'Other'
                  ].map((commonReason) => (
                    <button
                      key={commonReason}
                      type="button"
                      onClick={() => handleReasonChange(
                        commonReason === 'Other' 
                          ? reason 
                          : commonReason
                      )}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {commonReason}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deactivating...
                  </>
                ) : (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    Deactivate User
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

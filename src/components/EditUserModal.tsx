import React, { useState, useEffect } from 'react'
import { userManagementService } from '../services/userManagementService'
import { User, UpdateUserRequest } from '../types/user'
import { X, User as UserIcon, Phone, Building, Shield, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: User) => void
  userId: string
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userId,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<UpdateUserRequest>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    department: '',
  })
  const [errors, setErrors] = useState<Partial<UpdateUserRequest>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showRoleConfirmation, setShowRoleConfirmation] = useState(false)
  const [pendingRole, setPendingRole] = useState<string>('')

  // Load user data when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      loadUser()
    }
  }, [isOpen, userId])

  const loadUser = async () => {
    setLoading(true)
    setError(null)
    try {
      const userData = await userManagementService.getUserById(userId)
      setUser(userData)
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phoneNumber: userData.phoneNumber || '',
        department: userData.department || '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<UpdateUserRequest> = {}

    // First name validation
    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required'
    } else if (formData.firstName.length > 100) {
      newErrors.firstName = 'First name cannot exceed 100 characters'
    }

    // Last name validation
    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required'
    } else if (formData.lastName.length > 100) {
      newErrors.lastName = 'Last name cannot exceed 100 characters'
    }

    // Phone number validation (optional)
    if (formData.phoneNumber && formData.phoneNumber.length > 20) {
      newErrors.phoneNumber = 'Phone number cannot exceed 20 characters'
    } else if (formData.phoneNumber && !/^[\d\s\-\+\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number can only contain digits, spaces, and special characters (+-())'
    }

    // Department validation (optional)
    if (formData.department && formData.department.length > 100) {
      newErrors.department = 'Department cannot exceed 100 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRoleChange = (newRole: string) => {
    if (user && user.role !== newRole) {
      setPendingRole(newRole)
      setShowRoleConfirmation(true)
    }
  }

  const confirmRoleChange = async () => {
    if (!user || !pendingRole) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await userManagementService.updateUserRole(user.id, pendingRole as 'Admin' | 'StandardUser')
      
      // Reload user data to get updated role
      const updatedUser = await userManagementService.getUserById(user.id)
      setUser(updatedUser)
      setShowRoleConfirmation(false)
      setPendingRole('')
      
      // Show success message
      setSubmitError(null)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update role')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const updatedUser = await userManagementService.updateUser(userId, formData)
      onSuccess(updatedUser)
      handleClose()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phoneNumber: '',
      department: '',
    })
    setErrors({})
    setSubmitError(null)
    setUser(null)
    setShowRoleConfirmation(false)
    setPendingRole('')
    onClose()
  }

  const handleInputChange = (field: keyof UpdateUserRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Loading user...</span>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-red-600">{error}</span>
              </div>
              <div className="mt-4 text-right">
                <button
                  onClick={handleClose}
                  className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <UserIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Edit User
                      </h3>
                      <p className="text-sm text-gray-500">
                        {user?.email}
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

                {/* Error Alert */}
                {submitError && (
                  <div className="mb-6 rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                          {submitError}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Role Display */}
                {user && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Role
                    </label>
                    <div className="flex items-center justify-between">
                      <div>{getRoleBadge(user.role)}</div>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="StandardUser">Standard User</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Form Fields */}
                  <div className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <UserIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className={`block w-full pl-10 pr-3 py-2 border ${errors.firstName ? 'border-red-300' : 'border-gray-300'} rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                            placeholder="John"
                          />
                        </div>
                        {errors.firstName && (
                          <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className={`block w-full px-3 py-2 border ${errors.lastName ? 'border-red-300' : 'border-gray-300'} rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                            placeholder="Doe"
                          />
                        </div>
                        {errors.lastName && (
                          <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>
                        )}
                      </div>
                    </div>

                    {/* Optional Fields */}
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="tel"
                            id="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                            className={`block w-full pl-10 pr-3 py-2 border ${errors.phoneNumber ? 'border-red-300' : 'border-gray-300'} rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        {errors.phoneNumber && (
                          <p className="mt-2 text-sm text-red-600">{errors.phoneNumber}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                          Department
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            id="department"
                            value={formData.department}
                            onChange={(e) => handleInputChange('department', e.target.value)}
                            className={`block w-full pl-10 pr-3 py-2 border ${errors.department ? 'border-red-300' : 'border-gray-300'} rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                            placeholder="Engineering, Marketing, etc."
                          />
                        </div>
                        {errors.department && (
                          <p className="mt-2 text-sm text-red-600">{errors.department}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Update User
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
            </>
          )}
        </div>

        {/* Role Change Confirmation Modal */}
        {showRoleConfirmation && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setShowRoleConfirmation(false)}
              />
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Confirm Role Change
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to change {user?.firstName} {user?.lastName}'s role from 
                          <span className="font-medium"> {user?.role}</span> to 
                          <span className="font-medium"> {pendingRole}</span>?
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          This change will take effect immediately and may affect the user's access to system features.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={confirmRoleChange}
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      'Confirm Role Change'
                    )}
                  </button>
                  <button
                    onClick={() => setShowRoleConfirmation(false)}
                    disabled={isSubmitting}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

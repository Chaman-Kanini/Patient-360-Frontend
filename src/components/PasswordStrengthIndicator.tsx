import React from 'react'
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'

interface PasswordRequirement {
  regex: RegExp
  text: string
  met: boolean
}

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  className = '' 
}) => {
  const requirements: PasswordRequirement[] = [
    {
      regex: /.{8,}/,
      text: 'At least 8 characters',
      met: password.length >= 8
    },
    {
      regex: /[A-Z]/,
      text: 'At least one uppercase letter',
      met: /[A-Z]/.test(password)
    },
    {
      regex: /[a-z]/,
      text: 'At least one lowercase letter',
      met: /[a-z]/.test(password)
    },
    {
      regex: /\d/,
      text: 'At least one number',
      met: /\d/.test(password)
    },
    {
      regex: /[@$!%*?&]/,
      text: 'At least one special character (@$!%*?&)',
      met: /[@$!%*?&]/.test(password)
    }
  ]

  const metRequirements = requirements.filter(req => req.met).length
  const totalRequirements = requirements.length
  const strengthPercentage = (metRequirements / totalRequirements) * 100

  const getStrengthColor = () => {
    if (strengthPercentage === 0) return 'bg-gray-200'
    if (strengthPercentage <= 20) return 'bg-red-500'
    if (strengthPercentage <= 40) return 'bg-orange-500'
    if (strengthPercentage <= 60) return 'bg-yellow-500'
    if (strengthPercentage <= 80) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getStrengthText = () => {
    if (password.length === 0) return ''
    if (strengthPercentage <= 20) return 'Very Weak'
    if (strengthPercentage <= 40) return 'Weak'
    if (strengthPercentage <= 60) return 'Fair'
    if (strengthPercentage <= 80) return 'Good'
    return 'Strong'
  }

  const getStrengthTextColor = () => {
    if (strengthPercentage === 0) return 'text-gray-500'
    if (strengthPercentage <= 20) return 'text-red-600'
    if (strengthPercentage <= 40) return 'text-orange-600'
    if (strengthPercentage <= 60) return 'text-yellow-600'
    if (strengthPercentage <= 80) return 'text-blue-600'
    return 'text-green-600'
  }

  if (password.length === 0) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Password Strength</span>
          <span className={`text-sm font-medium ${getStrengthTextColor()}`}>
            {getStrengthText()}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ease-out ${getStrengthColor()}`}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
      </div>

      {/* Requirements List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900">Requirements:</h4>
        <ul className="space-y-1">
          {requirements.map((requirement, index) => (
            <li key={index} className="flex items-center text-sm">
              {requirement.met ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
              )}
              <span className={requirement.met ? 'text-green-700' : 'text-gray-600'}>
                {requirement.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Security Tip */}
      {metRequirements < totalRequirements && (
        <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-800">
            <p className="font-medium">Security Tip:</p>
            <p>Use a unique password that you haven't used before. Avoid common words or personal information.</p>
          </div>
        </div>
      )}
    </div>
  )
}

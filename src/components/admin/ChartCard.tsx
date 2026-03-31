import React from 'react'
import { RefreshCw } from 'lucide-react'

interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  loading?: boolean
  className?: string
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  loading = false,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : (
        children
      )}
    </div>
  )
}

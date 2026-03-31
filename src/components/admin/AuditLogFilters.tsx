import React, { useState, useEffect } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { adminDashboardService } from '../../services/adminDashboardService'
import { AuditLogFilter } from '../../types/admin'

interface AuditLogFiltersProps {
  filter: AuditLogFilter
  onFilterChange: (filter: AuditLogFilter) => void
}

export const AuditLogFilters: React.FC<AuditLogFiltersProps> = ({
  filter,
  onFilterChange,
}) => {
  const [actions, setActions] = useState<string[]>([])
  const [localSearch, setLocalSearch] = useState(filter.searchTerm || '')
  const [localIp, setLocalIp] = useState(filter.ipAddress || '')

  useEffect(() => {
    adminDashboardService.getDistinctActions().then(setActions).catch(console.error)
  }, [])

  const handleSearch = () => {
    onFilterChange({
      ...filter,
      searchTerm: localSearch.trim() || undefined,
      ipAddress: localIp.trim() || undefined,
      page: 1,
    })
  }

  const handleClear = () => {
    setLocalSearch('')
    setLocalIp('')
    onFilterChange({ page: 1, pageSize: filter.pageSize })
  }

  const hasActiveFilters = filter.searchTerm || filter.action || filter.startDate || filter.endDate || filter.ipAddress

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Filter className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">Filters</span>
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="ml-auto text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search user, action..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <select
          value={filter.action || ''}
          onChange={(e) =>
            onFilterChange({ ...filter, action: e.target.value || undefined, page: 1 })
          }
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <input
          type="date"
          value={filter.startDate?.slice(0, 10) || ''}
          onChange={(e) =>
            onFilterChange({
              ...filter,
              startDate: e.target.value ? `${e.target.value}T00:00:00Z` : undefined,
              page: 1,
            })
          }
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Start Date"
        />

        <input
          type="date"
          value={filter.endDate?.slice(0, 10) || ''}
          onChange={(e) =>
            onFilterChange({
              ...filter,
              endDate: e.target.value ? `${e.target.value}T23:59:59Z` : undefined,
              page: 1,
            })
          }
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="End Date"
        />

        <div className="flex gap-2">
          <input
            type="text"
            value={localIp}
            onChange={(e) => setLocalIp(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="IP Address"
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

import React from 'react'

interface TimeRangeSelectorProps {
  value: number
  onChange: (days: number) => void
  options?: number[]
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  options = [7, 14, 30, 90],
}) => {
  const labels: Record<number, string> = {
    7: '7d',
    14: '14d',
    30: '30d',
    90: '90d',
  }

  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {options.map((days) => (
        <button
          key={days}
          onClick={() => onChange(days)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            value === days
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {labels[days] || `${days}d`}
        </button>
      ))}
    </div>
  )
}

import React, { useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'

interface ExportButtonProps {
  onExport: () => Promise<Record<string, unknown>[]>
  filename?: string
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  filename = 'audit-logs-export',
}) => {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const data = await onExport()
      if (!data || data.length === 0) return

      const headers = Object.keys(data[0])
      const csvRows = [
        headers.join(','),
        ...data.map((row) =>
          headers
            .map((h) => {
              const val = row[h]
              const str = val === null || val === undefined ? '' : String(val)
              return `"${str.replace(/"/g, '""')}"`
            })
            .join(',')
        ),
      ]

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
    >
      {loading ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      Export CSV
    </button>
  )
}

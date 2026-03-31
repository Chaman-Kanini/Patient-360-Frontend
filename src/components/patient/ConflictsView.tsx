import React from 'react';
import { AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';

interface ConflictsViewProps {
  patientData: any;
  batchId?: string;
  onConflictResolved?: (updatedData: any) => void;
}

export const ConflictsView: React.FC<ConflictsViewProps> = ({ patientData }) => {
  if (!patientData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No patient data available</p>
      </div>
    );
  }

  // Extract conflicts from patient data
  const conflicts = patientData.conflicts || [];
  const hasConflicts = conflicts.length > 0;

  // Determine severity based on entity_type or conflict description
  const getSeverity = (conflict: any): string => {
    const entityType = conflict.entity_type?.toLowerCase() || '';
    const description = conflict.conflict_description?.toLowerCase() || '';
    
    // Critical conflicts
    if (entityType === 'patient' || description.includes('error') || description.includes('critical')) {
      return 'critical';
    }
    // Warning conflicts
    if (description.includes('differ') || description.includes('conflict') || description.includes('discrepancy')) {
      return 'warning';
    }
    // Info conflicts
    return 'info';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (!hasConflicts) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-green-100 rounded-full">
            <svg
              className="h-12 w-12 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Conflicts Detected</h3>
        <p className="text-gray-600">All patient data is consistent across documents.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conflict Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-sm text-red-600 font-medium">Critical</div>
            <div className="text-2xl font-bold text-red-700">
              {conflicts.filter((c: any) => getSeverity(c) === 'critical').length}
            </div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-sm text-orange-600 font-medium">Warnings</div>
            <div className="text-2xl font-bold text-orange-700">
              {conflicts.filter((c: any) => getSeverity(c) === 'warning').length}
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 font-medium">Info</div>
            <div className="text-2xl font-bold text-blue-700">
              {conflicts.filter((c: any) => getSeverity(c) === 'info').length}
            </div>
          </div>
        </div>
      </div>

      {/* Conflicts List */}
      <div className="space-y-4">
        {conflicts.map((conflict: any, index: number) => {
          const severity = getSeverity(conflict);
          return (
            <div
              key={index}
              className={`bg-white rounded-lg shadow-sm border p-6 ${getSeverityColor(severity)}`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  {getSeverityIcon(severity)}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {conflict.entity_name || conflict.field || 'Data Conflict'}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                        {conflict.entity_type || 'Unknown'}
                      </span>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-white border capitalize">
                        {severity}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{conflict.conflict_description || conflict.description || conflict.message}</p>
                  
                  {conflict.variants && conflict.variants.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">Conflicting Values:</p>
                      <div className="space-y-2">
                        {conflict.variants.map((variant: any, vIndex: number) => (
                          <div 
                            key={vIndex} 
                            className="p-3 rounded border bg-white border-gray-200"
                          >
                            <div className="flex-1">
                              <div className="text-sm text-gray-900 mb-1">
                                <strong>Value:</strong> {variant.value || variant.status || JSON.stringify(variant)}
                              </div>
                              {variant._source && (
                                <div className="text-xs text-gray-500">
                                  <strong>Source:</strong> {variant._source}
                                </div>
                              )}
                              {variant.date_recorded && (
                                <div className="text-xs text-gray-500">
                                  <strong>Date:</strong> {variant.date_recorded}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

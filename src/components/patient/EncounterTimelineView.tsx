import React, { useState } from 'react';
import { Calendar, MapPin, ChevronDown, ChevronUp, Clock } from 'lucide-react';

interface EncounterTimelineViewProps {
  patientData: any;
}

interface Encounter {
  date: string;
  encounter_type: string;
  facility: string | null;
  flow: string[];
  _source?: string[];
}

export const EncounterTimelineView: React.FC<EncounterTimelineViewProps> = ({ patientData }) => {
  const [expandedEncounters, setExpandedEncounters] = useState<Set<number>>(new Set());

  if (!patientData?.encounter_timeline) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No encounter timeline data available</p>
      </div>
    );
  }

  const encounters: Encounter[] = patientData.encounter_timeline;

  // Sort encounters by date (newest first)
  const sortedEncounters = [...encounters].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  const toggleEncounter = (index: number) => {
    const newExpanded = new Set(expandedEncounters);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedEncounters(newExpanded);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const getEncounterTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      'Office Visit': 'bg-blue-100 text-blue-800',
      'Telemedicine': 'bg-purple-100 text-purple-800',
      'Hospital Encounter': 'bg-red-100 text-red-800',
      'Emergency': 'bg-red-100 text-red-800',
      'Refill': 'bg-green-100 text-green-800',
      'Telephone Encounter': 'bg-cyan-100 text-cyan-800',
      'Ancillary Procedure': 'bg-orange-100 text-orange-800',
    };
    return typeColors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-2">
          <Clock className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Encounter Timeline</h2>
        </div>
        <p className="text-sm text-gray-600">
          Chronological view of patient encounters and visit events
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {sortedEncounters.map((encounter, index) => {
          const isExpanded = expandedEncounters.has(index);
          const hasMultipleFlowItems = encounter.flow && encounter.flow.length > 1;

          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center text-gray-900 font-semibold">
                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                        {formatDate(encounter.date)}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEncounterTypeColor(encounter.encounter_type)}`}>
                        {encounter.encounter_type}
                      </span>
                    </div>
                    {encounter.facility && (
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
                        <span>{encounter.facility}</span>
                      </div>
                    )}
                  </div>
                  {hasMultipleFlowItems && (
                    <button
                      onClick={() => toggleEncounter(index)}
                      className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Event Flow */}
              <div className="px-6 py-4">
                {encounter.flow && encounter.flow.length > 0 ? (
                  <div className="space-y-3">
                    {encounter.flow.map((flowItem, flowIndex) => {
                      // Show only first item if collapsed and there are multiple items
                      if (!isExpanded && hasMultipleFlowItems && flowIndex > 0) {
                        return null;
                      }

                      // Check if this is a continuation item (starts with →)
                      const isContinuation = flowItem.trim().startsWith('→');
                      const displayText = isContinuation 
                        ? flowItem.trim().substring(1).trim() 
                        : flowItem.trim();

                      return (
                        <div key={flowIndex} className="flex items-start">
                          {flowIndex === 0 ? (
                            <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-600 mr-3" />
                          ) : (
                            <div className="flex-shrink-0 mr-3 mt-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </div>
                          )}
                          <p className={`flex-1 text-sm ${flowIndex === 0 ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                            {displayText}
                          </p>
                        </div>
                      );
                    })}
                    {!isExpanded && hasMultipleFlowItems && (
                      <button
                        onClick={() => toggleEncounter(index)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center mt-2"
                      >
                        <span>Show {encounter.flow.length - 1} more event{encounter.flow.length - 1 > 1 ? 's' : ''}</span>
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No event details recorded</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {sortedEncounters.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No encounters found in the timeline</p>
        </div>
      )}
    </div>
  );
};

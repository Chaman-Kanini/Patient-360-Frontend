import React from 'react';
import { Calendar, MapPin, Activity, Stethoscope, FlaskConical, TrendingUp } from 'lucide-react';

interface EncounterHistoryViewProps {
  patientData: any;
}

export const EncounterHistoryView: React.FC<EncounterHistoryViewProps> = ({ patientData }) => {
  console.log('EncounterHistoryView - patientData:', patientData);
  console.log('EncounterHistoryView - encounter_timeline_detailed:', patientData?.encounter_timeline_detailed);
  
  const encounterTimeline = patientData?.encounter_timeline_detailed || [];

  if (!encounterTimeline || encounterTimeline.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No encounter timeline data available</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Date not specified';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Encounter Timeline</h2>
        </div>
        <p className="text-gray-600">
          Chronological view of all patient encounters from oldest to most recent
        </p>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
            {encounterTimeline.length} Total Encounters
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Encounters */}
        <div className="space-y-6">
          {encounterTimeline.map((encounter: any, index: number) => (
            <div key={index} className="relative pl-20">
              {/* Timeline dot */}
              <div className="absolute left-6 top-6 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow"></div>

              {/* Encounter Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatDate(encounter.date)}
                        </h3>
                      </div>
                      {encounter.type && (
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                          {encounter.type}
                        </span>
                      )}
                    </div>
                    {encounter.facility && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span className="max-w-xs text-right">{encounter.facility}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Reason for Visit */}
                  {encounter.reason_for_visit && encounter.reason_for_visit.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-5 w-5 text-orange-600" />
                        <h4 className="font-semibold text-gray-900">Reason for Visit</h4>
                      </div>
                      <ul className="ml-7 space-y-1">
                        {encounter.reason_for_visit.map((reason: string, idx: number) => (
                          <li key={idx} className="text-gray-700 text-sm">• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Diagnoses */}
                  {encounter.diagnoses && encounter.diagnoses.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Stethoscope className="h-5 w-5 text-red-600" />
                        <h4 className="font-semibold text-gray-900">Diagnoses</h4>
                      </div>
                      <ul className="ml-7 space-y-1">
                        {encounter.diagnoses.map((diagnosis: string, idx: number) => (
                          <li key={idx} className="text-gray-700 text-sm">• {diagnosis}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Procedures */}
                  {encounter.procedures && encounter.procedures.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-5 w-5 text-purple-600" />
                        <h4 className="font-semibold text-gray-900">Procedures</h4>
                      </div>
                      <ul className="ml-7 space-y-1">
                        {encounter.procedures.map((procedure: string, idx: number) => (
                          <li key={idx} className="text-gray-700 text-sm">• {procedure}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Laboratory Results */}
                  {encounter.laboratory_results && encounter.laboratory_results.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FlaskConical className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-gray-900">Laboratory Results</h4>
                      </div>
                      <div className="ml-7 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {encounter.laboratory_results.map((lab: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-gray-900 text-sm">{lab.test}</span>
                              {lab.interpretation && (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                  lab.interpretation.includes('H') ? 'bg-red-100 text-red-800' :
                                  lab.interpretation.includes('L') ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {lab.interpretation}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-sm text-gray-700">
                              <span className="font-semibold">{lab.value}</span>
                              {lab.unit && <span className="text-gray-500"> {lab.unit}</span>}
                            </div>
                            {lab.reference_range && (
                              <div className="mt-1 text-xs text-gray-500">
                                Range: {lab.reference_range}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vitals */}
                  {encounter.vitals && encounter.vitals.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-teal-600" />
                        <h4 className="font-semibold text-gray-900">Vitals</h4>
                      </div>
                      <div className="ml-7 grid grid-cols-2 md:grid-cols-3 gap-3">
                        {encounter.vitals.map((vital: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div className="text-xs text-gray-600 mb-1">{vital.vital}</div>
                            <div className="font-semibold text-gray-900">
                              {vital.value} {vital.unit}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Plans and Follow-ups */}
                  {encounter.plans_and_followups && encounter.plans_and_followups.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-5 w-5 text-indigo-600" />
                        <h4 className="font-semibold text-gray-900">Plans & Follow-ups</h4>
                      </div>
                      <ul className="ml-7 space-y-1">
                        {encounter.plans_and_followups.map((plan: string, idx: number) => (
                          <li key={idx} className="text-gray-700 text-sm">• {plan}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

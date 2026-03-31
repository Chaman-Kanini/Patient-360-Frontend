import React from 'react';
import { Stethoscope, Calendar, Activity, FlaskConical, AlertCircle, TrendingUp } from 'lucide-react';

interface DiagnosisFlowViewProps {
  patientData: any;
}

export const DiagnosisFlowView: React.FC<DiagnosisFlowViewProps> = ({ patientData }) => {
  console.log('DiagnosisFlowView - patientData:', patientData);
  console.log('DiagnosisFlowView - diagnosis_flows:', patientData?.diagnosis_flows);
  
  const diagnosisFlows = patientData?.diagnosis_flows || [];

  if (!diagnosisFlows || diagnosisFlows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No diagnosis flow data available</p>
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
          <Stethoscope className="h-6 w-6 text-red-600" />
          <h2 className="text-2xl font-bold text-gray-900">Diagnosis Clinical Trace</h2>
        </div>
        <p className="text-gray-600">
          Documented diagnostic pathways showing the clinical evidence and reasoning for each diagnosis
        </p>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full font-medium">
            {diagnosisFlows.length} Diagnosis {diagnosisFlows.length === 1 ? 'Flow' : 'Flows'}
          </span>
        </div>
      </div>

      {/* Diagnosis Flows */}
      <div className="space-y-6">
        {diagnosisFlows.map((flow: any, index: number) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Diagnosis Header */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className="h-5 w-5 text-red-600" />
                    <h3 className="text-xl font-bold text-gray-900">{flow.diagnosis}</h3>
                  </div>
                  {flow.date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Diagnosed: {formatDate(flow.date)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Clinical Trace */}
            {flow.clinical_trace && (
              <div className="p-6 space-y-6">
                {/* Encounter Date */}
                {flow.clinical_trace.encounter_date && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-gray-900">Encounter Date:</span>
                      <span className="text-gray-700">{formatDate(flow.clinical_trace.encounter_date)}</span>
                    </div>
                  </div>
                )}

                {/* Presenting Symptoms */}
                {flow.clinical_trace.presenting_symptoms && flow.clinical_trace.presenting_symptoms.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="h-5 w-5 text-orange-600" />
                      <h4 className="font-semibold text-gray-900 text-lg">Presenting Symptoms</h4>
                    </div>
                    <div className="ml-7 space-y-2">
                      {flow.clinical_trace.presenting_symptoms.map((symptom: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="mt-1.5 w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                          <span className="text-gray-700">{symptom}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Objective Findings */}
                {flow.clinical_trace.objective_findings && flow.clinical_trace.objective_findings.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FlaskConical className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-gray-900 text-lg">Objective Findings</h4>
                    </div>
                    <div className="ml-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {flow.clinical_trace.objective_findings.map((finding: any, idx: number) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {finding.type === 'lab' && <FlaskConical className="h-4 w-4 text-green-600" />}
                              {finding.type === 'vital' && <TrendingUp className="h-4 w-4 text-teal-600" />}
                              {finding.type === 'imaging' && <Activity className="h-4 w-4 text-purple-600" />}
                              <span className="text-xs font-medium text-gray-500 uppercase">{finding.type}</span>
                            </div>
                            {finding.interpretation && (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                finding.interpretation.includes('H') || finding.interpretation.includes('High') ? 'bg-red-100 text-red-800' :
                                finding.interpretation.includes('L') || finding.interpretation.includes('Low') ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {finding.interpretation}
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-gray-900 mb-1">{finding.name}</div>
                          <div className="text-sm text-gray-700">
                            <span className="font-semibold">{finding.value}</span>
                            {finding.unit && <span className="text-gray-500"> {finding.unit}</span>}
                          </div>
                          {finding.reference_range && (
                            <div className="mt-1 text-xs text-gray-500">
                              Reference: {finding.reference_range}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Diagnostic Tests Ordered */}
                {flow.clinical_trace.diagnostic_tests_ordered && flow.clinical_trace.diagnostic_tests_ordered.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="h-5 w-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-900 text-lg">Diagnostic Tests Ordered</h4>
                    </div>
                    <div className="ml-7 space-y-2">
                      {flow.clinical_trace.diagnostic_tests_ordered.map((test: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="mt-1.5 w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                          <span className="text-gray-700">{test}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Final Diagnosis Statement */}
                {flow.clinical_trace.final_diagnosis_statement && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Final Diagnosis Statement</h4>
                        <p className="text-gray-700">{flow.clinical_trace.final_diagnosis_statement}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

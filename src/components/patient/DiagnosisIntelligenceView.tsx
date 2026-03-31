import React, { useState } from 'react';
import { AlertCircle, ChevronRight, Beaker, Calendar, TrendingUp, ArrowRight, CheckCircle2, Info } from 'lucide-react';

interface DiagnosisIntelligenceViewProps {
  patientData: any;
}

interface DiagnosisIntelligence {
  diagnosis: string;
  evidence_summary?: string[];
  related_labs?: string[];
  related_encounters?: string[];
  related_procedures?: string[];
  clinical_reasoning_flow?: string[];
  suggested_care_pathway?: string[];
  _source?: string[];
}

interface LabValue {
  name: string;
  value: string;
  flag?: 'H' | 'L' | 'ABNORMAL';
  unit?: string;
}

const parseLabValue = (labText: string): LabValue => {
  const match = labText.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*\(([HL])\)/i);
  if (match) {
    return {
      name: match[1].trim(),
      value: match[2],
      flag: match[3].toUpperCase() as 'H' | 'L',
    };
  }
  const normalMatch = labText.match(/^(.+?)\s+(\d+(?:\.\d+)?)/i);
  if (normalMatch) {
    return {
      name: normalMatch[1].trim(),
      value: normalMatch[2],
    };
  }
  return { name: labText, value: '' };
};

const getLabBadgeColor = (flag?: 'H' | 'L' | 'ABNORMAL'): string => {
  if (flag === 'H') return 'bg-red-100 text-red-700 border-red-300';
  if (flag === 'L') return 'bg-orange-100 text-orange-700 border-orange-300';
  if (flag === 'ABNORMAL') return 'bg-red-100 text-red-700 border-red-300';
  return 'bg-green-100 text-green-700 border-green-300';
};

const getEvidenceStrength = (evidenceCount: number): { label: string; color: string } => {
  if (evidenceCount >= 3) return { label: 'Strong Evidence', color: 'text-green-600' };
  if (evidenceCount >= 2) return { label: 'Moderate Evidence', color: 'text-yellow-600' };
  return { label: 'Limited Evidence', color: 'text-orange-600' };
};

// Mini Trend Chart Component
const MiniTrendChart: React.FC<{ labName: string; currentValue: string; flag?: 'H' | 'L' | 'ABNORMAL' }> = ({ labName: _labName, currentValue: _currentValue, flag }) => {
  // Simulated trend data - in production, this would come from historical lab results
  const getTrendDirection = () => {
    if (flag === 'H' || flag === 'ABNORMAL') return 'up';
    if (flag === 'L') return 'down';
    return 'stable';
  };

  const trendDirection = getTrendDirection();
  const trendColor = trendDirection === 'up' ? 'text-red-600' : trendDirection === 'down' ? 'text-orange-600' : 'text-green-600';

  return (
    <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">Trend</span>
        <div className={`flex items-center gap-1 font-semibold ${trendColor}`}>
          {trendDirection === 'up' && '↗ Increasing'}
          {trendDirection === 'down' && '↘ Decreasing'}
          {trendDirection === 'stable' && '→ Stable'}
        </div>
      </div>
      <div className="mt-1 flex items-end gap-1 h-8">
        {/* Simple bar chart visualization */}
        {trendDirection === 'up' && (
          <>
            <div className="w-2 bg-yellow-300 h-3 rounded-t"></div>
            <div className="w-2 bg-orange-400 h-5 rounded-t"></div>
            <div className="w-2 bg-red-500 h-8 rounded-t"></div>
          </>
        )}
        {trendDirection === 'down' && (
          <>
            <div className="w-2 bg-red-500 h-8 rounded-t"></div>
            <div className="w-2 bg-orange-400 h-5 rounded-t"></div>
            <div className="w-2 bg-yellow-300 h-3 rounded-t"></div>
          </>
        )}
        {trendDirection === 'stable' && (
          <>
            <div className="w-2 bg-green-400 h-5 rounded-t"></div>
            <div className="w-2 bg-green-400 h-5 rounded-t"></div>
            <div className="w-2 bg-green-400 h-5 rounded-t"></div>
          </>
        )}
      </div>
    </div>
  );
};

export const DiagnosisIntelligenceView: React.FC<DiagnosisIntelligenceViewProps> = ({ patientData }) => {
  const [expandedDiagnoses, setExpandedDiagnoses] = useState<Set<number>>(new Set());

  if (!patientData?.diagnosis_intelligence) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No diagnosis intelligence data available</p>
      </div>
    );
  }

  const diagnosisData: DiagnosisIntelligence[] = patientData.diagnosis_intelligence;

  const toggleDiagnosis = (index: number) => {
    const newExpanded = new Set(expandedDiagnoses);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedDiagnoses(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-white rounded-xl shadow-sm border border-purple-200 p-6">
        <div className="flex items-center mb-2">
          <div className="p-2 bg-purple-100 rounded-lg mr-3">
            <AlertCircle className="h-6 w-6 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Diagnosis Intelligence</h2>
        </div>
        <p className="text-sm text-gray-600">
          AI-powered clinical reasoning with evidence transparency
        </p>
      </div>

      {/* Diagnosis Cards */}
      <div className="grid grid-cols-1 gap-4">
        {diagnosisData.map((diagnosisItem, index) => {
          const isExpanded = expandedDiagnoses.has(index);
          const evidenceStrength = getEvidenceStrength(diagnosisItem.evidence_summary?.length || 0);
          const abnormalLabs = diagnosisItem.related_labs?.filter(lab => 
            lab.includes('(H)') || lab.includes('(L)') || lab.toLowerCase().includes('abnormal')
          ) || [];

          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md border-2 border-gray-200 overflow-hidden hover:shadow-xl hover:border-purple-300 transition-all"
            >
              {/* Card Header - Compact View */}
              <div className="p-5 bg-gradient-to-r from-purple-50 via-white to-purple-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {diagnosisItem.diagnosis}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${evidenceStrength.color} bg-opacity-10`}>
                        {evidenceStrength.label}
                      </span>
                    </div>
                    
                    {/* Quick Summary - Always Visible */}
                    {!isExpanded && (
                      <div className="space-y-2 mt-3">
                        {diagnosisItem.evidence_summary && diagnosisItem.evidence_summary[0] && (
                          <p className="text-sm text-gray-600 italic">
                            "{diagnosisItem.evidence_summary[0].substring(0, 100)}{diagnosisItem.evidence_summary[0].length > 100 ? '...' : ''}"
                          </p>
                        )}
                        
                        {/* Abnormal Labs Preview */}
                        {abnormalLabs.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {abnormalLabs.slice(0, 3).map((lab, idx) => {
                              const parsed = parseLabValue(lab);
                              return (
                                <span key={idx} className={`px-2 py-1 rounded-md text-xs font-medium border ${getLabBadgeColor(parsed.flag)}`}>
                                  {parsed.name} {parsed.value} {parsed.flag && `(${parsed.flag})`}
                                </span>
                              );
                            })}
                            {abnormalLabs.length > 3 && (
                              <span className="px-2 py-1 text-xs text-gray-500">+{abnormalLabs.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => toggleDiagnosis(index)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    {isExpanded ? 'Hide Details' : 'View Full Reasoning'}
                    <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-6 space-y-6 bg-gray-50">
                  {/* 1. Why This Diagnosis? */}
                  {diagnosisItem.evidence_summary && diagnosisItem.evidence_summary.length > 0 && (
                    <div className="bg-white rounded-lg border-2 border-blue-200 p-5">
                      <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-600" />
                        Why this diagnosis?
                      </h4>
                      <div className="space-y-2">
                        {diagnosisItem.evidence_summary.map((evidence, evidenceIndex) => (
                          <div key={evidenceIndex} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-gray-800">"{evidence}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Abnormal Evidence Panel */}
                  {abnormalLabs.length > 0 && (
                    <div className="bg-white rounded-lg border-2 border-red-200 p-5">
                      <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Beaker className="h-5 w-5 text-red-600" />
                        Abnormal Evidence
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {abnormalLabs.map((lab, labIndex) => {
                          const parsed = parseLabValue(lab);
                          return (
                            <div key={labIndex} className={`p-4 rounded-lg border-2 ${getLabBadgeColor(parsed.flag)} bg-opacity-50`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold">{parsed.name}</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${getLabBadgeColor(parsed.flag)}`}>
                                  {parsed.value} {parsed.flag && `(${parsed.flag})`}
                                </span>
                              </div>
                              <MiniTrendChart labName={parsed.name} currentValue={parsed.value} flag={parsed.flag} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Related Encounter */}
                  {diagnosisItem.related_encounters && diagnosisItem.related_encounters.length > 0 && (
                    <div className="bg-white rounded-lg border-2 border-green-200 p-5">
                      <h4 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-green-600" />
                        Related Encounter
                      </h4>
                      <div className="space-y-2">
                        {diagnosisItem.related_encounters.map((encounter, encIndex) => (
                          <div key={encIndex} className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm text-gray-800">{encounter}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Clinical Reasoning Flow - Horizontal Timeline */}
                  {diagnosisItem.clinical_reasoning_flow && diagnosisItem.clinical_reasoning_flow.length > 0 && (
                    <div className="bg-white rounded-lg border-2 border-indigo-200 p-5">
                      <h4 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                        Clinical Reasoning Flow
                      </h4>
                      <div className="flex items-center gap-4 overflow-x-auto pb-2">
                        {diagnosisItem.clinical_reasoning_flow.map((step, stepIndex) => {
                          const isContinuation = step.trim().startsWith('→');
                          const displayText = isContinuation ? step.trim().substring(1).trim() : step.trim();
                          const isLast = stepIndex === diagnosisItem.clinical_reasoning_flow!.length - 1;

                          return (
                            <React.Fragment key={stepIndex}>
                              <div className="flex flex-col items-center min-w-[200px]">
                                <div className={`w-full p-4 rounded-lg border-2 text-center ${
                                  isLast
                                    ? 'bg-green-50 border-green-500'
                                    : stepIndex === 0
                                    ? 'bg-blue-50 border-blue-500'
                                    : 'bg-indigo-50 border-indigo-300'
                                }`}>
                                  <p className="text-sm font-medium text-gray-900">{displayText}</p>
                                </div>
                                {isLast && (
                                  <div className="mt-2">
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                  </div>
                                )}
                              </div>
                              {!isLast && (
                                <div className="flex items-center">
                                  <ArrowRight className="h-6 w-6 text-indigo-400" />
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 5. Related Procedures */}
                  {diagnosisItem.related_procedures && diagnosisItem.related_procedures.length > 0 && (
                    <div className="bg-white rounded-lg border-2 border-purple-200 p-5">
                      <h4 className="text-base font-bold text-gray-900 mb-4">Related Procedures</h4>
                      <div className="space-y-2">
                        {diagnosisItem.related_procedures.map((proc, procIndex) => (
                          <div key={procIndex} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-sm text-gray-800">{proc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {diagnosisData.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No diagnosis intelligence data found</p>
        </div>
      )}
    </div>
  );
};

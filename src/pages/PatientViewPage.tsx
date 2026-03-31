import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientService } from '../services/patientService';
import { ConsolidatedPatientData, ConflictData, ICD10Code, CPTCode } from '../types/patient';
import { ArrowLeft, AlertTriangle, CheckCircle, FileText, User, ChevronDown, ChevronRight, Activity, Pill, TestTube, Stethoscope, Heart, AlertCircle, MessageCircle } from 'lucide-react';
import { PatientChatbot } from '../components/PatientChatbot';

export const PatientViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedPatientData | null>(null);
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);
  const [icd10Codes, setIcd10Codes] = useState<ICD10Code[]>([]);
  const [cptCodes, setCptCodes] = useState<CPTCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Demographics']));
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadPatientData(id);
    }
  }, [id]);

  const loadPatientData = async (patientId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Load consolidated data
      const data = await patientService.getConsolidatedData(patientId);
      console.log('Consolidated data response:', data);
      console.log('Consolidated data structure:', JSON.stringify(data.consolidatedData, null, 2));
      console.log('Medical codes in response:', data.medicalCodes);
      setConsolidatedData(data);
      
      // Extract medical codes from consolidated data response
      if (data.medicalCodes) {
        console.log('Setting ICD-10 codes:', data.medicalCodes.icd10Codes);
        console.log('Setting CPT codes:', data.medicalCodes.cptCodes);
        console.log('Summary:', data.medicalCodes.summary);
        setIcd10Codes(data.medicalCodes.icd10Codes || []);
        setCptCodes(data.medicalCodes.cptCodes || []);
      } else {
        console.warn('No medicalCodes in response');
      }
      
      // Load conflicts if any
      if (data.status === 'ConflictsPending') {
        const conflicts = await patientService.getConflicts(patientId);
        setConflictData(conflicts);
      }
    } catch (err) {
      console.error('Error loading patient data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const handleConsolidate = async () => {
    if (!id) return;
    
    try {
      setIsConsolidating(true);
      await patientService.consolidatePatientData(id);
      // Reload data after consolidation
      await loadPatientData(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to consolidate patient data');
    } finally {
      setIsConsolidating(false);
    }
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  const getSectionIcon = (sectionKey: string) => {
    const key = sectionKey.toLowerCase();
    if (key.includes('medication') || key.includes('drug')) return Pill;
    if (key.includes('lab') || key.includes('test')) return TestTube;
    if (key.includes('vital') || key.includes('sign')) return Activity;
    if (key.includes('procedure') || key.includes('surgery')) return Stethoscope;
    if (key.includes('condition') || key.includes('diagnosis') || key.includes('problem')) return Heart;
    if (key.includes('allerg')) return AlertCircle;
    if (key.includes('demographic') || key.includes('patient')) return User;
    return FileText;
  };

  const formatFieldName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) return <span className="text-gray-400 italic">Not specified</span>;
    if (typeof value === 'boolean') return <span className={value ? 'text-lime-600' : 'text-gray-500'}>{value ? 'Yes' : 'No'}</span>;
    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
        try {
          return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch {
          return value;
        }
      }
      return value;
    }
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  const renderArraySection = (title: string, data: any[], isExpanded: boolean) => {
    if (!data || data.length === 0) return null;
    
    const Icon = getSectionIcon(title);
    
    return (
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <button
          onClick={() => toggleSection(title)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-xl"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900">{formatFieldName(title)}</h3>
              <p className="text-sm text-gray-500">{data.length} {data.length === 1 ? 'entry' : 'entries'}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-lime-100 text-lime-700 rounded-full text-sm font-medium">
              {data.length}
            </span>
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </button>
        
        {isExpanded && (
          <div className="px-6 pb-6 space-y-3 border-t border-gray-100">
            {data.map((item, index) => (
              <div key={index} className="bg-gradient-to-r from-gray-50 to-white border-l-4 border-cyan-500 rounded-lg p-4 hover:shadow-sm transition-shadow">
                {typeof item === 'object' && item !== null ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(item)
                      .filter(([key]) => key !== '_source' && key !== 'sourceDocuments')
                      .map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                            {formatFieldName(key)}
                          </span>
                          <span className="text-sm text-gray-900">
                            {Array.isArray(value) ? (
                              <div className="space-y-1">
                                {value.map((v, i) => (
                                  <div key={i} className="pl-2 border-l-2 border-lime-300">
                                    {typeof v === 'object' && v !== null ? (
                                      Object.entries(v).map(([vk, vv]) => (
                                        <div key={vk}>
                                          <span className="font-medium text-xs text-gray-600">{formatFieldName(vk)}:</span> {renderValue(vv)}
                                        </div>
                                      ))
                                    ) : (
                                      renderValue(v)
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : typeof value === 'object' && value !== null ? (
                              <div className="space-y-1">
                                {Object.entries(value).map(([vk, vv]) => (
                                  <div key={vk} className="text-xs">
                                    <span className="font-medium text-gray-600">{formatFieldName(vk)}:</span> {renderValue(vv)}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              renderValue(value)
                            )}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-900">{renderValue(item)}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderObjectSection = (title: string, data: any, isExpanded: boolean) => {
    if (!data || typeof data !== 'object') return null;
    
    const Icon = getSectionIcon(title);
    const entries = Object.entries(data).filter(([key]) => key !== '_source' && key !== 'sourceDocuments');
    
    return (
      <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <button
          onClick={() => toggleSection(title)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-xl"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900">{formatFieldName(title)}</h3>
              <p className="text-sm text-gray-500">{entries.length} {entries.length === 1 ? 'field' : 'fields'}</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </button>
        
        {isExpanded && (
          <div className="px-6 pb-6 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {entries.map(([key, value]) => (
                <div key={key} className="bg-gradient-to-br from-gray-50 to-white border-l-4 border-cyan-500 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    {formatFieldName(key)}
                  </div>
                  <div className="text-sm text-gray-900 font-medium">
                    {Array.isArray(value) ? (
                      <div className="space-y-1">
                        {value.map((v, i) => (
                          <div key={i} className="pl-2 border-l-2 border-lime-300">
                            {typeof v === 'object' && v !== null ? (
                              Object.entries(v).map(([vk, vv]) => (
                                <div key={vk} className="text-xs">
                                  <span className="font-medium text-gray-600">{formatFieldName(vk)}:</span> {renderValue(vv)}
                                </div>
                              ))
                            ) : (
                              renderValue(v)
                            )}
                          </div>
                        ))}
                      </div>
                    ) : typeof value === 'object' && value !== null ? (
                      <div className="space-y-1">
                        {Object.entries(value).map(([vk, vv]) => (
                          <div key={vk} className="text-xs">
                            <span className="font-medium text-gray-600">{formatFieldName(vk)}:</span> {renderValue(vv)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      renderValue(value)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/patient-contexts')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Patient Contexts
          </button>
        </div>
      </div>
    );
  }

  if (!consolidatedData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No consolidated data available</p>
          <button
            onClick={() => id && handleConsolidate()}
            disabled={isConsolidating}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isConsolidating ? 'Consolidating...' : 'Consolidate Data'}
          </button>
        </div>
      </div>
    );
  }

  const data = consolidatedData.consolidatedData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-gradient-to-r from-cyan-500 to-lime-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/patient-contexts')}
                className="mr-4 p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-700 bg-clip-text text-transparent">Patient Consolidated View</h1>
                <p className="text-sm text-gray-600 font-medium">
                  {consolidatedData.patientName || 'Unknown Patient'}
                  {consolidatedData.patientIdentifier && (
                    <span className="ml-2 px-2 py-0.5 bg-lime-100 text-lime-700 rounded-full text-xs">
                      {consolidatedData.patientIdentifier}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Status</div>
              <div className="flex items-center mt-1">
                {consolidatedData.status === 'Consolidated' ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-lime-500 mr-1" />
                    <span className="text-sm font-semibold text-lime-600">{consolidatedData.status}</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm font-semibold text-yellow-600">{consolidatedData.status}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Info Bar */}
          {conflictData && conflictData.hasConflicts && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center bg-yellow-100 px-4 py-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-sm font-semibold text-yellow-800">
                  {conflictData.conflictCount} conflicts detected
                </span>
              </div>
            </div>
          )}

          {/* Clinical Data Sections - Dynamic Rendering */}
          <div className="space-y-4">
            {/* ICD-10 Codes Table */}
            {icd10Codes.length > 0 && (
              <div className="bg-white border-2 border-blue-200 rounded-xl shadow-md">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-xl border-b-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">ICD-10 Diagnosis Codes</h3>
                        <p className="text-sm text-blue-600">{icd10Codes.length} diagnoses coded</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Diagnosis</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">ICD-10 Code</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {icd10Codes.map((item, index) => (
                        <tr key={index} className="hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900">{item.diagnosis}</td>
                          <td className="px-6 py-4 text-sm font-mono font-semibold text-blue-600">{item.code}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CPT Codes Table */}
            {cptCodes.length > 0 && (
              <div className="bg-white border-2 border-green-200 rounded-xl shadow-md">
                <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-green-100 rounded-t-xl border-b-2 border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <Stethoscope className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">CPT Procedure Codes</h3>
                        <p className="text-sm text-green-600">{cptCodes.length} procedures coded</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Procedure</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">CPT Code</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {cptCodes.map((item, index) => (
                        <tr key={index} className="hover:bg-green-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900">{item.procedure}</td>
                          <td className="px-6 py-4 text-sm font-mono font-semibold text-green-600">{item.code}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {data && typeof data === 'object' && Object.entries(data).map(([sectionKey, sectionValue]) => {
              if (sectionKey === 'Conflicts') {
                return null;
              }
              
              const isExpanded = expandedSections.has(sectionKey);
              
              if (Array.isArray(sectionValue)) {
                return renderArraySection(sectionKey, sectionValue, isExpanded);
              } else if (typeof sectionValue === 'object' && sectionValue !== null) {
                return renderObjectSection(sectionKey, sectionValue, isExpanded);
              }
              return null;
            })}

            {/* Conflicts Section */}
            {data['Conflicts'] && Array.isArray(data['Conflicts']) && data['Conflicts'].length > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl shadow-lg">
                <button
                  onClick={() => toggleSection('Conflicts')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-yellow-100 transition-colors rounded-t-xl"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-500 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">Data Conflicts</h3>
                      <p className="text-sm text-yellow-700">Requires attention</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-bold">
                      {data['Conflicts'].length}
                    </span>
                    {expandedSections.has('Conflicts') ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>
                
                {expandedSections.has('Conflicts') && (
                  <div className="px-6 pb-6 space-y-4 border-t border-yellow-200">
                    {data['Conflicts'].map((conflict: any, index: number) => (
                      <div key={index} className="bg-white border-2 border-yellow-300 rounded-lg p-4 shadow-sm">
                        <div className="font-semibold text-gray-900 mb-2 flex items-center">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs mr-2">CONFLICT</span>
                          {formatFieldName(conflict.field || 'Unknown Field')}
                        </div>
                        {conflict.note && (
                          <div className="text-sm text-gray-600 mb-3 italic">{conflict.note}</div>
                        )}
                        {conflict.values && Array.isArray(conflict.values) && (
                          <div className="space-y-2">
                            <div className="text-sm font-semibold text-gray-700">Conflicting Values:</div>
                            {conflict.values.map((val: any, vIdx: number) => (
                              <div key={vIdx} className="ml-4 border-l-4 border-yellow-400 pl-3 py-2 bg-yellow-50 rounded">
                                <div className="text-sm font-medium text-gray-900">{val.value || 'N/A'}</div>
                                {val._source && (
                                  <div className="text-xs text-gray-500 mt-1">Source: {val._source}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Patient Summary Section */}
            {consolidatedData.patientSummary && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-lg mt-6">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-t-xl border-b-2 border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Patient Summary</h3>
                      <p className="text-sm text-blue-600">AI-generated clinical overview</p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500 shadow-sm">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {consolidatedData.patientSummary}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-gray-500 italic">
                      Generated during data consolidation • Maximum 200 words
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-blue-600">
                      <Activity className="h-3 w-3" />
                      <span>Clinical Summary</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Chatbot Button */}
      {!isChatbotOpen && (
        <button
          onClick={() => setIsChatbotOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-full shadow-2xl hover:from-cyan-600 hover:to-cyan-700 transition-all hover:scale-110 z-40 flex items-center space-x-2 group"
          aria-label="Open chatbot"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-medium">
            Ask about patient data
          </span>
        </button>
      )}

      {/* Chatbot Component */}
      {id && (
        <PatientChatbot
          patientContextId={id}
          isOpen={isChatbotOpen}
          onClose={() => setIsChatbotOpen(false)}
        />
      )}
    </div>
  );
};

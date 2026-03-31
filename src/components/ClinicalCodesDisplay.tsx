import React from 'react';
import { Activity, FileText, AlertCircle } from 'lucide-react';
import { ICD10Code, CPTCode } from '../services/clinicalCodesService';

interface ClinicalCodesDisplayProps {
  icd10Codes: Record<string, ICD10Code[]>;
  cptCodes: Record<string, CPTCode[]>;
  isLoading?: boolean;
}

export const ClinicalCodesDisplay: React.FC<ClinicalCodesDisplayProps> = ({
  icd10Codes,
  cptCodes,
  isLoading = false
}) => {
  const hasICD10Data = Object.keys(icd10Codes).length > 0;
  const hasCPTData = Object.keys(cptCodes).length > 0;

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-blue-50 border-b">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            Clinical Codes Reference
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            ICD-10 Diagnosis Codes and CPT Procedure Codes
          </p>
        </div>
        <div className="px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading clinical codes...</p>
        </div>
      </div>
    );
  }

  if (!hasICD10Data && !hasCPTData) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-blue-50 border-b">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600" />
            Clinical Codes Reference
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            ICD-10 Diagnosis Codes and CPT Procedure Codes
          </p>
        </div>
        <div className="px-4 py-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-500">No clinical codes found for the extracted terms.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-blue-50 border-b">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-blue-600" />
          Clinical Codes Reference
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          ICD-10 Diagnosis Codes and CPT Procedure Codes
        </p>
      </div>
      
      <div className="px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ICD-10 Diagnosis Codes */}
          {hasICD10Data && (
            <div className="space-y-4">
              <div className="flex items-center mb-3">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                <h4 className="text-md font-semibold text-gray-900">ICD-10 Diagnosis Codes</h4>
              </div>
              
              {Object.entries(icd10Codes).map(([searchTerm, codes]) => (
                <div key={searchTerm} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Search: "{searchTerm}"
                    </span>
                  </div>
                  
                  {codes.length > 0 ? (
                    <div className="space-y-2">
                      {codes.map((code, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded border-l-4 border-green-400">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono font-medium bg-green-600 text-white">
                                  {code.Code}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {code.Diagnosis}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No matching codes found</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CPT Procedure Codes */}
          {hasCPTData && (
            <div className="space-y-4">
              <div className="flex items-center mb-3">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                <h4 className="text-md font-semibold text-gray-900">CPT Procedure Codes</h4>
              </div>
              
              {Object.entries(cptCodes).map(([searchTerm, codes]) => (
                <div key={searchTerm} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Search: "{searchTerm}"
                    </span>
                  </div>
                  
                  {codes.length > 0 ? (
                    <div className="space-y-2">
                      {codes.map((code, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono font-medium bg-blue-600 text-white">
                                  {code.Code}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {code.Procedure}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No matching codes found</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { FileCode, CheckCircle, XCircle } from 'lucide-react';

interface CodesViewProps {
  icd10Codes: Record<string, any[]>;
  cptCodes: Record<string, any[]>;
  isLoading?: boolean;
}

export const CodesView: React.FC<CodesViewProps> = ({ icd10Codes, cptCodes, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clinical codes...</p>
        </div>
      </div>
    );
  }

  const hasICD10 = icd10Codes && Object.keys(icd10Codes).length > 0;
  const hasCPT = cptCodes && Object.keys(cptCodes).length > 0;

  if (!hasICD10 && !hasCPT) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <FileCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Clinical Codes Available</h3>
        <p className="text-gray-600">Clinical codes will appear here once patient data is processed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ICD-10 Codes Section */}
      {hasICD10 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-200 flex items-center">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600 mr-3">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">ICD-10 Diagnosis Codes</h3>
              <p className="text-sm text-gray-600">International Classification of Diseases codes</p>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="space-y-4">
              {Object.entries(icd10Codes).map(([diagnosis, codes]: [string, any]) => (
                <div key={diagnosis} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">{diagnosis}</h4>
                  </div>
                  <div className="p-4">
                    {Array.isArray(codes) && codes.length > 0 ? (
                      <div className="space-y-3">
                        {codes.map((code: any, index: number) => (
                          <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <CheckCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono font-semibold text-blue-700">{code.code}</span>
                              </div>
                              <p className="text-sm text-gray-700">{code.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-500 text-sm">
                        <XCircle className="h-4 w-4 mr-2" />
                        No matching codes found
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CPT Codes Section */}
      {hasCPT && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-green-50 border-b border-green-200 flex items-center">
            <div className="p-2 rounded-lg bg-green-100 text-green-600 mr-3">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">CPT Procedure Codes</h3>
              <p className="text-sm text-gray-600">Current Procedural Terminology codes</p>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="space-y-4">
              {Object.entries(cptCodes).map(([procedure, codes]: [string, any]) => (
                <div key={procedure} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">{procedure}</h4>
                  </div>
                  <div className="p-4">
                    {Array.isArray(codes) && codes.length > 0 ? (
                      <div className="space-y-3">
                        {codes.map((code: any, index: number) => (
                          <div key={index} className="flex items-start p-3 bg-green-50 rounded-lg border border-green-200">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono font-semibold text-green-700">{code.code}</span>
                              </div>
                              <p className="text-sm text-gray-700">{code.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-500 text-sm">
                        <XCircle className="h-4 w-4 mr-2" />
                        No matching codes found
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { ClinicalCodesDisplay } from './ClinicalCodesDisplay';
import { clinicalCodesService, ICD10Code, CPTCode } from '../services/clinicalCodesService';
import { Search } from 'lucide-react';

export const ClinicalCodesDemo: React.FC = () => {
  const [diagnosisTerms, setDiagnosisTerms] = useState('');
  const [procedureTerms, setProcedureTerms] = useState('');
  const [clinicalCodes, setClinicalCodes] = useState<{
    icd10Codes: Record<string, ICD10Code[]>;
    cptCodes: Record<string, CPTCode[]>;
  }>({ icd10Codes: {}, cptCodes: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!diagnosisTerms.trim() && !procedureTerms.trim()) {
      setError('Please enter at least one search term');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const diagnosisArray = diagnosisTerms.split(',').map(term => term.trim()).filter(term => term);
      const procedureArray = procedureTerms.split(',').map(term => term.trim()).filter(term => term);

      const response = await clinicalCodesService.lookupCodes({
        diagnosisTerms: diagnosisArray.length > 0 ? diagnosisArray : undefined,
        procedureTerms: procedureArray.length > 0 ? procedureArray : undefined
      });

      if (response.success) {
        setClinicalCodes(response.data);
      } else {
        setError('Failed to lookup clinical codes');
      }
    } catch (err) {
      setError('An error occurred while searching for codes');
      console.error('Clinical codes lookup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setDiagnosisTerms('');
    setProcedureTerms('');
    setClinicalCodes({ icd10Codes: {}, cptCodes: {} });
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Clinical Codes Lookup Demo</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-2">
              Diagnosis Terms (comma-separated)
            </label>
            <textarea
              id="diagnosis"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., hypertension, diabetes, heart failure"
              value={diagnosisTerms}
              onChange={(e) => setDiagnosisTerms(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="procedures" className="block text-sm font-medium text-gray-700 mb-2">
              Procedure Terms (comma-separated)
            </label>
            <textarea
              id="procedures"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., colonoscopy, ECG, blood test"
              value={procedureTerms}
              onChange={(e) => setProcedureTerms(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'Searching...' : 'Search Codes'}
          </button>
          
          <button
            onClick={handleClear}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Clear
          </button>
        </div>
      </div>

      <ClinicalCodesDisplay 
        icd10Codes={clinicalCodes.icd10Codes}
        cptCodes={clinicalCodes.cptCodes}
        isLoading={isLoading}
      />
    </div>
  );
};
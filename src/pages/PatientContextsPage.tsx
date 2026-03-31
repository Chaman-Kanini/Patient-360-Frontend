import React, { useState, useEffect } from 'react';
import { patientService } from '../services/patientService';
import { ragService } from '../services/ragService';
import { Sidebar } from '../components/patient/Sidebar';
import { PatientHeader } from '../components/patient/PatientHeader';
import { Patient360View } from '../components/patient/Patient360View';
import { ConflictsView } from '../components/patient/ConflictsView';
import { EnhancedCodesView } from '../components/patient/EnhancedCodesView';
import { SourceDocumentsView } from '../components/patient/SourceDocumentsView';
import { AlertTriangle, Database, Menu } from 'lucide-react';

interface RagBatch {
  id: string;
  name: string;
  createdAt: string;
  lastModified: string;
  size: number;
  filePath: string;
  patientName?: string;
  patientAge?: string;
  patientMRN?: string;
  conflictCount?: number;
}

export const PatientContextsPage: React.FC = () => {
  const [ragBatches, setRagBatches] = useState<RagBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState('patient-360');
  const [pdfDocuments, setPdfDocuments] = useState<any[]>([]);
  const [codesDataForView, setCodesDataForView] = useState<any>(null);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [pdfCount, setPdfCount] = useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    loadRagBatches();
  }, []);

  useEffect(() => {
    if (activeView === 'documents' && selectedBatchId) {
      console.log('Documents view active, loading PDFs for batch:', selectedBatchId);
      loadPdfFiles(selectedBatchId);
    }
  }, [activeView, selectedBatchId]);

  // Load codes data - check for finalized codes first, fallback to consolidated
  useEffect(() => {
    const loadCodesData = async () => {
      if (!selectedBatchId || !selectedBatch) return;
      
      setIsLoadingCodes(true);
      try {
        const finalizedResponse = await ragService.getFinalizedCodes(selectedBatchId);
        
        if (finalizedResponse.success && finalizedResponse.exists && finalizedResponse.data) {
          console.log('Using finalized codes for batch:', selectedBatchId);
          const finalizedData = {
            ...selectedBatch,
            icd10_codes: finalizedResponse.data.icd10_codes?.map((c: any) => ({
              diagnosis: c.sourceItem,
              icd10_code: c.code,
              description: c.description,
              confidence: 1,
              isFinalized: true,
              isAISuggested: c.isAISuggested // Preserve the AI/Human flag
            })) || [],
            cpt_codes: finalizedResponse.data.cpt_codes?.map((c: any) => ({
              procedure: c.sourceItem,
              cpt_code: c.code,
              description: c.description,
              confidence: 1,
              isFinalized: true,
              isAISuggested: c.isAISuggested // Preserve the AI/Human flag
            })) || [],
            _isFinalized: true
          };
          setCodesDataForView(finalizedData);
        } else {
          console.log('No finalized codes found, using consolidated data for batch:', selectedBatchId);
          setCodesDataForView(selectedBatch);
        }
      } catch (error) {
        console.error('Error loading codes data:', error);
        setCodesDataForView(selectedBatch);
      } finally {
        setIsLoadingCodes(false);
      }
    };

    loadCodesData();
  }, [selectedBatchId, selectedBatch]);

  const loadRagBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading RAG batches...');
      const response = await patientService.getRagBatches();
      console.log('RAG batches response:', response);
      const batches = response.batches || [];
      console.log('Total batches received:', batches.length);
      
      // Load patient info for each batch
      const batchesWithPatientInfo = await Promise.all(
        batches.map(async (batch: RagBatch) => {
          try {
            const batchData = await patientService.getRagBatchData(batch.id);
            const jsonData = typeof batchData.data === 'string' 
              ? JSON.parse(batchData.data.replace(/```json/g,"").replace(/```/g,"").trim()) 
              : batchData.data;
            
            const patient = jsonData.patient || {};
            const conflicts = jsonData.conflicts || [];
            
            return {
              ...batch,
              patientName: patient.name || 'Unknown Patient',
              patientAge: patient.age || 'N/A',
              patientMRN: patient.patient_id || patient.mrn || 'N/A',
              conflictCount: conflicts.length
            };
          } catch (err) {
            console.error(`Error loading patient info for batch ${batch.id}:`, err);
            return batch;
          }
        })
      );
      
      console.log('Batches with patient info:', batchesWithPatientInfo.length);
      setRagBatches(batchesWithPatientInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load RAG batches');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchClick = async (batch: RagBatch) => {
    try {
      setLoading(true);
      // Clear previous PDF documents when switching batches
      setPdfDocuments([]);
      
      const response = await patientService.getRagBatchData(batch.id);
      const jsonData = typeof response.data === 'string' ? JSON.parse(response.data.replace(/```json/g,"").replace(/```/g,"").trim()) : response.data;
      setSelectedBatch(jsonData);
      setSelectedBatchId(batch.id);
      setPdfCount(response.pdf_count || jsonData._source_document_count || 1);
      setActiveView('patient-360');
      
      // PDFs will be loaded by useEffect when documents view is activated
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load batch data');
    } finally {
      setLoading(false);
    }
  };

  const loadPdfFiles = async (batchId: string) => {
    try {
      console.log('Loading PDFs for batch:', batchId);
      const response = await patientService.getRagBatchPdfs(batchId);
      console.log('PDF response:', response);
      console.log('response.success:', response.success);
      console.log('response.pdfs:', response.pdfs);
      console.log('response.pdfs type:', typeof response.pdfs);
      console.log('response.pdfs length:', response.pdfs?.length);
      
      if (response.success && response.pdfs && Array.isArray(response.pdfs) && response.pdfs.length > 0) {
        console.log('Setting PDF documents:', response.pdfs);
        setPdfDocuments(response.pdfs);
      } else {
        console.log('No PDFs found in response or response invalid');
        setPdfDocuments([]);
      }
    } catch (error) {
      console.error('Error loading PDF files:', error);
      setPdfDocuments([]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFinalizeCodes = async (finalizedCodes: { icd10: any[]; cpt: any[] }) => {
    if (!selectedBatchId) {
      throw new Error('No batch ID available');
    }
    console.log('Finalizing codes for batch:', selectedBatchId, finalizedCodes);
    await ragService.finalizeCodes(selectedBatchId, finalizedCodes);
    
    // Refresh the codes data to show finalized codes
    const finalizedData = {
      ...selectedBatch,
      icd10_codes: finalizedCodes.icd10.map((c: any) => ({
        diagnosis: c.sourceItem,
        icd10_code: c.code,
        description: c.description,
        confidence: 1,
        isFinalized: true,
        isAISuggested: c.isAISuggested // Preserve the AI/Human flag
      })),
      cpt_codes: finalizedCodes.cpt.map((c: any) => ({
        procedure: c.sourceItem,
        cpt_code: c.code,
        description: c.description,
        confidence: 1,
        isFinalized: true,
        isAISuggested: c.isAISuggested // Preserve the AI/Human flag
      })),
      _isFinalized: true
    };
    setCodesDataForView(finalizedData);
  };

  const renderActiveView = () => {
    if (!selectedBatch) return null;

    switch (activeView) {
      case 'patient-360':
        return <Patient360View patientData={selectedBatch} batchId={selectedBatchId} />;
      case 'conflicts':
        return (
          <ConflictsView 
            patientData={selectedBatch} 
            batchId={selectedBatchId}
            onConflictResolved={(updatedData) => {
              setSelectedBatch(updatedData);
            }}
          />
        );
      case 'codes':
        return (
          <EnhancedCodesView 
            rawData={codesDataForView || selectedBatch} 
            batchId={selectedBatchId}
            isLoading={isLoadingCodes}
            onFinalize={handleFinalizeCodes}
          />
        );
      case 'documents':
        console.log('Rendering SourceDocumentsView with pdfDocuments:', pdfDocuments);
        console.log('pdfDocuments length:', pdfDocuments.length);
        console.log('selectedBatchId:', selectedBatchId);
        return <SourceDocumentsView documents={pdfDocuments} batchId={selectedBatchId} />;
      default:
        return <Patient360View patientData={selectedBatch} batchId={selectedBatchId} />;
    }
  };

  const getConflictCount = () => {
    if (!selectedBatch) return 0;
    const conflicts = selectedBatch.conflicts || [];
    return conflicts.length;
  };

  if (loading && !selectedBatch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading RAG batches...</p>
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
            onClick={() => {
              setSelectedBatch(null);
              setError(null);
              loadRagBatches();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (selectedBatch) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar activeView={activeView} onViewChange={setActiveView} isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Patient Header */}
          <PatientHeader 
            patientData={selectedBatch} 
            documentsProcessed={pdfCount}
            conflictsPending={getConflictCount()}
          />

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-6 py-8">
              {renderActiveView()}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-4xl w-full mx-auto px-6">
        {ragBatches.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
            <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Patient Records Found</h3>
            <p className="text-gray-600 mb-6">
              No processed patient records are available. Upload and process documents to get started.
            </p>
            <button
              onClick={loadRagBatches}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">Patient Records</h1>
              <p className="text-sm text-gray-600 mt-1">
                {ragBatches.length} patient record{ragBatches.length !== 1 ? 's' : ''} available
              </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MRN
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ragBatches.map((batch) => (
                    <tr
                      key={batch.id}
                      onClick={() => handleBatchClick(batch)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{batch.patientName || batch.name}</div>
                            <div className="text-sm text-gray-500">{batch.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{batch.patientAge || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{batch.patientMRN || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {batch.conflictCount !== undefined && batch.conflictCount > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {batch.conflictCount} Conflict{batch.conflictCount !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            No Conflicts
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(batch.lastModified)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(batch.size)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AlertTriangle, Menu } from 'lucide-react';
import { patientService } from '../services/patientService';
import { ragService } from '../services/ragService';
import { Sidebar } from '../components/patient/Sidebar';
import { PatientHeader } from '../components/patient/PatientHeader';
import { Patient360View } from '../components/patient/Patient360View';
import { ConflictsView } from '../components/patient/ConflictsView';
import { EnhancedCodesView } from '../components/patient/EnhancedCodesView';
import { SourceDocumentsView } from '../components/patient/SourceDocumentsView';

interface OutputPageState {
  data: any;
  batchId: string;
}

export const OutputPage: React.FC = () => {
  const location = useLocation();
  const state = location.state as OutputPageState;
  console.log('OutputPage - location.state:', state);
  console.log('OutputPage - batchId from state:', state?.batchId);
  const [activeView, setActiveView] = useState('patient-360');
  const [pdfDocuments, setPdfDocuments] = useState<any[]>([]);
  const [patientData, setPatientData] = useState<any>(null);
  const [codesDataForView, setCodesDataForView] = useState<any>(null);
  const [isLoadingCodes, setIsLoadingCodes] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Initialize patient data from state
  useEffect(() => {
    if (state?.data) {
      setPatientData(state.data);
    }
  }, [state?.data]);

  // Reload batch data from backend
  const reloadBatchData = async () => {
    if (!state?.batchId) return;
    try {
      const response = await patientService.getRagBatchData(state.batchId);
      const jsonData = typeof response.data === 'string' 
        ? JSON.parse(response.data.replace(/```json/g,"").replace(/```/g,"").trim()) 
        : response.data;
      setPatientData(jsonData);
    } catch (error) {
      console.error('Error reloading batch data:', error);
    }
  };

  // Load codes data - check for finalized codes first, fallback to consolidated
  useEffect(() => {
    const loadCodesData = async () => {
      if (!state?.batchId || !patientData) return;
      
      setIsLoadingCodes(true);
      try {
        const finalizedResponse = await ragService.getFinalizedCodes(state.batchId);
        
        if (finalizedResponse.success && finalizedResponse.exists && finalizedResponse.data) {
          console.log('Using finalized codes for batch:', state.batchId);
          const finalizedData = {
            ...patientData,
            icd10_codes: finalizedResponse.data.icd10_codes?.map((c: any) => ({
              diagnosis: c.sourceItem,
              icd10_code: c.code,
              description: c.description,
              confidence: 1,
              isFinalized: true,
              isAISuggested: c.isAISuggested
            })) || [],
            cpt_codes: finalizedResponse.data.cpt_codes?.map((c: any) => ({
              procedure: c.sourceItem,
              cpt_code: c.code,
              description: c.description,
              confidence: 1,
              isFinalized: true,
              isAISuggested: c.isAISuggested
            })) || [],
            _isFinalized: true
          };
          setCodesDataForView(finalizedData);
        } else {
          console.log('No finalized codes found, using consolidated data for batch:', state.batchId);
          setCodesDataForView(patientData);
        }
      } catch (error) {
        console.error('Error loading codes data:', error);
        setCodesDataForView(patientData);
      } finally {
        setIsLoadingCodes(false);
      }
    };

    loadCodesData();
  }, [state?.batchId, patientData]);

  useEffect(() => {
    console.log('useEffect triggered - activeView:', activeView, 'batchId:', state?.batchId);
    if (activeView === 'documents' && state?.batchId) {
      console.log('Documents view active, loading PDFs for batch:', state.batchId);
      loadPdfFiles(state.batchId);
    } else {
      console.log('Not loading PDFs - activeView:', activeView, 'has batchId:', !!state?.batchId);
    }
  }, [activeView, state?.batchId]);

  const loadPdfFiles = async (batchId: string) => {
    try {
      console.log('Loading PDFs for batch:', batchId);
      const response = await patientService.getRagBatchPdfs(batchId);
      console.log('PDF response:', response);
      if (response.success && response.pdfs) {
        console.log('Setting PDF documents:', response.pdfs);
        setPdfDocuments(response.pdfs);
      } else {
        console.log('No PDFs found in response');
        setPdfDocuments([]);
      }
    } catch (error) {
      console.error('Error loading PDF files:', error);
      setPdfDocuments([]);
    }
  };

  const handleFinalizeCodes = async (finalizedCodes: { icd10: any[]; cpt: any[] }) => {
    if (!state?.batchId) {
      throw new Error('No batch ID available');
    }
    console.log('Finalizing codes for batch:', state.batchId, finalizedCodes);
    await ragService.finalizeCodes(state.batchId, finalizedCodes);
    
    const finalizedData = {
      ...patientData,
      icd10_codes: finalizedCodes.icd10.map((c: any) => ({
        diagnosis: c.sourceItem,
        icd10_code: c.code,
        description: c.description,
        confidence: 1,
        isFinalized: true,
        isAISuggested: c.isAISuggested
      })),
      cpt_codes: finalizedCodes.cpt.map((c: any) => ({
        procedure: c.sourceItem,
        cpt_code: c.code,
        description: c.description,
        confidence: 1,
        isFinalized: true,
        isAISuggested: c.isAISuggested
      })),
      _isFinalized: true
    };
    setCodesDataForView(finalizedData);
  };

  const renderActiveView = () => {
    if (!patientData) return null;

    switch (activeView) {
      case 'patient-360':
        return <Patient360View patientData={patientData} batchId={state?.batchId} />;
      case 'conflicts':
        return (
          <ConflictsView 
            patientData={patientData} 
            batchId={state?.batchId}
            onConflictResolved={async (updatedData) => {
              setPatientData(updatedData);
              await reloadBatchData();
            }}
          />
        );
      case 'codes':
        return (
          <EnhancedCodesView 
            rawData={codesDataForView || patientData} 
            batchId={state?.batchId}
            isLoading={isLoadingCodes}
            onFinalize={handleFinalizeCodes}
          />
        );
      case 'documents':
        return <SourceDocumentsView documents={pdfDocuments} batchId={state?.batchId} />;
      default:
        return <Patient360View patientData={patientData} batchId={state?.batchId} />;
    }
  };

  const getConflictCount = () => {
    if (!patientData) return 0;
    const conflicts = patientData.conflicts || [];
    return conflicts.length;
  };

  if (!patientData && !state?.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Output Data</h3>
          <p className="text-gray-600 mb-4">
            No processing results found.
          </p>
          <Link
            to="/documents/upload"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Upload
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Patient Header */}
        <PatientHeader 
          patientData={patientData} 
          documentsProcessed={1}
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
};
import React, { useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { documentService } from '../services/documentService';
import { ragService } from '../services/ragService';
import { UploadProgress } from '../types/document';
import { FileDropzone } from '../components/documents/FileDropzone';
import { UploadProgressList } from '../components/documents/UploadProgressList';

export const DocumentUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [currentPatientContextId, setCurrentPatientContextId] = useState<string | null>(null);
  const uploadAbortControllerRef = useRef<AbortController | null>(null);

  const handleFilesSelected = useCallback((files: File[]) => {
    const newProgressItems: UploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }));

    setUploadProgress(prev => [...prev, ...newProgressItems]);
    setSelectedFiles(prev => [...prev, ...files]);
  }, []);

  const handleRemoveFile = useCallback((fileToRemove: File) => {
    setUploadProgress(prev => prev.filter(p => p.file !== fileToRemove));
    setSelectedFiles(prev => prev.filter(f => f !== fileToRemove));
  }, []);

  const handleRetryFile = useCallback(async (fileToRetry: File) => {
    // Update status to pending
    setUploadProgress(prev => 
      prev.map(p => 
        p.file === fileToRetry 
          ? { ...p, status: 'pending', progress: 0, error: undefined }
          : p
      )
    );

    // Upload single file
    await uploadSingleFile(fileToRetry);
  }, []);

  const uploadSingleFile = useCallback(async (file: File) => {
    try {
      // Update status to uploading
      setUploadProgress(prev => 
        prev.map(p => 
          p.file === file 
            ? { ...p, status: 'uploading', progress: 0 }
            : p
        )
      );

      const result = await documentService.uploadDocument(
        file,
        undefined, // No patient context - create new session
        (progress) => {
          setUploadProgress(prev => 
            prev.map(p => 
              p.file === file 
                ? { ...p, progress: progress.progress, status: progress.status }
                : p
            )
          );
        }
      );

      if (result.success) {
        // Update to success
        setUploadProgress(prev => 
          prev.map(p => 
            p.file === file 
              ? { ...p, status: 'success', progress: 100, documentId: result.documents[0]?.id }
              : p
          )
        );

        // Capture patient context ID if available in the response
        if (result.documents[0]?.patientContextId) {
          setCurrentPatientContextId(result.documents[0].patientContextId);
        }

        // Show success message if all files are complete
        setTimeout(() => {
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 5000);
        }, 1000);
      } else {
        // Update to error
        setUploadProgress(prev => 
          prev.map(p => 
            p.file === file 
              ? { ...p, status: 'error', error: result.errors[0]?.error }
              : p
          )
        );
      }
    } catch (error) {
      // Update to error
      setUploadProgress(prev => 
        prev.map(p => 
          p.file === file 
            ? { ...p, status: 'error', error: 'Upload failed unexpectedly' }
            : p
        )
      );
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    uploadAbortControllerRef.current = new AbortController();

    try {
      const pendingFiles = uploadProgress.filter(p => p.status === 'pending').map(p => p.file);
      
      if (pendingFiles.length === 0) {
        setIsUploading(false);
        return;
      }

      // Test connection first
      console.log('Testing RAG API connection...');
      const connectionOk = await ragService.testConnection();
      if (!connectionOk) {
        throw new Error('Cannot connect to RAG API at localhost:8000. Please ensure the backend is running.');
      }

      // Update all files to uploading status
      setUploadProgress(prev => 
        prev.map(p => 
          pendingFiles.includes(p.file) 
            ? { ...p, status: 'uploading', progress: 10 }
            : p
        )
      );

      console.log('Starting RAG processing... This may take several minutes.');
      
      // Simulate progress during long processing
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => 
          prev.map(p => 
            pendingFiles.includes(p.file) && p.status === 'uploading' && p.progress < 90
              ? { ...p, progress: Math.min(p.progress + 5, 90) }
              : p
          )
        );
      }, 3000);

      // Call RAG API
      const ragResult = await ragService.uploadBatch(pendingFiles);
      console.log('RAG Upload Result:', ragResult);
      console.log('batch_id from result:', ragResult.batch_id);
      
      clearInterval(progressInterval);
      
      // Update all files to success
      setUploadProgress(prev => 
        prev.map(p => 
          pendingFiles.includes(p.file) 
            ? { ...p, status: 'success', progress: 100 }
            : p
        )
      );

      // Redirect to output page with the data
      if (ragResult.data) {
        console.log('Navigating to /output with state:', {
          data: ragResult.data,
          batchId: ragResult.batch_id
        });
        navigate('/output', { 
          state: { 
            data: ragResult.data, 
            batchId: ragResult.batch_id 
          } 
        });
      } else {
        console.log('No data in ragResult, showing success message');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 5000);
      }

    } catch (error) {
      console.error('RAG upload failed:', error);
      
      // Clear any progress interval
      const progressInterval = setInterval(() => {}, 1000);
      clearInterval(progressInterval);
      
      // Update files to error status
      const pendingFiles = uploadProgress.filter(p => p.status === 'pending').map(p => p.file);
      setUploadProgress(prev => 
        prev.map(p => 
          pendingFiles.includes(p.file) 
            ? { ...p, status: 'error', progress: 0, error: error instanceof Error ? error.message : 'Upload failed' }
            : p
        )
      );
    } finally {
      setIsUploading(false);
      uploadAbortControllerRef.current = null;
    }
  }, [selectedFiles, uploadProgress, navigate]);

  const handleCancel = useCallback(() => {
    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort();
      uploadAbortControllerRef.current = null;
    }
    setIsUploading(false);
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedFiles([]);
    setUploadProgress([]);
    setShowSuccessMessage(false);
  }, []);

  const hasPendingFiles = uploadProgress.some(p => p.status === 'pending');
  const hasActiveUploads = uploadProgress.some(p => p.status === 'uploading');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Upload & Process Documents</h1>
                <p className="mt-2 text-gray-600">
                  Upload clinical documents for AI-powered RAG processing and intelligent analysis
                </p>
              </div>
              <div className="hidden lg:block">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-4">
                  <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-green-400">✅</span>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-green-800">
                  Processing Complete!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  Your documents have been processed successfully by the RAG system.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* File Upload Area */}
        <div className="mb-6">
          <FileDropzone
            onFilesSelected={handleFilesSelected}
            disabled={isUploading}
            maxFiles={10}
          />
        </div>

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="mb-6">
            <UploadProgressList
              progressItems={uploadProgress}
              onRemoveFile={handleRemoveFile}
              onRetryFile={handleRetryFile}
            />
          </div>
        )}

        {/* Action Buttons */}
        {selectedFiles.length > 0 && (
          <div className="flex justify-between items-center bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-sm text-gray-600">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleClearAll}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
              
              {hasActiveUploads ? (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Cancel Processing
                </button>
              ) : (
                <button
                  onClick={handleUpload}
                  disabled={!hasPendingFiles || isUploading}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Processing... (may take several minutes)' : `Process ${hasPendingFiles ? uploadProgress.filter(p => p.status === 'pending').length : 0} Files`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-base font-semibold text-blue-900 mb-3">Processing Guidelines</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center text-sm text-blue-800">
                  <svg className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Supported: PDF, DOC, DOCX
                </div>
                <div className="flex items-center text-sm text-blue-800">
                  <svg className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Max size: 50MB per file
                </div>
                <div className="flex items-center text-sm text-blue-800">
                  <svg className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Max batch: 10 files
                </div>
                <div className="flex items-center text-sm text-blue-800">
                  <svg className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  RAG-powered processing
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import axios, { AxiosProgressEvent } from 'axios';
import {
  UploadedDocument,
  UploadProgress,
  UploadResult,
  BatchUploadResult,
  DocumentListResponse,
  DocumentResponse
} from '../types/document';
import { ErrorMessages, getErrorMessage, getFileValidationError, getNetworkErrorMessage } from '../utils/errorMessages';

const API_BASE_URL = 'https://dotnetbackend-patient-360.onrender.com';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      if (config.headers && typeof (config.headers as any).set === 'function') {
        (config.headers as any).set('Authorization', `Bearer ${token}`);
      } else {
        config.headers = (config.headers || {}) as any;
        (config.headers as any)['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const documentService = {
  async uploadDocument(
    file: File,
    patientContextId?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (patientContextId) {
        formData.append('patientContextId', patientContextId);
      }

      const response = await apiClient.post<UploadResult>(
        `/documents/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (onProgress && progressEvent.total) {
              const progressPercent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress({
                file,
                progress: progressPercent,
                status: 'uploading'
              });
            }
          },
        }
      );

      if (onProgress) {
        onProgress({
          file,
          progress: 100,
          status: 'success'
        });
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = getErrorMessage(error, ErrorMessages.UPLOAD_FAILED);
        const errorType = error.response?.data?.errorType;
        const statusCode = error.response?.status;
        
        // Use specific error messages based on status code
        const specificMessage = statusCode ? getNetworkErrorMessage(statusCode) : errorMessage;
        const finalMessage = errorType ? getFileValidationError(errorType) : specificMessage;
        
        if (onProgress) {
          onProgress({
            file,
            progress: 0,
            status: 'error',
            error: finalMessage
          });
        }

        return {
          success: false,
          documents: [],
          errors: [{
            fileName: file.name,
            error: finalMessage,
            errorType
          }]
        };
      }

      throw error;
    }
  },

  async uploadDocumentsParallel(
    files: File[],
    onProgress?: (progress: UploadProgress[]) => void
  ): Promise<BatchUploadResult & { patientContextId?: string }> {
    const progressMap = new Map<string, UploadProgress>();
    const updateProgress = () => {
      if (onProgress) {
        onProgress(Array.from(progressMap.values()));
      }
    };

    try {
      // Step 1: Upload all documents in parallel
      const uploadPromises = files.map(async (file) => {
        try {
          progressMap.set(file.name, {
            file,
            progress: 0,
            status: 'uploading'
          });
          updateProgress();

          const result = await this.uploadDocument(file, undefined, (progress) => {
            progressMap.set(file.name, progress);
            updateProgress();
          });

          return { file, result, success: true };
        } catch (error) {
          progressMap.set(file.name, {
            file,
            progress: 0,
            status: 'error',
            error: 'Upload failed'
          });
          updateProgress();
          return { file, result: null, success: false };
        }
      });

      // Wait for all uploads to complete
      const uploadResults = await Promise.all(uploadPromises);
      
      // Step 2: Check if we have successful uploads
      const successfulUploads = uploadResults.filter(r => r.success);
      const failedUploads = uploadResults.filter(r => !r.success);

      if (successfulUploads.length === 0) {
        return {
          success: false,
          summary: {
            totalFiles: files.length,
            successful: 0,
            failed: files.length
          },
          documents: [],
          errors: failedUploads.map(f => ({
            fileName: f.file.name,
            error: 'Upload failed'
          }))
        };
      }

      if (successfulUploads.length < 2) {
        // Not enough documents for consolidation, return upload results
        return {
          success: true,
          summary: {
            totalFiles: files.length,
            successful: successfulUploads.length,
            failed: failedUploads.length
          },
          documents: successfulUploads.map(u => u.result!.documents[0]),
          errors: failedUploads.map(f => ({
            fileName: f.file.name,
            error: 'Upload failed'
          }))
        };
      }

      // Step 3: Trigger consolidation for successful uploads
      try {
        const consolidationResponse = await apiClient.post<{
          success: boolean;
          patientContextId: string;
          message?: string;
        }>('/patients/consolidate-recent', {
          documentIds: successfulUploads.map(u => u.result!.documents[0].id)
        });

        return {
          success: true,
          summary: {
            totalFiles: files.length,
            successful: successfulUploads.length,
            failed: failedUploads.length
          },
          documents: successfulUploads.map(u => u.result!.documents[0]),
          errors: failedUploads.map(f => ({
            fileName: f.file.name,
            error: 'Upload failed'
          })),
          patientContextId: consolidationResponse.data.patientContextId
        };
      } catch (consolidationError) {
        // Consolidation failed, but uploads succeeded
        return {
          success: true,
          summary: {
            totalFiles: files.length,
            successful: successfulUploads.length,
            failed: failedUploads.length
          },
          documents: successfulUploads.map(u => u.result!.documents[0]),
          errors: [
            ...failedUploads.map(f => ({
              fileName: f.file.name,
              error: 'Upload failed'
            })),
            {
              fileName: 'Consolidation',
              error: 'Consolidation failed - documents uploaded but not consolidated'
            }
          ]
        };
      }

    } catch (error) {
      // Global error
      if (onProgress) {
        files.forEach(file => {
          progressMap.set(file.name, {
            file,
            progress: 0,
            status: 'error',
            error: 'Parallel processing failed'
          });
        });
        onProgress(Array.from(progressMap.values()));
      }
      
      return {
        success: false,
        summary: {
          totalFiles: files.length,
          successful: 0,
          failed: files.length
        },
        documents: [],
        errors: files.map(file => ({
          fileName: file.name,
          error: 'Parallel processing failed'
        }))
      };
    }
  },

  async uploadDocuments(
    files: File[],
    patientContextId?: string,
    onProgress?: (progress: UploadProgress[]) => void
  ): Promise<BatchUploadResult> {
    // Track progress for each file
    const progressMap = new Map<string, UploadProgress>();
    const updateProgress = () => {
      if (onProgress) {
        onProgress(Array.from(progressMap.values()));
      }
    };

    try {
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('files', file);
      });
      
      if (patientContextId) {
        formData.append('patientContextId', patientContextId);
      }

      const response = await apiClient.post<BatchUploadResult>(
        `/documents/upload-batch`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (progressEvent.total) {
              const overallProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              
              files.forEach(file => {
                progressMap.set(file.name, {
                  file,
                  progress: overallProgress,
                  status: 'uploading'
                });
              });
              
              updateProgress();
            }
          },
        }
      );

      // Update final status based on response
      response.data.documents.forEach(doc => {
        const originalFile = files.find(f => f.name === doc.fileName);
        if (originalFile) {
          progressMap.set(originalFile.name, {
            file: originalFile,
            progress: 100,
            status: 'success',
            documentId: doc.id
          });
        }
      });

      response.data.errors.forEach(error => {
        const originalFile = files.find(f => f.name === error.fileName);
        if (originalFile) {
          progressMap.set(originalFile.name, {
            file: originalFile,
            progress: 0,
            status: 'error',
            error: error.error
          });
        }
      });

      updateProgress();
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Batch upload failed';

        if (onProgress) {
          files.forEach(file => {
            progressMap.set(file.name, {
              file,
              progress: 0,
              status: 'error',
              error: errorMessage
            });
          });
          onProgress(Array.from(progressMap.values()));
        }
        
        return {
          success: false,
          summary: {
            totalFiles: files.length,
            successful: 0,
            failed: files.length
          },
          documents: [],
          errors: files.map(file => ({
            fileName: file.name,
            error: errorMessage
          }))
        };
      }

      throw error;
    }
  },

  async getDocuments(): Promise<UploadedDocument[]> {
    try {
      const response = await apiClient.get<DocumentListResponse>(`/documents`);
      return response.data.documents;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch documents');
      }
      throw error;
    }
  },

  async getDocument(id: string): Promise<UploadedDocument> {
    try {
      const response = await apiClient.get<DocumentResponse>(`/documents/${id}`);
      return response.data.document;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error('Document not found');
        }
        throw new Error(error.response?.data?.message || 'Failed to fetch document');
      }
      throw error;
    }
  },

  async deleteDocument(id: string): Promise<void> {
    try {
      await apiClient.delete(`/documents/${id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to delete document');
      }
      throw error;
    }
  },

  async downloadDocument(id: string): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `/documents/${id}/download`,
        {
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to download document');
      }
      throw error;
    }
  },

  // Utility function to format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Utility function to validate file on client side
  validateFile(file: File): { isValid: boolean; error?: string } {
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: 'File type not allowed. Please upload PDF, DOC, or DOCX files.'
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size exceeds 50MB limit.'
      };
    }

    if (file.size === 0) {
      return {
        isValid: false,
        error: 'File is empty.'
      };
    }

    return { isValid: true };
  },

  // Utility function to get file icon based on type
  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      default:
        return '📎';
    }
  }
};

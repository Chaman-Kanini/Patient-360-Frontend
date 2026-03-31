export type DocumentStatus = 'Pending' | 'Validated' | 'Processing' | 'Completed' | 'Failed' | 'Rejected';

export interface UploadedDocument {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  status: DocumentStatus;
  uploadedAt: string;
  processedAt?: string;
  validationError?: string;
  patientContextId?: string;
  patientContext?: PatientContext;
}

export interface PatientContext {
  id: string;
  patientIdentifier: string;
  patientName: string;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  documentId?: string;
}

export interface UploadResult {
  success: boolean;
  documents: UploadedDocument[];
  errors: UploadError[];
}

export interface UploadError {
  fileName: string;
  error: string;
  errorType?: string;
}

export interface BatchUploadResult {
  success: boolean;
  summary: {
    totalFiles: number;
    successful: number;
    failed: number;
  };
  documents: UploadedDocument[];
  errors: UploadError[];
}

export interface DocumentUploadRequest {
  file: File;
  patientContextId?: string;
}

export interface DocumentListResponse {
  success: boolean;
  documents: UploadedDocument[];
}

export interface DocumentResponse {
  success: boolean;
  document: UploadedDocument;
}

export interface ValidationErrorType {
  InvalidExtension: 'InvalidExtension';
  FileTooLarge: 'FileTooLarge';
  InvalidMimeType: 'InvalidMimeType';
  PasswordProtected: 'PasswordProtected';
  CorruptedFile: 'CorruptedFile';
  EmptyFile: 'EmptyFile';
}

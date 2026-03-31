export const ErrorMessages = {
  // File validation errors
  FILE_TOO_LARGE: 'File size exceeds 50MB limit. Please compress the file or upload a smaller version.',
  INVALID_FILE_TYPE: 'File type not supported. Please upload PDF, DOC, or DOCX files only.',
  EMPTY_FILE: 'The selected file is empty. Please choose a valid file.',
  PASSWORD_PROTECTED: 'Password-protected files are not allowed. Please remove the password protection and try again.',
  CORRUPTED_FILE: 'The file appears to be corrupted or damaged. Please try uploading a different version.',
  INVALID_MIME_TYPE: 'File type does not match the extension. The file may be corrupted or renamed incorrectly.',
  
  // Network errors
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection and try again.',
  TIMEOUT_ERROR: 'Upload timed out. Please try again with a smaller file or check your connection.',
  SERVER_ERROR: 'Server error occurred. Please try again later or contact support if the problem persists.',
  UNAUTHORIZED: 'You are not authorized to perform this action. Please log in again.',
  FORBIDDEN: 'You do not have permission to upload documents. Please contact your administrator.',
  
  // Upload errors
  UPLOAD_FAILED: 'Upload failed. Please try again or contact support if the problem continues.',
  BATCH_UPLOAD_FAILED: 'Batch upload failed. Some files may not have been uploaded successfully.',
  PARTIAL_UPLOAD: 'Some files failed to upload. Please check the error details and retry the failed files.',
  
  // File operation errors
  DOWNLOAD_FAILED: 'Failed to download the file. Please try again or contact support.',
  DELETE_FAILED: 'Failed to delete the document. Please try again or contact support.',
  FILE_NOT_FOUND: 'The requested document was not found. It may have been deleted or moved.',
  
  // General errors
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
  INVALID_REQUEST: 'Invalid request format. Please try again or contact support.',
  
  // Validation errors
  TOO_MANY_FILES: 'Maximum 10 files allowed per upload. Please upload files in smaller batches.',
  INVALID_PATIENT_CONTEXT: 'Invalid patient context selected. Please choose a valid patient or leave empty.',
  
  // Success messages
  UPLOAD_SUCCESS: 'Document uploaded successfully and is being processed.',
  BATCH_UPLOAD_SUCCESS: 'All documents uploaded successfully and are being processed.',
  DELETE_SUCCESS: 'Document deleted successfully.',
  DOWNLOAD_SUCCESS: 'Document downloaded successfully.',
  
  // Status messages
  PROCESSING: 'Document is being processed. Please wait...',
  VALIDATING: 'Document is being validated...',
  UPLOADING: 'Uploading document...'
} as const;

// Helper functions for error message handling
export const getErrorMessage = (error: any, defaultMessage: string = ErrorMessages.UNKNOWN_ERROR): string => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  return defaultMessage;
};

export const getFileValidationError = (errorType?: string): string => {
  switch (errorType) {
    case 'FileTooLarge':
      return ErrorMessages.FILE_TOO_LARGE;
    case 'InvalidExtension':
      return ErrorMessages.INVALID_FILE_TYPE;
    case 'InvalidMimeType':
      return ErrorMessages.INVALID_MIME_TYPE;
    case 'PasswordProtected':
      return ErrorMessages.PASSWORD_PROTECTED;
    case 'CorruptedFile':
      return ErrorMessages.CORRUPTED_FILE;
    case 'EmptyFile':
      return ErrorMessages.EMPTY_FILE;
    default:
      return ErrorMessages.UPLOAD_FAILED;
  }
};

export const getNetworkErrorMessage = (status?: number): string => {
  switch (status) {
    case 401:
      return ErrorMessages.UNAUTHORIZED;
    case 403:
      return ErrorMessages.FORBIDDEN;
    case 404:
      return ErrorMessages.FILE_NOT_FOUND;
    case 408:
    case 504:
      return ErrorMessages.TIMEOUT_ERROR;
    case 413:
      return ErrorMessages.FILE_TOO_LARGE;
    case 422:
      return ErrorMessages.INVALID_FILE_TYPE;
    case 500:
    case 502:
    case 503:
      return ErrorMessages.SERVER_ERROR;
    default:
      return ErrorMessages.NETWORK_ERROR;
  }
};

import React, { useCallback, useState } from 'react';
import { documentService } from '../../services/documentService';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFilesSelected,
  maxFiles = 10,
  disabled = false,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateFiles = useCallback((files: FileList): { validFiles: File[]; errors: string[] } => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return { validFiles, errors };
    }

    Array.from(files).forEach(file => {
      const validation = documentService.validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    return { validFiles, errors };
  }, [maxFiles]);

  const handleFiles = useCallback((files: FileList) => {
    if (disabled) return;

    const { validFiles, errors } = validateFiles(files);
    
    setValidationError(errors.length > 0 ? errors.join('; ') : null);
    
    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  }, [disabled, onFilesSelected, validateFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFiles]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      document.getElementById('file-input')?.click();
    }
  }, []);

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-input')?.click()}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label="Upload documents"
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf,.doc,.docx"
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
          aria-label="Select files to upload"
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="text-4xl">
            {isDragOver ? '📁' : '📤'}
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse
            </p>
          </div>
          
          <div className="text-xs text-gray-400 space-y-1">
            <p>Accepted formats: PDF, DOC, DOCX</p>
            <p>Maximum file size: 50MB</p>
            <p>Maximum files: {maxFiles}</p>
          </div>
        </div>
      </div>

      {validationError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Validation Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {validationError}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

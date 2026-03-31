import React from 'react';
import { UploadProgress } from '../../types/document';
import { documentService } from '../../services/documentService';

interface UploadProgressItemProps {
  progress: UploadProgress;
  onRemove?: (file: File) => void;
  onRetry?: (file: File) => void;
  className?: string;
}

export const UploadProgressItem: React.FC<UploadProgressItemProps> = ({
  progress,
  onRemove,
  onRetry,
  className = ''
}) => {
  const { file, progress: progressPercent, status, error } = progress;

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'uploading':
        return '📤';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'text-gray-500';
      case 'uploading':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-gray-300';
      case 'uploading':
        return 'bg-blue-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const formatFileName = (fileName: string): string => {
    const maxLength = 30;
    if (fileName.length <= maxLength) return fileName;
    
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - 3 - (extension?.length || 0));
    
    return `${truncatedName}...${extension ? '.' + extension : ''}`;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-start space-x-3">
        {/* File icon and status */}
        <div className="flex-shrink-0 text-2xl">
          {documentService.getFileIcon(file.name)}
        </div>
        
        {/* File info and progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900 truncate" title={file.name}>
              {formatFileName(file.name)}
            </h4>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${getStatusColor()}`}>
                {getStatusIcon()}
              </span>
              <span className="text-xs text-gray-500">
                {documentService.formatFileSize(file.size)}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">
                {status === 'uploading' ? `${progressPercent}%` : status}
              </span>
              {status === 'success' && (
                <span className="text-xs text-green-600">Completed</span>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col space-y-1">
          {(status === 'error' && onRetry) && (
            <button
              onClick={() => onRetry(file)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              title="Retry upload"
            >
              Retry
            </button>
          )}
          
          {(status === 'pending' || status === 'error') && onRemove && (
            <button
              onClick={() => onRemove(file)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
              title="Remove file"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

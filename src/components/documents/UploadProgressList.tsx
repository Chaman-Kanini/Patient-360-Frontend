import React from 'react';
import { UploadProgress } from '../../types/document';
import { UploadProgressItem } from './UploadProgressItem';

interface UploadProgressListProps {
  progressItems: UploadProgress[];
  onRemoveFile?: (file: File) => void;
  onRetryFile?: (file: File) => void;
  className?: string;
}

export const UploadProgressList: React.FC<UploadProgressListProps> = ({
  progressItems,
  onRemoveFile,
  onRetryFile,
  className = ''
}) => {
  if (progressItems.length === 0) {
    return null;
  }

  const getStatusStats = () => {
    const stats = {
      pending: 0,
      uploading: 0,
      success: 0,
      error: 0
    };

    progressItems.forEach(item => {
      stats[item.status]++;
    });

    return stats;
  };

  const stats = getStatusStats();
  const hasActiveUploads = stats.uploading > 0 || stats.pending > 0;
  const hasErrors = stats.error > 0;
  const allCompleted = stats.success === progressItems.length && progressItems.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary header */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">
            Upload Queue ({progressItems.length} files)
          </h3>
          <div className="flex items-center space-x-4 text-xs">
            {stats.pending > 0 && (
              <span className="text-gray-500">
                ⏳ {stats.pending} pending
              </span>
            )}
            {stats.uploading > 0 && (
              <span className="text-blue-500">
                📤 {stats.uploading} uploading
              </span>
            )}
            {stats.success > 0 && (
              <span className="text-green-500">
                ✅ {stats.success} completed
              </span>
            )}
            {stats.error > 0 && (
              <span className="text-red-500">
                ❌ {stats.error} failed
              </span>
            )}
          </div>
        </div>

        {/* Overall progress bar */}
        {progressItems.length > 0 && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(stats.success / progressItems.length) * 100}%`
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">
                Overall Progress
              </span>
              <span className="text-xs text-gray-500">
                {Math.round((stats.success / progressItems.length) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Status messages */}
      {allCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-green-400">✅</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Upload Complete
              </h3>
              <div className="mt-2 text-sm text-green-700">
                All {progressItems.length} files have been successfully uploaded.
              </div>
            </div>
          </div>
        </div>
      )}

      {hasErrors && !hasActiveUploads && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Upload Errors
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {stats.error} file{stats.error !== 1 ? 's' : ''} failed to upload. 
                Please check the error messages below and retry if needed.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress items list */}
      <div className="space-y-3">
        {progressItems.map((progress, index) => (
          <UploadProgressItem
            key={`${progress.file.name}-${index}`}
            progress={progress}
            onRemove={onRemoveFile}
            onRetry={onRetryFile}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        {hasErrors && (
          <button
            onClick={() => {
              const errorFiles = progressItems
                .filter(item => item.status === 'error')
                .map(item => item.file);
              errorFiles.forEach(file => onRetryFile?.(file));
            }}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Retry Failed ({stats.error})
          </button>
        )}
        
        {(onRemoveFile && progressItems.length > 0) && (
          <button
            onClick={() => {
              const allFiles = progressItems.map(item => item.file);
              allFiles.forEach(file => onRemoveFile?.(file));
            }}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};

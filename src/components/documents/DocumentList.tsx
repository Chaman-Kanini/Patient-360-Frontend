import React from 'react';
import { UploadedDocument } from '../../types/document';
import { documentService } from '../../services/documentService';

interface DocumentListProps {
  documents: UploadedDocument[];
  onDownload?: (document: UploadedDocument) => void;
  onDelete?: (document: UploadedDocument) => void;
  onSelect?: (document: UploadedDocument) => void;
  selectedDocuments?: Set<string>;
  loading?: boolean;
  className?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDownload,
  onDelete,
  onSelect,
  selectedDocuments = new Set(),
  loading = false,
  className = ''
}) => {
  const handleSelectDocument = (document: UploadedDocument) => {
    onSelect?.(document);
  };

  const handleDownloadDocument = (document: UploadedDocument) => {
    onDownload?.(document);
  };

  const handleDeleteDocument = (document: UploadedDocument) => {
    onDelete?.(document);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'text-green-600 bg-green-100';
      case 'Processing':
        return 'text-blue-600 bg-blue-100';
      case 'Failed':
      case 'Rejected':
        return 'text-red-600 bg-red-100';
      case 'Pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'Validated':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading documents...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-12 text-center ${className}`}>
        <div className="text-4xl mb-4">📄</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No documents</h3>
        <p className="text-gray-600">
          No documents found. Upload your first document to get started.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {onSelect && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.size === documents.length && documents.length > 0}
                    onChange={() => {
                      if (selectedDocuments.size === documents.length) {
                        onSelect?.(null as any);
                      } else {
                        documents.forEach(doc => onSelect?.(doc));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Document
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uploaded
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((document) => (
              <tr key={document.id} className="hover:bg-gray-50">
                {onSelect && (
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.has(document.id)}
                      onChange={() => handleSelectDocument(document)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {documentService.getFileIcon(document.fileName)}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {document.fileName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {document.contentType}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {document.patientContext ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {document.patientContext.patientName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {document.patientContext.patientIdentifier}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No patient</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(document.status)}`}>
                    {document.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(document.uploadedAt)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {documentService.formatFileSize(document.fileSize)}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    {onDownload && (
                      <button
                        onClick={() => handleDownloadDocument(document)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Download"
                      >
                        ⬇️
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => handleDeleteDocument(document)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

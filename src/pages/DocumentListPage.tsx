import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { documentService } from '../services/documentService';
import { UploadedDocument } from '../types/document';

export const DocumentListPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const docs = await documentService.getDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentService.deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setSelectedDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const handleDownloadDocument = async (document: UploadedDocument) => {
    try {
      const blob = await documentService.downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.fileName;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document');
    }
  };

  const handleSelectDocument = (documentId: string) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedDocuments.size === filteredDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(filteredDocuments.map(doc => doc.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocuments.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedDocuments.size} document(s)?`)) {
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedDocuments).map(id => documentService.deleteDocument(id))
      );
      setDocuments(prev => prev.filter(doc => !selectedDocuments.has(doc.id)));
      setSelectedDocuments(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete documents');
    }
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

  // Filter and search logic
  const filteredDocuments = documents.filter(doc => {
    const matchesFilter = filter === 'all' || doc.status === filter;
    const matchesSearch = searchTerm === '' || 
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.patientContext?.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.patientContext?.patientIdentifier?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/dashboard" className="mr-4 p-2 text-gray-400 hover:text-gray-600">
                ← Back
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
                <p className="mt-2 text-gray-600">
                  Manage and view your uploaded clinical documents.
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/patient-contexts')}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
              >
                360 View
              </button>
              <button
                onClick={() => navigate('/documents/upload')}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
              >
                Upload New Document
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">❌</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-600 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-6 bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Documents
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by filename or patient..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="sm:w-48">
              <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Documents</option>
                <option value="Pending">Pending</option>
                <option value="Validated">Validated</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
                <option value="Failed">Failed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedDocuments.size > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-3">
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedDocuments(new Set())}
                  className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {documents.length === 0 ? 'No documents yet' : 'No matching documents'}
            </h3>
            <p className="text-gray-600 mb-6">
              {documents.length === 0 
                ? 'Upload your first clinical document to get started.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {documents.length === 0 && (
              <button
                onClick={() => navigate('/documents/upload')}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
              >
                Upload Document
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.size === filteredDocuments.length && filteredDocuments.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
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
                  {filteredDocuments.map((document) => (
                    <tr key={document.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedDocuments.has(document.id)}
                          onChange={() => handleSelectDocument(document.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
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
                          <button
                            onClick={() => handleDownloadDocument(document)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Download"
                          >
                            ⬇️
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(document.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
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

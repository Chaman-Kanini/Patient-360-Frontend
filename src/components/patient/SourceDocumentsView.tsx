import React, { useState } from 'react';
import { FileText, Calendar, FileCheck, Download, Eye } from 'lucide-react';
import { PdfViewerModal } from './PdfViewerModal';
import { patientService } from '../../services/patientService';

interface SourceDocumentsViewProps {
  documents?: any[];
  batchId?: string;
}

export const SourceDocumentsView: React.FC<SourceDocumentsViewProps> = ({ documents = [], batchId }) => {
  console.log('SourceDocumentsView received documents:', documents);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; name: string } | null>(null);
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isPdf = (fileName: string) => fileName.toLowerCase().endsWith('.pdf');

  const handleViewDocument = async (fileName: string) => {
    if (!batchId) return;
    
    if (!isPdf(fileName)) {
      // DOCX/DOC files can't be viewed inline — trigger download instead
      handleDownloadDocument(fileName);
      return;
    }

    try {
      const blob = await patientService.viewPdf(batchId, fileName);
      const blobUrl = URL.createObjectURL(blob);
      
      setSelectedPdf({ url: blobUrl, name: fileName });
      setViewerOpen(true);
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Failed to load document. Please try again.');
    }
  };

  const handleDownloadDocument = async (fileName: string) => {
    if (!batchId) return;
    
    try {
      const blob = await patientService.downloadPdf(batchId, fileName);
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    // Revoke the blob URL to free memory
    if (selectedPdf?.url.startsWith('blob:')) {
      URL.revokeObjectURL(selectedPdf.url);
    }
    setSelectedPdf(null);
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Source Documents</h3>
        <p className="text-gray-600">Source documents will appear here once uploaded and processed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="flex items-start p-6">
            <div className="p-3 bg-red-50 rounded-lg mr-4">
              <FileText className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {doc.name || doc.fileName || `Document ${index + 1}`}
              </h4>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                {doc.size && (
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    <span>{formatFileSize(doc.size)}</span>
                  </div>
                )}
                {doc.uploadedAt && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{formatDate(doc.uploadedAt)}</span>
                  </div>
                )}
                {doc.status && (
                  <div className="flex items-center">
                    <FileCheck className="h-4 w-4 mr-1" />
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      {doc.status}
                    </span>
                  </div>
                )}
              </div>
              {doc.description && (
                <p className="text-gray-700 text-sm">{doc.description}</p>
              )}
            </div>
            <div className="ml-4 flex space-x-2">
              {isPdf(doc.fileName || doc.name) ? (
                <button
                  onClick={() => handleViewDocument(doc.fileName || doc.name)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  title="View Document"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </button>
              ) : null}
              <button
                onClick={() => handleDownloadDocument(doc.fileName || doc.name)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                title="Download Document"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* PDF Viewer Modal */}
      {selectedPdf && (
        <PdfViewerModal
          isOpen={viewerOpen}
          onClose={handleCloseViewer}
          pdfUrl={selectedPdf.url}
          fileName={selectedPdf.name}
        />
      )}
    </div>
  );
};

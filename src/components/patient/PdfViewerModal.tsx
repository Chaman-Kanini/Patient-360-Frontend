import React from 'react';
import { X } from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  fileName: string;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ 
  isOpen, 
  onClose, 
  pdfUrl, 
  fileName 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative w-full h-full max-w-7xl max-h-screen p-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          title="Close PDF viewer"
        >
          <X className="h-6 w-6 text-gray-700" />
        </button>

        {/* PDF viewer */}
        <div className="w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{fileName}</h3>
            </div>
            
            {/* PDF iframe */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title={fileName}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

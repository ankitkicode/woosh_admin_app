import React from 'react';
import { X } from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  imageUrl: string;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ isOpen, onClose, title, imageUrl }) => {
  if (!isOpen) return null;

  // Since images are stored on localhost backend
  const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `http://localhost:5001${imageUrl}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body / Image */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50 flex items-center justify-center min-h-[400px]">
          {fullImageUrl.toLowerCase().endsWith('.pdf') ? (
            <iframe 
              src={fullImageUrl} 
              className="w-full h-[600px] rounded-lg shadow-sm border border-gray-200"
              title={title}
            />
          ) : (
            <img 
              src={fullImageUrl} 
              alt={title}
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm border border-gray-200"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f3f4f6/a1a1aa?text=Image+Not+Found';
              }}
            />
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};

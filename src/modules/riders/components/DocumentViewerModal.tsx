import React, { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';

export interface DocumentData {
  type: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  isVerified?: boolean;
}

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  documentData: DocumentData | null;
  onApprove?: (docType: string) => void;
  onReject?: (docType: string, reason: string) => void;
  isSubmitting?: boolean;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ 
  isOpen, onClose, title, documentData, onApprove, onReject, isSubmitting 
}) => {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (!isOpen || !documentData) return null;

  const fullImageUrl = documentData.url.startsWith('http') ? documentData.url : `http://localhost:5001${documentData.url}`;
  const isPdf = fullImageUrl.toLowerCase().endsWith('.pdf');

  const handleClose = () => {
    setRejectMode(false);
    setRejectReason('');
    onClose();
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim() || !onReject) return;
    onReject(documentData.type, rejectReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {documentData.status === 'approved' && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 uppercase">Approved</span>}
            {documentData.status === 'rejected' && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 uppercase">Rejected</span>}
            {documentData.status === 'pending' && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 uppercase">Pending</span>}
          </div>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-auto bg-gray-50 flex flex-col">
          {documentData.status === 'rejected' && documentData.rejectionReason && (
            <div className="bg-red-50 p-4 border-b border-red-100">
              <span className="font-bold text-red-800 text-sm block mb-1">Previous Rejection Reason:</span>
              <p className="text-red-700 text-sm">{documentData.rejectionReason}</p>
            </div>
          )}
          
          <div className="flex-1 flex items-center justify-center p-6 min-h-[400px]">
            {isPdf ? (
              <iframe src={fullImageUrl} className="w-full h-[600px] rounded-lg shadow-sm border border-gray-200" title={title} />
            ) : (
              <img 
                src={fullImageUrl} 
                alt={title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm border border-gray-200"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f3f4f6/a1a1aa?text=Image+Not+Found'; }}
              />
            )}
          </div>
        </div>
        
        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white">
          {rejectMode ? (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-gray-900">Provide Rejection Reason:</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="E.g., Document is blurry, incorrect name..."
                className="w-full border border-gray-300 rounded-xl p-3 h-24 focus:ring-2 focus:ring-red-500 focus:outline-none text-sm"
              />
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setRejectMode(false)}
                  className="px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRejectConfirm}
                  disabled={isSubmitting || !rejectReason.trim()}
                  className="px-4 py-2 font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Confirm Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <button onClick={handleClose} className="px-5 py-2 text-gray-600 hover:bg-gray-100 font-medium rounded-lg">
                  Close
                </button>
              </div>
              
              {onApprove && onReject && (
                <div className="flex gap-3">
                  <button 
                    onClick={() => setRejectMode(true)}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2 font-medium text-red-600 border border-red-200 bg-white hover:bg-red-50 disabled:opacity-50 rounded-lg"
                  >
                    <XCircle className="w-4 h-4" /> Reject Document
                  </button>
                  <button 
                    onClick={() => onApprove(documentData.type)}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2 font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Document
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

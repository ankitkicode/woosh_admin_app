import React, { useState } from 'react';
import { X, CheckCircle, XCircle, ExternalLink, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '../../../common/components/Button';

export interface DocumentData {
  type: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected' | 'PENDING' | 'APPROVED' | 'REJECTED';
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

const QUICK_REJECTION_REASONS = [
  'Blurry or unreadable document photo',
  'Document has expired',
  'Name does not match rider profile',
  'Image is cropped or incomplete',
  'Vehicle registration number mismatch',
  'Incorrect document type uploaded',
  'Document appears invalid or tampered'
];

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ 
  isOpen, onClose, title, documentData, onApprove, onReject, isSubmitting 
}) => {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (!isOpen || !documentData) return null;

  const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1').replace('/api/v1', '');
  const fullImageUrl = documentData.url?.startsWith('http') ? documentData.url : `${backendUrl}${documentData.url}`;
  const isPdf = documentData.url?.toLowerCase().endsWith('.pdf');
  const normalizedStatus = (documentData.status || 'PENDING').toLowerCase();

  const handleClose = () => {
    setRejectMode(false);
    setRejectReason('');
    onClose();
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim() || !onReject) return;
    onReject(documentData.type, rejectReason.trim());
  };

  const handleQuickReasonClick = (reason: string) => {
    setRejectReason(reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={handleClose} />
      
      {/* Modal Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {normalizedStatus === 'approved' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 uppercase flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Approved
              </span>
            )}
            {normalizedStatus === 'rejected' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 uppercase flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Rejected
              </span>
            )}
            {normalizedStatus === 'pending' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 uppercase">
                Pending Review
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {fullImageUrl && (
              <a
                href={fullImageUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Open Original</span>
              </a>
            )}
            <button 
              onClick={handleClose} 
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Body Content */}
        <div className="flex-1 overflow-auto bg-slate-900/5 flex flex-col">
          {normalizedStatus === 'rejected' && documentData.rejectionReason && (
            <div className="bg-red-50 p-4 border-b border-red-100 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-red-800 text-xs uppercase tracking-wide block mb-0.5">Rejection Reason</span>
                <p className="text-red-700 text-sm">{documentData.rejectionReason}</p>
              </div>
            </div>
          )}
          
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 min-h-[380px] bg-slate-950/5">
            {isPdf ? (
              <div className="w-full h-[540px] flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <iframe src={fullImageUrl} className="w-full flex-1" title={title} />
              </div>
            ) : documentData.url ? (
              <img 
                src={fullImageUrl} 
                alt={title}
                className="max-w-full max-h-[540px] object-contain rounded-xl shadow-sm border border-gray-200 bg-white"
                onError={(e) => { 
                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f3f4f6/a1a1aa?text=Document+Image+Not+Found'; 
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 py-12">
                <FileText className="w-12 h-12 mb-2" />
                <p className="text-sm">No document file available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white">
          {rejectMode ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Specify Rejection Reason:</p>
                <span className="text-xs text-gray-500">Select a preset or write custom reason</span>
              </div>

              {/* Quick tags */}
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REJECTION_REASONS.map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickReasonClick(reason)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      rejectReason === reason 
                        ? 'bg-red-50 border-red-300 text-red-700 font-semibold' 
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter detailed reason for rejecting this document..."
                rows={3}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-red-500 focus:outline-none text-sm resize-none"
              />

              <div className="flex justify-end gap-3 pt-1">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectMode(false)}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button 
                  size="sm"
                  onClick={handleRejectConfirm}
                  isLoading={isSubmitting}
                  disabled={isSubmitting || !rejectReason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white border-transparent"
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Confirm Reject
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Close
              </Button>
              
              {onApprove && onReject && (
                <div className="flex gap-3">
                  {normalizedStatus !== 'rejected' && (
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setRejectMode(true)}
                      disabled={isSubmitting}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" /> Reject Document
                    </Button>
                  )}
                  {normalizedStatus !== 'approved' && (
                    <Button 
                      size="sm"
                      onClick={() => onApprove(documentData.type)}
                      isLoading={isSubmitting}
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                    >
                      <CheckCircle className="w-4 h-4 mr-1.5" /> Approve Document
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

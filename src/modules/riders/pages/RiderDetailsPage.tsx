import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRiderById, approveRider, rejectRider, reviewRiderDocument, type RiderDetailsResponse } from '../api/ridersApi';
import { ArrowLeft, CheckCircle, XCircle, FileText, AlertCircle, Eye, Bike, ShieldCheck, Wallet } from 'lucide-react';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import type { DocumentData } from '../components/DocumentViewerModal';

export const RiderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [data, setData] = useState<RiderDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [docViewerData, setDocViewerData] = useState<{ title: string, data: DocumentData | null }>({ title: '', data: null });
  const [docReviewLoading, setDocReviewLoading] = useState(false);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetchRiderById(id);
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load rider details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleApprove = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await approveRider(id);
      loadData(); // Reload to get updated status
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectReason.trim()) return;
    try {
      setActionLoading(true);
      await rejectRider(id, rejectReason);
      setRejectModalOpen(false);
      loadData(); // Reload to get updated status
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const viewDocument = (title: string, doc: DocumentData) => {
    setDocViewerData({ title, data: doc });
    setDocViewerOpen(true);
  };

  const handleReviewDocument = async (docType: string, status: 'approved' | 'rejected', reason?: string) => {
    if (!id) return;
    try {
      setDocReviewLoading(true);
      await reviewRiderDocument(id, docType, status, reason);
      setDocViewerOpen(false);
      loadData(); // Reload to get updated document status
    } catch (err: any) {
      alert(err.message || 'Document review failed');
    } finally {
      setDocReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data?.profile) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Rider</h2>
        <p className="text-gray-500 mb-6">{error || 'Profile not found'}</p>
        <button onClick={() => navigate('/riders')} className="text-pink-600 font-medium hover:underline">
          &larr; Back to Riders List
        </button>
      </div>
    );
  }

  const { profile } = data;
  const user = profile.user || {};
  const checklist = profile.safetyChecklist || {};

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24">
      {/* Header Bar */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/riders')}
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Rider Profile
            {profile.kycStatus === 'approved' && <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 uppercase tracking-wider">Approved</span>}
            {profile.kycStatus === 'under_review' && <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">Review Pending</span>}
            {profile.kycStatus === 'rejected' && <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 uppercase tracking-wider">Rejected</span>}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Joined {new Date(user.createdAt || profile.createdAt).toLocaleDateString()}</p>
        </div>
        
        {/* Action Buttons (Right Aligned) */}
        {profile.kycStatus === 'under_review' && (
          <div className="ml-auto flex gap-3">
            <button 
              onClick={() => setRejectModalOpen(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-red-100 text-red-600 rounded-xl font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
            <button 
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 shadow-sm shadow-green-200 transition-all"
            >
              <CheckCircle className="w-4 h-4" /> Approve KYC
            </button>
          </div>
        )}
      </div>

      {profile.kycStatus === 'rejected' && profile.kycRejectionReason && (
        <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-800">Rejection Reason</h4>
            <p className="text-sm text-red-600 mt-1">{profile.kycRejectionReason}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal & Vehicle Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><FileText className="w-5 h-5 text-pink-500"/> Personal Details</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center text-pink-700 font-bold text-2xl">
                {user.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">{user.name || 'Not Provided'}</h4>
                <p className="text-gray-500 font-medium">{user.phoneNumber}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Email</span>
                <p className="text-gray-900">{user.email || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Status</span>
                <p className="text-gray-900 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {user.isActive ? 'Active Account' : 'Banned'}
                </p>
              </div>
            </div>
          </div>

          {/* Vehicle Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><Bike className="w-5 h-5 text-pink-500"/> Vehicle Details</h3>
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Vehicle Number</span>
                <div className="inline-block bg-yellow-100 border-2 border-yellow-400 px-3 py-1.5 rounded text-gray-900 font-mono font-bold">
                  {profile.vehicleNumber || '—'}
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Vehicle Model</span>
                <p className="text-gray-900 font-medium">{profile.vehicleModel || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Child Ride Capability</span>
                <p className="text-gray-900 font-medium">{profile.canAcceptChildRides ? 'Yes - Approved' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Safety Checklist */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-pink-500"/> Safety Checklist</h3>
            {checklist.checkedAt ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 mb-4">Last checked: {new Date(checklist.checkedAt).toLocaleString()}</p>
                {[
                  { label: 'Helmet Available', value: checklist.helmetAvailable },
                  { label: 'First Aid Kit', value: checklist.firstAidKitAvailable },
                  { label: 'Sanitary Pads', value: checklist.sanitaryPadsAvailable },
                  { label: 'Phone Battery Ok', value: checklist.phoneBatteryCheck },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.label}</span>
                    {item.value ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No checklist submitted yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: Documents & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center"><Wallet className="w-6 h-6 text-green-600"/></div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase">Wallet Balance</div>
                <div className="text-xl font-bold text-gray-900">₹{profile.walletBalance?.toFixed(2) || '0.00'}</div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center"><Bike className="w-6 h-6 text-pink-600"/></div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase">Total Rides</div>
                <div className="text-xl font-bold text-gray-900">{profile.totalRides || 0}</div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-amber-500"/></div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase">Rating</div>
                <div className="text-xl font-bold text-gray-900">{profile.rating?.toFixed(1) || '0.0'} ⭐</div>
              </div>
            </div>
          </div>

          {/* KYC Documents */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">KYC Documents Submitted</h3>
            {profile.documents && profile.documents.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profile.documents.map((doc: any, index: number) => {
                  const title = doc.type.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                  const imageUrl = doc.url.startsWith('http') ? doc.url : `http://localhost:5001${doc.url}`;
                  
                  const isPdf = doc.url.toLowerCase().endsWith('.pdf');
                  
                  return (
                    <div 
                      key={index}
                      onClick={() => viewDocument(title, doc)}
                      className="group cursor-pointer rounded-xl border border-gray-200 overflow-hidden hover:border-pink-500 hover:shadow-md transition-all relative"
                    >
                      <div className="absolute top-2 right-2 z-10">
                        {doc.status === 'approved' && <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase shadow-sm border border-green-200">Approved</span>}
                        {doc.status === 'rejected' && <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase shadow-sm border border-red-200">Rejected</span>}
                        {(!doc.status || doc.status === 'pending') && <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase shadow-sm border border-amber-200">Pending</span>}
                      </div>
                      
                      <div className="aspect-video bg-gray-100 relative flex items-center justify-center">
                        {isPdf ? (
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <FileText className="w-12 h-12 mb-2" />
                            <span className="text-xs font-semibold">PDF Document</span>
                          </div>
                        ) : (
                          <img 
                            src={imageUrl} 
                            alt={title}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/f3f4f6/a1a1aa?text=No+Preview'; }}
                          />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                        </div>
                      </div>
                      <div className="p-3 bg-white">
                        <div className="text-sm font-semibold text-gray-900 truncate pr-16">{title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{new Date(doc.uploadedAt || new Date()).toLocaleDateString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No documents uploaded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRejectModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Reject KYC</h3>
            <p className="text-sm text-gray-500 mb-6">Please provide a reason for rejecting this rider's KYC application. This will be shown to the rider.</p>
            
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Aadhaar card image is blurry, Driving License is expired..."
              className="w-full border border-gray-300 rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-pink-500 mb-6"
            />
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setRejectModalOpen(false)}
                className="px-5 py-2 font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
                className="px-5 py-2 font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewerModal 
        isOpen={docViewerOpen}
        onClose={() => setDocViewerOpen(false)}
        title={docViewerData.title}
        documentData={docViewerData.data}
        isSubmitting={docReviewLoading}
        onApprove={(docType) => handleReviewDocument(docType, 'approved')}
        onReject={(docType, reason) => handleReviewDocument(docType, 'rejected', reason)}
      />
    </div>
  );
};

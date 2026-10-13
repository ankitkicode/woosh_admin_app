import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRiderById, approveRider, rejectRider, reviewRiderDocument, deleteRider, type RiderDetailsResponse } from '../api/ridersApi';
import { ArrowLeft, CheckCircle, XCircle, FileText, AlertCircle, Eye, Bike, ShieldCheck, Wallet, Trash2, AlertTriangle, Edit3, Check } from 'lucide-react';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import type { DocumentData } from '../components/DocumentViewerModal';
import { Card, CardContent, CardHeader, CardTitle } from '../../../common/components/Card';
import { Button } from '../../../common/components/Button';
import { Badge } from '../../../common/components/Badge';
import { Modal } from '../../../common/components/Modal';
import { Textarea } from '../../../common/components/Textarea';
import { useToast } from '../../../common/components/Toast';
import { SkeletonCard } from '../../../common/components/Skeleton';
import { EmptyState } from '../../../common/components/EmptyState';
import { Avatar } from '../../../common/components/Avatar';

const QUICK_REJECTION_REASONS = [
  'Blurry or unreadable document photo',
  'Expired Driving License',
  'Invalid Vehicle Registration (RC)',
  'Aadhaar / Identity document mismatch',
  'Vehicle details mismatch with registration',
  'Incomplete KYC document submission',
  'Failed background verification'
];

export const RiderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [data, setData] = useState<RiderDetailsResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Approve modal state
  const [approveModalOpen, setApproveModalOpen] = useState(false);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Document viewer modal state
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [docViewerData, setDocViewerData] = useState<{ title: string, data: DocumentData | null }>({ title: '', data: null });
  const [docReviewLoading, setDocReviewLoading] = useState(false);

  const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1').replace('/api/v1', '');

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
      setApproveModalOpen(false);
      toast('success', 'Rider KYC approved successfully');
      await loadData();
    } catch (err: any) {
      toast('error', 'Approval failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id || !rejectReason.trim()) return;
    try {
      setActionLoading(true);
      await rejectRider(id, rejectReason.trim());
      setRejectModalOpen(false);
      setRejectReason('');
      toast('success', 'Rider KYC rejected successfully');
      await loadData();
    } catch (err: any) {
      toast('error', 'Rejection failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this rider and their associated user account? This action cannot be undone.')) return;
    try {
      setActionLoading(true);
      await deleteRider(id);
      toast('success', 'Rider deleted successfully');
      navigate('/riders');
    } catch (err: any) {
      toast('error', 'Deletion failed', err.message);
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
      toast('success', `Document ${status} successfully`);
      await loadData();
    } catch (err: any) {
      toast('error', 'Document review failed', err.message);
    } finally {
      setDocReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.profile) {
    return (
      <Card className="max-w-4xl mx-auto mt-12">
        <EmptyState
          icon={<AlertCircle className="w-12 h-12 text-woosh-error" />}
          title="Error Loading Rider"
          description={error || 'Profile not found'}
          actionLabel="Back to Riders List"
          onAction={() => navigate('/riders')}
        />
      </Card>
    );
  }

  const { profile } = data;
  const user = profile.user || {};
  const checklist = profile.safetyChecklist || {};
  const normalizedKycStatus = (profile.kycStatus || 'pending').toLowerCase();

  return (
    <div className="space-y-6 pb-24">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/riders')} className="px-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-woosh-dark">Rider Profile</h1>
              {normalizedKycStatus === 'approved' && <Badge variant="success" dot>Approved</Badge>}
              {normalizedKycStatus === 'under_review' && <Badge variant="warning" dot>Under Review</Badge>}
              {normalizedKycStatus === 'rejected' && <Badge variant="error" dot>Rejected</Badge>}
              {normalizedKycStatus === 'pending' && <Badge variant="neutral" dot>Pending Review</Badge>}
            </div>
            <p className="text-sm text-woosh-muted mt-0.5">
              Joined {new Date(user.createdAt || profile.createdAt).toLocaleDateString()} • ID: <span className="font-mono text-xs">{profile._id}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={actionLoading}
            className="text-woosh-error hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 size={16} /> Delete
          </Button>

          {/* If Pending or Under Review: Allow Approve and Reject */}
          {(normalizedKycStatus === 'under_review' || normalizedKycStatus === 'pending') && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectReason('');
                  setRejectModalOpen(true);
                }}
                disabled={actionLoading}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle size={16} className="mr-1.5" /> Reject KYC
              </Button>
              <Button
                size="sm"
                onClick={() => setApproveModalOpen(true)}
                isLoading={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-sm"
              >
                <CheckCircle size={16} className="mr-1.5" /> Approve KYC
              </Button>
            </>
          )}

          {/* If Approved: Allow Revoke / Reject */}
          {normalizedKycStatus === 'approved' && (
            <>
              <div className="hidden sm:inline-flex items-center px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Active & Verified
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectReason('');
                  setRejectModalOpen(true);
                }}
                disabled={actionLoading}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle size={16} className="mr-1.5" /> Revoke / Reject
              </Button>
            </>
          )}

          {/* If Rejected: Allow Re-Approve or Edit Rejection Reason */}
          {normalizedKycStatus === 'rejected' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRejectReason(profile.kycRejectionReason || '');
                  setRejectModalOpen(true);
                }}
                disabled={actionLoading}
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
              >
                <Edit3 size={16} className="mr-1.5" /> Edit Reason
              </Button>
              <Button
                size="sm"
                onClick={() => setApproveModalOpen(true)}
                isLoading={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-sm"
              >
                <CheckCircle size={16} className="mr-1.5" /> Re-Approve KYC
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Rejection Alert Banner */}
      {normalizedKycStatus === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-900">KYC Application Rejected</h4>
              <p className="text-sm text-red-700 mt-0.5">
                <span className="font-semibold">Reason:</span> {profile.kycRejectionReason || 'No specific reason provided.'}
              </p>
              <p className="text-xs text-red-500 mt-1">
                The rider has been notified in their app and cannot take rides until their profile is approved.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setApproveModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shrink-0"
          >
            <CheckCircle size={14} className="mr-1.5" /> Re-Approve KYC
          </Button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal & Vehicle Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2"><FileText className="w-4 h-4 text-woosh-primary" /> Personal Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Avatar
                  name={user.name || '?'}
                  size="lg"
                  src={profile.profileImage ? (profile.profileImage.startsWith('http') ? profile.profileImage : `${backendUrl}${profile.profileImage}`) : undefined}
                  fallbackIcon={<Bike size={32} />}
                />
                <div>
                  <h4 className="text-base font-bold text-woosh-dark">{user.name || 'Not Provided'}</h4>
                  <p className="text-sm text-woosh-muted font-medium mt-0.5">{user.phoneNumber}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-woosh-muted uppercase tracking-wider block mb-1">Email</span>
                  <p className="text-sm text-woosh-dark">{user.email || '—'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-woosh-muted uppercase tracking-wider block mb-1">Account Status</span>
                  <div className="mt-1">
                    <Badge variant={user.isActive ? 'success' : 'error'} dot>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold text-woosh-muted uppercase tracking-wider block mb-1">Online Status</span>
                  <div className="mt-1">
                    <Badge variant={profile.isOnline ? 'success' : 'neutral'} dot>
                      {profile.isOnline ? 'Online (Accepting rides)' : 'Offline'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Card */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2"><Bike className="w-4 h-4 text-woosh-primary" /> Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div>
                  <span className="text-xs font-semibold text-woosh-muted uppercase tracking-wider block mb-2">Vehicle Number</span>
                  <div className="inline-block bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-md text-woosh-dark font-mono font-bold text-sm">
                    {profile.vehicleNumber || '—'}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold text-woosh-muted uppercase tracking-wider block mb-1">Vehicle Model</span>
                  <p className="text-sm text-woosh-dark font-medium">{profile.vehicleModel || '—'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-woosh-muted uppercase tracking-wider block mb-1">Child Ride Capability</span>
                  <div className="mt-1">
                    {profile.canAcceptChildRides ? (
                      <Badge variant="success">Yes - Approved</Badge>
                    ) : (
                      <Badge variant="neutral">No</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Checklist */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-woosh-primary" /> Safety Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              {checklist.checkedAt ? (
                <div className="space-y-4">
                  <p className="text-xs text-woosh-muted mb-2">Last checked: {new Date(checklist.checkedAt).toLocaleString()}</p>
                  {[
                    { label: 'Helmet Available', value: checklist.helmetAvailable },
                    { label: 'First Aid Kit', value: checklist.firstAidKitAvailable },
                    { label: 'Sanitary Pads', value: checklist.sanitaryPadsAvailable },
                    { label: 'Phone Battery Ok', value: checklist.phoneBatteryCheck },
                    { label: 'Face Verified', value: checklist.faceVerified },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between pb-2 border-b border-woosh-divider last:border-0 last:pb-0">
                      <span className="text-sm text-woosh-dark">{item.label}</span>
                      {item.value ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-woosh-muted italic">No checklist submitted yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Documents & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center"><Wallet className="w-6 h-6 text-emerald-600" /></div>
                <div>
                  <div className="text-xs font-semibold text-woosh-muted uppercase tracking-wider mb-1">Wallet Balance</div>
                  <div className="text-xl font-bold text-woosh-dark">₹{profile.walletBalance?.toFixed(2) || '0.00'}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-woosh-primary-light rounded-xl flex items-center justify-center"><Bike className="w-6 h-6 text-woosh-primary" /></div>
                <div>
                  <div className="text-xs font-semibold text-woosh-muted uppercase tracking-wider mb-1">Total Rides</div>
                  <div className="text-xl font-bold text-woosh-dark">{profile.totalRides || 0}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-amber-500" /></div>
                <div>
                  <div className="text-xs font-semibold text-woosh-muted uppercase tracking-wider mb-1">Rating</div>
                  <div className="text-xl font-bold text-woosh-dark">{profile.rating?.toFixed(1) || '0.0'} ⭐</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KYC Documents */}
          <Card>
            <CardHeader className="py-4 border-b border-woosh-divider flex flex-row items-center justify-between">
              <div>
                <CardTitle>KYC Documents Submitted</CardTitle>
                <p className="text-xs text-woosh-muted mt-0.5">Click any document to inspect full preview or verify individually</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
                {profile.documents?.length || 0} Document(s)
              </span>
            </CardHeader>
            <CardContent className="pt-5">
              {profile.documents && profile.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {profile.documents.map((doc: any, index: number) => {
                    const title = doc.type ? doc.type.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : 'Document';
                    const imageUrl = doc.url ? (doc.url.startsWith('http') ? doc.url : `${backendUrl}${doc.url}`) : '';
                    const isPdf = doc.url ? doc.url.toLowerCase().endsWith('.pdf') : false;
                    const docStatus = (doc.status || 'pending').toLowerCase();

                    return (
                      <div
                        key={index}
                        className="group rounded-xl border border-woosh-border overflow-hidden hover:border-woosh-primary hover:shadow-md transition-all relative flex flex-col bg-white"
                      >
                        <div className="absolute top-2 right-2 z-10 pointer-events-none">
                          {docStatus === 'approved' && <Badge variant="success">Approved</Badge>}
                          {docStatus === 'rejected' && <Badge variant="error">Rejected</Badge>}
                          {docStatus === 'pending' && <Badge variant="warning">Pending</Badge>}
                        </div>

                        {/* Thumbnail */}
                        <div 
                          onClick={() => viewDocument(title, doc)}
                          className="aspect-video bg-woosh-surface relative flex items-center justify-center border-b border-woosh-divider cursor-pointer"
                        >
                          {isPdf ? (
                            <div className="flex flex-col items-center justify-center text-woosh-placeholder">
                              <FileText className="w-10 h-10 mb-2 text-indigo-500" />
                              <span className="text-xs font-semibold text-gray-700">PDF Document</span>
                            </div>
                          ) : imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={title}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/f8fafc/94a3b8?text=No+Preview'; }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400">
                              <FileText className="w-8 h-8 mb-1" />
                              <span className="text-xs">No File</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <span className="px-3 py-1.5 rounded-lg bg-black/75 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 drop-shadow-md">
                              <Eye className="w-3.5 h-3.5" /> Inspect
                            </span>
                          </div>
                        </div>

                        {/* Info & Quick Actions */}
                        <div className="p-3 bg-white flex-1 flex flex-col justify-between">
                          <div>
                            <div className="text-sm font-semibold text-woosh-dark truncate pr-16" title={title}>{title}</div>
                            {docStatus === 'rejected' && doc.rejectionReason && (
                              <p className="text-xs text-red-600 line-clamp-1 mt-1 font-medium" title={doc.rejectionReason}>
                                Reason: {doc.rejectionReason}
                              </p>
                            )}
                          </div>
                          
                          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => viewDocument(title, doc)}
                              className="text-xs text-woosh-primary font-medium hover:underline flex items-center gap-1"
                            >
                              <Eye size={12} /> View Full
                            </button>

                            <div className="flex items-center gap-1.5">
                              {docStatus !== 'approved' && (
                                <button
                                  type="button"
                                  title="Approve Document"
                                  onClick={() => handleReviewDocument(doc.type, 'approved')}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                >
                                  <CheckCircle size={15} />
                                </button>
                              )}
                              {docStatus !== 'rejected' && (
                                <button
                                  type="button"
                                  title="Reject Document"
                                  onClick={() => viewDocument(title, doc)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                  <XCircle size={15} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={<FileText className="w-10 h-10 text-woosh-placeholder" />}
                  title="No documents uploaded"
                  description="This rider has not uploaded any KYC documents yet."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section: Recent Rides & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Rides */}
        <Card>
          <CardHeader className="py-4">
            <CardTitle>Recent Rides</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentRides && data.recentRides.length > 0 ? (
              <div className="divide-y divide-woosh-divider">
                {data.recentRides.map((ride: any) => (
                  <div key={ride._id} className="p-4 flex items-center justify-between hover:bg-woosh-surface/50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-woosh-dark">
                        {new Date(ride.createdAt).toLocaleDateString()} at {new Date(ride.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-woosh-muted mt-0.5 truncate max-w-[200px] sm:max-w-[300px]">
                        {ride.pickup?.address || 'Pickup'} → {ride.drop?.address || 'Drop'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-woosh-dark">₹{ride.finalFare || ride.estimatedFare || 0}</p>
                      <Badge variant={ride.status === 'completed' ? 'success' : ride.status === 'cancelled' ? 'error' : 'info'}>
                        {ride.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-woosh-muted italic">No recent rides found.</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="py-4">
            <CardTitle>Wallet Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentTransactions && data.recentTransactions.length > 0 ? (
              <div className="divide-y divide-woosh-divider">
                {data.recentTransactions.map((tx: any) => (
                  <div key={tx._id} className="p-4 flex items-center justify-between hover:bg-woosh-surface/50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-woosh-dark flex items-center gap-2">
                        {tx.type === 'credit' ? <span className="text-emerald-500 text-lg">+</span> : <span className="text-red-500 text-lg">-</span>}
                        {tx.description || tx.type}
                      </p>
                      <p className="text-xs text-woosh-muted mt-0.5">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-woosh-dark'}`}>
                        ₹{tx.amount?.toFixed(2)}
                      </p>
                      <Badge variant={tx.status === 'success' ? 'success' : tx.status === 'failed' ? 'error' : 'neutral'}>
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-woosh-muted italic">No recent transactions.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approve Confirmation Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Approve Rider KYC Application"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setApproveModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleApprove} 
              isLoading={actionLoading} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
            >
              <CheckCircle size={16} className="mr-1.5" /> Confirm & Approve
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-900">
              <p className="font-bold">Are you sure you want to approve this rider?</p>
              <p className="mt-1 text-emerald-800 text-xs leading-relaxed">
                Approving this profile will automatically verify all submitted KYC documents, mark the user's role as active rider, and send an instant push notification permitting them to go online and accept ride bookings.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-3.5 rounded-xl text-xs space-y-2 border border-gray-100">
            <div className="flex justify-between">
              <span className="text-gray-500">Rider Name:</span>
              <span className="font-semibold text-gray-900">{user.name || 'Not Provided'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone Number:</span>
              <span className="font-semibold text-gray-900">{user.phoneNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Vehicle Number:</span>
              <span className="font-mono font-bold text-gray-900">{profile.vehicleNumber || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Documents Attached:</span>
              <span className="font-semibold text-gray-900">{profile.documents?.length || 0}</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject KYC Application"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setRejectModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleReject} 
              isLoading={actionLoading} 
              disabled={actionLoading || !rejectReason.trim()} 
              className="bg-red-600 hover:bg-red-700 border-transparent text-white"
            >
              <XCircle size={16} className="mr-1.5" /> Confirm Rejection
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-woosh-muted">
            Please provide a specific reason for rejecting this rider's KYC application. This reason will be shown to the rider in their mobile app to explain why their profile was rejected and what to re-submit.
          </p>

          <div>
            <span className="text-xs font-semibold text-gray-700 block mb-2">Quick Rejection Reason Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REJECTION_REASONS.map((reason, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRejectReason(reason)}
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
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Detailed Reason (Required):</label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Aadhaar card image is blurry, Driving License has expired, Vehicle registration number does not match..."
              rows={4}
            />
          </div>
        </div>
      </Modal>

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

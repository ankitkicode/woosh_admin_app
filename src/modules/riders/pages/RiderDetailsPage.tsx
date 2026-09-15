import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchRiderById, approveRider, rejectRider, reviewRiderDocument, deleteRider, type RiderDetailsResponse } from '../api/ridersApi';
import { ArrowLeft, CheckCircle, XCircle, FileText, AlertCircle, Eye, Bike, ShieldCheck, Wallet, Trash2 } from 'lucide-react';
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

export const RiderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
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
      toast('success', 'Rider approved successfully');
      loadData(); // Reload to get updated status
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
      await rejectRider(id, rejectReason);
      setRejectModalOpen(false);
      toast('success', 'Rider application rejected');
      loadData(); // Reload to get updated status
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
      loadData(); // Reload to get updated document status
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

  return (
    <div className="space-y-6 pb-24">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/riders')} className="px-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-woosh-dark flex items-center gap-3">
              Rider Profile
              {profile.kycStatus === 'approved' && <Badge variant="success" dot>Approved</Badge>}
              {profile.kycStatus === 'under_review' && <Badge variant="warning" dot>Review Pending</Badge>}
              {profile.kycStatus === 'rejected' && <Badge variant="error" dot>Rejected</Badge>}
              {profile.kycStatus === 'pending' && <Badge variant="neutral" dot>Pending</Badge>}
            </h1>
            <p className="text-sm text-woosh-muted mt-0.5">Joined {new Date(user.createdAt || profile.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleDelete}
            disabled={actionLoading}
            className="text-woosh-error hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 size={16} /> Delete
          </Button>
          
          {profile.kycStatus === 'under_review' && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setRejectModalOpen(true)}
                disabled={actionLoading}
                className="text-woosh-error border-woosh-error hover:bg-red-50"
              >
                <XCircle size={16} /> Reject
              </Button>
              <Button 
                size="sm"
                onClick={handleApprove}
                isLoading={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
              >
                <CheckCircle size={16} /> Approve KYC
              </Button>
            </>
          )}
        </div>
      </div>

      {profile.kycStatus === 'rejected' && profile.kycRejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">
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
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2"><FileText className="w-4 h-4 text-woosh-primary"/> Personal Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Avatar 
                  name={user.name || '?'} 
                  size="lg" 
                  src={profile.profileImage ? (profile.profileImage.startsWith('http') ? profile.profileImage : `http://localhost:5001${profile.profileImage}`) : undefined} 
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
                      {user.isActive ? 'Active' : 'Banned'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Card */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2"><Bike className="w-4 h-4 text-woosh-primary"/> Vehicle Details</CardTitle>
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
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-woosh-primary"/> Safety Checklist</CardTitle>
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
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center"><Wallet className="w-6 h-6 text-emerald-600"/></div>
                <div>
                  <div className="text-xs font-semibold text-woosh-muted uppercase tracking-wider mb-1">Wallet Balance</div>
                  <div className="text-xl font-bold text-woosh-dark">₹{profile.walletBalance?.toFixed(2) || '0.00'}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-woosh-primary-light rounded-xl flex items-center justify-center"><Bike className="w-6 h-6 text-woosh-primary"/></div>
                <div>
                  <div className="text-xs font-semibold text-woosh-muted uppercase tracking-wider mb-1">Total Rides</div>
                  <div className="text-xl font-bold text-woosh-dark">{profile.totalRides || 0}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-amber-500"/></div>
                <div>
                  <div className="text-xs font-semibold text-woosh-muted uppercase tracking-wider mb-1">Rating</div>
                  <div className="text-xl font-bold text-woosh-dark">{profile.rating?.toFixed(1) || '0.0'} ⭐</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KYC Documents */}
          <Card>
            <CardHeader className="py-5">
              <CardTitle>KYC Documents Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.documents && profile.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {profile.documents.map((doc: any, index: number) => {
                    const title = doc.type.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                    const imageUrl = doc.url.startsWith('http') ? doc.url : `http://localhost:5001${doc.url}`;
                    const isPdf = doc.url.toLowerCase().endsWith('.pdf');
                    
                    return (
                      <div 
                        key={index}
                        onClick={() => viewDocument(title, doc)}
                        className="group cursor-pointer rounded-xl border border-woosh-border overflow-hidden hover:border-woosh-primary hover:shadow-md transition-all relative"
                      >
                        <div className="absolute top-2 right-2 z-10">
                          {doc.status === 'approved' && <Badge variant="success">Approved</Badge>}
                          {doc.status === 'rejected' && <Badge variant="error">Rejected</Badge>}
                          {(!doc.status || doc.status === 'pending') && <Badge variant="warning">Pending</Badge>}
                        </div>
                        
                        <div className="aspect-video bg-woosh-surface relative flex items-center justify-center border-b border-woosh-divider">
                          {isPdf ? (
                            <div className="flex flex-col items-center justify-center text-woosh-placeholder">
                              <FileText className="w-10 h-10 mb-2" />
                              <span className="text-xs font-semibold">PDF Document</span>
                            </div>
                          ) : (
                            <img 
                              src={imageUrl} 
                              alt={title}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x300/f8fafc/94a3b8?text=No+Preview'; }}
                            />
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                          </div>
                        </div>
                        <div className="p-3 bg-white">
                          <div className="text-sm font-semibold text-woosh-dark truncate pr-16">{title}</div>
                          <div className="text-xs text-woosh-muted mt-0.5">{new Date(doc.uploadedAt || new Date()).toLocaleDateString()}</div>
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
                        {new Date(ride.createdAt).toLocaleDateString()} at {new Date(ride.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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

      {/* Rejection Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject KYC Application"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleReject} disabled={actionLoading || !rejectReason.trim()} className="bg-red-600 hover:bg-red-700 border-transparent text-white">
              Confirm Rejection
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-woosh-muted">Please provide a reason for rejecting this rider's KYC application. This will be shown to the rider.</p>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Aadhaar card image is blurry, Driving License is expired..."
            rows={4}
          />
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

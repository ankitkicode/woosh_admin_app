import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchRiderById,
  approveRider,
  rejectRider,
  reviewRiderDocument,
  deleteRider,
  toggleRiderOnlineStatus,
  updateRiderProfile,
  uploadRiderDocument,
  uploadRiderAvatar,
  type RiderDetailsResponse
} from '../api/ridersApi';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
  Eye,
  Bike,
  ShieldCheck,
  Wallet,
  Trash2,
  AlertTriangle,
  Edit3,
  Upload,
  Camera,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Shield,
  User,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Navigation,
  Sliders,
  Award,
  TrendingUp,
  Volume2,
  Radio
} from 'lucide-react';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import type { DocumentData } from '../components/DocumentViewerModal';
import { Card, CardContent, CardHeader, CardTitle } from '../../../common/components/Card';
import { Button } from '../../../common/components/Button';
import { Badge } from '../../../common/components/Badge';
import { Modal } from '../../../common/components/Modal';
import { Input } from '../../../common/components/Input';
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

// All 9 standard Woosh KYC Document Categories
const ALL_KYC_DOCUMENT_TYPES = [
  { type: 'aadhaar', label: 'Aadhaar Card', description: 'National ID proof (Front / Back)' },
  { type: 'driving_license', label: 'Driving License', description: 'Valid 2-wheeler / transport motor driving license' },
  { type: 'pan', label: 'PAN Card', description: 'Income Tax Permanent Account Number' },
  { type: 'rc_book', label: 'RC Book (Registration)', description: 'Official vehicle registration certificate' },
  { type: 'vehicle_insurance', label: 'Vehicle Insurance', description: 'Active comprehensive / 3rd party insurance' },
  { type: 'puc', label: 'Pollution Certificate (PUC)', description: 'Pollution under control emission compliance' },
  { type: 'police_verification', label: 'Police Verification', description: 'Police clearance report / character certificate' },
  { type: 'face_verification', label: 'Face Verification', description: 'Biometric selfie face scan' },
  { type: 'selfie_verification', label: 'Profile / Vehicle Selfie', description: 'Live selfie photo with helmet/vehicle' },
];

export const RiderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [data, setData] = useState<RiderDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Active Tab state: 'documents' | 'personal' | 'vehicle' | 'safety' | 'trips'
  const [activeTab, setActiveTab] = useState<'documents' | 'personal' | 'vehicle' | 'safety' | 'trips'>('documents');

  // Approve modal state
  const [approveModalOpen, setApproveModalOpen] = useState(false);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Document viewer modal state
  const [docViewerOpen, setDocViewerOpen] = useState(false);
  const [docViewerData, setDocViewerData] = useState<{ title: string; data: DocumentData | null }>({ title: '', data: null });

  // Edit Profile Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    phoneNumber: string;
    email: string;
    gender: string;
    dateOfBirth: string;
    city: string;
    state: string;
    isActive: boolean;
    vehicleNumber: string;
    vehicleModel: string;
    vehicleColor: string;
    vehicleType: string;
    canAcceptChildRides: boolean;
    areas: string;
    walletBalance: number;
    maxPickupDistance: number;
    acceptCashRides: boolean;
    rideRequestSound: boolean;
    language: string;
    payoutSchedule: string;
    shareEveryTrip: boolean;
    stopRequestsAfter10PM: boolean;
    rideCheck: boolean;
    recordAudioOnSOS: boolean;
  }>({
    name: '',
    phoneNumber: '',
    email: '',
    gender: 'female',
    dateOfBirth: '',
    city: '',
    state: '',
    isActive: true,
    vehicleNumber: '',
    vehicleModel: '',
    vehicleColor: '',
    vehicleType: 'scooter',
    canAcceptChildRides: false,
    areas: '',
    walletBalance: 0,
    maxPickupDistance: 3,
    acceptCashRides: true,
    rideRequestSound: true,
    language: 'English',
    payoutSchedule: 'WEEKLY',
    shareEveryTrip: false,
    stopRequestsAfter10PM: false,
    rideCheck: true,
    recordAudioOnSOS: false,
  });

  // Direct Document Upload State
  const [uploadTargetDocType, setUploadTargetDocType] = useState<string | null>(null);
  const [uploadTargetDocLabel, setUploadTargetDocLabel] = useState<string>('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const [docUploadStatus, setDocUploadStatus] = useState<'APPROVED' | 'PENDING'>('APPROVED');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Avatar upload ref
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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

  // Sync edit form with current data
  const handleOpenEditModal = () => {
    if (!data?.profile) return;
    const { profile } = data;
    const user = profile.user || {};
    const prefs = profile.preferences || {};
    const safetyPrefs = profile.safetyPreferences || {};

    setEditFormData({
      name: user.name || '',
      phoneNumber: user.phoneNumber || '',
      email: user.email || '',
      gender: 'female', // Woosh is strictly female riders
      dateOfBirth: user.dateOfBirth || '',
      city: user.city || '',
      state: user.state || '',
      isActive: user.isActive !== undefined ? user.isActive : true,
      vehicleNumber: profile.vehicleNumber || '',
      vehicleModel: profile.vehicleModel || '',
      vehicleColor: profile.vehicleColor || '',
      vehicleType: profile.vehicleType || 'scooter',
      canAcceptChildRides: Boolean(profile.canAcceptChildRides),
      areas: Array.isArray(profile.areas) ? profile.areas.join(', ') : profile.areas || '',
      walletBalance: profile.walletBalance || 0,
      maxPickupDistance: prefs.maxPickupDistance ?? 3,
      acceptCashRides: prefs.acceptCashRides ?? true,
      rideRequestSound: prefs.rideRequestSound ?? true,
      language: prefs.language || 'English',
      payoutSchedule: prefs.payoutSchedule || 'WEEKLY',
      shareEveryTrip: safetyPrefs.shareEveryTrip ?? false,
      stopRequestsAfter10PM: safetyPrefs.stopRequestsAfter10PM ?? false,
      rideCheck: safetyPrefs.rideCheck ?? true,
      recordAudioOnSOS: safetyPrefs.recordAudioOnSOS ?? false,
    });
    setEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setEditSubmitting(true);
      await updateRiderProfile(id, {
        name: editFormData.name,
        phoneNumber: editFormData.phoneNumber,
        email: editFormData.email,
        dateOfBirth: editFormData.dateOfBirth,
        city: editFormData.city,
        state: editFormData.state,
        isActive: editFormData.isActive,
        vehicleNumber: editFormData.vehicleNumber,
        vehicleModel: editFormData.vehicleModel,
        vehicleColor: editFormData.vehicleColor,
        vehicleType: editFormData.vehicleType,
        canAcceptChildRides: editFormData.canAcceptChildRides,
        areas: editFormData.areas,
        walletBalance: editFormData.walletBalance,
        preferences: {
          maxPickupDistance: editFormData.maxPickupDistance,
          acceptCashRides: editFormData.acceptCashRides,
          rideRequestSound: editFormData.rideRequestSound,
          language: editFormData.language,
          payoutSchedule: editFormData.payoutSchedule,
        },
        safetyPreferences: {
          shareEveryTrip: editFormData.shareEveryTrip,
          stopRequestsAfter10PM: editFormData.stopRequestsAfter10PM,
          rideCheck: editFormData.rideCheck,
          recordAudioOnSOS: editFormData.recordAudioOnSOS,
        }
      });
      toast('success', 'Rider profile updated successfully');
      setEditModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast('error', 'Update failed', err.message || 'Failed to update profile');
    } finally {
      setEditSubmitting(false);
    }
  };

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

  const handleToggleOnline = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await toggleRiderOnlineStatus(id);
      toast('success', `Rider status updated successfully`);
      await loadData();
    } catch (err: any) {
      toast('error', 'Status toggle failed', err.message);
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
      await reviewRiderDocument(id, docType, status, reason);
      setDocViewerOpen(false);
      toast('success', `Document ${status} successfully`);
      await loadData();
    } catch (err: any) {
      toast('error', 'Document review failed', err.message);
    }
  };

  // Open Document Upload Modal
  const openDocUpload = (docType: string, label: string) => {
    setUploadTargetDocType(docType);
    setUploadTargetDocLabel(label);
    setSelectedDocFile(null);
    setDocUploadStatus('APPROVED');
    setUploadModalOpen(true);
  };

  const handleUploadDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !uploadTargetDocType || !selectedDocFile) {
      toast('error', 'Please choose a document file to upload');
      return;
    }
    try {
      setIsUploadingDoc(true);
      await uploadRiderDocument(id, uploadTargetDocType, selectedDocFile, docUploadStatus);
      toast('success', `${uploadTargetDocLabel} uploaded and set to ${docUploadStatus}`);
      setUploadModalOpen(false);
      setSelectedDocFile(null);
      await loadData();
    } catch (err: any) {
      toast('error', 'Upload failed', err.message || 'Could not upload document');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Avatar upload handler
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    try {
      setIsUploadingAvatar(true);
      await uploadRiderAvatar(id, file);
      toast('success', 'Rider profile avatar updated successfully');
      await loadData();
    } catch (err: any) {
      toast('error', 'Avatar upload failed', err.message || 'Could not upload image');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
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
  const preferences = profile.preferences || {};
  const safetyPreferences = profile.safetyPreferences || {};
  const normalizedKycStatus = (profile.kycStatus || 'pending').toLowerCase();
  const emergencyContacts = user.emergencyContacts || [];

  // Acceptance rate calculation
  const totalRequests = profile.totalRideRequests || 0;
  const acceptedRides = profile.acceptedRides || 0;
  const acceptanceRate = totalRequests > 0 ? ((acceptedRides / totalRequests) * 100).toFixed(0) : '100';

  // GPS coordinates
  const hasGps = profile.currentLocation?.coordinates && profile.currentLocation.coordinates.length === 2;
  const [lng, lat] = hasGps ? profile.currentLocation.coordinates : [0, 0];

  return (
    <div className="space-y-6 pb-24">
      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* ─────────────────────────────────────────────────────────────
          TOP HEADER BAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/riders')} className="px-2 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>

          {/* Avatar with Camera upload button */}
          <div className="relative group shrink-0">
            <Avatar
              name={user.name || '?'}
              size="lg"
              src={profile.profileImage ? (profile.profileImage.startsWith('http') ? profile.profileImage : `${backendUrl}${profile.profileImage}`) : undefined}
              fallbackIcon={<Bike size={32} />}
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              title="Change Profile Photo"
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-woosh-primary text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer border-2 border-white"
            >
              {isUploadingAvatar ? <RefreshCw size={12} className="animate-spin" /> : <Camera size={13} />}
            </button>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-woosh-dark">{user.name || 'Rider Profile'}</h1>
              {normalizedKycStatus === 'approved' && <Badge variant="success" dot>KYC Approved</Badge>}
              {normalizedKycStatus === 'under_review' && <Badge variant="warning" dot>Under Review</Badge>}
              {normalizedKycStatus === 'rejected' && <Badge variant="error" dot>KYC Rejected</Badge>}
              {normalizedKycStatus === 'pending' && <Badge variant="neutral" dot>Pending Review</Badge>}
              
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-700 border border-pink-200 flex items-center gap-1">
                <Sparkles size={11} /> Female Partner (Woosh Queen)
              </span>

              {profile.isOnline ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Online Radar
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                  Offline
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-woosh-muted mt-1.5 font-medium">
              <span className="flex items-center gap-1 text-gray-700 font-bold">
                <Phone size={12} className="text-woosh-primary" /> {user.phoneNumber || '—'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Mail size={12} className="text-gray-400" /> {user.email || 'No email registered'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-gray-400" /> {[user.city, user.state].filter(Boolean).join(', ') || 'Madhya Pradesh'}
              </span>
              <span>•</span>
              <span>ID: <code className="font-mono text-gray-500">{profile._id}</code></span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Edit Profile Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenEditModal}
            className="text-gray-700 hover:text-woosh-primary hover:bg-pink-50 border-gray-300 font-bold"
          >
            <Edit3 size={15} className="mr-1.5 text-woosh-primary" /> Edit Profile
          </Button>

          {/* Toggle Online/Offline */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleOnline}
            disabled={actionLoading}
            className="text-gray-700 hover:bg-gray-50"
          >
            <Radio size={14} className={`mr-1.5 ${profile.isOnline ? 'text-emerald-600' : 'text-gray-400'}`} />
            {profile.isOnline ? 'Set Offline' : 'Set Online'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={actionLoading}
            className="text-woosh-error hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 size={16} /> Delete
          </Button>

          {/* KYC State Action Buttons */}
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
                <XCircle size={15} className="mr-1.5" /> Reject KYC
              </Button>
              <Button
                size="sm"
                onClick={() => setApproveModalOpen(true)}
                isLoading={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-sm"
              >
                <CheckCircle size={15} className="mr-1.5" /> Approve KYC
              </Button>
            </>
          )}

          {normalizedKycStatus === 'approved' && (
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
              <XCircle size={15} className="mr-1.5" /> Revoke / Reject
            </Button>
          )}

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
                <Edit3 size={15} className="mr-1.5" /> Edit Reason
              </Button>
              <Button
                size="sm"
                onClick={() => setApproveModalOpen(true)}
                isLoading={actionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-sm"
              >
                <CheckCircle size={15} className="mr-1.5" /> Re-Approve KYC
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Rejection Alert Banner if Rejected */}
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
                The rider cannot accept rides until their KYC profile or documents are re-approved.
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

      {/* ─────────────────────────────────────────────────────────────
          KPI & METRICS STATS BAR (ALL KEY OPERATIONAL VALUES)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3.5 bg-emerald-50/60 border-emerald-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
              <Wallet size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Wallet Balance</span>
              <span className="text-base font-black text-gray-900">₹{profile.walletBalance?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 bg-indigo-50/60 border-indigo-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total Earnings</span>
              <span className="text-base font-black text-gray-900">₹{profile.totalEarnings?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 bg-pink-50/60 border-pink-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-pink-100 text-pink-700 rounded-xl flex items-center justify-center shrink-0">
              <Bike size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Completed Rides</span>
              <span className="text-base font-black text-gray-900">{profile.totalRides || 0}</span>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 bg-amber-50/60 border-amber-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
              <Award size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Rating ({profile.totalRatings || 0})</span>
              <span className="text-base font-black text-gray-900">{profile.rating?.toFixed(1) || '5.0'} ⭐</span>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 bg-blue-50/60 border-blue-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shrink-0">
              <Sliders size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Acceptance Rate</span>
              <span className="text-base font-black text-gray-900">{acceptanceRate}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 bg-purple-50/60 border-purple-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Duty Online</span>
              <span className="text-base font-black text-gray-900">{profile.onlineHours || 0} hrs</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION NAVIGATION TABS (SEE ALL INFORMATION ORGANIZED)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'documents'
              ? 'bg-woosh-primary text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <FileText size={14} />
          KYC Documents ({profile.documents?.length || 0} / {ALL_KYC_DOCUMENT_TYPES.length})
        </button>

        <button
          onClick={() => setActiveTab('personal')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'personal'
              ? 'bg-woosh-primary text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <User size={14} />
          Personal Details & Emergency Contacts ({emergencyContacts.length})
        </button>

        <button
          onClick={() => setActiveTab('vehicle')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'vehicle'
              ? 'bg-woosh-primary text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Bike size={14} />
          Vehicle, Zones & Live GPS
        </button>

        <button
          onClick={() => setActiveTab('safety')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'safety'
              ? 'bg-woosh-primary text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <ShieldCheck size={14} />
          Safety Checklist & App Settings
        </button>

        <button
          onClick={() => setActiveTab('trips')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'trips'
              ? 'bg-woosh-primary text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Wallet size={14} />
          Trips & Wallet Ledger
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: KYC DOCUMENTS (ALL 9 TILES WITH ACTIONS)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'documents' && (
        <Card>
          <CardHeader className="py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-woosh-primary" />
                Rider KYC Verification Matrix
              </CardTitle>
              <p className="text-xs text-woosh-muted mt-0.5">
                Every document can be previewed, approved, rejected, or uploaded directly on behalf of the female rider partner.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 bg-pink-50 text-woosh-primary rounded-full border border-pink-200">
                {profile.documents?.length || 0} of {ALL_KYC_DOCUMENT_TYPES.length} Submitted
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {ALL_KYC_DOCUMENT_TYPES.map((docDef) => {
                const existingDoc = (profile.documents || []).find((d: any) => d.type === docDef.type);
                const isUploaded = Boolean(existingDoc && existingDoc.url);
                const docStatus = (existingDoc?.status || 'pending').toLowerCase();
                const imageUrl = isUploaded ? (existingDoc.url.startsWith('http') ? existingDoc.url : `${backendUrl}${existingDoc.url}`) : '';
                const isPdf = isUploaded && existingDoc.url.toLowerCase().endsWith('.pdf');

                return (
                  <div
                    key={docDef.type}
                    className={`group rounded-xl border overflow-hidden transition-all flex flex-col justify-between bg-white ${
                      isUploaded
                        ? docStatus === 'approved'
                          ? 'border-emerald-200 hover:shadow-md'
                          : docStatus === 'rejected'
                          ? 'border-red-200 hover:shadow-md'
                          : 'border-amber-200 hover:shadow-md'
                        : 'border-dashed border-gray-300 bg-gray-50/50 hover:border-woosh-primary/50'
                    }`}
                  >
                    {/* Top Thumbnail or Placeholder */}
                    <div className="aspect-video relative bg-slate-100 flex items-center justify-center border-b border-gray-100 overflow-hidden">
                      {isUploaded ? (
                        <>
                          {isPdf ? (
                            <div className="flex flex-col items-center justify-center text-indigo-500">
                              <FileText size={36} />
                              <span className="text-[11px] font-bold text-gray-700 mt-1">PDF File</span>
                            </div>
                          ) : (
                            <img
                              src={imageUrl}
                              alt={docDef.label}
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                              onClick={() => viewDocument(docDef.label, existingDoc)}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/400x250/f8fafc/94a3b8?text=Preview+Error';
                              }}
                            />
                          )}

                          {/* Status Pill on top right */}
                          <div className="absolute top-2 right-2 z-10 pointer-events-none">
                            {docStatus === 'approved' && <Badge variant="success">Approved</Badge>}
                            {docStatus === 'rejected' && <Badge variant="error">Rejected</Badge>}
                            {docStatus === 'pending' && <Badge variant="warning">Pending</Badge>}
                          </div>

                          {/* Hover inspect overlay */}
                          <div
                            onClick={() => viewDocument(docDef.label, existingDoc)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                          >
                            <span className="text-xs font-bold text-white bg-black/60 px-2.5 py-1 rounded-md flex items-center gap-1">
                              <Eye size={12} /> Inspect
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                          <Upload size={24} className="mb-1 text-gray-300" />
                          <span className="text-xs font-semibold text-gray-500">Not Uploaded</span>
                          <span className="text-[10px] text-gray-400">Missing document</span>
                        </div>
                      )}
                    </div>

                    {/* Content & Actions */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 truncate" title={docDef.label}>
                          {docDef.label}
                        </h4>
                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{docDef.description}</p>
                        {isUploaded && docStatus === 'rejected' && existingDoc.rejectionReason && (
                          <p className="text-[11px] font-semibold text-red-600 line-clamp-1 mt-1" title={existingDoc.rejectionReason}>
                            Reason: {existingDoc.rejectionReason}
                          </p>
                        )}
                      </div>

                      {/* Action buttons footer */}
                      <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5">
                        {isUploaded ? (
                          <>
                            <button
                              type="button"
                              onClick={() => viewDocument(docDef.label, existingDoc)}
                              className="text-xs font-bold text-woosh-primary hover:underline flex items-center gap-1"
                            >
                              <Eye size={12} /> View
                            </button>

                            <div className="flex items-center gap-1">
                              {/* Replace Document */}
                              <button
                                type="button"
                                onClick={() => openDocUpload(docDef.type, docDef.label)}
                                title="Upload / Replace Document"
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Upload size={14} />
                              </button>

                              {/* Approve */}
                              {docStatus !== 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => handleReviewDocument(docDef.type, 'approved')}
                                  title="Approve Document"
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                >
                                  <CheckCircle size={15} />
                                </button>
                              )}

                              {/* Reject */}
                              {docStatus !== 'rejected' && (
                                <button
                                  type="button"
                                  onClick={() => viewDocument(docDef.label, existingDoc)}
                                  title="Reject Document"
                                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                  <XCircle size={15} />
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDocUpload(docDef.type, docDef.label)}
                            className="w-full text-xs py-1 h-auto text-woosh-primary border-pink-200 hover:bg-pink-50 font-bold"
                          >
                            <Upload size={12} className="mr-1" /> + Upload Document
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: PERSONAL DETAILS & EMERGENCY CONTACTS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'personal' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Detailed Personal Information Card */}
          <Card>
            <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-woosh-primary" /> Full Personal Information
              </CardTitle>
              <button
                onClick={handleOpenEditModal}
                className="text-xs font-semibold text-woosh-primary hover:underline flex items-center gap-1"
              >
                <Edit3 size={13} /> Edit
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Legal Name</span>
                <span className="font-bold text-gray-900">{user.name || 'Not Provided'}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Registered Phone</span>
                <span className="font-bold text-gray-900 font-mono">{user.phoneNumber || '—'}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</span>
                <span className="font-medium text-gray-800">{user.email || '—'}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gender Policy</span>
                <span className="px-2.5 py-0.5 bg-pink-50 border border-pink-200 text-pink-700 font-bold rounded text-xs flex items-center gap-1">
                  <Sparkles size={11} /> Female Fleet Partner Only
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date of Birth</span>
                <span className="font-medium text-gray-900">{user.dateOfBirth || '—'}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">City</span>
                <span className="font-medium text-gray-900">{user.city || '—'}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">State</span>
                <span className="font-medium text-gray-900">{user.state || 'Madhya Pradesh'}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Active</span>
                <Badge variant={user.isActive ? 'success' : 'error'} dot>
                  {user.isActive ? 'Active (Permitted)' : 'Disabled / Suspended'}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aadhaar Verified</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${user.isAadhaarVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                  {user.isAadhaarVerified ? '✓ Identity Verified' : '✗ Unverified'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Biometric Face Scan</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${user.isFaceVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                  {user.isFaceVerified ? '✓ Biometric Match' : '✗ Pending'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Security MPIN</span>
                <span className="text-xs font-medium text-gray-700">
                  {user.isMpinSet ? '✓ MPIN Configured' : '✗ Not Set'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Registration Date</span>
                <span className="text-xs font-medium text-gray-600">
                  {new Date(user.createdAt || profile.createdAt).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contacts Directory */}
          <Card>
            <CardHeader className="py-4 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Emergency SOS Contacts ({emergencyContacts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <p className="text-xs text-gray-500">
                Contacts notified immediately when this rider triggers an SOS alert or unexpected stop during trips.
              </p>

              {emergencyContacts.length > 0 ? (
                <div className="space-y-2.5">
                  {emergencyContacts.map((c: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                          {c.isPrimary && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                              PRIMARY
                            </span>
                          )}
                          <span className="text-xs text-gray-500 capitalize bg-gray-200/60 px-2 py-0.5 rounded-full">
                            {c.relationship || 'other'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 font-mono mt-1 flex items-center gap-1">
                          <Phone size={12} className="text-gray-400" /> {c.phoneNumber}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {c.sendSosAlerts && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full border border-red-200">
                            SOS Alert ON
                          </span>
                        )}
                        {c.autoShareRides && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                            Auto Trip Share
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400 border border-dashed rounded-xl">
                  <Shield size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-semibold">No Emergency Contacts Registered</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Rider has not yet added SOS emergency contacts in their mobile app.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: VEHICLE, OPERATING ZONES & LIVE GPS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'vehicle' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicle Profile Card */}
          <Card>
            <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-woosh-primary" /> Vehicle & Fleet Details
              </CardTitle>
              <button
                onClick={handleOpenEditModal}
                className="text-xs font-semibold text-woosh-primary hover:underline flex items-center gap-1"
              >
                <Edit3 size={13} /> Edit
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Vehicle Registration Plate (HSRP)
                </span>
                <div className="inline-block bg-amber-100 border-2 border-amber-400 px-4 py-2 rounded-xl text-gray-900 font-mono font-black text-lg tracking-widest shadow-xs">
                  {profile.vehicleNumber || 'NOT ASSIGNED'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Vehicle Model</span>
                  <p className="font-bold text-gray-900">{profile.vehicleModel || '—'}</p>
                </div>

                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Body Color</span>
                  <p className="font-bold text-gray-900 capitalize">{profile.vehicleColor || '—'}</p>
                </div>

                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Vehicle Type</span>
                  <p className="font-bold text-gray-900 capitalize">{profile.vehicleType || 'Scooter'}</p>
                </div>

                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Child Ride Certification</span>
                  <Badge variant={profile.canAcceptChildRides ? 'success' : 'neutral'}>
                    {profile.canAcceptChildRides ? '✓ Certified for School/Child Rides' : 'Standard Trips Only'}
                  </Badge>
                </div>
              </div>

              {/* Operating Zones */}
              <div className="pt-3 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Permitted Operating Localities / Areas</span>
                {Array.isArray(profile.areas) && profile.areas.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.areas.map((area: string, i: number) => (
                      <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-pink-50 text-pink-700 border border-pink-200">
                        {area}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">All city zones permitted (No restrictions configured).</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live GPS Radar & Coordinates Card */}
          <Card>
            <CardHeader className="py-4 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-indigo-600" />
                Live GPS Radar & Telematics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio size={14} className={profile.isOnline ? 'text-emerald-500 animate-pulse' : 'text-gray-400'} />
                    GPS Telematics Signal
                  </span>
                  <Badge variant={profile.isOnline ? 'success' : 'neutral'}>
                    {profile.isOnline ? 'Broadcasting Location' : 'Rider Offline'}
                  </Badge>
                </div>

                {hasGps ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-white p-2 rounded-lg border border-indigo-100">
                        <span className="text-gray-400 block text-[10px]">LATITUDE</span>
                        <span className="font-bold text-gray-900">{lat}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-indigo-100">
                        <span className="text-gray-400 block text-[10px]">LONGITUDE</span>
                        <span className="font-bold text-gray-900">{lng}</span>
                      </div>
                    </div>

                    <a
                      href={`https://www.google.com/maps?q=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 hover:shadow-xs mt-2"
                    >
                      <ExternalLink size={12} /> Open in Google Maps
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No GPS coordinates recorded yet. Coordinates update when rider goes online.</p>
                )}
              </div>

              <div className="text-xs text-gray-500 space-y-1.5 pt-1">
                <p>• Online hours logged: <strong>{profile.onlineHours || 0} hours</strong></p>
                <p>• Max pickup radius: <strong>{preferences.maxPickupDistance || 3} km</strong></p>
                <p>• Cash trips accepted: <strong>{preferences.acceptCashRides ? 'Yes' : 'No'}</strong></p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: SAFETY CHECKLIST & APP PREFERENCES
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'safety' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Safety Checklist Card */}
          <Card>
            <CardHeader className="py-4 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Daily Fleet Safety Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {checklist.checkedAt ? (
                <>
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                    <Calendar size={13} /> Last inspection: {new Date(checklist.checkedAt).toLocaleString()}
                  </p>
                  {[
                    { label: 'Passenger & Rider Helmet Available', value: checklist.helmetAvailable },
                    { label: 'Emergency First Aid Kit Onboard', value: checklist.firstAidKitAvailable },
                    { label: 'Sanitary Pads Emergency Kit', value: checklist.sanitaryPadsAvailable },
                    { label: 'Phone Battery Level Sufficient (> 20%)', value: checklist.phoneBatteryCheck },
                    { label: 'Morning Biometric Face Verification', value: checklist.faceVerified },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="text-xs font-semibold text-gray-800">{item.label}</span>
                      {item.value ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle size={13} /> Compliant
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <XCircle size={13} /> Non-compliant
                        </span>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div className="p-6 text-center text-gray-400 border border-dashed rounded-xl">
                  <ShieldCheck size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-semibold">No Daily Checklist Submitted Today</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Checklist resets every morning when the rider begins their shift.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Operational & Safety Preferences Card */}
          <Card>
            <CardHeader className="py-4 border-b border-gray-100 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-woosh-primary" />
                Driver Preferences & Safety Rules
              </CardTitle>
              <button
                onClick={handleOpenEditModal}
                className="text-xs font-semibold text-woosh-primary hover:underline flex items-center gap-1"
              >
                <Edit3 size={13} /> Configure
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-gray-700 uppercase tracking-wider mb-2">Driver Operational Settings</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Max Pickup Radius:</span>
                    <span className="font-bold text-gray-900">{preferences.maxPickupDistance || 3} km</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Accept Cash on Delivery:</span>
                    <span className="font-bold text-gray-900">{preferences.acceptCashRides ? 'Yes (Accepted)' : 'No (Digital Only)'}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Incoming Ride Audio Alert:</span>
                    <span className="font-bold text-gray-900">{preferences.rideRequestSound ? 'Sound Enabled' : 'Muted'}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">App Interface Language:</span>
                    <span className="font-bold text-gray-900">{preferences.language || 'English'}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Earnings Payout Schedule:</span>
                    <span className="font-bold text-gray-900">{preferences.payoutSchedule || 'WEEKLY'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <h4 className="font-bold text-gray-700 uppercase tracking-wider mb-2">Safety & Night Protection Rules</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Auto Share Every Trip with Family:</span>
                    <span className={`font-bold ${safetyPreferences.shareEveryTrip ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {safetyPreferences.shareEveryTrip ? '✓ Active' : 'Off'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Stop Requests After 10:00 PM:</span>
                    <span className={`font-bold ${safetyPreferences.stopRequestsAfter10PM ? 'text-purple-700' : 'text-gray-500'}`}>
                      {safetyPreferences.stopRequestsAfter10PM ? '✓ Active (Night Curfew)' : 'Off'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Safety RideCheck (Route Deviation / Hault):</span>
                    <span className={`font-bold ${safetyPreferences.rideCheck ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {safetyPreferences.rideCheck ? '✓ Active' : 'Off'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Auto Record Audio on SOS:</span>
                    <span className={`font-bold ${safetyPreferences.recordAudioOnSOS ? 'text-red-700' : 'text-gray-500'}`}>
                      {safetyPreferences.recordAudioOnSOS ? '✓ Active' : 'Off'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: RECENT TRIPS & WALLET TRANSACTIONS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'trips' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Rides */}
          <Card>
            <CardHeader className="py-4 border-b border-gray-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Bike className="w-4 h-4 text-woosh-primary" /> Recent Trips & Bookings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.recentRides && data.recentRides.length > 0 ? (
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {data.recentRides.map((ride: any) => (
                    <div key={ride._id} className="p-3.5 flex items-center justify-between text-xs hover:bg-gray-50/50">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">{new Date(ride.createdAt).toLocaleDateString()}</span>
                          <span className="text-[10px] text-gray-400">{new Date(ride.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {ride.passenger?.name && (
                            <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.2 rounded">
                              Passenger: {ride.passenger.name}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 truncate max-w-[240px]">
                          <strong>From:</strong> {ride.pickup?.address || 'Pickup'}
                        </p>
                        <p className="text-gray-600 truncate max-w-[240px]">
                          <strong>To:</strong> {ride.drop?.address || 'Drop'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-gray-900 text-sm">₹{ride.finalFare || ride.estimatedFare || 0}</p>
                        <Badge variant={ride.status === 'completed' ? 'success' : ride.status === 'cancelled' ? 'error' : 'info'}>
                          {ride.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-8 text-center text-xs text-gray-400 italic">No trips recorded for this rider.</p>
              )}
            </CardContent>
          </Card>

          {/* Wallet Ledger */}
          <Card>
            <CardHeader className="py-4 border-b border-gray-100 flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" /> Wallet Transactions
              </CardTitle>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Current: ₹{profile.walletBalance?.toFixed(2) || '0.00'}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {data.recentTransactions && data.recentTransactions.length > 0 ? (
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {data.recentTransactions.map((tx: any) => (
                    <div key={tx._id} className="p-3.5 flex items-center justify-between text-xs hover:bg-gray-50/50">
                      <div>
                        <p className="font-bold text-gray-900 flex items-center gap-1">
                          {tx.type === 'credit' ? <span className="text-emerald-600 font-bold">+</span> : <span className="text-red-500 font-bold">-</span>}
                          {tx.description || tx.type}
                        </p>
                        <p className="text-gray-400 text-[10px] mt-0.5">
                          {new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <p className={`font-black text-sm ${tx.type === 'credit' ? 'text-emerald-600' : 'text-gray-900'}`}>
                        ₹{tx.amount?.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-8 text-center text-xs text-gray-400 italic">No wallet transactions recorded.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: Edit Profile Modal (Admin Dynamic Control)
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Rider Profile (Admin Control)"
        description="Update personal information, vehicle registration, operating preferences, and safety rules for this partner."
        maxWidth="4xl"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="outline" size="sm" onClick={() => setEditModalOpen(false)} disabled={editSubmitting}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveProfile}
              isLoading={editSubmitting}
              className="bg-woosh-primary hover:bg-woosh-primary-hover text-white shadow-sm font-bold px-5"
            >
              Save Profile Changes
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveProfile} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 text-xs">
          {/* Section 1: Personal Info Card */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center">
                  <User size={14} />
                </span>
                Personal Information
              </h4>
              <span className="text-[11px] font-bold text-pink-700 bg-pink-50 border border-pink-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={11} /> Female Fleet Partner
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Full Legal Name</label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="e.g. Rani Ahirwar"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Mobile Phone Number</label>
                <Input
                  value={editFormData.phoneNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                  placeholder="10 digit phone number"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Email Address</label>
                <Input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="rider@example.com"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Date of Birth</label>
                <Input
                  type="date"
                  value={editFormData.dateOfBirth}
                  onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">City</label>
                <Input
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  placeholder="e.g. Bhopal"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">State</label>
                <Input
                  value={editFormData.state}
                  onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                  placeholder="e.g. Madhya Pradesh"
                />
              </div>

              {/* Account Active Toggle Card */}
              <div
                onClick={() => setEditFormData({ ...editFormData, isActive: !editFormData.isActive })}
                className="sm:col-span-2 lg:col-span-3 flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-200 hover:border-woosh-primary/50 cursor-pointer transition-all shadow-2xs"
              >
                <div className="pr-4">
                  <span className="font-bold text-gray-900 block text-xs">Account Active Status</span>
                  <span className="text-[11px] text-gray-500">Enable to allow the rider to sign in, receive dispatch orders, and access the partner app.</span>
                </div>
                <input
                  type="checkbox"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="w-5 h-5 text-woosh-primary rounded cursor-pointer shrink-0 accent-pink-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Vehicle & Fleet Specifications */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <div className="border-b border-slate-200 pb-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Bike size={14} />
                </span>
                Vehicle & Fleet Information
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Vehicle Registration Plate (HSRP)</label>
                <Input
                  value={editFormData.vehicleNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, vehicleNumber: e.target.value })}
                  placeholder="e.g. MP04AB1234"
                  className="font-mono uppercase font-black tracking-wider"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Vehicle Model</label>
                <Input
                  value={editFormData.vehicleModel}
                  onChange={(e) => setEditFormData({ ...editFormData, vehicleModel: e.target.value })}
                  placeholder="e.g. Honda Activa 6G"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Vehicle Color</label>
                <Input
                  value={editFormData.vehicleColor}
                  onChange={(e) => setEditFormData({ ...editFormData, vehicleColor: e.target.value })}
                  placeholder="e.g. Matte Black / Red"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Vehicle Type</label>
                <select
                  value={editFormData.vehicleType}
                  onChange={(e) => setEditFormData({ ...editFormData, vehicleType: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-woosh-primary bg-white h-9"
                >
                  <option value="scooter">Scooter (2-Wheeler)</option>
                  <option value="bike">Motorbike</option>
                  <option value="auto">Auto Rickshaw</option>
                  <option value="cab">Cab / Car</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Wallet Balance Adjustment (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editFormData.walletBalance}
                  onChange={(e) => setEditFormData({ ...editFormData, walletBalance: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>

              <div
                onClick={() => setEditFormData({ ...editFormData, canAcceptChildRides: !editFormData.canAcceptChildRides })}
                className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-woosh-primary/50 cursor-pointer transition-all shadow-2xs"
              >
                <div className="pr-2">
                  <span className="font-bold text-gray-900 block text-xs">Child Ride Certified</span>
                  <span className="text-[10px] text-gray-500">Permit school and minor passenger trips</span>
                </div>
                <input
                  type="checkbox"
                  checked={editFormData.canAcceptChildRides}
                  onChange={(e) => setEditFormData({ ...editFormData, canAcceptChildRides: e.target.checked })}
                  className="w-5 h-5 text-woosh-primary rounded cursor-pointer shrink-0 accent-pink-600"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="font-bold text-gray-700 block mb-1">Permitted Operating Localities / Areas</label>
                <Input
                  value={editFormData.areas}
                  onChange={(e) => setEditFormData({ ...editFormData, areas: e.target.value })}
                  placeholder="e.g. MP Nagar, Kolar Road, Arera Hills, New Market, Hoshangabad Road"
                />
                <span className="text-[10px] text-gray-400 block mt-1">Separate multiple zone names with commas. Leave blank to permit all city zones.</span>
              </div>
            </div>
          </div>

          {/* Section 3: Driver Operational Preferences */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <div className="border-b border-slate-200 pb-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Sliders size={14} />
                </span>
                Driver Operational Preferences
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Maximum Pickup Radius (km)</label>
                <Input
                  type="number"
                  value={editFormData.maxPickupDistance}
                  onChange={(e) => setEditFormData({ ...editFormData, maxPickupDistance: Number(e.target.value) || 3 })}
                  placeholder="e.g. 3 or 5"
                />
                <span className="text-[10px] text-gray-400 block mt-1">Rider will only receive dispatches within this distance.</span>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Payout Schedule</label>
                <select
                  value={editFormData.payoutSchedule}
                  onChange={(e) => setEditFormData({ ...editFormData, payoutSchedule: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-woosh-primary bg-white h-9"
                >
                  <option value="WEEKLY">Weekly Settlement (Standard)</option>
                  <option value="DAILY">Daily Fast Payout</option>
                </select>
                <span className="text-[10px] text-gray-400 block mt-1">Controls automated banking payout cycles.</span>
              </div>

              {/* Accept Cash Rides Toggle Card */}
              <div
                onClick={() => setEditFormData({ ...editFormData, acceptCashRides: !editFormData.acceptCashRides })}
                className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-200 hover:border-woosh-primary/50 cursor-pointer transition-all shadow-2xs"
              >
                <div className="pr-3">
                  <span className="font-bold text-gray-900 block text-xs">Accept Cash on Delivery Rides</span>
                  <span className="text-[10px] text-gray-500">Allow accepting rides where passengers pay in cash at drop.</span>
                </div>
                <input
                  type="checkbox"
                  checked={editFormData.acceptCashRides}
                  onChange={(e) => setEditFormData({ ...editFormData, acceptCashRides: e.target.checked })}
                  className="w-5 h-5 text-woosh-primary rounded cursor-pointer shrink-0 accent-pink-600"
                />
              </div>

              {/* Ride Request Sound Alert Toggle Card */}
              <div
                onClick={() => setEditFormData({ ...editFormData, rideRequestSound: !editFormData.rideRequestSound })}
                className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-200 hover:border-woosh-primary/50 cursor-pointer transition-all shadow-2xs"
              >
                <div className="pr-3">
                  <span className="font-bold text-gray-900 block text-xs flex items-center gap-1.5">
                    <Volume2 size={13} className="text-woosh-primary" /> Incoming Ride Sound Alert
                  </span>
                  <span className="text-[10px] text-gray-500">Play continuous loud audio chime when a ride request arrives.</span>
                </div>
                <input
                  type="checkbox"
                  checked={editFormData.rideRequestSound}
                  onChange={(e) => setEditFormData({ ...editFormData, rideRequestSound: e.target.checked })}
                  className="w-5 h-5 text-woosh-primary rounded cursor-pointer shrink-0 accent-pink-600"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Safety & Night Protection Rules */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-4">
            <div className="border-b border-slate-200 pb-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck size={14} />
                </span>
                Safety & Night Fleet Protection Rules
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setEditFormData({ ...editFormData, stopRequestsAfter10PM: !editFormData.stopRequestsAfter10PM })}
                className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-200 hover:border-woosh-primary/50 cursor-pointer transition-all shadow-2xs"
              >
                <div className="pr-3">
                  <span className="font-bold text-gray-900 block text-xs">Stop Requests After 10:00 PM</span>
                  <span className="text-[11px] text-gray-500">Night shift curfew protection to restrict night rides.</span>
                </div>
                <input
                  type="checkbox"
                  checked={editFormData.stopRequestsAfter10PM}
                  onChange={(e) => setEditFormData({ ...editFormData, stopRequestsAfter10PM: e.target.checked })}
                  className="w-5 h-5 text-woosh-primary rounded cursor-pointer shrink-0 accent-pink-600"
                />
              </div>

              <div
                onClick={() => setEditFormData({ ...editFormData, shareEveryTrip: !editFormData.shareEveryTrip })}
                className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-200 hover:border-woosh-primary/50 cursor-pointer transition-all shadow-2xs"
              >
                <div className="pr-3">
                  <span className="font-bold text-gray-900 block text-xs">Auto Share Every Trip with Family</span>
                  <span className="text-[11px] text-gray-500">Automatically broadcast live trip route to emergency contacts.</span>
                </div>
                <input
                  type="checkbox"
                  checked={editFormData.shareEveryTrip}
                  onChange={(e) => setEditFormData({ ...editFormData, shareEveryTrip: e.target.checked })}
                  className="w-5 h-5 text-woosh-primary rounded cursor-pointer shrink-0 accent-pink-600"
                />
              </div>

              <div
                onClick={() => setEditFormData({ ...editFormData, rideCheck: !editFormData.rideCheck })}
                className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-200 hover:border-woosh-primary/50 cursor-pointer transition-all shadow-2xs"
              >
                <div className="pr-3">
                  <span className="font-bold text-gray-900 block text-xs">Safety RideCheck (Route Deviation / Halt)</span>
                  <span className="text-[11px] text-gray-500">Detect unexpected stops or unusual routing deviations in real-time.</span>
                </div>
                <input
                  type="checkbox"
                  checked={editFormData.rideCheck}
                  onChange={(e) => setEditFormData({ ...editFormData, rideCheck: e.target.checked })}
                  className="w-5 h-5 text-woosh-primary rounded cursor-pointer shrink-0 accent-pink-600"
                />
              </div>

              <div
                onClick={() => setEditFormData({ ...editFormData, recordAudioOnSOS: !editFormData.recordAudioOnSOS })}
                className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-200 hover:border-woosh-primary/50 cursor-pointer transition-all shadow-2xs"
              >
                <div className="pr-3">
                  <span className="font-bold text-gray-900 block text-xs">Auto Record Audio on SOS Alert</span>
                  <span className="text-[11px] text-gray-500">Record mic audio during an emergency to assist dispatch operators.</span>
                </div>
                <input
                  type="checkbox"
                  checked={editFormData.recordAudioOnSOS}
                  onChange={(e) => setEditFormData({ ...editFormData, recordAudioOnSOS: e.target.checked })}
                  className="w-5 h-5 text-woosh-primary rounded cursor-pointer shrink-0 accent-pink-600"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: Upload / Replace KYC Document Modal
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title={`Upload Document: ${uploadTargetDocLabel}`}
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setUploadModalOpen(false)} disabled={isUploadingDoc}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUploadDocumentSubmit}
              isLoading={isUploadingDoc}
              disabled={!selectedDocFile}
              className="bg-woosh-primary hover:bg-woosh-primary-hover text-white font-bold"
            >
              Upload & Save Document
            </Button>
          </>
        }
      >
        <form onSubmit={handleUploadDocumentSubmit} className="space-y-4">
          <p className="text-xs text-gray-600">
            Select a clear image (JPG, PNG, WEBP) or PDF for <strong>{uploadTargetDocLabel}</strong> to save directly into the rider's profile.
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-woosh-primary transition-colors bg-gray-50/50">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              id="doc-upload-input"
              accept="image/*,application/pdf"
              onChange={(e) => setSelectedDocFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <label
              htmlFor="doc-upload-input"
              className="inline-block px-4 py-2 bg-white border border-gray-300 hover:border-woosh-primary rounded-lg text-xs font-bold text-gray-700 cursor-pointer shadow-2xs hover:text-woosh-primary"
            >
              Choose File from Computer
            </label>
            {selectedDocFile ? (
              <p className="text-xs font-bold text-emerald-600 mt-2">
                Selected: {selectedDocFile.name} ({(selectedDocFile.size / 1024).toFixed(1)} KB)
              </p>
            ) : (
              <p className="text-[11px] text-gray-400 mt-1">Supports PNG, JPG, PDF up to 5MB</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Initial Verification Status</label>
            <select
              value={docUploadStatus}
              onChange={(e) => setDocUploadStatus(e.target.value as 'APPROVED' | 'PENDING')}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-woosh-primary bg-white"
            >
              <option value="APPROVED">Directly Mark as APPROVED (Recommended)</option>
              <option value="PENDING">Mark as PENDING (Review Later)</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: Approve KYC Confirmation Modal (Preserved)
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Approve Rider KYC Application"
        maxWidth="lg"
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

      {/* ─────────────────────────────────────────────────────────────
          MODAL 4: Rejection Modal (Preserved with quick reasons)
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject KYC Application"
        maxWidth="lg"
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

      {/* ─────────────────────────────────────────────────────────────
          MODAL 5: Document Viewer Modal (Preserved)
      ───────────────────────────────────────────────────────────── */}
      <DocumentViewerModal
        isOpen={docViewerOpen}
        onClose={() => setDocViewerOpen(false)}
        title={docViewerData.title}
        documentData={docViewerData.data}
        isSubmitting={actionLoading}
        onApprove={(docType) => handleReviewDocument(docType, 'approved')}
        onReject={(docType, reason) => handleReviewDocument(docType, 'rejected', reason)}
      />
    </div>
  );
};

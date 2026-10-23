import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Send,
  Ban,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Wallet,
  Baby,
  ChevronRight,
  AlertTriangle,
  Trash2,
  FileText,
  ShieldCheck,
  Shield,
  Navigation,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../common/components/Card';
import { Badge } from '../../../common/components/Badge';
import { Button } from '../../../common/components/Button';
import { Modal } from '../../../common/components/Modal';
import { Textarea } from '../../../common/components/Textarea';
import { Input } from '../../../common/components/Input';
import { SkeletonCard } from '../../../common/components/Skeleton';
import { EmptyState } from '../../../common/components/EmptyState';
import { Avatar } from '../../../common/components/Avatar';
import { useToast } from '../../../common/components/Toast';
import {
  fetchPassengerById,
  deletePassenger,
  toggleBanPassenger,
  sendPassengerPush,
  type PassengerDetailsResponse,
} from '../api/passengersApi';

export const PassengerDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [data, setData] = useState<PassengerDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Send Direct Push Modal State
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [pushType, setPushType] = useState('GENERAL');
  const [isSendingPush, setIsSendingPush] = useState(false);

  // Ban/Unban Confirmation Modal State
  const [banModalOpen, setBanModalOpen] = useState(false);

  const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1').replace('/api/v1', '');

  const loadPassengerDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetchPassengerById(id);
      if (!res?.user) {
        setError('Passenger not found');
        return;
      }
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load passenger details');
      toast('error', 'Failed to load passenger details', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPassengerDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !data?.user) return;
    if (!window.confirm(`Are you sure you want to delete ${data.user.name || 'this passenger'} and their associated user account? This action cannot be undone.`)) {
      return;
    }
    try {
      setActionLoading(true);
      await deletePassenger(id);
      toast('success', 'Passenger deleted successfully');
      navigate('/passengers');
    } catch (err: any) {
      toast('error', 'Deletion failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBanStatus = async () => {
    if (!data?.user) return;
    try {
      setActionLoading(true);
      const action = data.user.isActive ? 'ban' : 'unban';
      await toggleBanPassenger(data.user._id, action);
      toast('success', `Passenger ${data.user.isActive ? 'suspended' : 'reactivated'} successfully`);
      setBanModalOpen(false);
      await loadPassengerDetails();
    } catch (err: any) {
      toast('error', 'Action failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendDirectPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.user) return;
    if (!pushTitle.trim() || !pushBody.trim()) {
      toast('error', 'Validation Error', 'Title and message body are required');
      return;
    }

    try {
      setIsSendingPush(true);
      await sendPassengerPush(data.user._id, pushTitle.trim(), pushBody.trim(), pushType);
      toast('success', 'Notification Dispatched', `Direct push sent to ${data.user.name || data.user.phoneNumber}`);
      setPushModalOpen(false);
      setPushTitle('');
      setPushBody('');
    } catch (err: any) {
      toast('error', 'Push failed', err?.message || 'Failed to deliver notification');
    } finally {
      setIsSendingPush(false);
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
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.user) {
    return (
      <Card className="max-w-4xl mx-auto mt-12">
        <EmptyState
          icon={<AlertTriangle className="w-12 h-12 text-woosh-error" />}
          title="Error Loading Passenger"
          description={error || 'Passenger profile not found'}
          actionLabel="Back to Passengers List"
          onAction={() => navigate('/passengers')}
        />
      </Card>
    );
  }

  const {
    user,
    childProfiles = [],
    recentRides = [],
    transactions = [],
    totalRides = 0,
    walletBalance = 0,
    rating = 5.0,
  } = data;

  const profile = data.profile || data.passengerProfile || {};

  return (
    <div className="space-y-6 pb-24">
      {/* Header Bar - Identical layout to Rider Profile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/passengers')} className="px-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-woosh-dark">Passenger Profile</h1>
              <Badge variant={user.isActive ? 'success' : 'error'} dot>
                {user.isActive ? 'Active' : 'Suspended'}
              </Badge>
              {profile?.isWomenVerified && (
                <Badge variant="success" dot>Women Verified</Badge>
              )}
              {user.role === 'both' && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Dual Role (Rider too)
                </span>
              )}
            </div>
            <p className="text-sm text-woosh-muted mt-0.5">
              Joined {new Date(user.createdAt).toLocaleDateString()} • ID:{' '}
              <span className="font-mono text-xs">{user._id}</span>
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => setBanModalOpen(true)}
            disabled={actionLoading}
            className={user.isActive ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50'}
          >
            {user.isActive ? (
              <>
                <Ban size={16} className="mr-1.5" /> Suspend Account
              </>
            ) : (
              <>
                <CheckCircle2 size={16} className="mr-1.5" /> Reactivate Account
              </>
            )}
          </Button>

          <Button
            size="sm"
            onClick={() => setPushModalOpen(true)}
            disabled={actionLoading}
            className="bg-woosh-primary hover:bg-woosh-primary-dark text-white border-transparent shadow-sm"
          >
            <Send size={16} className="mr-1.5" /> Send Notification
          </Button>
        </div>
      </div>

      {/* Account Suspended Alert Banner */}
      {!user.isActive && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-900">Passenger Account Suspended</h4>
              <p className="text-sm text-red-700 mt-0.5">
                This account is currently blocked from booking rides, adding wallet funds, or logging into Woosh.
              </p>
              <p className="text-xs text-red-500 mt-1">
                Suspension is active across all mobile sessions. Click reactivate below to restore account access.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setBanModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shrink-0"
          >
            <CheckCircle2 size={14} className="mr-1.5" /> Reactivate Account
          </Button>
        </div>
      )}

      {/* Main Grid: Left Column (Personal & Safety Details), Right Column (Stats Bar & Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal & Safety Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-woosh-primary" /> Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Avatar
                  name={user.name || '?'}
                  size="lg"
                  src={
                    profile.profileImage
                      ? profile.profileImage.startsWith('http')
                        ? profile.profileImage
                        : `${backendUrl}${profile.profileImage}`
                      : undefined
                  }
                  fallbackIcon={<User size={32} />}
                />
                <div>
                  <h4 className="text-base font-bold text-woosh-dark">{user.name || 'Not Provided'}</h4>
                  <p className="text-sm text-woosh-muted font-medium mt-0.5">{user.phoneNumber}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-woosh-muted uppercase tracking-wider block mb-1">
                    Email
                  </span>
                  <p className="text-sm text-woosh-dark">{user.email || '—'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-woosh-muted uppercase tracking-wider block mb-1">
                    Account Status
                  </span>
                  <div className="mt-1">
                    <Badge variant={user.isActive ? 'success' : 'error'} dot>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold text-woosh-muted uppercase tracking-wider block mb-1">
                    Gender
                  </span>
                  <p className="text-sm text-woosh-dark capitalize">{user.gender || '—'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-woosh-muted uppercase tracking-wider block mb-1">
                    City / Region
                  </span>
                  <p className="text-sm text-woosh-dark">{user.city || user.state || 'Bhopal'}</p>
                </div>
                {profile.referralCode && (
                  <div>
                    <span className="text-xs font-semibold text-woosh-muted uppercase tracking-wider block mb-1">
                      Referral Code
                    </span>
                    <span className="inline-block bg-purple-50 border border-purple-200 px-2.5 py-1 rounded text-purple-700 font-mono text-xs font-bold">
                      {profile.referralCode}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Safety & Emergency Card */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-woosh-primary" /> Safety & Emergency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-woosh-muted uppercase tracking-wider block mb-1">
                    Aadhaar Verification
                  </span>
                  <div className="mt-1">
                    <Badge variant={user.isAadhaarVerified ? 'success' : 'neutral'} dot>
                      {user.isAadhaarVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-woosh-muted uppercase tracking-wider block mb-1">
                    Women Safety Verification
                  </span>
                  <div className="mt-1">
                    <Badge variant={profile.isWomenVerified ? 'success' : 'neutral'} dot>
                      {profile.isWomenVerified
                        ? 'Verified Woman Passenger'
                        : profile.faceVerificationStatus === 'pending'
                        ? 'Pending Review'
                        : 'Not Initiated'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-woosh-muted uppercase tracking-wider block mb-2">
                    Emergency Contacts ({user.emergencyContacts?.length || 0})
                  </span>
                  {!user.emergencyContacts || user.emergencyContacts.length === 0 ? (
                    <p className="text-xs text-woosh-muted italic bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                      No emergency contacts configured yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {user.emergencyContacts.map((contact: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-xs"
                        >
                          <div>
                            <div className="font-bold text-rose-950 text-xs">{contact.name || `Contact #${idx + 1}`}</div>
                            <div className="text-[11px] text-rose-700 mt-0.5">{contact.phoneNumber}</div>
                            {contact.relationship && (
                              <div className="text-[10px] text-rose-500 capitalize">{contact.relationship}</div>
                            )}
                          </div>
                          <a
                            href={`tel:${contact.phoneNumber}`}
                            className="p-2 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors shadow-sm"
                            title="Call Emergency Contact"
                          >
                            <Phone size={13} />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stats Bar & Content Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top 3 Stat Cards (Identical visual style to Rider page) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-woosh-muted uppercase tracking-wider mb-1">
                    Wallet Balance
                  </div>
                  <div className="text-xl font-bold text-woosh-dark">
                    ₹{Number(walletBalance || 0).toFixed(2)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-woosh-primary-light rounded-xl flex items-center justify-center">
                  <Navigation className="w-6 h-6 text-woosh-primary" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-woosh-muted uppercase tracking-wider mb-1">
                    Total Rides
                  </div>
                  <div className="text-xl font-bold text-woosh-dark">{totalRides || 0}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-woosh-muted uppercase tracking-wider mb-1">
                    Rating
                  </div>
                  <div className="text-xl font-bold text-woosh-dark">
                    {Number(profile?.rating ?? rating ?? 5.0).toFixed(1)} ⭐
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Child Profiles Card */}
          <Card>
            <CardHeader className="py-4 border-b border-woosh-divider flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Baby className="w-4 h-4 text-purple-600" /> Child Profiles
                </CardTitle>
                <p className="text-xs text-woosh-muted mt-0.5">Solo & companion ride safety for kids</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
                {childProfiles.length} Profile(s)
              </span>
            </CardHeader>
            <CardContent className="pt-5">
              {childProfiles.length === 0 ? (
                <div className="text-center py-6 text-woosh-muted text-xs">
                  No registered child profiles for this passenger.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {childProfiles.map((child: any) => (
                    <div
                      key={child._id}
                      className="p-3.5 rounded-xl border border-woosh-border bg-gray-50/60 space-y-2 hover:bg-white hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                          {child.name?.slice(0, 2).toUpperCase() || 'C'}
                        </div>
                        <div>
                          <div className="font-bold text-woosh-dark text-xs">{child.name}</div>
                          <div className="text-[11px] text-woosh-muted">
                            {child.age ? `${child.age} years old` : 'Age not set'} • {child.gender || 'Child'}
                          </div>
                        </div>
                      </div>

                      {child.schoolName && (
                        <div className="text-[11px] text-gray-600 bg-white p-2 rounded-lg border border-gray-100 truncate">
                          🏫 <span className="font-semibold">{child.schoolName}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Rides Card */}
          <Card>
            <CardHeader className="py-4 border-b border-woosh-divider flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-woosh-primary" /> Recent Rides
                </CardTitle>
                <p className="text-xs text-woosh-muted mt-0.5">Last booking transactions and route trips</p>
              </div>
              <button
                onClick={() => navigate(`/rides?search=${encodeURIComponent(user.phoneNumber || '')}`)}
                className="text-xs font-semibold text-woosh-primary hover:underline flex items-center gap-1"
              >
                <span>View all in Rides</span>
                <ChevronRight size={13} />
              </button>
            </CardHeader>
            <CardContent className="p-0">
              {recentRides.length === 0 ? (
                <div className="text-center py-8 text-woosh-muted text-xs">No ride bookings found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-woosh-dark">
                    <thead className="bg-gray-50/70 text-[11px] uppercase font-bold text-gray-500 border-b border-woosh-border">
                      <tr>
                        <th className="py-2.5 px-4">Ride ID</th>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Driver / Rider</th>
                        <th className="py-2.5 px-4">Route</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Fare</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recentRides.map((ride: any) => (
                        <tr key={ride._id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold">
                            #{ride._id.slice(-6).toUpperCase()}
                          </td>
                          <td className="py-3 px-4 text-woosh-muted whitespace-nowrap">
                            {new Date(ride.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold">{ride.rider?.name || 'Unassigned'}</div>
                            <div className="text-[10px] text-gray-400">{ride.rider?.phoneNumber || ''}</div>
                          </td>
                          <td className="py-3 px-4 max-w-[200px]">
                            <div className="truncate text-gray-600">
                              <span className="text-emerald-600 font-bold">From:</span> {ride.pickup?.address || 'Pickup'}
                            </div>
                            <div className="truncate text-gray-600">
                              <span className="text-rose-600 font-bold">To:</span> {ride.drop?.address || 'Destination'}
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge
                              variant={
                                ride.status === 'completed'
                                  ? 'success'
                                  : ride.status?.includes('cancelled')
                                  ? 'error'
                                  : 'warning'
                              }
                              dot
                            >
                              {ride.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-bold whitespace-nowrap text-emerald-600">
                            ₹{ride.finalFare || ride.estimatedFare || 0}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/rides/${ride._id}`)}
                              className="text-woosh-primary text-xs p-1"
                            >
                              <ExternalLink size={13} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wallet Activity Card */}
          <Card>
            <CardHeader className="py-4 border-b border-woosh-divider flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600" /> Wallet Activity
                </CardTitle>
                <p className="text-xs text-woosh-muted mt-0.5">Recent credits, debits and payment logs</p>
              </div>
              <div className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                Balance: ₹{Number(walletBalance || 0).toLocaleString('en-IN')}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-woosh-muted text-xs">No wallet transactions recorded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-woosh-dark">
                    <thead className="bg-gray-50/70 text-[11px] uppercase font-bold text-gray-500 border-b border-woosh-border">
                      <tr>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4">Description</th>
                        <th className="py-2.5 px-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactions.map((txn: any) => {
                        const isCredit = txn.type === 'topup' || txn.type === 'refund' || txn.type === 'credit';
                        return (
                          <tr key={txn._id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 text-woosh-muted whitespace-nowrap">
                              {new Date(txn.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <Badge variant={isCredit ? 'success' : 'neutral'}>
                                {txn.type}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 max-w-xs truncate text-gray-600">
                              {txn.description || 'Transaction'}
                            </td>
                            <td
                              className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                                isCredit ? 'text-emerald-600' : 'text-gray-900'
                              }`}
                            >
                              {isCredit ? '+' : '-'}₹{txn.amount}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Direct Push Notification Modal */}
      <Modal
        isOpen={pushModalOpen}
        onClose={() => setPushModalOpen(false)}
        title={`Send Push to ${user.name || user.phoneNumber}`}
        description="Deliver an immediate push alert to this passenger's mobile lockscreen and in-app inbox."
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setPushModalOpen(false)} disabled={isSendingPush}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendDirectPush}
              disabled={isSendingPush || !pushTitle.trim() || !pushBody.trim()}
              className="bg-woosh-primary text-white"
            >
              {isSendingPush ? (
                <>
                  <RefreshCw size={14} className="animate-spin mr-1.5" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={14} className="mr-1.5" />
                  Dispatch Push
                </>
              )}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSendDirectPush} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Notification Type
            </label>
            <select
              value={pushType}
              onChange={(e) => setPushType(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-woosh-primary"
            >
              <option value="GENERAL">General Notice</option>
              <option value="PROMOTION">Promotional Offer</option>
              <option value="SAFETY_WARNING">Safety Advisory</option>
              <option value="UPDATE">Account Update</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>
            <Input
              value={pushTitle}
              onChange={(e) => setPushTitle(e.target.value)}
              placeholder="e.g. Special Discount on Your Next Ride"
              maxLength={60}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Message Body <span className="text-rose-500">*</span>
            </label>
            <Textarea
              value={pushBody}
              onChange={(e) => setPushBody(e.target.value)}
              rows={4}
              placeholder="Type notification text..."
              maxLength={240}
            />
          </div>
        </form>
      </Modal>

      {/* Ban / Unban Confirmation Modal */}
      <Modal
        isOpen={banModalOpen}
        onClose={() => setBanModalOpen(false)}
        title={user.isActive ? 'Confirm Account Suspension' : 'Confirm Account Reactivation'}
        description={
          user.isActive
            ? `Are you sure you want to suspend ${user.name || user.phoneNumber}? They will not be able to book rides or login until reactivated.`
            : `Reactivate ${user.name || user.phoneNumber}'s account so they can use Woosh again.`
        }
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={() => setBanModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant={user.isActive ? 'danger' : 'primary'}
              size="sm"
              onClick={handleToggleBanStatus}
              disabled={actionLoading}
              className={!user.isActive ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
            >
              {actionLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin mr-1.5" />
                  Updating...
                </>
              ) : user.isActive ? (
                'Yes, Suspend Account'
              ) : (
                'Yes, Reactivate Account'
              )}
            </Button>
          </div>
        }
      >
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            {user.isActive
              ? 'Suspending this account takes effect immediately across all active passenger mobile sessions.'
              : 'Reactivating will restore ride booking and login capabilities.'}
          </span>
        </div>
      </Modal>
    </div>
  );
};

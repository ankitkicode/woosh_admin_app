import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Clock,
  IndianRupee,
  Map as MapIcon,
  ShieldAlert,
  Bike,
  CheckCircle2,
  Phone,
  Copy,
  Check,
  AlertTriangle,
  Radio,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Navigation,
  XCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../common/components/Card';
import { Button } from '../../../common/components/Button';
import { Badge } from '../../../common/components/Badge';
import { Avatar } from '../../../common/components/Avatar';
import { SkeletonCard } from '../../../common/components/Skeleton';
import { apiClient } from '../../../common/utils/apiClient';
import { useToast } from '../../../common/components/Toast';
import { useRideTracking } from '../../../common/hooks/useRideTracking';
import { RideMap } from '../components/RideMap';

export function RideDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  const { liveLocation, isConnected } = useRideTracking(id);

  useEffect(() => {
    if (id) fetchRideDetails();
  }, [id]);

  const fetchRideDetails = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient(`/admin/rides/${id}`);
      setData(res);
    } catch (err: any) {
      toast('error', 'Failed to load ride details', err.message);
      navigate('/rides');
    } finally {
      setIsLoading(false);
    }
  };

  const [isCancelling, setIsCancelling] = useState(false);

  const handleCopyId = (rideId: string) => {
    navigator.clipboard.writeText(rideId);
    setCopiedId(true);
    toast('success', 'Ride ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCancelRide = async () => {
    if (!ride?._id) return;
    if (!window.confirm('Are you sure you want to administratively close/cancel this ride?')) return;
    try {
      setIsCancelling(true);
      await apiClient(`/admin/rides/${ride._id}/cancel`, {
        method: 'PUT',
        body: JSON.stringify({ reason: 'Administratively closed by operator' })
      });
      toast('success', 'Ride closed and marked as cancelled successfully');
      await fetchRideDetails();
    } catch (err: any) {
      toast('error', 'Failed to close ride', err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1440px] mx-auto pb-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-woosh-surface rounded animate-pulse" />
          <div className="w-48 h-8 bg-woosh-surface rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonCard className="lg:col-span-2" />
          <SkeletonCard className="lg:col-span-1" />
        </div>
      </div>
    );
  }

  if (!data?.ride) return null;

  const { ride, riderProfile, sosAlerts = [], disputes = [] } = data;

  const isSosResolved =
    sosAlerts &&
    sosAlerts.length > 0 &&
    sosAlerts.every((a: any) => a.status === 'resolved' || a.status === 'false_alarm');

  const hasActiveSos =
    ride.status === 'sos_active' ||
    (sosAlerts && sosAlerts.some((a: any) => a.status === 'active'));

  const getStatusBadge = (status: string) => {
    if (status === 'sos_active') {
      if (isSosResolved) {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            <CheckCircle2 size={13} className="text-emerald-600" />
            ✓ SOS Resolved
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <ShieldAlert size={13} className="text-rose-600" />
          SOS ACTIVE
        </span>
      );
    }
    if (['completed', 'payment_completed', 'closed'].includes(status)) {
      return (
        <Badge variant="success" dot>
          Completed
        </Badge>
      );
    }
    if (['requested', 'rider_search', 'rider_assigned'].includes(status)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          Matching Drivers
        </span>
      );
    }
    if (['accepted', 'rider_en_route', 'rider_arrived', 'otp_verification', 'started', 'in_progress'].includes(status)) {
      return (
        <Badge variant="info" dot>
          In Transit
        </Badge>
      );
    }
    if (['cancelled', 'expired', 'rider_cancelled', 'passenger_cancelled', 'no_show', 'timed_out'].includes(status)) {
      return (
        <Badge variant="error" dot>
          Cancelled
        </Badge>
      );
    }
    return <Badge variant="neutral">{status.replace(/_/g, ' ')}</Badge>;
  };

  const formatDate = (date?: string) => {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return date;
    }
  };

  const isLiveRide = [
    'accepted',
    'rider_en_route',
    'rider_arrived',
    'otp_verification',
    'started',
    'in_progress',
  ].includes(ride.status);

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12">
      {/* Header & Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/rides')}
            className="text-woosh-muted hover:text-woosh-dark"
            title="Back to rides list"
          >
            <ArrowLeft size={18} />
          </Button>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-woosh-dark">
                Ride #{ride._id.slice(-6).toUpperCase()}
              </h1>
              {getStatusBadge(ride.status)}
            </div>

            <div className="flex items-center gap-2 text-xs text-woosh-muted mt-1">
              <span>Full ID:</span>
              <span className="font-mono text-xs text-woosh-dark bg-woosh-surface px-1.5 py-0.5 rounded border border-gray-200">
                {ride._id}
              </span>
              <button
                onClick={() => handleCopyId(ride._id)}
                className="text-woosh-primary hover:text-woosh-primary/80 transition p-0.5"
                title="Copy full Ride ID"
              >
                {copiedId ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRideDetails}
            className="flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </Button>

          {isLiveRide && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/tracking')}
              className="flex items-center gap-1.5 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              <Navigation size={13} />
              <span>Track on Radar</span>
            </Button>
          )}

          {(ride.status === 'sos_active' || sosAlerts.length > 0) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/sos')}
              className={`flex items-center gap-1.5 ${
                isSosResolved
                  ? 'border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                  : 'border-rose-300 text-white bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <ShieldAlert size={13} />
              <span>{isSosResolved ? 'SOS History Desk' : 'Emergency SOS Desk'}</span>
            </Button>
          )}

          {['requested', 'rider_search', 'rider_assigned', 'accepted', 'rider_en_route', 'rider_arrived', 'otp_verification', 'started', 'in_progress', 'sos_active'].includes(ride.status) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancelRide}
              disabled={isCancelling}
              className="border-rose-200 text-rose-700 hover:bg-rose-50 flex items-center gap-1.5"
              title="Force close this ride"
            >
              <XCircle size={13} className="text-rose-600" />
              <span>{isCancelling ? 'Closing...' : 'Close Ride'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Safety Notice Banners */}
      {ride.status === 'sos_active' && isSosResolved && (
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950 text-xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-900 text-sm">
                Safety Incident Resolved · Case Closed:
              </span>{' '}
              All emergency alerts linked to this trip have been investigated and marked resolved by operations personnel. 
              The trip retains historical safety status <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono font-bold">sos_active</code> for audit compliance.
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/sos')}
            className="text-emerald-800 border-emerald-300 hover:bg-emerald-100 self-start sm:self-auto whitespace-nowrap"
          >
            View Incident Log →
          </Button>
        </div>
      )}

      {hasActiveSos && !isSosResolved && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-950 text-xs animate-pulse">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-900 text-sm">
                Active SOS Alert Under Emergency Investigation:
              </span>{' '}
              This ride has an active emergency panic signal triggered. Operator intervention is required at the SOS Safety Desk.
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/sos')}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold self-start sm:self-auto whitespace-nowrap"
          >
            Open SOS Desk Immediately →
          </Button>
        </div>
      )}

      {/* Top Quick Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="p-4 border border-woosh-border shadow-xs">
          <span className="text-xs font-medium text-woosh-muted uppercase tracking-wider block">
            Trip Distance & Time
          </span>
          <p className="text-xl font-bold text-woosh-dark mt-1">
            {ride.distanceKm ? `${ride.distanceKm} km` : 'Calculating'}
            {ride.durationMinutes ? ` · ${ride.durationMinutes} mins` : ''}
          </p>
          <span className="text-[11px] text-woosh-muted">Estimated transit route</span>
        </Card>

        <Card className="p-4 border border-woosh-border shadow-xs">
          <span className="text-xs font-medium text-woosh-muted uppercase tracking-wider block">
            Total Fare
          </span>
          <p className="text-xl font-bold text-woosh-primary mt-1">
            ₹{ride.finalFare || ride.estimatedFare || 0}
          </p>
          <span className="text-[11px] text-woosh-muted capitalize">
            {ride.paymentMethod || 'CASH'} · Status: {ride.paymentStatus || 'Pending'}
          </span>
        </Card>

        <Card className="p-4 border border-woosh-border shadow-xs">
          <span className="text-xs font-medium text-woosh-muted uppercase tracking-wider block">
            Ride OTP & Security
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-lg font-black text-woosh-primary bg-woosh-primary-light px-2.5 py-0.5 rounded">
              {ride.otp || '—'}
            </span>
            {ride.vehicleType && (
              <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 text-gray-800 rounded uppercase font-mono">
                {ride.vehicleType}
              </span>
            )}
          </div>
          <span className="text-[11px] text-woosh-muted">4-digit boarding authentication</span>
        </Card>

        <Card className="p-4 border border-woosh-border shadow-xs">
          <span className="text-xs font-medium text-woosh-muted uppercase tracking-wider block">
            Booking Created
          </span>
          <p className="text-sm font-bold text-woosh-dark mt-1 line-clamp-1">
            {formatDate(ride.createdAt)}
          </p>
          <span className="text-[11px] text-woosh-muted">Platform booking registered</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width) - Map, Passenger/Rider Profiles, Safety */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route Map Card */}
          <Card>
            <CardHeader className="py-4 border-b border-woosh-divider bg-woosh-surface/40">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapIcon size={18} className="text-woosh-primary" />
                  <span>Route Map & Navigation</span>
                </div>
                {isLiveRide ? (
                  <Badge variant={isConnected ? 'success' : 'neutral'} dot>
                    {isConnected ? 'Live Telemetry Active' : 'Connecting Radar...'}
                  </Badge>
                ) : (
                  <Badge variant="neutral">Trip Archived</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[340px] w-full border-b border-woosh-divider bg-woosh-surface/20 relative">
                {ride.pickup?.latitude && ride.drop?.latitude ? (
                  <RideMap
                    pickup={ride.pickup}
                    drop={ride.drop}
                    liveLocation={liveLocation}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-woosh-muted text-sm">
                    <MapIcon size={32} className="opacity-25 mb-1" />
                    <span>Coordinates not logged for this historical trip</span>
                  </div>
                )}
              </div>

              {/* Pickup & Drop Points Detailed */}
              <div className="p-5 space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                      Pickup Location
                    </span>
                    <p className="text-sm font-bold text-woosh-dark mt-0.5">
                      {ride.pickup?.address || 'Pickup address not recorded'}
                    </p>
                    {ride.pickup?.latitude && (
                      <span className="text-[11px] font-mono text-woosh-muted">
                        Lat: {ride.pickup.latitude.toFixed(5)}, Lng: {ride.pickup.longitude.toFixed(5)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-l-2 border-dashed border-gray-200 ml-3 h-3 my-0.5" />

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
                      Drop Location
                    </span>
                    <p className="text-sm font-bold text-woosh-dark mt-0.5">
                      {ride.drop?.address || 'Drop location not recorded'}
                    </p>
                    {ride.drop?.latitude && (
                      <span className="text-[11px] font-mono text-woosh-muted">
                        Lat: {ride.drop.latitude.toFixed(5)}, Lng: {ride.drop.longitude.toFixed(5)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Passenger & Rider Profiles (Side by side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Passenger Profile Card */}
            <Card className="border border-woosh-border shadow-xs">
              <CardHeader className="py-3.5 border-b border-woosh-divider bg-woosh-surface/30">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-600">
                    <User size={16} />
                    <span>Passenger Profile</span>
                  </div>
                  {ride.passenger?._id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs font-bold text-woosh-primary flex items-center gap-1"
                      onClick={() => navigate(`/passengers/${ride.passenger._id}`)}
                    >
                      <span>Profile</span>
                      <ExternalLink size={12} />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3.5">
                  <Avatar
                    name={ride.passenger?.name || 'Guest'}
                    size="lg"
                    className="bg-blue-100 text-blue-700 font-bold"
                  />
                  <div>
                    <p className="font-bold text-woosh-dark text-base">
                      {ride.passenger?.name || 'Guest Passenger'}
                    </p>
                    <a
                      href={ride.passenger?.phoneNumber ? `tel:${ride.passenger.phoneNumber}` : undefined}
                      className="text-xs text-woosh-primary flex items-center gap-1 font-semibold hover:underline mt-0.5"
                    >
                      <Phone size={11} />
                      <span>{ride.passenger?.phoneNumber || 'No phone'}</span>
                    </a>
                    {ride.passenger?.email && (
                      <span className="text-[11px] text-woosh-muted block mt-0.5">
                        {ride.passenger.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Child Mode Active Banner */}
                {ride.childProfile && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-3 text-xs">
                    <Avatar
                      name={ride.childProfile.name}
                      size="sm"
                      className="bg-indigo-200 text-indigo-700 font-bold"
                    />
                    <div>
                      <p className="font-bold text-indigo-950">Child Mode Ride Active</p>
                      <p className="text-indigo-700">
                        {ride.childProfile.name} ({ride.childProfile.age} yrs)
                      </p>
                    </div>
                  </div>
                )}

                {/* Rating Given to Rider */}
                {ride.rating?.passengerRating && (
                  <div className="pt-3 border-t border-woosh-divider">
                    <span className="text-[11px] text-woosh-muted uppercase tracking-wider font-semibold block mb-1">
                      Feedback Given to Rider
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-amber-500">
                        {ride.rating.passengerRating} ★
                      </span>
                      {ride.rating.passengerComment && (
                        <span className="text-xs text-woosh-dark italic">
                          "{ride.rating.passengerComment}"
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rider Profile Card */}
            <Card className="border border-woosh-border shadow-xs">
              <CardHeader className="py-3.5 border-b border-woosh-divider bg-woosh-surface/30">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Bike size={16} />
                    <span>Assigned Driver / Fleet</span>
                  </div>
                  {riderProfile?._id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs font-bold text-woosh-primary flex items-center gap-1"
                      onClick={() => navigate(`/riders/${riderProfile._id}`)}
                    >
                      <span>Profile</span>
                      <ExternalLink size={12} />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {ride.rider ? (
                  <>
                    <div className="flex items-center gap-3.5">
                      <Avatar
                        name={ride.rider.name}
                        src={riderProfile?.profileImage}
                        size="lg"
                        className="bg-emerald-100 text-emerald-700 font-bold"
                        fallbackIcon={<Bike size={22} />}
                      />
                      <div>
                        <p className="font-bold text-woosh-dark text-base">{ride.rider.name}</p>
                        <a
                          href={ride.rider.phoneNumber ? `tel:${ride.rider.phoneNumber}` : undefined}
                          className="text-xs text-woosh-primary flex items-center gap-1 font-semibold hover:underline mt-0.5"
                        >
                          <Phone size={11} />
                          <span>{ride.rider.phoneNumber}</span>
                        </a>
                      </div>
                    </div>

                    {/* Vehicle Details */}
                    {riderProfile && (
                      <div className="bg-woosh-surface rounded-xl p-3 border border-gray-100 text-xs space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-woosh-muted font-medium">Vehicle Registration</span>
                          <span className="font-mono font-bold text-woosh-dark bg-white px-2 py-0.5 rounded border border-gray-200">
                            {riderProfile.vehicleNumber || '—'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-gray-200/50">
                          <span className="text-woosh-muted">Make & Model</span>
                          <span className="font-bold text-woosh-dark">
                            {riderProfile.vehicleColor} {riderProfile.vehicleModel}
                          </span>
                        </div>
                        {riderProfile.vehicleType && (
                          <div className="flex justify-between items-center">
                            <span className="text-woosh-muted">Class</span>
                            <span className="uppercase font-mono text-[11px] font-bold text-woosh-primary">
                              {riderProfile.vehicleType}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rating Given to Passenger */}
                    {ride.rating?.riderRating && (
                      <div className="pt-3 border-t border-woosh-divider">
                        <span className="text-[11px] text-woosh-muted uppercase tracking-wider font-semibold block mb-1">
                          Feedback Given to Passenger
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-amber-500">
                            {ride.rating.riderRating} ★
                          </span>
                          {ride.rating.riderComment && (
                            <span className="text-xs text-woosh-dark italic">
                              "{ride.rating.riderComment}"
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : ['requested', 'rider_search', 'rider_assigned'].includes(ride.status) ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                      <Radio size={22} className="animate-spin" />
                    </div>
                    <p className="font-bold text-amber-800 text-sm">Searching for Nearby Drivers</p>
                    <p className="text-xs text-woosh-muted mt-1 max-w-xs">
                      The matching algorithm is broadcasting trip request to active riders in range.
                    </p>
                  </div>
                ) : ['cancelled', 'expired', 'rider_cancelled', 'passenger_cancelled', 'no_show', 'timed_out'].includes(ride.status) ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center text-gray-400">
                    <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-2">
                      <User size={22} />
                    </div>
                    <p className="font-bold text-gray-700 text-sm">No Driver Assigned</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs">
                      {ride.cancellation?.cancelledBy
                        ? `Trip was cancelled by ${ride.cancellation.cancelledBy} before any driver accepted the request.`
                        : 'Trip request was cancelled or timed out before driver acceptance.'}
                    </p>
                  </div>
                ) : ['completed', 'payment_completed', 'closed'].includes(ride.status) ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center text-gray-400">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                      <CheckCircle2 size={22} className="text-emerald-600" />
                    </div>
                    <p className="font-bold text-gray-800 text-sm">Completed Without Assigned Fleet Profile</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs">
                      This trip was recorded directly or completed as an offline fulfillment record.
                    </p>
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center text-gray-400">
                    <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-2">
                      <User size={22} />
                    </div>
                    <p className="font-bold text-gray-700 text-sm">No Driver Attached</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs">
                      Trip Status: {ride.status?.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Safety Incidents, SOS Records & Disputes (if any) */}
          {(sosAlerts.length > 0 || disputes.length > 0) && (
            <Card className="border-red-100 shadow-xs">
              <CardHeader className="py-3.5 bg-red-50/50 border-b border-red-100">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-700">
                  <ShieldAlert size={16} />
                  <span>Safety Alerts & Dispute Records</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {sosAlerts.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2.5">
                      SOS Emergency Trigger History ({sosAlerts.length})
                    </h4>
                    <div className="space-y-2.5">
                      {sosAlerts.map((sos: any) => (
                        <div
                          key={sos._id}
                          className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-bold text-woosh-dark">
                                Triggered by {sos.role} ({sos.triggeredBy?.name || 'User'})
                              </p>
                              <p className="text-xs text-woosh-muted">{formatDate(sos.createdAt)}</p>
                            </div>
                            <Badge
                              variant={
                                sos.status === 'resolved'
                                  ? 'success'
                                  : sos.status === 'false_alarm'
                                  ? 'neutral'
                                  : 'error'
                              }
                            >
                              {sos.status === 'resolved'
                                ? '✓ Resolved'
                                : sos.status === 'false_alarm'
                                ? 'False Alarm'
                                : 'Active Alarm'}
                            </Badge>
                          </div>
                          {sos.resolutionNotes && (
                            <div className="bg-emerald-50 text-emerald-900 text-xs p-2.5 rounded-lg border border-emerald-100 font-medium">
                              <span className="font-bold">Operator Resolution:</span> {sos.resolutionNotes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {disputes.length > 0 && (
                  <div className="pt-3 border-t border-gray-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2.5">
                      Disputes Logged ({disputes.length})
                    </h4>
                    <div className="space-y-2.5">
                      {disputes.map((dispute: any) => (
                        <div
                          key={dispute._id}
                          className="bg-white border border-amber-100 rounded-xl p-3.5 flex justify-between items-center"
                        >
                          <div>
                            <p className="text-sm font-bold text-woosh-dark">{dispute.subject}</p>
                            <p className="text-xs text-woosh-muted">
                              Raised by: {dispute.raisedBy?.name || 'Party'}
                            </p>
                          </div>
                          <Badge
                            variant={dispute.status === 'resolved' ? 'success' : 'warning'}
                          >
                            {dispute.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Insurance Protection & AI Alerts */}
          {ride.insuranceDetails && (
            <Card className="border border-woosh-border shadow-xs">
              <CardHeader className="py-3.5 border-b border-woosh-divider bg-woosh-surface/30">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-teal-700">
                  <ShieldCheck size={16} />
                  <span>Platform Trip Insurance Coverage</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-woosh-dark">
                    Active Woosh Trip Safety Policy
                  </p>
                  <p className="text-woosh-muted mt-0.5">
                    Covers personal accident, medical transit, and road protections
                  </p>
                </div>
                {ride.insuranceDetails.policyId && (
                  <span className="font-mono font-bold bg-teal-50 text-teal-800 px-2 py-1 rounded border border-teal-200">
                    Policy: {ride.insuranceDetails.policyId}
                  </span>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (1/3 width) - Fare Breakdown & Lifecycle Timeline */}
        <div className="space-y-6">
          {/* Fare & Payment Breakdown Card */}
          <Card className="border border-woosh-border shadow-xs">
            <CardHeader className="py-4 border-b border-woosh-divider bg-woosh-surface/40">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-woosh-dark">
                <IndianRupee size={18} className="text-woosh-primary" />
                <span>Commercial Fare Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-woosh-muted font-medium">Payment Mode</span>
                <Badge variant="neutral" className="uppercase font-bold">
                  {ride.paymentMethod || 'CASH'}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-woosh-muted font-medium">Settlement Status</span>
                <Badge
                  variant={ride.paymentStatus === 'paid' ? 'success' : 'warning'}
                  className="uppercase font-bold"
                >
                  {ride.paymentStatus || 'PENDING'}
                </Badge>
              </div>

              <div className="pt-3 border-t border-woosh-divider space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-woosh-muted">Estimated Base Fare</span>
                  <span className="font-medium text-woosh-dark">
                    ₹{ride.estimatedFare || 0}
                  </span>
                </div>

                {ride.isSurge && (
                  <div className="flex justify-between items-center text-amber-600">
                    <span>Peak Surge Multiplier</span>
                    <span className="font-bold">x{ride.surgeMultiplier}</span>
                  </div>
                )}

                {ride.waitingCharges > 0 && (
                  <div className="flex justify-between items-center text-rose-600">
                    <span>Waiting Charges</span>
                    <span className="font-bold">+₹{ride.waitingCharges}</span>
                  </div>
                )}

                {ride.applyWallet && ride.walletAmountUsed > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span>Woosh Wallet Credit Applied</span>
                    <span className="font-bold">-₹{ride.walletAmountUsed}</span>
                  </div>
                )}

                {ride.tipAmount > 0 && (
                  <div className="flex justify-between items-center text-blue-600">
                    <span>Driver Tip</span>
                    <span className="font-bold">+₹{ride.tipAmount}</span>
                  </div>
                )}

                {/* Admin Platform Breakdown */}
                {ride.platformCommission !== undefined && (
                  <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-[11px] text-woosh-muted">
                    <span>Platform Commission</span>
                    <span className="font-medium">₹{ride.platformCommission}</span>
                  </div>
                )}

                {ride.riderEarnings !== undefined && (
                  <div className="flex justify-between items-center text-[11px] text-woosh-muted">
                    <span>Driver Net Earnings</span>
                    <span className="font-medium text-emerald-700">₹{ride.riderEarnings}</span>
                  </div>
                )}

                {/* Final Total */}
                <div className="flex justify-between items-center pt-3 border-t border-woosh-divider border-dashed">
                  <span className="font-bold text-woosh-dark text-sm">Final Fare Billed</span>
                  <span className="text-xl font-black text-woosh-primary">
                    ₹{ride.finalFare || ride.estimatedFare || 0}
                  </span>
                </div>
              </div>

              {/* Online Payment Transaction Identifiers */}
              {(ride.razorpayPaymentId || ride.razorpayOrderId) && (
                <div className="pt-3 border-t border-woosh-divider text-[10px] space-y-1 font-mono text-woosh-muted">
                  {ride.razorpayOrderId && (
                    <div className="truncate">Order: {ride.razorpayOrderId}</div>
                  )}
                  {ride.razorpayPaymentId && (
                    <div className="truncate text-emerald-700">
                      Txn: {ride.razorpayPaymentId}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trip Lifecycle Timeline Stepper */}
          <Card className="border border-woosh-border shadow-xs">
            <CardHeader className="py-4 border-b border-woosh-divider bg-woosh-surface/40">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-woosh-dark">
                <Clock size={18} className="text-woosh-primary" />
                <span>Trip Lifecycle Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative pl-6 space-y-6">
                <div className="absolute top-2 left-[11px] bottom-2 w-px bg-woosh-divider" />

                {/* Step 1: Requested */}
                <div className="relative">
                  <div className="absolute -left-[28px] top-1 w-2.5 h-2.5 rounded-full bg-woosh-primary ring-4 ring-white" />
                  <p className="text-xs font-bold text-woosh-dark">Ride Requested</p>
                  <p className="text-[11px] text-woosh-muted mt-0.5">{formatDate(ride.createdAt)}</p>
                </div>

                {/* Step 2: Driver Assigned */}
                {ride.rider && (
                  <div className="relative">
                    <div className="absolute -left-[28px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                    <p className="text-xs font-bold text-woosh-dark">Driver Assigned & En Route</p>
                    <p className="text-[11px] text-woosh-muted mt-0.5">{ride.rider.name}</p>
                  </div>
                )}

                {/* Step 3: Arrived */}
                {ride.riderArrivedAt && (
                  <div className="relative">
                    <div className="absolute -left-[28px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-white" />
                    <p className="text-xs font-bold text-woosh-dark">Driver Arrived at Pickup</p>
                    <p className="text-[11px] text-woosh-muted mt-0.5">{formatDate(ride.riderArrivedAt)}</p>
                  </div>
                )}

                {/* Step 4: Started */}
                {ride.rideStartedAt && (
                  <div className="relative">
                    <div className="absolute -left-[28px] top-1 w-2.5 h-2.5 rounded-full bg-woosh-primary ring-4 ring-white" />
                    <p className="text-xs font-bold text-woosh-dark">Trip Started (OTP Verified)</p>
                    <p className="text-[11px] text-woosh-muted mt-0.5">{formatDate(ride.rideStartedAt)}</p>
                  </div>
                )}

                {/* Step 5: Completed */}
                {ride.rideEndedAt && !ride.status.includes('cancelled') && (
                  <div className="relative">
                    <div className="absolute -left-[28px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                    <p className="text-xs font-bold text-emerald-700">Trip Completed Safely</p>
                    <p className="text-[11px] text-woosh-muted mt-0.5">{formatDate(ride.rideEndedAt)}</p>
                  </div>
                )}

                {/* Step 5 Alternate: Cancelled */}
                {ride.cancellation?.cancelledBy && (
                  <div className="relative">
                    <div className="absolute -left-[28px] top-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-white" />
                    <p className="text-xs font-bold text-rose-600">Ride Cancelled</p>
                    <p className="text-[11px] text-woosh-muted mt-0.5">
                      By: {ride.cancellation.cancelledBy} · {formatDate(ride.cancellation.cancelledAt)}
                    </p>
                    {ride.cancellation.reason && (
                      <div className="mt-2 bg-rose-50 text-rose-800 text-xs p-2 rounded-lg border border-rose-100 font-medium">
                        Reason: {ride.cancellation.reason}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 6: SOS Audit (if applicable) */}
                {ride.sosTriggeredAt && (
                  <div className="relative">
                    <div
                      className={`absolute -left-[28px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                        isSosResolved ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}
                    />
                    <p className="text-xs font-bold text-woosh-dark">
                      {isSosResolved ? 'SOS Alert Handled & Resolved' : 'Emergency Alarm Raised'}
                    </p>
                    <p className="text-[11px] text-woosh-muted mt-0.5">
                      {formatDate(ride.sosTriggeredAt)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

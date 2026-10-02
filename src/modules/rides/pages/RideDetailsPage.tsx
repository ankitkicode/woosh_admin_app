import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../../common/components/Card';
import { Button } from '../../../common/components/Button';
import { Badge } from '../../../common/components/Badge';
import { Avatar } from '../../../common/components/Avatar';
import { SkeletonCard } from '../../../common/components/Skeleton';
import { apiClient } from '../../../common/utils/apiClient';
import { useToast } from '../../../common/components/Toast';
import { ArrowLeft, User, Clock, IndianRupee, Map as MapIcon, ShieldAlert, Bike } from 'lucide-react';
import { useRideTracking } from '../../../common/hooks/useRideTracking';
import { RideMap } from '../components/RideMap';

export function RideDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
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

  const { ride, riderProfile, sosAlerts, disputes } = data;

  const getStatusBadge = (status: string) => {
    if (['completed', 'payment_completed'].includes(status)) return <Badge variant="success" dot>Completed</Badge>;
    if (['requested', 'rider_search', 'rider_assigned'].includes(status)) return <Badge variant="warning" dot>Matching</Badge>;
    if (['accepted', 'rider_en_route', 'rider_arrived', 'otp_verification', 'started', 'in_progress'].includes(status)) return <Badge variant="info" dot>Active</Badge>;
    if (['cancelled', 'expired', 'rider_cancelled', 'passenger_cancelled', 'no_show', 'timed_out'].includes(status)) return <Badge variant="error" dot>Cancelled</Badge>;
    return <Badge variant="neutral">{status.replace(/_/g, ' ')}</Badge>;
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };


  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/rides')} className="text-woosh-muted">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-woosh-dark flex items-center gap-3">
              Ride Details
              {getStatusBadge(ride.status)}
            </h1>
            <p className="text-sm text-woosh-muted mt-1">ID: <span className="font-mono text-xs text-woosh-dark bg-woosh-surface px-1.5 py-0.5 rounded">{ride._id}</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Ride Info & Users */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Map/Location Card */}
          <Card>
            <CardHeader className="py-4 border-b border-woosh-divider bg-woosh-surface/30">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapIcon size={18} className="text-woosh-primary" />
                  Route Information
                </div>
                {['accepted', 'rider_en_route', 'rider_arrived', 'otp_verification', 'started', 'in_progress'].includes(ride.status) && (
                  <Badge variant={isConnected ? 'success' : 'neutral'} dot>
                    {isConnected ? 'Live Tracking' : 'Connecting...'}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[350px] w-full border-b border-woosh-divider bg-woosh-surface/20 relative">
                {ride.pickup?.latitude && ride.drop?.latitude ? (
                  <RideMap 
                    pickup={ride.pickup} 
                    drop={ride.drop} 
                    liveLocation={liveLocation} 
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-woosh-muted text-sm">
                    Location data unavailable
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-woosh-muted uppercase tracking-wider font-semibold mb-1">Distance</p>
                    <p className="font-medium text-woosh-dark">{ride.distanceKm ? `${ride.distanceKm} km` : 'N/A'}</p>
                  </div>
                <div>
                  <p className="text-xs text-woosh-muted uppercase tracking-wider font-semibold mb-1">Duration</p>
                  <p className="font-medium text-woosh-dark">{ride.durationMinutes ? `${ride.durationMinutes} mins` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-woosh-muted uppercase tracking-wider font-semibold mb-1">OTP</p>
                  <span className="font-mono font-bold text-woosh-primary bg-woosh-primary-light px-2 py-1 rounded">{ride.otp}</span>
                </div>
              </div>
              </div>
            </CardContent>
          </Card>

          {/* Passenger & Rider Profiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Passenger */}
            <Card>
              <CardHeader className="py-4 border-b border-woosh-divider bg-woosh-surface/30">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-blue-500" />
                    Passenger
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate(`/passengers/${ride.passenger?._id}`)}>
                    View Profile
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar name={ride.passenger?.name} size="lg" className="bg-blue-100 text-blue-700" />
                  <div>
                    <p className="font-bold text-woosh-dark">{ride.passenger?.name || 'Unknown'}</p>
                    <p className="text-sm text-woosh-muted">{ride.passenger?.phoneNumber}</p>
                  </div>
                </div>
                
                {ride.childProfile && (
                  <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center gap-3">
                    <Avatar name={ride.childProfile.name} size="sm" className="bg-indigo-200 text-indigo-700" />
                    <div>
                      <p className="text-xs font-semibold text-indigo-900">Child Mode Active</p>
                      <p className="text-xs text-indigo-700">{ride.childProfile.name} ({ride.childProfile.age} yrs)</p>
                    </div>
                  </div>
                )}
                
                {ride.rating?.passengerRating && (
                  <div className="mt-4 pt-4 border-t border-woosh-divider">
                    <p className="text-xs text-woosh-muted uppercase tracking-wider font-semibold mb-1">Rating Given to Rider</p>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-amber-500">{ride.rating.passengerRating} ★</span>
                      {ride.rating.passengerComment && <span className="text-sm text-woosh-muted ml-2">"{ride.rating.passengerComment}"</span>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rider */}
            <Card>
              <CardHeader className="py-4 border-b border-woosh-divider bg-woosh-surface/30">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bike size={18} className="text-emerald-500" />
                    Rider
                  </div>
                  {ride.rider && riderProfile && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate(`/riders/${riderProfile._id}`)}>
                      View Profile
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {ride.rider ? (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar name={ride.rider?.name} src={riderProfile?.profileImage} size="lg" className="bg-emerald-100 text-emerald-700" fallbackIcon={<Bike size={24} />} />
                      <div>
                        <p className="font-bold text-woosh-dark">{ride.rider?.name || 'Unknown'}</p>
                        <p className="text-sm text-woosh-muted">{ride.rider?.phoneNumber}</p>
                      </div>
                    </div>
                    
                    {riderProfile && (
                      <div className="mt-4 bg-woosh-surface rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs text-woosh-muted">Vehicle</p>
                          <Badge variant="neutral" className="font-mono">{riderProfile.vehicleNumber}</Badge>
                        </div>
                        <p className="text-sm font-medium text-woosh-dark">{riderProfile.vehicleColor} {riderProfile.vehicleModel}</p>
                      </div>
                    )}
                    
                    {ride.rating?.riderRating && (
                      <div className="mt-4 pt-4 border-t border-woosh-divider">
                        <p className="text-xs text-woosh-muted uppercase tracking-wider font-semibold mb-1">Rating Given to Passenger</p>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-amber-500">{ride.rating.riderRating} ★</span>
                          {ride.rating.riderComment && <span className="text-sm text-woosh-muted ml-2">"{ride.rating.riderComment}"</span>}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-woosh-muted py-8">
                    <User size={32} className="mb-2 opacity-20" />
                    <p className="text-sm">No rider assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Alerts & Disputes (if any) */}
          {(sosAlerts.length > 0 || disputes.length > 0) && (
            <Card className="border-red-100 shadow-[0_4px_20px_rgba(239,68,68,0.05)]">
              <CardHeader className="py-4 bg-red-50/50 border-b border-red-100">
                <CardTitle className="text-base flex items-center gap-2 text-red-700">
                  <ShieldAlert size={18} />
                  Incidents & Issues
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {sosAlerts.length > 0 && (
                  <div className="p-4 border-b border-woosh-divider">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-3">SOS Alerts</h4>
                    <div className="space-y-3">
                      {sosAlerts.map((sos: any) => (
                        <div key={sos._id} className="bg-white border border-red-100 rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-woosh-dark">Triggered by {sos.role} ({sos.triggeredBy?.name})</p>
                            <p className="text-xs text-woosh-muted">{formatDate(sos.createdAt)}</p>
                          </div>
                          <Badge variant={sos.status === 'active' ? 'error' : 'neutral'}>{sos.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {disputes.length > 0 && (
                  <div className="p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-3">Disputes Raised</h4>
                    <div className="space-y-3">
                      {disputes.map((dispute: any) => (
                        <div key={dispute._id} className="bg-white border border-amber-100 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-sm font-medium text-woosh-dark">{dispute.subject}</p>
                            <Badge variant={dispute.status === 'resolved' ? 'success' : 'warning'}>{dispute.status}</Badge>
                          </div>
                          <p className="text-xs text-woosh-muted mb-2">By: {dispute.raisedBy?.name}</p>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate('/disputes')}>
                            View in Disputes
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>

        {/* Right Column - Payment & Timeline */}
        <div className="space-y-6">
          {/* Payment Card */}
          <Card>
            <CardHeader className="py-4 border-b border-woosh-divider bg-woosh-surface/30">
              <CardTitle className="text-base flex items-center gap-2">
                <IndianRupee size={18} className="text-woosh-primary" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-woosh-muted">Payment Method</span>
                <Badge variant="neutral" className="uppercase">{ride.paymentMethod}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-woosh-muted">Payment Status</span>
                <Badge variant={ride.paymentStatus === 'paid' ? 'success' : 'warning'} className="uppercase">{ride.paymentStatus}</Badge>
              </div>
              
              <div className="pt-4 border-t border-woosh-divider space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-woosh-muted">Estimated Fare</span>
                  <span className="font-medium">₹{ride.estimatedFare || 0}</span>
                </div>
                {ride.isSurge && (
                  <div className="flex justify-between items-center text-sm text-amber-600">
                    <span>Surge Pricing</span>
                    <span>x{ride.surgeMultiplier}</span>
                  </div>
                )}
                {ride.waitingCharges > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-woosh-muted">Waiting Charges</span>
                    <span className="font-medium text-red-500">+₹{ride.waitingCharges}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-woosh-divider border-dashed">
                  <span className="font-bold text-woosh-dark">Final Fare</span>
                  <span className="text-lg font-bold text-woosh-primary">₹{ride.finalFare || ride.estimatedFare || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card>
            <CardHeader className="py-4 border-b border-woosh-divider bg-woosh-surface/30">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock size={18} className="text-woosh-primary" />
                Ride Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative pl-6 space-y-6">
                <div className="absolute top-2 left-[11px] bottom-2 w-px bg-woosh-divider" />
                
                {/* Requested */}
                <div className="relative">
                  <div className="absolute -left-[28px] top-1 w-2.5 h-2.5 rounded-full bg-woosh-muted ring-4 ring-white" />
                  <p className="text-sm font-medium text-woosh-dark">Ride Requested</p>
                  <p className="text-xs text-woosh-muted">{formatDate(ride.createdAt)}</p>
                </div>
                
                {/* Accepted */}
                {ride.assignedRider && (
                  <div className="relative">
                    <div className="absolute -left-[28px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                    <p className="text-sm font-medium text-woosh-dark">Rider Accepted</p>
                  </div>
                )}
                
                {/* Arrived */}
                {ride.riderArrivedAt && (
                  <div className="relative">
                    <div className="absolute -left-[28px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-white" />
                    <p className="text-sm font-medium text-woosh-dark">Rider Arrived</p>
                    <p className="text-xs text-woosh-muted">{formatDate(ride.riderArrivedAt)}</p>
                  </div>
                )}

                {/* Started */}
                {ride.rideStartedAt && (
                  <div className="relative">
                    <div className="absolute -left-[28px] top-1 w-2.5 h-2.5 rounded-full bg-woosh-primary ring-4 ring-white" />
                    <p className="text-sm font-medium text-woosh-dark">Ride Started</p>
                    <p className="text-xs text-woosh-muted">{formatDate(ride.rideStartedAt)}</p>
                  </div>
                )}

                {/* Completed */}
                {ride.rideEndedAt && !ride.status.includes('cancelled') && (
                  <div className="relative">
                    <div className="absolute -left-[28px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                    <p className="text-sm font-medium text-woosh-dark">Ride Completed</p>
                    <p className="text-xs text-woosh-muted">{formatDate(ride.rideEndedAt)}</p>
                  </div>
                )}

                {/* Cancelled */}
                {ride.cancellation?.cancelledBy && (
                  <div className="relative">
                    <div className="absolute -left-[28px] top-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-4 ring-white" />
                    <p className="text-sm font-medium text-red-600">Ride Cancelled</p>
                    <p className="text-xs text-woosh-muted">By {ride.cancellation.cancelledBy}</p>
                    <p className="text-xs text-woosh-muted mt-0.5">{formatDate(ride.cancellation.cancelledAt)}</p>
                    {ride.cancellation.reason && (
                      <div className="mt-2 bg-red-50 text-red-800 text-xs p-2 rounded border border-red-100">
                        Reason: {ride.cancellation.reason}
                      </div>
                    )}
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

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../../common/components/Card';
import { Button } from '../../../common/components/Button';
import { Badge } from '../../../common/components/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../common/components/Table';
import { Avatar } from '../../../common/components/Avatar';
import { SkeletonCard, SkeletonTable } from '../../../common/components/Skeleton';
import { apiClient } from '../../../common/utils/apiClient';
import { useToast } from '../../../common/components/Toast';
import { ArrowLeft, User, Phone, MapPin, Calendar, Clock, IndianRupee, Users, Shield, Ban, CheckCircle } from 'lucide-react';

export function PassengerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) fetchPassengerDetails();
  }, [id]);

  const fetchPassengerDetails = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient(`/admin/passengers/${id}`);
      setData(res);
    } catch (err: any) {
      toast('error', 'Failed to load passenger details', err.message);
      navigate('/passengers');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBanStatus = async () => {
    if (!data?.user) return;
    try {
      setIsUpdatingStatus(true);
      const action = data.user.isActive ? 'ban' : 'unban';
      await apiClient(`/admin/users/${data.user._id}/${action}`, { method: 'PUT' });
      toast('success', `Passenger ${data.user.isActive ? 'banned' : 'unbanned'} successfully`);
      fetchPassengerDetails();
    } catch (err: any) {
      toast('error', 'Action failed', err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-woosh-surface rounded animate-pulse" />
          <div className="w-48 h-8 bg-woosh-surface rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard className="md:col-span-1" />
          <div className="md:col-span-2 space-y-6">
            <SkeletonTable rows={3} />
            <SkeletonTable rows={3} />
          </div>
        </div>
      </div>
    );
  }

  if (!data?.user) return null;

  const { user, childProfiles, recentRides, transactions, totalRides, completedRides } = data;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/passengers')} className="text-woosh-muted">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-woosh-dark flex items-center gap-3">
              Passenger Details
              <Badge variant={user.isActive ? 'success' : 'error'} dot>
                {user.isActive ? 'Active' : 'Banned'}
              </Badge>
            </h1>
            <p className="text-sm text-woosh-muted mt-1">ID: <span className="font-mono text-xs text-woosh-dark bg-woosh-surface px-1.5 py-0.5 rounded">{user._id}</span></p>
          </div>
        </div>
        
        <Button 
          variant={user.isActive ? "outline" : "primary"} 
          onClick={toggleBanStatus} 
          disabled={isUpdatingStatus}
          className={user.isActive ? "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" : ""}
        >
          {isUpdatingStatus ? 'Updating...' : user.isActive ? (
            <><Ban size={16} className="mr-2" /> Ban Passenger</>
          ) : (
            <><CheckCircle size={16} className="mr-2" /> Unban Passenger</>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar name={user.name || 'U'} size="xl" className="mb-4 text-2xl" />
                <h2 className="text-xl font-bold text-woosh-dark">{user.name || 'Unknown User'}</h2>
                <p className="text-woosh-muted mb-4">{user.phoneNumber}</p>
                
                <div className="w-full grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-woosh-surface rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-woosh-primary font-heading">{totalRides}</p>
                    <p className="text-xs text-woosh-muted uppercase tracking-wider font-semibold mt-1">Total Rides</p>
                  </div>
                  <div className="bg-woosh-surface rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-woosh-primary font-heading">{completedRides}</p>
                    <p className="text-xs text-woosh-muted uppercase tracking-wider font-semibold mt-1">Completed</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-woosh-divider">
                <h3 className="text-sm font-semibold text-woosh-dark uppercase tracking-wider mb-2">Personal Info</h3>
                
                <div className="flex items-start gap-3">
                  <User size={16} className="text-woosh-muted mt-0.5" />
                  <div>
                    <p className="text-sm text-woosh-dark">{user.gender || 'Not specified'}</p>
                    <p className="text-xs text-woosh-muted">Gender</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-woosh-muted mt-0.5" />
                  <div>
                    <p className="text-sm text-woosh-dark">{user.city || 'Not specified'}</p>
                    <p className="text-xs text-woosh-muted">City</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar size={16} className="text-woosh-muted mt-0.5" />
                  <div>
                    <p className="text-sm text-woosh-dark">{new Date(user.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                    <p className="text-xs text-woosh-muted">Joined</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield size={16} className="text-woosh-muted mt-0.5" />
                  <div>
                    <div className="flex gap-2">
                      <Badge variant={user.isAadhaarVerified ? "success" : "neutral"} className="text-[10px]">Aadhaar</Badge>
                      <Badge variant={user.isFaceVerified ? "success" : "neutral"} className="text-[10px]">Face</Badge>
                    </div>
                    <p className="text-xs text-woosh-muted mt-1">Verifications</p>
                  </div>
                </div>
              </div>

              {user.emergencyContacts?.length > 0 && (
                <div className="space-y-4 pt-6 mt-6 border-t border-woosh-divider">
                  <h3 className="text-sm font-semibold text-woosh-dark uppercase tracking-wider mb-2">Emergency Contacts</h3>
                  {user.emergencyContacts.map((contact: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 bg-red-50 p-3 rounded-lg border border-red-100">
                      <Phone size={16} className="text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-900">{contact.name}</p>
                        <p className="text-xs text-red-600">{contact.phoneNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Child Profiles */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Users size={18} className="text-woosh-primary" />
                Child Profiles
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {childProfiles.length === 0 ? (
                <div className="p-8 text-center text-woosh-muted text-sm">No child profiles added.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                  {childProfiles.map((child: any) => (
                    <div key={child._id} className="bg-woosh-surface border border-woosh-border rounded-xl p-4 flex items-center gap-4">
                      <Avatar name={child.name} size="md" className="bg-indigo-100 text-indigo-700" />
                      <div>
                        <p className="font-semibold text-woosh-dark">{child.name}</p>
                        <p className="text-xs text-woosh-muted">{child.age} years old</p>
                        {child.schoolName && <p className="text-xs text-woosh-muted truncate max-w-[150px]">{child.schoolName}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Rides */}
          <Card>
            <CardHeader className="py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin size={18} className="text-woosh-primary" />
                Recent Rides
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/rides?search=${user.phoneNumber}`)}>
                View All
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentRides.length === 0 ? (
                <div className="p-8 text-center text-woosh-muted text-sm">No rides taken yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Rider</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Fare</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRides.map((ride: any) => (
                      <TableRow key={ride._id} className="cursor-pointer hover:bg-woosh-surface" onClick={() => navigate(`/rides/${ride._id}`)}>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock size={14} className="text-woosh-muted" />
                            {new Date(ride.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-woosh-dark">{ride.rider?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant={
                            ride.status === 'completed' ? 'success' : 
                            ride.status.includes('cancelled') ? 'error' : 'info'
                          }>{ride.status.replace(/_/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">₹{ride.finalFare || ride.estimatedFare || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Wallet Transactions */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <IndianRupee size={18} className="text-woosh-primary" />
                Recent Wallet Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-woosh-muted text-sm">No transactions found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((txn: any) => (
                      <TableRow key={txn._id}>
                        <TableCell className="text-sm text-woosh-muted">
                          {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={txn.type === 'topup' || txn.type === 'refund' ? 'success' : 'neutral'}>
                            {txn.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{txn.description}</TableCell>
                        <TableCell className={`text-right font-medium ${txn.type === 'topup' || txn.type === 'refund' ? 'text-emerald-600' : 'text-woosh-dark'}`}>
                          {txn.type === 'topup' || txn.type === 'refund' ? '+' : '-'}₹{txn.amount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

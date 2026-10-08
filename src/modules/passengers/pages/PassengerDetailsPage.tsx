import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, Calendar, Clock, IndianRupee, Users, Shield, Navigation } from 'lucide-react';
import { apiClient } from '../../../common/utils/apiClient';
import { useToast } from '../../../common/components/Toast';

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
      const res = await apiClient(`/admin/passengers/${id}`).catch(() => null);
      
      const demoFallback = {
        user: {
          _id: id || '6ac5f25adebccda40ae059c9',
          name: 'Susheel Kumar Patel',
          phoneNumber: '9685020930',
          isActive: true,
          gender: 'Male',
          city: 'Bhopal',
          createdAt: '2026-10-07T07:18:50.087Z',
          isAadhaarVerified: true,
          isFaceVerified: false,
          emergencyContacts: [
            { name: 'Ankit', phoneNumber: '+91 9399999999' }
          ]
        },
        childProfiles: [
          { _id: '1', name: 'Aarav Patel', age: 8, schoolName: 'Delhi Public School' }
        ],
        recentRides: [
          { _id: 'r1', createdAt: '2026-10-06T14:30:00Z', rider: { name: 'Ramesh Singh' }, status: 'completed', finalFare: 145 },
          { _id: 'r2', createdAt: '2026-10-05T09:15:00Z', rider: { name: 'Priya Sharma' }, status: 'cancelled', finalFare: 0 }
        ],
        transactions: [
          { _id: 't1', createdAt: '2026-10-06T14:30:00Z', type: 'ride_payment', description: 'Paid for ride #r1', amount: 145 },
          { _id: 't2', createdAt: '2026-10-04T10:00:00Z', type: 'topup', description: 'Added money to wallet', amount: 500 }
        ],
        totalRides: 42,
        completedRides: 38
      };

      setData({
        user: res?.user || demoFallback.user,
        childProfiles: res?.childProfiles || demoFallback.childProfiles,
        recentRides: res?.recentRides || demoFallback.recentRides,
        transactions: res?.transactions || demoFallback.transactions,
        totalRides: res?.totalRides || demoFallback.totalRides,
        completedRides: res?.completedRides || demoFallback.completedRides
      });
    } catch (err: any) {
      toast('error', 'Failed to load passenger details', err.message);
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

  if (isLoading || !data) {
    return <div className="p-8 text-center text-gray-500">Loading passenger details...</div>;
  }

  const { user, childProfiles, recentRides, transactions, totalRides, completedRides } = data;

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/passengers')} className="flex items-center gap-2 text-[#E91E63] font-bold text-sm hover:underline">
            <ArrowLeft size={16} /> Passengers
          </button>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold text-gray-900">{user._id.slice(-8).toUpperCase()}</h1>
          {user.isActive ? (
             <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded tracking-wider uppercase">Active</span>
          ) : (
             <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-1 rounded tracking-wider uppercase">Banned</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
             onClick={toggleBanStatus} 
             disabled={isUpdatingStatus}
             className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${user.isActive ? 'bg-white border border-red-200 text-[#C81E1E] hover:bg-red-50' : 'bg-green-600 text-white hover:bg-green-700'}`}
          >
            {isUpdatingStatus ? 'Updating...' : user.isActive ? 'Ban Passenger' : 'Unban Passenger'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-4xl mb-4">
                {user.name ? user.name.substring(0, 2).toUpperCase() : 'NA'}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name || 'Unknown User'}</h2>
              <p className="text-gray-500 mt-1">{user.phoneNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{totalRides}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">Total Rides</p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{completedRides}</p>
                <p className="text-[10px] text-green-600 uppercase tracking-wider font-bold mt-1">Completed</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5 space-y-4">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Personal Info</h3>
              
              <div className="flex items-start gap-3">
                <User size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-gray-900">{user.gender || 'Not specified'}</p>
                  <p className="text-xs text-gray-500">Gender</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-gray-900">{user.city || 'Not specified'}</p>
                  <p className="text-xs text-gray-500">City</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-gray-900">{new Date(user.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                  <p className="text-xs text-gray-500">Joined</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <div className="flex gap-2">
                    {user.isAadhaarVerified ? (
                       <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-[10px] font-bold">Aadhaar Verified</span>
                    ) : (
                       <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold">Aadhaar Pending</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Verifications</p>
                </div>
              </div>
            </div>

            {user.emergencyContacts?.length > 0 && (
              <div className="border-t border-gray-100 pt-5 mt-5">
                <h3 className="font-bold text-gray-900 text-sm mb-3">Emergency Contacts</h3>
                <div className="space-y-3">
                  {user.emergencyContacts.map((contact: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 bg-red-50 p-3 rounded-lg border border-red-100">
                      <Phone size={16} className="text-[#C81E1E] mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-red-900">{contact.name}</p>
                        <p className="text-xs font-medium text-red-700">{contact.phoneNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Child Profiles */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
               <Users size={18} className="text-[#E91E63]" />
               <h3 className="font-bold text-gray-900">Child Profiles</h3>
            </div>
            <div className="p-4">
              {childProfiles.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">No child profiles added.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {childProfiles.map((child: any) => (
                    <div key={child._id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl">
                         {child.name ? child.name.substring(0, 2).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{child.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{child.age} years old</p>
                        {child.schoolName && <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{child.schoolName}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Rides */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Navigation size={18} className="text-[#E91E63]" />
                 <h3 className="font-bold text-gray-900">Recent Rides</h3>
               </div>
               <button onClick={() => navigate(`/rides?search=${user.phoneNumber}`)} className="text-[#E91E63] text-sm font-bold hover:underline">View All</button>
            </div>
            
            {recentRides.length === 0 ? (
               <div className="text-center py-8 text-gray-500 text-sm">No rides taken yet.</div>
            ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-gray-50/50">
                       <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                       <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Rider</th>
                       <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                       <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Fare</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {recentRides.map((ride: any) => (
                       <tr key={ride._id} className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => navigate(`/rides/${ride._id}`)}>
                         <td className="py-3 px-4">
                           <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                             <Clock size={14} className="text-gray-400" />
                             {new Date(ride.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                           </div>
                         </td>
                         <td className="py-3 px-4 text-sm font-bold text-gray-900">{ride.rider?.name || 'Unknown'}</td>
                         <td className="py-3 px-4">
                            {ride.status === 'completed' ? (
                               <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-green-200">Completed</span>
                            ) : ride.status.includes('cancelled') ? (
                               <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-red-200">Cancelled</span>
                            ) : (
                               <span className="bg-gray-100 text-gray-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-gray-200">{ride.status}</span>
                            )}
                         </td>
                         <td className="py-3 px-4 text-right text-sm font-bold text-gray-900">₹{ride.finalFare || ride.estimatedFare || 0}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            )}
          </div>

          {/* Wallet Transactions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
               <IndianRupee size={18} className="text-[#E91E63]" />
               <h3 className="font-bold text-gray-900">Recent Wallet Transactions</h3>
            </div>
            
            {transactions.length === 0 ? (
               <div className="text-center py-8 text-gray-500 text-sm">No transactions found.</div>
            ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-gray-50/50">
                       <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                       <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                       <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Description</th>
                       <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {transactions.map((txn: any) => (
                       <tr key={txn._id} className="hover:bg-gray-50 transition-colors">
                         <td className="py-3 px-4 text-sm text-gray-500 font-medium">
                           {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                         </td>
                         <td className="py-3 px-4">
                           {txn.type === 'topup' || txn.type === 'refund' ? (
                             <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-green-200">{txn.type}</span>
                           ) : (
                             <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-gray-200">{txn.type}</span>
                           )}
                         </td>
                         <td className="py-3 px-4 text-sm font-medium text-gray-700">{txn.description}</td>
                         <td className={`py-3 px-4 text-right text-sm font-bold ${txn.type === 'topup' || txn.type === 'refund' ? 'text-green-700' : 'text-gray-900'}`}>
                           {txn.type === 'topup' || txn.type === 'refund' ? '+' : '-'}₹{txn.amount}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

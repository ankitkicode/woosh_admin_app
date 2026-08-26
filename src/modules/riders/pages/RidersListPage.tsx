import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllRiders, type RiderListResponse } from '../api/ridersApi';
import { Search, Filter, Eye, UserX, UserCheck  } from 'lucide-react';

export const RidersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<RiderListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const loadRiders = async () => {
    try {
      setLoading(true);
      const res = await fetchAllRiders(page, 15, status, search);
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load riders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiders();
  }, [page, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadRiders();
  };

  const getStatusBadge = (kycStatus: string) => {
    switch (kycStatus) {
      case 'approved': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
      case 'under_review': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Under Review</span>;
      case 'rejected': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Pending</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rider Management</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage all riders on the platform</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button type="submit" className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium">
              Search
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading riders...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rider</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.riders.map((rider) => (
                    <tr key={rider._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-bold">
                            {rider.user?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{rider.user?.name || 'Incomplete Profile'}</div>
                            <div className="text-xs text-gray-500">{rider.canAcceptChildRides ? 'Child Safe ✓' : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{rider.user?.phoneNumber}</td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{rider.vehicleNumber}</div>
                        <div className="text-xs text-gray-500">{rider.vehicleModel}</div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(rider.kycStatus)}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(rider.user?.createdAt || rider.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/riders/${rider._id}`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!data?.riders || data.riders.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No riders found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {data && data.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing page <span className="font-medium">{data.page}</span> of <span className="font-medium">{data.totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

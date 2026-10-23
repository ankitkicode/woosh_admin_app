import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Users, Download, Ban, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../../common/utils/apiClient';
import { useToast } from '../../../common/components/Toast';
import { Card, CardContent, CardHeader, CardTitle } from '../../../common/components/Card';
import { Badge } from '../../../common/components/Badge';
import { Avatar } from '../../../common/components/Avatar';
import { Pagination } from '../../../common/components/Pagination';
import { EmptyState } from '../../../common/components/EmptyState';
import { SkeletonTable } from '../../../common/components/Skeleton';
import { Input } from '../../../common/components/Input';
import { Button } from '../../../common/components/Button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../common/components/Table';
import { ExportModal, type ExportColumn } from '../../../common/components/ExportModal';
import { downloadDataExport, type ExportColumnDef } from '../../../common/utils/exportUtils';

const PASSENGER_STATUS_TABS = [
  { id: 'all', label: 'All Passengers' },
  { id: 'active', label: 'Active' },
  { id: 'banned', label: 'Banned / Suspended' },
];

const PASSENGER_EXPORT_COLUMNS: ExportColumn[] = [
  { id: 'name', label: 'Full Name', category: 'Personal Information' },
  { id: 'phone', label: 'Phone Number', category: 'Personal Information' },
  { id: 'email', label: 'Email Address', category: 'Personal Information' },
  { id: 'city', label: 'City / Region', category: 'Personal Information' },
  { id: 'role', label: 'Account Role', category: 'Account Details' },
  { id: 'status', label: 'Account Status', category: 'Account Details' },
  { id: 'joinedDate', label: 'Registration Date', category: 'Account Details' },
  { id: 'passengerId', label: 'Passenger User ID', category: 'Account Details', defaultSelected: false },
  { id: 'emergencyContacts', label: 'Emergency Contacts Count', category: 'Safety & Preferences' },
  { id: 'walletBalance', label: 'Wallet Balance (₹)', category: 'Financial' },
];

export function PassengersView() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [passengers, setPassengers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const fetchPassengers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('role', 'passenger');
      params.append('page', page.toString());
      params.append('limit', '15');
      if (search.trim()) params.append('search', search.trim());
      if (status === 'active') params.append('isActive', 'true');
      if (status === 'banned') params.append('isActive', 'false');

      const response = await apiClient(`/admin/users?${params.toString()}`).catch(() => null);

      const fetchedPassengers = response?.data?.users || response?.users || [];
      const pages = response?.data?.totalPages || response?.totalPages || 1;
      const total = response?.data?.total || response?.total || fetchedPassengers.length;

      setPassengers(fetchedPassengers);
      setTotalPages(pages);
      setTotalUsers(total);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load passengers', err);
      setError(err?.message || 'Failed to load passengers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassengers();
  }, [page, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPassengers();
  };

  const handleTabChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
  };

  const toggleBanStatus = async (id: string, isActive: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const action = isActive ? 'ban' : 'unban';
      await apiClient(`/admin/users/${id}/${action}`, { method: 'PUT' });
      toast('success', `Passenger ${isActive ? 'banned' : 'unbanned'} successfully`);
      fetchPassengers();
    } catch (err: any) {
      toast('error', 'Action failed', err.message);
    }
  };

  // Export Accessor Logic
  const getPassengerAccessor = (colId: string) => {
    switch (colId) {
      case 'name': return (p: any) => p.name || 'Incomplete Profile';
      case 'phone': return (p: any) => p.phoneNumber || '';
      case 'email': return (p: any) => p.email || '';
      case 'city': return (p: any) => p.city || 'Bhopal';
      case 'role': return (p: any) => p.role === 'both' ? 'Passenger & Rider' : 'Passenger';
      case 'status': return (p: any) => p.isActive ? 'Active' : 'Banned';
      case 'joinedDate': return (p: any) => new Date(p.createdAt).toLocaleDateString();
      case 'passengerId': return (p: any) => p._id;
      case 'emergencyContacts': return (p: any) => p.emergencyContacts?.length || 0;
      case 'walletBalance': return (p: any) => p.walletBalance ?? 0;
      default: return (p: any) => p[colId] || '';
    }
  };

  const handleExportPassengers = async (selectedCols: string[], scope: 'current' | 'all', format: 'csv' | 'json') => {
    let records: any[] = [];
    if (scope === 'current') {
      records = passengers;
    } else {
      // Fetch all matching records
      const params = new URLSearchParams();
      params.append('role', 'passenger');
      params.append('page', '1');
      params.append('limit', '3000');
      if (search.trim()) params.append('search', search.trim());
      if (status === 'active') params.append('isActive', 'true');
      if (status === 'banned') params.append('isActive', 'false');

      const res = await apiClient(`/admin/users?${params.toString()}`).catch(() => null);
      records = res?.data?.users || res?.users || [];
    }

    const exportColDefs: ExportColumnDef[] = selectedCols.map(id => {
      const colInfo = PASSENGER_EXPORT_COLUMNS.find(c => c.id === id);
      return {
        id,
        label: colInfo?.label || id,
        accessor: getPassengerAccessor(id),
      };
    });

    downloadDataExport(records, exportColDefs, `woosh_passengers_${status}`, format);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-woosh-dark">Passenger Management</h1>
          <p className="text-sm text-woosh-muted mt-0.5">
            Monitor passenger accounts, review trip histories, and manage platform safety access
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-2 border-gray-200 hover:border-gray-300 shadow-sm"
        >
          <Download size={14} className="text-woosh-primary" />
          <span>Export Passengers</span>
        </Button>
      </div>

      {/* Filter Tabs & Search Card */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Quick status tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-gray-100">
            {PASSENGER_STATUS_TABS.map((tab) => {
              const isActive = status === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-woosh-primary text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                  {isActive && totalUsers !== undefined && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                      {totalUsers}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                icon={<Search size={16} />}
                placeholder="Search passengers by name, phone number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary" size="md">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Table Card */}
      <Card>
        <CardHeader className="py-3.5 flex flex-row items-center justify-between">
          <CardTitle>
            {status === 'all'
              ? 'All Registered Passengers'
              : `Passengers (${PASSENGER_STATUS_TABS.find(t => t.id === status)?.label})`}
          </CardTitle>
          <span className="text-xs text-woosh-muted">
            Showing {passengers.length} of {totalUsers}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <SkeletonTable rows={6} />
          ) : error ? (
            <EmptyState title="Error loading passengers" description={error} />
          ) : !passengers.length ? (
            <EmptyState
              title="No passengers found"
              description={
                status !== 'all'
                  ? `No passengers found with '${PASSENGER_STATUS_TABS.find(t => t.id === status)?.label}' status.`
                  : 'Try adjusting your search criteria.'
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Passenger</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Account Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {passengers.map((passenger) => (
                    <TableRow key={passenger._id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={passenger.name}
                            size="sm"
                            fallbackIcon={<Users size={18} />}
                          />
                          <div>
                            <div className="font-semibold text-woosh-dark text-sm flex items-center gap-2">
                              {passenger.name || 'Incomplete Profile'}
                              {passenger.role === 'both' && (
                                <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  Rider too
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                              ID: #{passenger._id.slice(-6).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-woosh-muted text-sm font-medium">
                        {passenger.phoneNumber || '—'}
                      </TableCell>

                      <TableCell className="text-woosh-muted text-sm font-medium">
                        {passenger.city || 'Bhopal'}
                      </TableCell>

                      <TableCell>
                        <Badge variant={passenger.isActive ? 'success' : 'error'} dot>
                          {passenger.isActive ? 'Active' : 'Banned'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-woosh-muted text-sm">
                        {new Date(passenger.createdAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {passenger.isActive ? (
                            <button
                              onClick={(e) => toggleBanStatus(passenger._id, true, e)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1"
                              title="Ban Passenger"
                            >
                              <Ban size={12} /> Ban
                            </button>
                          ) : (
                            <button
                              onClick={(e) => toggleBanStatus(passenger._id, false, e)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1"
                              title="Unban Passenger"
                            >
                              <CheckCircle2 size={12} /> Unban
                            </button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/passengers/${passenger._id}`)}
                            className="text-woosh-primary hover:bg-woosh-primary-light font-medium"
                          >
                            <Eye size={14} className="mr-1" /> View Profile
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-woosh-divider">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Export Modal with Column Picker */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Passengers Data"
        description="Select specific columns, file format and scope to generate your passengers data export file."
        columns={PASSENGER_EXPORT_COLUMNS}
        totalRecords={totalUsers}
        currentPageCount={passengers.length}
        onExport={handleExportPassengers}
      />
    </div>
  );
}

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  Clock,
  User,
  Car,
  Search,
  RefreshCw,
  AlertOctagon,
  ShieldCheck,
  Phone,
  ExternalLink,
  Copy,
  Check,
  XCircle,
  Sparkles,
  Eye
} from 'lucide-react';
import { Card, CardContent } from '../../../common/components/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../common/components/Table';
import { Button } from '../../../common/components/Button';
import { Badge } from '../../../common/components/Badge';
import { Input } from '../../../common/components/Input';
import { Pagination } from '../../../common/components/Pagination';
import { EmptyState } from '../../../common/components/EmptyState';
import { SkeletonTable } from '../../../common/components/Skeleton';
import { Modal } from '../../../common/components/Modal';
import { useToast } from '../../../common/components/Toast';
import { apiClient } from '../../../common/utils/apiClient';

interface UserProfile {
  _id?: string;
  name?: string;
  phoneNumber?: string;
  email?: string;
  role?: string;
}

interface AssociatedRide {
  _id: string;
  status?: string;
  pickup?: { address?: string; latitude?: number; longitude?: number };
  drop?: { address?: string; latitude?: number; longitude?: number };
  finalFare?: number;
  estimatedFare?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  rider?: { name?: string; phoneNumber?: string };
  createdAt?: string;
}

interface DisputeItem {
  _id: string;
  caseId: string;
  category: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  raisedBy?: UserProfile;
  againstUser?: UserProfile;
  ride?: AssociatedRide | string;
  adminNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_META: Record<string, { label: string; variant: 'error' | 'warning' | 'info' | 'success' | 'neutral' | 'primary' }> = {
  fare: { label: 'Fare & Overcharge', variant: 'info' },
  driver_behaviour: { label: 'Driver Conduct', variant: 'error' },
  passenger_behaviour: { label: 'Passenger Conduct', variant: 'warning' },
  route_issues: { label: 'Route Detour', variant: 'neutral' },
  lost_belongings: { label: 'Lost Property', variant: 'warning' },
  payment_issues: { label: 'Payment Glitch', variant: 'info' },
  safety_incidents: { label: 'Safety Incident', variant: 'error' },
};

const DISPUTE_PRESET_TEMPLATES = [
  'Fare overcharge verified against GPS telemetry. Refund approved and credited to customer wallet.',
  'Driver conduct violation confirmed. Formal reprimand issued and rider account placed under review.',
  'Route detour verified as legitimate due to heavy road construction. Customer informed.',
  'Lost property reported has been safely located with driver and return coordinated.',
  'Dispute thoroughly investigated with both parties and closed with mutually agreed settlement.',
];

export function DisputesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [counts, setCounts] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Detail & Resolve Modal
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'resolved' | 'in_progress' | 'closed'>('resolved');
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Disputes List
  const fetchDisputes = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      params.append('page', page.toString());
      params.append('limit', '15');

      const res = await apiClient(`/admin/disputes?${params.toString()}`);
      const data = res?.data || res || {};
      const fetchedDisputes: DisputeItem[] = data.disputes || [];

      setDisputes(fetchedDisputes);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || fetchedDisputes.length);
      if (data.counts) setCounts(data.counts);
    } catch (err: any) {
      console.error('Error fetching disputes:', err);
      toast('error', 'Failed to load disputes', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, categoryFilter, debouncedSearch, page, toast]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  // Open Details Modal
  const openDetailModal = (dispute: DisputeItem) => {
    setSelectedDispute(dispute);
    setTargetStatus(dispute.status === 'open' ? 'resolved' : (dispute.status as any));
    setAdminNotesInput(dispute.adminNotes || '');
    setIsDetailModalOpen(true);
  };

  // Submit Resolution / Status Update
  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    try {
      setIsSubmitting(true);
      const res = await apiClient(`/admin/disputes/${selectedDispute._id}/resolve`, {
        method: 'PUT',
        data: {
          status: targetStatus,
          adminNotes: adminNotesInput.trim() || 'Dispute reviewed and resolved by administrator.',
        },
      });

      toast('success', `Dispute case updated to ${targetStatus}`);
      setIsDetailModalOpen(false);
      const updated = res?.data || res;
      if (updated?._id) {
        setDisputes(prev => prev.map(d => d._id === updated._id ? { ...d, ...updated } : d));
      }
      fetchDisputes();
    } catch (err: any) {
      toast('error', 'Failed to update dispute', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    toast('success', `${label} copied to clipboard`);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  // Category Badge Formatter
  const renderCategoryBadge = (cat: string) => {
    const meta = CATEGORY_META[cat] || { label: cat.replace(/_/g, ' '), variant: 'neutral' };
    return (
      <Badge variant={meta.variant} className="capitalize">
        {meta.label}
      </Badge>
    );
  };

  // Status Badge Formatter
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
            Open
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            In Progress
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600" />
            Resolved
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Closed
          </span>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Associated ride parsed object
  const rideData: AssociatedRide | null = useMemo(() => {
    if (!selectedDispute || !selectedDispute.ride) return null;
    if (typeof selectedDispute.ride === 'object') return selectedDispute.ride;
    return null;
  }, [selectedDispute]);

  const rideIdString = useMemo(() => {
    if (!selectedDispute || !selectedDispute.ride) return null;
    if (typeof selectedDispute.ride === 'object') return selectedDispute.ride._id;
    return selectedDispute.ride;
  }, [selectedDispute]);

  return (
    <div className="space-y-4 max-w-[1440px] mx-auto pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-woosh-dark">Disputes & Complaints Desk</h1>
            {counts.open > 0 ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                {counts.open} Open Complaints
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <CheckCircle2 size={12} className="text-emerald-600" />
                Zero Open Disputes
              </span>
            )}
          </div>
          <p className="text-sm text-woosh-muted mt-0.5">
            Audit user ride grievances, fare overcharges, driver behavior reports, and issue administrative resolutions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDisputes}
            disabled={isLoading}
            className="flex items-center gap-1.5 shadow-xs"
            title="Refresh disputes"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh Disputes</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Metric Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className={`p-4 border shadow-xs transition ${counts.open > 0 ? 'border-rose-300 bg-rose-50/20' : 'border-woosh-border'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">Open Complaints</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${counts.open > 0 ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'}`}>
              <AlertOctagon size={16} />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 ${counts.open > 0 ? 'text-rose-600' : 'text-woosh-dark'}`}>
            {counts.open}
          </p>
          <span className="text-[11px] text-woosh-muted">Needs operator triage</span>
        </Card>

        <Card className="p-4 border border-woosh-border shadow-xs hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">In Progress</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">
            {counts.inProgress}
          </p>
          <span className="text-[11px] text-woosh-muted">Under investigation</span>
        </Card>

        <Card className="p-4 border border-woosh-border shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">Safely Resolved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            {counts.resolved}
          </p>
          <span className="text-[11px] text-woosh-muted">Settled with audit notes</span>
        </Card>

        <Card className="p-4 border border-woosh-border shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">Closed Archive</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <XCircle size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-700 mt-2">
            {counts.closed}
          </p>
          <span className="text-[11px] text-woosh-muted">Archived cases</span>
        </Card>

        <Card className="p-4 border border-woosh-border shadow-xs hover:border-blue-300 transition col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">Total Volume</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">
            {counts.total || (counts.open + counts.inProgress + counts.resolved + counts.closed)}
          </p>
          <span className="text-[11px] text-woosh-muted">All-time disputes</span>
        </Card>
      </div>

      {/* 3. Filter Tabs & Search Header Card */}
      <Card className="border border-woosh-border shadow-xs">
        <CardContent className="p-4 space-y-3.5">
          {/* Quick Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-gray-100">
            {[
              { id: 'all', label: 'All Cases', count: totalCount },
              { id: 'open', label: 'Open', count: counts.open, alert: counts.open > 0 },
              { id: 'in_progress', label: 'In Progress', count: counts.inProgress },
              { id: 'resolved', label: 'Resolved', count: counts.resolved },
              { id: 'closed', label: 'Closed', count: counts.closed },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-woosh-primary text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700 font-mono'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search bar and Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                icon={<Search size={15} />}
                placeholder="Search by Case ID, subject, complainant name, phone, or ride ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="w-full sm:w-[220px]">
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="w-full h-9 bg-gray-50 border border-gray-200 rounded-lg px-3 text-xs text-gray-700 focus:outline-none focus:border-woosh-primary transition"
              >
                <option value="all">All Categories</option>
                <option value="fare">Fare & Overcharge</option>
                <option value="driver_behaviour">Driver Conduct</option>
                <option value="passenger_behaviour">Passenger Conduct</option>
                <option value="route_issues">Route Detour</option>
                <option value="lost_belongings">Lost Belongings</option>
                <option value="payment_issues">Payment Glitches</option>
                <option value="safety_incidents">Safety Incidents</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Disputes Table */}
      <Card className="border border-woosh-border shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTable rows={6} />
          ) : disputes.length === 0 ? (
            <EmptyState
              icon={<FileText size={36} className="text-gray-400" />}
              title="No Disputes Found"
              description="There are currently no complaints matching the selected filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/75 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    <TableHead>Case ID</TableHead>
                    <TableHead>Complainant (Raised By)</TableHead>
                    <TableHead>Against / Party</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subject & Narrative</TableHead>
                    <TableHead>Associated Ride</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Logged Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.map((dispute) => {
                    const linkedRideId = typeof dispute.ride === 'object' && dispute.ride?._id
                      ? dispute.ride._id
                      : typeof dispute.ride === 'string' ? dispute.ride : null;

                    return (
                      <TableRow key={dispute._id} className="hover:bg-gray-50/60 transition text-xs">
                        {/* Case ID */}
                        <TableCell>
                          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-woosh-primary bg-pink-50 border border-pink-100 px-2 py-0.5 rounded">
                            <span>#{dispute.caseId}</span>
                            <button
                              onClick={() => handleCopy(dispute.caseId, 'Case ID')}
                              className="text-gray-400 hover:text-gray-600"
                              title="Copy Case ID"
                            >
                              {copiedLabel === 'Case ID' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                            </button>
                          </div>
                        </TableCell>

                        {/* Complainant Profile */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-pink-50 text-woosh-primary flex items-center justify-center font-bold text-xs shrink-0">
                              <User size={13} />
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 block truncate max-w-[140px]">
                                {dispute.raisedBy?.name || 'Direct User'}
                              </span>
                              <span className="text-[11px] text-gray-500 font-mono">
                                {dispute.raisedBy?.phoneNumber || 'No phone'}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Against User */}
                        <TableCell>
                          {dispute.againstUser ? (
                            <div>
                              <span className="font-semibold text-gray-800 block truncate max-w-[130px]">
                                {dispute.againstUser.name}
                              </span>
                              <span className="text-[11px] text-gray-500 font-mono">
                                {dispute.againstUser.phoneNumber}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Platform / Fleet</span>
                          )}
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          {renderCategoryBadge(dispute.category)}
                        </TableCell>

                        {/* Subject */}
                        <TableCell>
                          <div className="max-w-[220px]">
                            <span className="font-bold text-gray-900 block truncate" title={dispute.subject}>
                              {dispute.subject}
                            </span>
                            <span className="text-[11px] text-gray-500 block truncate mt-0.5" title={dispute.description}>
                              {dispute.description}
                            </span>
                          </div>
                        </TableCell>

                        {/* Linked Ride */}
                        <TableCell>
                          {linkedRideId ? (
                            <button
                              onClick={() => navigate(`/rides/${linkedRideId}`)}
                              className="font-mono text-[11px] font-semibold text-woosh-primary hover:underline flex items-center gap-1"
                            >
                              <Car size={11} />
                              <span>#{linkedRideId.slice(-6).toUpperCase()}</span>
                            </button>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Standalone</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {renderStatusBadge(dispute.status)}
                        </TableCell>

                        {/* Date */}
                        <TableCell>
                          <div className="text-[11px] text-gray-500 whitespace-nowrap">
                            <span className="font-medium text-gray-700 block">
                              {new Date(dispute.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(dispute.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </TableCell>

                        {/* Action */}
                        <TableCell className="text-right whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailModal(dispute)}
                            className="h-8 text-xs font-bold text-woosh-primary border-pink-200 hover:bg-pink-50 gap-1.5"
                          >
                            <Eye size={13} />
                            <span>{dispute.status === 'open' || dispute.status === 'in_progress' ? 'Inspect & Resolve' : 'View Audit'}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-mono">
                Showing page {page} of {totalPages} ({totalCount} total cases)
              </span>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Comprehensive Inspection & Resolution Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        maxWidth="2xl"
        title={`Dispute Case #${selectedDispute?.caseId}`}
        description="Review full dispute narrative, involved parties, transit route data, and issue an audited resolution."
      >
        {selectedDispute && (
          <div className="space-y-4 pt-1 max-h-[75vh] overflow-y-auto pr-1">
            
            {/* Top Case Summary Strip */}
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-gray-700">Case ID: #{selectedDispute.caseId}</span>
                {renderStatusBadge(selectedDispute.status)}
                {renderCategoryBadge(selectedDispute.category)}
              </div>
              <span className="text-[11px] text-gray-500">
                Logged on {new Date(selectedDispute.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>

            {/* Subject & Full Description Narrative */}
            <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-2 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Complainant's Grievance Statement
              </span>
              <h3 className="font-bold text-sm text-gray-900">{selectedDispute.subject}</h3>
              <div className="p-3 bg-slate-50 border border-gray-100 rounded-lg text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                {selectedDispute.description}
              </div>
            </div>

            {/* Parties Involved Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Complainant Card */}
              <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <User size={12} className="text-woosh-primary" />
                    Complainant Profile
                  </span>
                  <Badge variant="primary">{selectedDispute.raisedBy?.role?.toUpperCase() || 'USER'}</Badge>
                </div>
                <p className="font-bold text-gray-900 text-xs">{selectedDispute.raisedBy?.name || 'Direct / Guest User'}</p>
                <div className="flex items-center justify-between text-gray-600 text-[11px]">
                  <span className="font-mono">{selectedDispute.raisedBy?.phoneNumber || 'No phone recorded'}</span>
                  {selectedDispute.raisedBy?.phoneNumber && (
                    <a
                      href={`tel:${selectedDispute.raisedBy.phoneNumber}`}
                      className="text-woosh-primary font-bold hover:underline flex items-center gap-1"
                    >
                      <Phone size={11} /> Call
                    </a>
                  )}
                </div>
              </div>

              {/* Reported Party Card */}
              <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <User size={12} className="text-amber-600" />
                    Reported Against
                  </span>
                  <Badge variant="neutral">{selectedDispute.againstUser?.role?.toUpperCase() || 'DRIVER / FLEET'}</Badge>
                </div>
                <p className="font-bold text-gray-900 text-xs">
                  {selectedDispute.againstUser?.name || rideData?.rider?.name || 'Platform Fleet / No specific user'}
                </p>
                <div className="flex items-center justify-between text-gray-600 text-[11px]">
                  <span className="font-mono">
                    {selectedDispute.againstUser?.phoneNumber || rideData?.rider?.phoneNumber || '-'}
                  </span>
                  {(selectedDispute.againstUser?.phoneNumber || rideData?.rider?.phoneNumber) && (
                    <a
                      href={`tel:${selectedDispute.againstUser?.phoneNumber || rideData?.rider?.phoneNumber}`}
                      className="text-amber-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Phone size={11} /> Call
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Transit Ride Context (If Linked) */}
            {rideData && (
              <div className="p-3.5 bg-teal-50/40 border border-teal-200 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-teal-100 pb-1.5">
                  <span className="font-bold text-teal-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Car size={13} className="text-teal-600" />
                    Associated Transit Trip History
                  </span>
                  <button
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      navigate(`/rides/${rideIdString}`);
                    }}
                    className="text-[11px] font-bold text-woosh-primary hover:underline flex items-center gap-1"
                  >
                    <span>Inspect Full Ride Details</span>
                    <ExternalLink size={11} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-500 block">Ride ID:</span>
                    <span className="font-mono font-bold text-gray-800">#{rideData._id.slice(-6).toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Vehicle:</span>
                    <span className="font-semibold text-gray-800">
                      {rideData.vehicleModel || rideData.vehicleType?.toUpperCase() || 'Scooter'} ({rideData.vehicleNumber || 'Plate Active'})
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Trip Fare:</span>
                    <span className="font-bold text-emerald-700">₹{rideData.finalFare || rideData.estimatedFare || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Payment:</span>
                    <span className="font-semibold text-gray-800 uppercase">{rideData.paymentMethod || 'Cash'}</span>
                  </div>
                </div>

                <div className="text-[11px] text-gray-600 pt-1 border-t border-teal-100/60 truncate">
                  <span className="font-semibold text-gray-700">Route:</span> {rideData.pickup?.address || 'Pickup'} → {rideData.drop?.address || 'Drop'}
                </div>
              </div>
            )}

            {/* Official Audit Record (If Already Resolved or Closed) */}
            {(selectedDispute.status === 'resolved' || selectedDispute.status === 'closed') && (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Resolution Audit Trail
                  </span>
                  {selectedDispute.resolvedAt && (
                    <span className="text-[10px] text-emerald-700 font-mono">
                      Resolved on {new Date(selectedDispute.resolvedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  )}
                </div>
                <div className="p-2.5 bg-white border border-emerald-100 rounded-lg text-emerald-950 font-medium text-xs leading-relaxed">
                  {selectedDispute.adminNotes || 'Dispute reviewed and resolved in accordance with Woosh safety and fare policies.'}
                </div>
              </div>
            )}

            {/* Triage & Resolution Console Form (Available for all statuses so admin can adjust or resolve) */}
            <form onSubmit={handleResolveDispute} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-woosh-primary" />
                  Administrative Resolution Console
                </span>
                <span className="text-[10px] text-woosh-muted">Update status & audit log</span>
              </div>

              {/* Status Radio Selectors */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Select Target Status</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetStatus('resolved')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition text-center ${
                      targetStatus === 'resolved'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    ✓ Mark Resolved
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetStatus('in_progress')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition text-center ${
                      targetStatus === 'in_progress'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    ⋯ In Progress
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetStatus('closed')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition text-center ${
                      targetStatus === 'closed'
                        ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    ✕ Close Case
                  </button>
                </div>
              </div>

              {/* Quick Preset Templates */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                  <Sparkles size={11} className="text-woosh-primary" />
                  Quick Audit Templates (Click to fill)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DISPUTE_PRESET_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAdminNotesInput(tmpl)}
                      className="text-[10px] bg-white border border-gray-200 hover:border-gray-400 text-gray-700 px-2 py-0.5 rounded-md transition"
                    >
                      {tmpl.length > 40 ? tmpl.slice(0, 40) + '...' : tmpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Official Admin Resolution Notes</label>
                <textarea
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  placeholder="Document the exact findings, refund amount, or disciplinary action taken..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-woosh-primary bg-white focus:ring-1 focus:ring-pink-200 resize-none"
                  required
                />
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Close Modal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting || !adminNotesInput.trim()}
                  isLoading={isSubmitting}
                  className="bg-woosh-primary hover:bg-woosh-primary-hover font-bold shadow-xs"
                >
                  <ShieldCheck size={14} className="mr-1" />
                  <span>Execute Resolution & Notify User</span>
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}

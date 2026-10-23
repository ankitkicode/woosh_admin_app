import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  User,
  Car,
  Search,
  RefreshCw,
  Clock,
  AlertOctagon,
  Phone,
  Mail,
  ExternalLink,
  ShieldCheck,
  XCircle,
  RotateCcw,
  Sparkles,
  Inbox
} from 'lucide-react';
import { Card } from '../../../common/components/Card';
import { Badge } from '../../../common/components/Badge';
import { Button } from '../../../common/components/Button';
import { Input } from '../../../common/components/Input';
import { Modal } from '../../../common/components/Modal';
import { useToast } from '../../../common/components/Toast';
import { apiClient } from '../../../common/utils/apiClient';

interface SenderUser {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface SupportMessage {
  _id?: string;
  sender: 'passenger' | 'support_agent' | 'system';
  senderUser?: SenderUser;
  message: string;
  attachments?: string[];
  createdAt: string;
}

interface AssociatedRide {
  _id: string;
  status?: string;
  pickup?: { address?: string; latitude?: number; longitude?: number };
  drop?: { address?: string; latitude?: number; longitude?: number };
  finalFare?: number;
  estimatedFare?: number;
  vehicleType?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  rider?: { name?: string; phoneNumber?: string };
  createdAt?: string;
}

interface PassengerProfile {
  _id?: string;
  name?: string;
  phoneNumber?: string;
  email?: string;
}

interface SupportTicket {
  _id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  passenger?: PassengerProfile;
  ride?: AssociatedRide | string;
  messages: SupportMessage[];
  resolvedAt?: string;
  resolutionSummary?: string;
  createdAt: string;
  updatedAt: string;
}

const QUICK_REPLY_TEMPLATES = [
  'Thank you for contacting Woosh Support. We are actively investigating your fare query with our billing team.',
  'We have reviewed the trip details and issued a formal warning to the assigned driver.',
  'A full cancellation fee refund has been credited directly to your Woosh wallet.',
  'Your lost property inquiry has been relayed to the driver; we will update you shortly.',
  'Our dispatch team has confirmed the detour was due to road work. We have adjusted your final fare.',
];

const CATEGORY_LABELS: Record<string, string> = {
  fare_issue: 'Fare & Overcharge',
  driver_behavior: 'Driver Conduct',
  lost_item: 'Lost Property',
  safety_incident: 'Safety Concern',
  route_detour: 'Route Detour',
  app_payment_issue: 'App & Payment',
  cancellation_fee: 'Cancellation Fee',
  other: 'General Inquiry',
};

export function SupportPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [counts, setCounts] = useState({ open: 0, inProgress: 0, resolved: 0, closed: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Resolution Modal State
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveActionType, setResolveActionType] = useState<'RESOLVED' | 'CLOSED'>('RESOLVED');
  const [resolutionNoteInput, setResolutionNoteInput] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Tickets List
  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter.toUpperCase());
      if (priorityFilter !== 'all') params.append('priority', priorityFilter.toUpperCase());
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      params.append('page', page.toString());
      params.append('limit', '15');

      const res = await apiClient(`/admin/support/tickets?${params.toString()}`);
      const data = res?.data || res || {};
      const fetchedTickets: SupportTicket[] = data.tickets || [];

      setTickets(fetchedTickets);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || fetchedTickets.length);
      if (data.counts) setCounts(data.counts);

      if (fetchedTickets.length > 0) {
        setSelectedTicketId(prev => {
          if (prev && fetchedTickets.some(t => t._id === prev)) return prev;
          return fetchedTickets[0]._id;
        });
      } else {
        setSelectedTicketId(null);
      }
    } catch (err: any) {
      console.error('Error fetching support tickets:', err);
      toast('error', 'Failed to load support tickets', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, debouncedSearch, page, toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Fetch Full Details of Selected Ticket
  const fetchTicketDetails = useCallback(async (id: string) => {
    try {
      const res = await apiClient(`/admin/support/tickets/${id}`);
      const ticketData = res?.data || res;
      setSelectedTicket(ticketData);
    } catch (err: any) {
      console.error('Error fetching ticket details:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketDetails(selectedTicketId);
    } else {
      setSelectedTicket(null);
    }
  }, [selectedTicketId, fetchTicketDetails]);

  // Send Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !replyText.trim()) return;

    try {
      setIsSending(true);
      const res = await apiClient(`/admin/support/tickets/${selectedTicketId}/reply`, {
        method: 'POST',
        data: { message: replyText.trim() },
      });
      toast('success', 'Official reply dispatched to customer');
      setReplyText('');
      const updated = res?.data || res;
      if (updated?._id) {
        setSelectedTicket(updated);
      } else {
        await fetchTicketDetails(selectedTicketId);
      }
      await fetchTickets();
    } catch (err: any) {
      toast('error', 'Failed to send reply', err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Open Resolution Modal
  const openResolveModal = (action: 'RESOLVED' | 'CLOSED') => {
    setResolveActionType(action);
    setResolutionNoteInput(
      action === 'RESOLVED'
        ? 'Customer query thoroughly reviewed and resolved by support operator.'
        : 'Ticket closed after review.'
    );
    setIsResolveModalOpen(true);
  };

  // Execute Status Change
  const handleConfirmStatusChange = async () => {
    if (!selectedTicketId) return;

    try {
      setIsUpdatingStatus(true);
      const res = await apiClient(`/admin/support/tickets/${selectedTicketId}/status`, {
        method: 'PUT',
        data: {
          status: resolveActionType,
          resolutionSummary: resolutionNoteInput.trim(),
        },
      });
      toast('success', `Ticket marked as ${resolveActionType}`);
      setIsResolveModalOpen(false);
      const updated = res?.data || res;
      if (updated?._id) {
        setSelectedTicket(updated);
      } else {
        await fetchTicketDetails(selectedTicketId);
      }
      await fetchTickets();
    } catch (err: any) {
      toast('error', 'Failed to update ticket status', err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Direct Status Update (Reopen / In Progress)
  const handleDirectStatusChange = async (newStatus: 'OPEN' | 'IN_PROGRESS') => {
    if (!selectedTicketId) return;

    try {
      setIsUpdatingStatus(true);
      const res = await apiClient(`/admin/support/tickets/${selectedTicketId}/status`, {
        method: 'PUT',
        data: { status: newStatus },
      });
      toast('success', `Ticket status updated to ${newStatus}`);
      const updated = res?.data || res;
      if (updated?._id) {
        setSelectedTicket(updated);
      } else {
        await fetchTicketDetails(selectedTicketId);
      }
      await fetchTickets();
    } catch (err: any) {
      toast('error', 'Failed to update ticket status', err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };


  // Priority Badge formatting
  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            LOW
          </span>
        );
    }
  };

  // Status Badge formatting
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
            Open
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            In Progress
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600" />
            Resolved
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Closed
          </span>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Associated ride parsed object
  const rideData: AssociatedRide | null = useMemo(() => {
    if (!selectedTicket || !selectedTicket.ride) return null;
    if (typeof selectedTicket.ride === 'object') return selectedTicket.ride;
    return null;
  }, [selectedTicket]);

  const rideIdString = useMemo(() => {
    if (!selectedTicket || !selectedTicket.ride) return null;
    if (typeof selectedTicket.ride === 'object') return selectedTicket.ride._id;
    return selectedTicket.ride;
  }, [selectedTicket]);

  return (
    <div className="space-y-4 max-w-[1440px] mx-auto pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-woosh-dark">Support Inbox & Resolution Desk</h1>
            {counts.open > 0 ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                {counts.open} Awaiting Response
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <CheckCircle2 size={12} className="text-emerald-600" />
                Inbox Zero · All Clear
              </span>
            )}
          </div>
          <p className="text-sm text-woosh-muted mt-0.5">
            Audit customer complaints, passenger fare discrepancies, driver conduct reports, and reply in real-time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTickets}
            disabled={isLoading}
            className="flex items-center gap-1.5 shadow-xs"
            title="Refresh tickets"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh Inbox</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className={`p-4 border shadow-xs transition ${counts.open > 0 ? 'border-rose-300 bg-rose-50/20' : 'border-woosh-border'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">Open Inquiries</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${counts.open > 0 ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'}`}>
              <AlertOctagon size={16} />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 ${counts.open > 0 ? 'text-rose-600' : 'text-woosh-dark'}`}>
            {counts.open}
          </p>
          <span className="text-[11px] text-woosh-muted">Needs agent response</span>
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
            <span className="text-xs font-medium text-woosh-muted">Resolved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            {counts.resolved}
          </p>
          <span className="text-[11px] text-woosh-muted">Safely resolved</span>
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
          <span className="text-[11px] text-woosh-muted">Completed cases</span>
        </Card>

        <Card className="p-4 border border-woosh-border shadow-xs hover:border-blue-300 transition col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">Total Volume</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">
            {counts.open + counts.inProgress + counts.resolved + counts.closed}
          </p>
          <span className="text-[11px] text-woosh-muted">All-time tickets</span>
        </Card>
      </div>

      {/* 3. Main Split Interface */}
      <div className="bg-white border border-woosh-border rounded-2xl shadow-sm flex flex-col lg:flex-row overflow-hidden min-h-[720px] max-h-[820px]">
        
        {/* Left Column: Tickets Queue (380px) */}
        <div className="w-full lg:w-[400px] xl:w-[420px] border-r border-gray-200 flex flex-col shrink-0 bg-gray-50/60">
          
          {/* Filter Tabs & Search Header */}
          <div className="p-3.5 border-b border-gray-200 bg-white space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Input
                icon={<Search size={14} />}
                placeholder="Search by ticket #, subject, passenger..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8.5 text-xs"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'All', count: totalCount },
                { id: 'open', label: 'Open', count: counts.open, alert: counts.open > 0 },
                { id: 'in_progress', label: 'In Progress', count: counts.inProgress },
                { id: 'resolved', label: 'Resolved', count: counts.resolved },
                { id: 'closed', label: 'Closed', count: counts.closed },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition whitespace-nowrap ${
                    statusFilter === tab.id
                      ? 'bg-woosh-dark text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-white text-gray-700 font-mono'}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Priority & Category Select Filters */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 text-xs">
              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none truncate"
              >
                <option value="all">All Categories</option>
                <option value="fare_issue">Fare Issue</option>
                <option value="driver_behavior">Driver Conduct</option>
                <option value="lost_item">Lost Item</option>
                <option value="safety_incident">Safety Concern</option>
                <option value="route_detour">Route Detour</option>
                <option value="app_payment_issue">App & Payment</option>
                <option value="cancellation_fee">Cancellation Fee</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Ticket Queue List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-woosh-muted animate-pulse">
                Fetching support tickets...
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-woosh-muted text-xs">
                No tickets matching current filters.
              </div>
            ) : (
              tickets.map(ticket => {
                const isSelected = selectedTicketId === ticket._id;
                const isOpen = ticket.status === 'OPEN';

                return (
                  <div
                    key={ticket._id}
                    onClick={() => setSelectedTicketId(ticket._id)}
                    className={`p-3.5 cursor-pointer transition flex flex-col gap-1.5 relative ${
                      isSelected
                        ? 'bg-woosh-primary-light/40 border-l-4 border-l-woosh-primary bg-white'
                        : isOpen
                        ? 'bg-rose-50/20 hover:bg-rose-50/40'
                        : 'hover:bg-gray-100/70 bg-transparent'
                    }`}
                  >
                    {/* Top Row: Ticket # & Priority */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">
                          #{ticket.ticketNumber || ticket._id.slice(-6).toUpperCase()}
                        </span>
                        {renderPriorityBadge(ticket.priority)}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {new Date(ticket.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                        {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Subject Line */}
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {ticket.subject}
                    </p>

                    {/* Category & Passenger */}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mt-0.5">
                      <span className="text-[10px] font-semibold text-woosh-primary bg-pink-50 px-1.5 py-0.2 rounded border border-pink-100">
                        {CATEGORY_LABELS[ticket.category] || ticket.category?.replace(/_/g, ' ')}
                      </span>
                      <span className="font-medium text-gray-700 truncate max-w-[130px]">
                        {ticket.passenger?.name || 'Customer'}
                      </span>
                    </div>

                    {/* Bottom Row: Status & Linked Ride */}
                    <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-gray-100 text-[10px]">
                      {ticket.ride ? (
                        <span className="font-mono text-gray-400 flex items-center gap-1">
                          <Car size={10} />
                          <span>Ride #{typeof ticket.ride === 'object' ? ticket.ride._id.slice(-6).toUpperCase() : ticket.ride.slice(-6).toUpperCase()}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">General Inquiry</span>
                      )}
                      {renderStatusBadge(ticket.status)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-2.5 border-t border-gray-200 bg-white flex items-center justify-between text-xs">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-2.5 py-1 bg-gray-100 rounded text-gray-700 hover:bg-gray-200 disabled:opacity-40 font-medium"
              >
                Previous
              </button>
              <span className="text-gray-500 font-mono text-[11px]">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-2.5 py-1 bg-gray-100 rounded text-gray-700 hover:bg-gray-200 disabled:opacity-40 font-medium"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Detailed Ticket Thread & Action Command Center */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {selectedTicket ? (
            <>
              {/* 1. Ticket Action Top Header */}
              <div className="p-4 border-b border-gray-200 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      #{selectedTicket.ticketNumber || selectedTicket._id}
                    </span>
                    {renderStatusBadge(selectedTicket.status)}
                    {renderPriorityBadge(selectedTicket.priority)}
                    <span className="text-[11px] font-semibold text-woosh-primary bg-pink-50 px-2 py-0.5 rounded border border-pink-100">
                      {CATEGORY_LABELS[selectedTicket.category] || selectedTicket.category?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900 leading-snug">
                    {selectedTicket.subject}
                  </h2>
                  <p className="text-xs text-woosh-muted">
                    Created on {new Date(selectedTicket.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>

                {/* Status Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {selectedTicket.status === 'OPEN' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDirectStatusChange('IN_PROGRESS')}
                      disabled={isUpdatingStatus}
                      className="text-xs font-bold"
                    >
                      <Clock size={13} className="mr-1 text-amber-500" />
                      Mark In Progress
                    </Button>
                  )}

                  {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => openResolveModal('RESOLVED')}
                      disabled={isUpdatingStatus}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 size={13} className="mr-1" />
                      Resolve Ticket
                    </Button>
                  )}

                  {selectedTicket.status !== 'CLOSED' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openResolveModal('CLOSED')}
                      disabled={isUpdatingStatus}
                      className="text-xs font-bold"
                    >
                      Close Case
                    </Button>
                  )}

                  {selectedTicket.status === 'CLOSED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDirectStatusChange('OPEN')}
                      disabled={isUpdatingStatus}
                      className="text-xs font-bold"
                    >
                      <RotateCcw size={13} className="mr-1" />
                      Reopen Ticket
                    </Button>
                  )}
                </div>
              </div>

              {/* 2. Detailed Context Bar: WHO RAISED IT (Passenger) & Linked Transit Trip */}
              <div className="p-3.5 bg-slate-50 border-b border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0 text-xs">
                
                {/* Passenger / Ticket Creator Box */}
                <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <User size={13} className="text-woosh-primary" />
                      Ticket Creator (Passenger)
                    </span>
                    <Badge variant="primary">PASSENGER</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 text-xs">
                        {selectedTicket.passenger?.name || 'Direct / Guest Customer'}
                      </p>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        {selectedTicket.passenger?.phoneNumber || 'No phone recorded'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {selectedTicket.passenger?.phoneNumber && (
                        <a
                          href={`tel:${selectedTicket.passenger.phoneNumber}`}
                          className="w-7 h-7 rounded-lg bg-pink-50 hover:bg-pink-100 text-woosh-primary flex items-center justify-center transition"
                          title="Call Passenger"
                        >
                          <Phone size={13} />
                        </a>
                      )}
                      {selectedTicket.passenger?.email && (
                        <a
                          href={`mailto:${selectedTicket.passenger.email}`}
                          className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition"
                          title="Email Passenger"
                        >
                          <Mail size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Associated Trip Box */}
                <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Car size={13} className="text-teal-600" />
                      Associated Transit Ride
                    </span>
                    {rideIdString && (
                      <button
                        onClick={() => navigate(`/rides/${rideIdString}`)}
                        className="text-[10px] font-bold text-woosh-primary hover:underline flex items-center gap-1"
                      >
                        <span>Inspect Ride</span>
                        <ExternalLink size={10} />
                      </button>
                    )}
                  </div>

                  {rideData ? (
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-gray-900 text-xs">
                          Driver: {rideData.rider?.name || 'Unassigned'}
                        </p>
                        <span className="text-[10px] font-mono text-gray-500">
                          {rideData.vehicleNumber || 'Vehicle Active'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        Pickup: {rideData.pickup?.address || 'Origin'} → Drop: {rideData.drop?.address || 'Destination'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-gray-400 italic text-xs py-1">
                      No specific trip associated. General customer inquiry.
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Official Resolution Banner (If Resolved or Closed) */}
              {(selectedTicket.status === 'RESOLVED' || selectedTicket.status === 'CLOSED') && (
                <div className="mx-4 mt-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      Resolution Audit Record
                    </span>
                    {selectedTicket.resolvedAt && (
                      <span className="text-[10px] text-emerald-700 font-mono">
                        Closed on {new Date(selectedTicket.resolvedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    )}
                  </div>
                  <p className="text-emerald-950 text-xs font-medium pl-5 leading-relaxed">
                    {selectedTicket.resolutionSummary || 'Case reviewed and resolved in accordance with Woosh customer satisfaction policy.'}
                  </p>
                </div>
              )}

              {/* 4. Live Conversation Messages Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((msg, idx) => {
                    const isAgent = msg.sender === 'support_agent';
                    const isSystem = msg.sender === 'system';

                    if (isSystem) {
                      return (
                        <div key={idx} className="flex justify-center my-2">
                          <div className="bg-gray-100 text-gray-600 text-[11px] font-medium px-3 py-1 rounded-full border border-gray-200">
                            {msg.message} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                      >
                        {/* Author Header */}
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px]">
                          {isAgent ? (
                            <>
                              <span className="font-bold text-woosh-dark">
                                {msg.senderUser?.name || 'Support Desk Operator'}
                              </span>
                              <span className="text-[10px] font-semibold text-woosh-primary bg-pink-50 px-1.5 py-0.2 rounded border border-pink-100">
                                {msg.senderUser?.role ? msg.senderUser.role.toUpperCase() : 'AGENT'}
                              </span>
                              <span className="text-gray-400">·</span>
                              <span className="text-gray-400">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="font-bold text-gray-900">
                                {selectedTicket.passenger?.name || 'Passenger (Customer)'}
                              </span>
                              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                                CALLER
                              </span>
                              <span className="text-gray-400">·</span>
                              <span className="text-gray-400">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Message Bubble */}
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs ${
                            isAgent
                              ? 'bg-woosh-dark text-white rounded-tr-none'
                              : 'bg-white border border-gray-200 text-gray-900 rounded-tl-none shadow-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-16 text-woosh-muted text-xs">
                    No messages recorded yet in this inquiry.
                  </div>
                )}
              </div>

              {/* 5. Quick Response Presets Strip */}
              {selectedTicket.status !== 'CLOSED' && (
                <div className="px-4 py-2 bg-gray-50/80 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <Sparkles size={11} className="text-woosh-primary" />
                    Quick Presets:
                  </span>
                  {QUICK_REPLY_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReplyText(tmpl)}
                      className="text-[11px] bg-white border border-gray-200 hover:border-gray-400 text-gray-700 px-2.5 py-1 rounded-lg transition whitespace-nowrap shrink-0 shadow-2xs"
                    >
                      {tmpl.length > 40 ? tmpl.slice(0, 40) + '...' : tmpl}
                    </button>
                  ))}
                </div>
              )}

              {/* 6. Live Reply Bar */}
              <form onSubmit={handleSendReply} className="p-3.5 border-t border-gray-200 bg-white flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    selectedTicket.status === 'CLOSED'
                      ? 'This ticket is closed. Reopen the ticket to send messages.'
                      : 'Type official response to customer...'
                  }
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-woosh-primary bg-gray-50 focus:bg-white transition"
                  disabled={selectedTicket.status === 'CLOSED' || isSending}
                />
                <Button
                  type="submit"
                  disabled={isSending || !replyText.trim() || selectedTicket.status === 'CLOSED'}
                  isLoading={isSending}
                  variant="primary"
                  className="h-9 px-4 text-xs font-bold rounded-xl shadow-xs"
                >
                  <Send size={13} className="mr-1.5" />
                  <span>Send Reply</span>
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
              <Inbox size={48} className="text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-gray-700">Select a Support Ticket</p>
              <p className="text-xs text-woosh-muted mt-1 max-w-sm text-center">
                Select an inquiry from the queue on the left to inspect customer details, associated trip history, and send official replies.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Resolution Confirmation Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title={resolveActionType === 'RESOLVED' ? 'Confirm Incident Safe & Resolved' : 'Close Support Case'}
        description={`Record the resolution summary for ticket #${selectedTicket?.ticketNumber || selectedTicket?._id}.`}
      >
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Official Resolution & Audit Summary</label>
            <textarea
              value={resolutionNoteInput}
              onChange={(e) => setResolutionNoteInput(e.target.value)}
              placeholder="State the resolution steps taken (e.g. verified refund credited, passenger contacted)..."
              className="w-full border border-gray-200 rounded-xl p-3 text-xs h-[100px] resize-none focus:outline-none focus:border-woosh-primary focus:ring-1 focus:ring-pink-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResolveModalOpen(false)}
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button
              variant={resolveActionType === 'RESOLVED' ? 'primary' : 'secondary'}
              size="sm"
              onClick={handleConfirmStatusChange}
              disabled={isUpdatingStatus}
              isLoading={isUpdatingStatus}
              className={resolveActionType === 'RESOLVED' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              <CheckCircle2 size={14} className="mr-1" />
              <span>{resolveActionType === 'RESOLVED' ? 'Confirm Resolved' : 'Close Ticket'}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

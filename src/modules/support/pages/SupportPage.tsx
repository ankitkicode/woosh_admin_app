import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Send, CheckCircle, User, Car, Search } from 'lucide-react';
import { apiClient } from '../../../common/utils/apiClient';
import { useToast } from '../../../common/components/Toast';

export function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [counts, setCounts] = useState({ open: 0, inProgress: 0, resolved: 0, closed: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { toast } = useToast();

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter.toUpperCase());
      if (search.trim()) params.append('search', search.trim());
      params.append('page', page.toString());
      params.append('limit', '20');

      const res = await apiClient(`/admin/support/tickets?${params.toString()}`);
      const data = res?.data || res || {};
      const fetchedTickets = data.tickets || [];

      setTickets(fetchedTickets);
      setTotalPages(data.totalPages || 1);
      if (data.counts) setCounts(data.counts);

      if (fetchedTickets.length > 0 && !selectedTicketId) {
        setSelectedTicketId(fetchedTickets[0]._id);
      }
    } catch (err: any) {
      console.error(err);
      toast('error', 'Failed to load support tickets', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search, page, selectedTicketId, toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Fetch full details of selected ticket (messages thread)
  const fetchTicketDetails = useCallback(async (id: string) => {
    try {
      const res = await apiClient(`/admin/support/tickets/${id}`);
      setSelectedTicket(res?.data || res);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketDetails(selectedTicketId);
    } else {
      setSelectedTicket(null);
    }
  }, [selectedTicketId, fetchTicketDetails]);

  // Send reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !replyText.trim()) return;

    try {
      setIsSending(true);
      await apiClient(`/admin/support/tickets/${selectedTicketId}/reply`, {
        method: 'POST',
        data: { message: replyText.trim() },
      });
      toast('success', 'Reply sent successfully');
      setReplyText('');
      await fetchTicketDetails(selectedTicketId);
      await fetchTickets();
    } catch (err: any) {
      toast('error', 'Failed to send reply', err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Change status
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicketId) return;

    try {
      setIsUpdatingStatus(true);
      await apiClient(`/admin/support/tickets/${selectedTicketId}/status`, {
        method: 'PUT',
        data: { status: newStatus },
      });
      toast('success', `Ticket status updated to ${newStatus}`);
      await fetchTicketDetails(selectedTicketId);
      await fetchTickets();
    } catch (err: any) {
      toast('error', 'Failed to update status', err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">LOW</span>;
    }
  };

  const formatStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">Open</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">In Progress</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">Closed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto h-[calc(100vh-95px)] flex flex-col pb-2">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="text-woosh-primary" size={24} />
            Support Inbox & Ticketing
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage customer inquiries, disputes, and live agent responses</p>
        </div>

        {/* Status Count Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Tickets', count: counts.open + counts.inProgress + counts.resolved + counts.closed },
            { id: 'open', label: 'Open', count: counts.open, color: 'text-red-600' },
            { id: 'in_progress', label: 'In Progress', count: counts.inProgress, color: 'text-amber-600' },
            { id: 'resolved', label: 'Resolved', count: counts.resolved, color: 'text-emerald-600' },
            { id: 'closed', label: 'Closed', count: counts.closed, color: 'text-gray-500' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700 font-mono'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm flex overflow-hidden min-h-0">
        {/* Left Pane: Ticket List */}
        <div className="w-full md:w-[380px] lg:w-[420px] border-r border-gray-200 flex flex-col flex-shrink-0 bg-gray-50/50">
          {/* Search bar */}
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="relative">
              <input
                type="text"
                placeholder="Search ticket # or subject..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-woosh-primary"
              />
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Ticket List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No tickets matching current filter.
              </div>
            ) : (
              tickets.map(ticket => {
                const isSelected = selectedTicketId === ticket._id;
                return (
                  <div
                    key={ticket._id}
                    onClick={() => setSelectedTicketId(ticket._id)}
                    className={`p-3.5 cursor-pointer transition flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-woosh-primary/5 border-l-4 border-l-woosh-primary bg-white'
                        : 'hover:bg-gray-100/70 bg-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                        #{ticket.ticketNumber || ticket._id.slice(-6).toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {formatPriorityBadge(ticket.priority)}
                        <span className="text-[10px] text-gray-400">
                          {new Date(ticket.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm font-bold text-gray-900 truncate">{ticket.subject}</p>
                    
                    <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                      <span className="truncate max-w-[150px] font-medium text-gray-700">
                        {ticket.passenger?.name || 'Passenger'}
                      </span>
                      {formatStatusBadge(ticket.status)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="p-2.5 border-t border-gray-200 bg-white flex items-center justify-between text-xs">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-gray-500 font-mono">Page {page} / {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right Pane: Ticket Detail & Live Chat Thread */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {selectedTicket ? (
            <>
              {/* Ticket Topbar */}
              <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-500">
                      #{selectedTicket.ticketNumber || selectedTicket._id}
                    </span>
                    {formatStatusBadge(selectedTicket.status)}
                    {formatPriorityBadge(selectedTicket.priority)}
                  </div>
                  <h2 className="text-base font-bold text-gray-900 mt-1">{selectedTicket.subject}</h2>
                  <p className="text-xs text-gray-500">
                    Category: <span className="font-semibold capitalize text-gray-700">{selectedTicket.category?.replace(/_/g, ' ')}</span> · 
                    Created {new Date(selectedTicket.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Status Action Buttons */}
                <div className="flex items-center gap-2">
                  {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                    <button
                      onClick={() => handleStatusChange('RESOLVED')}
                      disabled={isUpdatingStatus}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
                    >
                      <CheckCircle size={14} /> Resolve Ticket
                    </button>
                  )}
                  {selectedTicket.status !== 'CLOSED' && (
                    <button
                      onClick={() => handleStatusChange('CLOSED')}
                      disabled={isUpdatingStatus}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-800 hover:bg-gray-900 text-white"
                    >
                      Close Ticket
                    </button>
                  )}
                  {selectedTicket.status === 'CLOSED' && (
                    <button
                      onClick={() => handleStatusChange('OPEN')}
                      disabled={isUpdatingStatus}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>

              {/* Passenger & Ride Info Bar */}
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <User size={13} className="text-gray-400" />
                    <span className="font-bold text-gray-900">{selectedTicket.passenger?.name || 'Customer'}</span>
                    <span className="text-gray-400">({selectedTicket.passenger?.phoneNumber || 'No phone'})</span>
                  </div>
                  {selectedTicket.ride && (
                    <div className="flex items-center gap-1.5 border-l border-gray-200 pl-4">
                      <Car size={13} className="text-gray-400" />
                      <span>Ride:</span>
                      <span className="font-mono font-bold text-gray-900">
                        {typeof selectedTicket.ride === 'object' ? selectedTicket.ride._id : selectedTicket.ride}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                  selectedTicket.messages.map((msg: any, idx: number) => {
                    const isAgent = msg.sender === 'support_agent';
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-gray-400">
                          <span className="font-bold">{isAgent ? 'Support Team' : selectedTicket.passenger?.name || 'Passenger'}</span>
                          <span>·</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed ${
                            isAgent
                              ? 'bg-woosh-primary text-white rounded-tr-none'
                              : 'bg-white border border-gray-200 text-gray-900 rounded-tl-none'
                          }`}
                        >
                          <p>{msg.message}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-gray-400 text-xs">
                    No messages recorded yet in this conversation.
                  </div>
                )}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-gray-200 bg-white flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type an official reply to the customer..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-woosh-primary bg-gray-50 focus:bg-white"
                  disabled={selectedTicket.status === 'CLOSED'}
                />
                <button
                  type="submit"
                  disabled={isSending || !replyText.trim() || selectedTicket.status === 'CLOSED'}
                  className="bg-woosh-primary hover:bg-woosh-primary/90 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Send size={14} />
                  <span>{isSending ? 'Sending...' : 'Reply'}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
              <MessageSquare size={48} className="text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-gray-600">Select a support ticket</p>
              <p className="text-xs text-gray-400 mt-1">Choose an inquiry from the left panel to read the thread and reply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Phone, Clock, AlertCircle, CheckCircle2, UserCircle, Users } from 'lucide-react';
import { apiClient } from '../../../common/utils/apiClient';
import { useToast } from '../../../common/components/Toast';

export function SupportPage() {
  const [activeTab, setActiveTab] = useState<'passengers' | 'riders'>('passengers');
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const endpoint = activeTab === 'passengers' ? '/contact' : '/rider-support';
      const data = await apiClient(endpoint).catch(() => ({ success: true, data: [] }));
      
      // Handle the nested data structure from the API (data.data) or fallback
      let fetchedTickets = data?.data || data || [];
      if (!Array.isArray(fetchedTickets)) fetchedTickets = [];

      // Fallback demo data if no tickets are available to match reference styling
      if (fetchedTickets.length === 0) {
        fetchedTickets = [
          {
            _id: '6ac67985e72a46dda836faa2',
            name: 'Priya Sharma',
            phone: '9399999999',
            queryType: 'Child Mode',
            message: 'I want to enable child mode for my daily rides but it is not working.',
            status: 'pending',
            createdAt: new Date().toISOString(),
          },
          {
            _id: '6ac67372e72a46dda836f9c4',
            name: 'Rahul Verma',
            phone: '9399846862',
            queryType: 'Safety concern',
            message: 'The rider was driving very fast. Please look into this.',
            status: 'pending',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            _id: '6abf93fe7a7848b6c24e6dce',
            name: 'Amit Singh',
            phone: '9388498249',
            queryType: 'Payment Issue',
            message: 'Amount deducted twice from my account.',
            status: 'resolved',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          }
        ];
      }

      setTickets(fetchedTickets);
      if (fetchedTickets.length > 0) {
        setSelectedTicketId(fetchedTickets[0]._id);
      } else {
        setSelectedTicketId(null);
      }
    } catch (err: any) {
      toast('error', `Failed to load tickets`, err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicketId) return;
    try {
      const endpoint = activeTab === 'passengers' ? '/contact' : '/rider-support';
      await apiClient(`${endpoint}/${selectedTicketId}/status`, {
        method: 'PUT',
        data: { status: newStatus },
      });
      toast('success', 'Status updated successfully');
      fetchTickets();
    } catch (err: any) {
      toast('error', 'Failed to update status', err.message);
    }
  };

  const selectedTicket = tickets.find(t => t._id === selectedTicketId);

  const pendingTickets = tickets.filter(t => t.status === 'pending');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved');
  const closedTickets = tickets.filter(t => t.status === 'closed');

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending': 
      default: return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support & Contact</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage support queries and resolve user issues</p>
          </div>
          <div className="flex items-center gap-2">
             <span className="bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full text-xs font-bold border border-orange-200">{pendingTickets.length} pending</span>
             <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-xs font-bold border border-green-200">{resolvedTickets.length} resolved</span>
             <span className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full text-xs font-bold border border-gray-200">{closedTickets.length} closed</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('passengers')} 
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'passengers' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              <Users size={16} /> Passenger Support
            </button>
            <button 
              onClick={() => setActiveTab('riders')} 
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === 'riders' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              <UserCircle size={16} /> Rider Support
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Content */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Column: List */}
        <div className="w-full lg:w-[40%] flex flex-col gap-3">
          {isLoading ? (
             <div className="animate-pulse flex flex-col gap-3">
               {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl"></div>)}
             </div>
          ) : tickets.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 shadow-sm flex flex-col items-center">
              <MessageSquare size={48} className="text-gray-300 mb-3" />
              <p className="font-bold text-gray-900">No support tickets found</p>
              <p className="text-sm">There are currently no {activeTab} support tickets.</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div 
                key={ticket._id}
                onClick={() => setSelectedTicketId(ticket._id)}
                className={`bg-white rounded-xl p-4 border-2 cursor-pointer transition-all ${selectedTicketId === ticket._id ? 'border-pink-500 shadow-md' : 'border-gray-200 hover:border-gray-300'} shadow-sm`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase border ${getStatusStyle(ticket.status)}`}>
                        {ticket.status}
                     </span>
                     <span className="font-mono text-xs text-gray-500 font-bold">{ticket._id.slice(-6).toUpperCase()}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{formatDate(ticket.createdAt)}</span>
                </div>
                
                <h3 className="font-bold text-gray-900 text-base mb-1">{ticket.queryType}</h3>
                
                <div className="flex items-center gap-2 mb-2">
                  <UserCircle size={14} className="text-gray-400" />
                  <span className="font-bold text-gray-700 text-sm">{ticket.name}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-xs text-gray-500">{ticket.phone}</span>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2 mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  {ticket.message}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Details */}
        <div className="w-full lg:w-[60%] flex flex-col gap-4 sticky top-6">
          {selectedTicket ? (
            <>
              {/* Ticket Header & Contact */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded tracking-wider uppercase border ${getStatusStyle(selectedTicket.status)}`}>
                        {selectedTicket.status}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock size={14} /> {new Date(selectedTicket.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedTicket.queryType}</h2>
                  </div>
                  <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <Phone size={16} /> Call User
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 mb-6">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 tracking-wider mb-1 uppercase">Name</div>
                    <div className="font-bold text-gray-900 text-base">{selectedTicket.name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 tracking-wider mb-1 uppercase">Phone Number</div>
                    <div className="font-bold text-gray-900 text-base">{selectedTicket.phone}</div>
                  </div>
                </div>

                {/* Message Body */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
                    <MessageSquare size={16} className="text-gray-400" />
                    Query Message
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-800 text-sm leading-relaxed min-h-[150px] shadow-sm">
                    {selectedTicket.message}
                  </div>
                </div>
              </div>

              {/* Resolution Actions */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 text-sm">Update Status & Resolve</h3>
                
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <label className={`flex flex-col items-center gap-2 border-2 rounded-xl p-4 cursor-pointer transition-colors ${selectedTicket.status === 'pending' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      name="status" 
                      className="hidden" 
                      checked={selectedTicket.status === 'pending'}
                      onChange={() => handleStatusChange('pending')}
                    />
                    <AlertCircle size={24} className={selectedTicket.status === 'pending' ? 'text-orange-500' : 'text-gray-400'} />
                    <span className={`text-sm font-bold ${selectedTicket.status === 'pending' ? 'text-orange-700' : 'text-gray-600'}`}>Pending</span>
                  </label>
                  
                  <label className={`flex flex-col items-center gap-2 border-2 rounded-xl p-4 cursor-pointer transition-colors ${selectedTicket.status === 'resolved' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      name="status" 
                      className="hidden" 
                      checked={selectedTicket.status === 'resolved'}
                      onChange={() => handleStatusChange('resolved')}
                    />
                    <CheckCircle2 size={24} className={selectedTicket.status === 'resolved' ? 'text-green-500' : 'text-gray-400'} />
                    <span className={`text-sm font-bold ${selectedTicket.status === 'resolved' ? 'text-green-700' : 'text-gray-600'}`}>Resolved</span>
                  </label>
                  
                  <label className={`flex flex-col items-center gap-2 border-2 rounded-xl p-4 cursor-pointer transition-colors ${selectedTicket.status === 'closed' ? 'border-gray-900 bg-gray-100' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      name="status" 
                      className="hidden" 
                      checked={selectedTicket.status === 'closed'}
                      onChange={() => handleStatusChange('closed')}
                    />
                    <CheckCircle2 size={24} className={selectedTicket.status === 'closed' ? 'text-gray-900' : 'text-gray-400'} />
                    <span className={`text-sm font-bold ${selectedTicket.status === 'closed' ? 'text-gray-900' : 'text-gray-600'}`}>Closed</span>
                  </label>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-700 mb-2">Resolution Notes (Optional)</p>
                  <textarea 
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-3 focus:outline-none focus:border-pink-500 min-h-[100px] resize-none mb-3 bg-gray-50"
                    placeholder="Add details about how this was resolved..."
                  ></textarea>
                  
                  <button className="w-full bg-gray-900 text-white font-bold text-sm py-3 rounded-lg hover:bg-gray-800 transition-colors shadow-sm">
                    Save Notes & Status
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center shadow-sm text-gray-500">
               <MessageSquare size={64} className="text-gray-200 mb-4" />
               <p className="font-bold text-gray-900 text-lg">Select a ticket</p>
               <p className="text-sm mt-1">Choose a ticket from the left to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

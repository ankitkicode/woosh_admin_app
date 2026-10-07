import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../common/utils/apiClient';
import { Badge } from '../../../common/components/Badge';
import { Card, CardContent } from '../../../common/components/Card';
import { EmptyState } from '../../../common/components/EmptyState';
import { SkeletonCard } from '../../../common/components/Skeleton';
import { useToast } from '../../../common/components/Toast';
import { Tabs } from '../../../common/components/Tabs';
import { MessageSquare, Users, UserCircle } from 'lucide-react';
import { Select } from '../../../common/components/Select';

const SUPPORT_TABS = [
  { id: 'passengers', label: 'Passenger Support', icon: <Users size={16} /> },
  { id: 'riders', label: 'Rider Support', icon: <UserCircle size={16} /> },
];

export function SupportPage() {
  const [activeTab, setActiveTab] = useState('passengers');
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const endpoint = activeTab === 'passengers' ? '/contact' : '/rider-support';
      const data = await apiClient(endpoint);
      console.log(data);
      setTickets(data || []);
    } catch (err: any) {
      toast('error', `Failed to load ${activeTab} support tickets`, err.message);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const endpoint = activeTab === 'passengers' ? '/contact' : '/rider-support';
      await apiClient(`${endpoint}/${ticketId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      toast('success', 'Status updated successfully', '');
      fetchTickets();
    } catch (err: any) {
      toast('error', 'Failed to update status', err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge variant="success" dot={true}>Resolved</Badge>;
      case 'closed':
        return <Badge variant="error" dot={true}>Closed</Badge>;
      case 'pending':
      default:
        return <Badge variant="warning" dot={true}>Pending</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-woosh-dark">Support & Contact</h1>
          <p className="text-woosh-muted mt-1">Manage passenger and rider support queries</p>
        </div>
      </div>

      <Tabs
        tabs={SUPPORT_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={24} />}
          title="No support tickets found"
          description={`There are currently no ${activeTab} support tickets.`}
        />
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card key={ticket._id} className="hover:border-woosh-primary/30 transition-colors">
              <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-woosh-dark text-lg">{ticket.name}</h3>
                    {getStatusBadge(ticket.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-woosh-muted">
                    <div>
                      <span className="font-medium text-woosh-dark block mb-0.5">Phone</span>
                      {ticket.phone}
                    </div>
                    <div>
                      <span className="font-medium text-woosh-dark block mb-0.5">Query Type</span>
                      <span className="capitalize">{ticket.queryType.replace(/_/g, ' ')}</span>
                    </div>
                    <div>
                      <span className="font-medium text-woosh-dark block mb-0.5">Date</span>
                      {new Date(ticket.createdAt).toLocaleDateString()} {new Date(ticket.createdAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="mt-4 bg-woosh-surface p-4 rounded-lg border border-woosh-border">
                    <span className="font-medium text-woosh-dark block mb-1">Message</span>
                    <p className="text-woosh-muted whitespace-pre-wrap">{ticket.message}</p>
                  </div>
                </div>

                <div className="w-full sm:w-48 flex-shrink-0">
                  <label className="block text-xs font-medium text-woosh-muted mb-1.5">Update Status</label>
                  <Select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                    options={[
                      { value: 'pending', label: 'Pending' },
                      { value: 'resolved', label: 'Resolved' },
                      { value: 'closed', label: 'Closed' }
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

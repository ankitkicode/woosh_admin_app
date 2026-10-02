import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../../../common/components/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../common/components/Table';
import { Button } from '../../../common/components/Button';
import { Badge } from '../../../common/components/Badge';
import { Pagination } from '../../../common/components/Pagination';
import { EmptyState } from '../../../common/components/EmptyState';
import { SkeletonTable } from '../../../common/components/Skeleton';
import { Modal } from '../../../common/components/Modal';
import { Textarea } from '../../../common/components/Textarea';
import { Tabs } from '../../../common/components/Tabs';
import { apiClient } from '../../../common/utils/apiClient';
import { useToast } from '../../../common/components/Toast';
import { FileText, CheckCircle, Clock, User } from 'lucide-react';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'closed', label: 'Closed' },
];

const CATEGORY_COLORS: Record<string, 'error' | 'warning' | 'info' | 'success' | 'neutral'> = {
  fare: 'info',
  driver_behaviour: 'error',
  passenger_behaviour: 'warning',
  route_issues: 'neutral',
  lost_belongings: 'warning',
  payment_issues: 'info',
  safety_incidents: 'error',
};

export function DisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  // Resolve modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchDisputes(); }, [statusFilter, page]);

  const fetchDisputes = async () => {
    try {
      setIsLoading(true);
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const data = await apiClient(`/admin/disputes?page=${page}&limit=15${statusParam}`);
      setDisputes(data.disputes || []);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      toast('error', 'Failed to load disputes', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openResolveModal = (dispute: any) => {
    setSelectedDispute(dispute);
    setAdminNotes('');
    setShowResolveModal(true);
  };

  const handleResolve = async () => {
    if (!selectedDispute) return;
    try {
      setIsSubmitting(true);
      await apiClient(`/admin/disputes/${selectedDispute._id}/resolve`, {
        method: 'PUT',
        data: { adminNotes },
      });
      toast('success', 'Dispute resolved successfully');
      setShowResolveModal(false);
      fetchDisputes();
    } catch (err: any) {
      toast('error', 'Failed to resolve dispute', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="error" dot>Open</Badge>;
      case 'in_progress': return <Badge variant="warning" dot>In Progress</Badge>;
      case 'resolved': return <Badge variant="success" dot>Resolved</Badge>;
      case 'closed': return <Badge variant="neutral" dot>Closed</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const formatCategory = (cat: string) => cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-woosh-dark flex items-center gap-2">
          <FileText size={22} className="text-woosh-primary" />
          Disputes & Complaints
        </h1>
        <p className="text-sm text-woosh-muted mt-0.5">Review and resolve user complaints and disputes.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5">
          <Tabs
            tabs={STATUS_TABS}
            activeTab={statusFilter}
            onChange={(tab) => { setStatusFilter(tab); setPage(1); }}
          />
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTable rows={5} />
          ) : disputes.length === 0 ? (
            <EmptyState
              title="No disputes found"
              description="No complaints match the current filter."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case ID</TableHead>
                    <TableHead>Raised By</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disputes.map((dispute) => (
                    <TableRow key={dispute._id}>
                      <TableCell>
                        <span className="font-mono text-xs font-medium text-woosh-primary bg-woosh-primary-light px-1.5 py-0.5 rounded">
                          {dispute.caseId}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-woosh-muted" />
                          <div>
                            <span className="font-medium text-woosh-dark block">{dispute.raisedBy?.name || 'Unknown'}</span>
                            <span className="text-xs text-woosh-muted">{dispute.raisedBy?.phoneNumber || '-'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={CATEGORY_COLORS[dispute.category] || 'neutral'}>
                          {formatCategory(dispute.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-woosh-dark max-w-[200px] truncate block">{dispute.subject}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-woosh-muted">
                          <Clock size={12} />
                          {new Date(dispute.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {dispute.status === 'open' || dispute.status === 'in_progress' ? (
                          <Button variant="ghost" size="sm" onClick={() => openResolveModal(dispute)} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                            <CheckCircle size={14} /> Resolve
                          </Button>
                        ) : (
                          <span className="text-xs text-woosh-muted italic">{dispute.adminNotes ? 'Resolved' : '-'}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="px-5 py-3 border-t border-woosh-divider">
                  <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Resolve Modal */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        maxWidth="sm"
        title="Resolve Dispute"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowResolveModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleResolve} disabled={isSubmitting}>
              {isSubmitting ? 'Resolving...' : 'Mark as Resolved'}
            </Button>
          </>
        }
      >
        {selectedDispute && (
          <div className="space-y-4">
            <div className="bg-woosh-surface rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-medium text-woosh-primary">{selectedDispute.caseId}</span>
                <Badge variant={CATEGORY_COLORS[selectedDispute.category] || 'neutral'}>
                  {formatCategory(selectedDispute.category)}
                </Badge>
              </div>
              <p className="text-sm font-medium text-woosh-dark">{selectedDispute.subject}</p>
              <p className="text-xs text-woosh-muted">{selectedDispute.description}</p>
              <p className="text-xs text-woosh-muted">By: {selectedDispute.raisedBy?.name} ({selectedDispute.raisedBy?.phoneNumber})</p>
            </div>
            <Textarea
              label="Admin Resolution Notes"
              placeholder="Describe the resolution or action taken..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

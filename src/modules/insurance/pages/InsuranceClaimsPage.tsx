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
import { Input } from '../../../common/components/Input';
import { Tabs } from '../../../common/components/Tabs';
import { Select } from '../../../common/components/Select';
import { apiClient } from '../../../common/utils/apiClient';
import { useToast } from '../../../common/components/Toast';
import { Shield, Clock, User, IndianRupee } from 'lucide-react';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'processing', label: 'Processing' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const CLAIM_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'accident', label: 'Accident' },
  { value: 'vehicle_damage', label: 'Vehicle Damage' },
  { value: 'medical', label: 'Medical' },
  { value: 'other', label: 'Other' },
];

export function InsuranceClaimsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const { toast } = useToast();

  // Update modal
  const [showModal, setShowModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchClaims(); }, [statusFilter, typeFilter, page]);

  const fetchClaims = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient(`/admin/insurance?status=${statusFilter}&claimType=${typeFilter}&page=${page}&limit=15`);
      setClaims(data.claims || []);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      toast('error', 'Failed to load insurance claims', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openUpdateModal = (claim: any) => {
    setSelectedClaim(claim);
    setNewStatus(claim.status === 'pending' ? 'processing' : '');
    setApprovedAmount(claim.amountRequested?.toString() || '');
    setAdminNotes(claim.adminNotes || '');
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedClaim || !newStatus) return;
    try {
      setIsSubmitting(true);
      await apiClient(`/admin/insurance/${selectedClaim._id}/status`, {
        method: 'PUT',
        data: {
          status: newStatus,
          amountApproved: newStatus === 'approved' ? Number(approvedAmount) : undefined,
          adminNotes,
        },
      });
      toast('success', `Claim ${newStatus} successfully`);
      setShowModal(false);
      fetchClaims();
    } catch (err: any) {
      toast('error', 'Failed to update claim', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="warning" dot>Pending</Badge>;
      case 'processing': return <Badge variant="info" dot>Processing</Badge>;
      case 'approved': return <Badge variant="success" dot>Approved</Badge>;
      case 'rejected': return <Badge variant="error" dot>Rejected</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getClaimTypeBadge = (type: string) => {
    const map: Record<string, 'error' | 'warning' | 'info' | 'neutral'> = {
      accident: 'error', vehicle_damage: 'warning', medical: 'info', other: 'neutral',
    };
    return <Badge variant={map[type] || 'neutral'}>{type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-woosh-dark flex items-center gap-2">
          <Shield size={22} className="text-woosh-primary" />
          Insurance Claims
        </h1>
        <p className="text-sm text-woosh-muted mt-0.5">Review and manage insurance claims from riders and passengers.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5">
          <Tabs
            tabs={STATUS_TABS}
            activeTab={statusFilter}
            onChange={(tab) => { setStatusFilter(tab); setPage(1); }}
          />
          <div className="w-44">
            <Select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              options={CLAIM_TYPE_OPTIONS}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTable rows={5} />
          ) : claims.length === 0 ? (
            <EmptyState title="No insurance claims found" description="No claims match the current filter." />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claimant</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Incident Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.map((claim) => (
                    <TableRow key={claim._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-woosh-muted" />
                          <div>
                            <span className="font-medium text-woosh-dark block">{claim.userId?.name || 'Unknown'}</span>
                            <span className="text-xs text-woosh-muted">{claim.userId?.phoneNumber || '-'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={claim.role === 'passenger' ? 'info' : 'warning'}>{claim.role}</Badge>
                      </TableCell>
                      <TableCell>{getClaimTypeBadge(claim.claimType)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-woosh-muted">
                          <Clock size={12} />
                          {new Date(claim.incidentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5 font-medium text-woosh-dark">
                          <IndianRupee size={13} />
                          {claim.amountRequested?.toLocaleString() || '-'}
                        </div>
                        {claim.amountApproved != null && (
                          <span className="text-xs text-emerald-600">Approved: ₹{claim.amountApproved.toLocaleString()}</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(claim.status)}</TableCell>
                      <TableCell className="text-right">
                        {claim.status !== 'approved' && claim.status !== 'rejected' ? (
                          <Button variant="ghost" size="sm" onClick={() => openUpdateModal(claim)} className="text-woosh-primary hover:bg-woosh-primary-light">
                            Update
                          </Button>
                        ) : (
                          <span className="text-xs text-woosh-muted italic">{claim.adminNotes ? 'Reviewed' : '-'}</span>
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

      {/* Update Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="sm"
        title="Update Insurance Claim"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleUpdate} disabled={isSubmitting || !newStatus}>
              {isSubmitting ? 'Updating...' : 'Update Claim'}
            </Button>
          </>
        }
      >
        {selectedClaim && (
          <div className="space-y-4">
            <div className="bg-woosh-surface rounded-lg p-3 space-y-1.5">
              <p className="text-sm font-medium text-woosh-dark">{selectedClaim.userId?.name || 'Unknown'} ({selectedClaim.role})</p>
              <p className="text-xs text-woosh-muted">{selectedClaim.description}</p>
              <p className="text-xs font-medium text-woosh-dark">Requested: ₹{selectedClaim.amountRequested?.toLocaleString() || 'N/A'}</p>
            </div>

            <Select
              label="Update Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={[
                { value: '', label: 'Select status...' },
                { value: 'processing', label: 'Processing' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />

            {newStatus === 'approved' && (
              <Input
                label="Approved Amount (₹)"
                type="number"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                placeholder="Enter approved amount"
              />
            )}

            <Textarea
              label="Admin Notes"
              placeholder="Add notes about this decision..."
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

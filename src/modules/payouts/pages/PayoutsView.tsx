import React, { useState, useEffect } from 'react';
import { fetchPayouts, updatePayoutStatus, bulkUpdatePayouts, type PayoutRequest } from '../api/payoutsApi';
import { Card, CardContent, CardHeader, CardTitle } from '../../../common/components/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../common/components/Table';
import { Badge } from '../../../common/components/Badge';
import { Button } from '../../../common/components/Button';
import { Modal } from '../../../common/components/Modal';
import { Input } from '../../../common/components/Input';
import { Textarea } from '../../../common/components/Textarea';
import { useToast } from '../../../common/components/Toast';
import { Banknote, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PayoutsView: React.FC = () => {
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [bulkApproveModalOpen, setBulkApproveModalOpen] = useState(false);

  const [transactionRef, setTransactionRef] = useState('');
  const [remarks, setRemarks] = useState('');

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const res = await fetchPayouts();
      setPayouts(res.payouts || []);
      setSelectedIds(new Set());
    } catch (err: any) {
      toast('error', 'Failed to load payouts', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
  }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(payouts.filter(p => p.status === 'pending').map(p => p._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleApprove = async () => {
    if (!selectedPayout) return;
    try {
      setActionLoading(true);
      await updatePayoutStatus(selectedPayout._id, {
        status: 'completed',
        transactionRef,
        remarks
      });
      toast('success', 'Payout marked as completed');
      setApproveModalOpen(false);
      loadPayouts();
    } catch (err: any) {
      toast('error', 'Failed to approve payout', err.message);
    } finally {
      setActionLoading(false);
      setTransactionRef('');
      setRemarks('');
      setSelectedPayout(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    try {
      setActionLoading(true);
      await bulkUpdatePayouts({
        payoutIds: Array.from(selectedIds),
        status: 'completed',
        transactionRef,
        remarks
      });
      toast('success', `Bulk approved ${selectedIds.size} payouts successfully`);
      setBulkApproveModalOpen(false);
      loadPayouts();
    } catch (err: any) {
      toast('error', 'Failed to bulk approve payouts', err.message);
    } finally {
      setActionLoading(false);
      setTransactionRef('');
      setRemarks('');
    }
  };

  const handleReject = async () => {
    if (!selectedPayout) return;
    if (!remarks.trim()) {
      toast('error', 'Rejection reason is required');
      return;
    }
    try {
      setActionLoading(true);
      await updatePayoutStatus(selectedPayout._id, {
        status: 'rejected',
        remarks
      });
      toast('success', 'Payout request rejected & amount refunded');
      setRejectModalOpen(false);
      loadPayouts();
    } catch (err: any) {
      toast('error', 'Failed to reject payout', err.message);
    } finally {
      setActionLoading(false);
      setRemarks('');
      setSelectedPayout(null);
    }
  };

  const openApprove = (p: PayoutRequest) => {
    setSelectedPayout(p);
    setTransactionRef('');
    setRemarks('');
    setApproveModalOpen(true);
  };

  const openReject = (p: PayoutRequest) => {
    setSelectedPayout(p);
    setRemarks('');
    setRejectModalOpen(true);
  };

  const totalSelectedAmount = payouts
    .filter(p => selectedIds.has(p._id))
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-woosh-dark flex items-center gap-2">
            <Banknote className="text-woosh-primary" /> Payout Requests
          </h1>
          <p className="text-sm text-woosh-muted mt-1">Manage rider withdrawal requests and platform settlements.</p>
        </div>
        {selectedIds.size > 0 && (
          <Button 
            onClick={() => setBulkApproveModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            Bulk Approve ({selectedIds.size}) - ₹{totalSelectedAmount.toLocaleString()}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-woosh-primary focus:ring-woosh-primary"
                      onChange={handleSelectAll}
                      checked={selectedIds.size > 0 && selectedIds.size === payouts.filter(p => p.status === 'pending').length}
                    />
                  </TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Rider</TableHead>
                  <TableHead>Bank Details</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : payouts.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-woosh-muted">No payout requests found.</TableCell></TableRow>
                ) : (
                  payouts.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell>
                        {p.status === 'pending' && (
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-woosh-primary focus:ring-woosh-primary"
                            checked={selectedIds.has(p._id)}
                            onChange={() => handleSelect(p._id)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(p.requestedAt).toLocaleDateString()} {new Date(p.requestedAt).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-woosh-dark hover:text-woosh-primary cursor-pointer" onClick={() => navigate(`/riders/${p.rider?._id}`)}>
                          {p.rider?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-woosh-muted">{p.rider?.phoneNumber}</div>
                      </TableCell>
                      <TableCell>
                        {p.bankAccount ? (
                          <div className="text-sm">
                            <div className="font-medium">{p.bankAccount.bankName}</div>
                            <div className="text-woosh-muted">A/C: {p.bankAccount.accountNumber}</div>
                            <div className="text-woosh-muted">IFSC: {p.bankAccount.ifscCode}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-woosh-muted italic">No bank info</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-woosh-dark">₹{p.amount.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        {p.status === 'pending' && <Badge variant="warning" dot>Pending</Badge>}
                        {p.status === 'completed' && <Badge variant="success" dot>Completed</Badge>}
                        {p.status === 'rejected' && <Badge variant="error" dot>Rejected</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openReject(p)} className="text-red-600 border-red-200 hover:bg-red-50">
                              Reject
                            </Button>
                            <Button size="sm" onClick={() => openApprove(p)} className="bg-emerald-600 hover:bg-emerald-700 border-transparent text-white">
                              Pay
                            </Button>
                          </div>
                        )}
                        {p.status !== 'pending' && (
                          <span className="text-xs text-woosh-muted">Processed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Approve Modal */}
      <Modal isOpen={approveModalOpen} onClose={() => setApproveModalOpen(false)} title="Process Payout">
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
            <p className="text-sm text-blue-800">You are about to mark a payout of <strong>₹{selectedPayout?.amount}</strong> for <strong>{selectedPayout?.rider?.name}</strong> as completed. Please ensure you have transferred the funds to their bank account.</p>
            {selectedPayout?.bankAccount && (
               <div className="mt-2 bg-white p-2 rounded border border-blue-100 text-sm">
                 <div className="font-bold">{selectedPayout.bankAccount.accountHolderName}</div>
                 <div>{selectedPayout.bankAccount.bankName} - A/C: {selectedPayout.bankAccount.accountNumber}</div>
                 <div>IFSC: {selectedPayout.bankAccount.ifscCode}</div>
               </div>
            )}
          </div>
          <Input 
            label="Transaction Reference (e.g. UTR Number)" 
            value={transactionRef} 
            onChange={(e) => setTransactionRef(e.target.value)} 
            placeholder="Enter bank reference number"
          />
          <Textarea 
            label="Remarks (Optional)" 
            value={remarks} 
            onChange={(e) => setRemarks(e.target.value)} 
            placeholder="Add any internal notes here"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setApproveModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleApprove} 
              isLoading={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirm Payment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Approve Modal */}
      <Modal isOpen={bulkApproveModalOpen} onClose={() => setBulkApproveModalOpen(false)} title="Bulk Process Payouts">
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
            <p className="text-sm text-blue-800">You are about to mark <strong>{selectedIds.size}</strong> payouts totaling <strong>₹{totalSelectedAmount.toLocaleString()}</strong> as completed. Please ensure you have processed the bulk transfer.</p>
          </div>
          <Input 
            label="Bulk Transaction Reference" 
            value={transactionRef} 
            onChange={(e) => setTransactionRef(e.target.value)} 
            placeholder="Enter bulk transfer reference number"
          />
          <Textarea 
            label="Remarks (Optional)" 
            value={remarks} 
            onChange={(e) => setRemarks(e.target.value)} 
            placeholder="Add any internal notes here"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setBulkApproveModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleBulkApprove} 
              isLoading={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Confirm Bulk Payment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Reject Payout">
        <div className="space-y-4">
          <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-4">
            <p className="text-sm text-red-800">Rejecting this request will immediately refund <strong>₹{selectedPayout?.amount}</strong> back to the rider's Woosh wallet.</p>
          </div>
          <Textarea 
            label="Rejection Reason" 
            value={remarks} 
            onChange={(e) => setRemarks(e.target.value)} 
            placeholder="Why is this payout being rejected?"
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleReject} 
              isLoading={actionLoading}
              variant="primary"
              className="bg-red-600 hover:bg-red-700 border-red-600 text-white"
            >
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

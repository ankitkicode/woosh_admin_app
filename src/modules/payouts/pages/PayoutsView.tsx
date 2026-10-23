import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Banknote,
  CheckCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  XCircle,
  Search,
  RefreshCw,
  Copy,
  Check,
  Eye,
  Building,
  Sparkles,
  User
} from 'lucide-react';
import {
  fetchPayouts,
  updatePayoutStatus,
  bulkUpdatePayouts,
  type PayoutRequest,
  type PayoutCounts
} from '../api/payoutsApi';
import { Card, CardContent } from '../../../common/components/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../common/components/Table';
import { Badge } from '../../../common/components/Badge';
import { Button } from '../../../common/components/Button';
import { Modal } from '../../../common/components/Modal';
import { Input } from '../../../common/components/Input';
import { Textarea } from '../../../common/components/Textarea';
import { Pagination } from '../../../common/components/Pagination';
import { EmptyState } from '../../../common/components/EmptyState';
import { SkeletonTable } from '../../../common/components/Skeleton';
import { useToast } from '../../../common/components/Toast';

const REJECTION_PRESET_REASONS = [
  'Incorrect Bank Account Number or IFSC Code.',
  'Bank Account Holder name does not match Rider KYC name.',
  'Beneficiary bank rejected IMPS transfer (Account inactive/frozen).',
  'Suspicious transaction volume under audit review.',
];

export const PayoutsView: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [counts, setCounts] = useState<PayoutCounts>({
    total: 0,
    totalAmount: 0,
    pending: 0,
    pendingAmount: 0,
    completed: 0,
    completedAmount: 0,
    rejected: 0,
    rejectedAmount: 0,
    approved: 0,
    approvedAmount: 0,
  });

  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // Checkbox Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [bulkApproveModalOpen, setBulkApproveModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  const [transactionRef, setTransactionRef] = useState('');
  const [remarks, setRemarks] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Load Payouts List
  const loadPayouts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchPayouts(page, 15, statusFilter, debouncedSearch);
      setPayouts(res.payouts || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total || (res.payouts ? res.payouts.length : 0));
      if (res.counts) setCounts(res.counts);
      setSelectedIds(new Set());
    } catch (err: any) {
      toast('error', 'Failed to load payouts', err.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch, toast]);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  // Select All Checkbox
  const pendingPayouts = useMemo(() => payouts.filter(p => p.status === 'pending'), [payouts]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(pendingPayouts.map(p => p._id)));
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

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    toast('success', `${label} copied to clipboard`);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  // Approve Single Payout
  const handleApprove = async () => {
    if (!selectedPayout) return;
    try {
      setActionLoading(true);
      await updatePayoutStatus(selectedPayout._id, {
        status: 'completed',
        transactionRef: transactionRef.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });
      toast('success', `Payout of ₹${selectedPayout.amount} marked as completed`);
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

  // Bulk Approve Payouts
  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    try {
      setActionLoading(true);
      await bulkUpdatePayouts({
        payoutIds: Array.from(selectedIds),
        status: 'completed',
        transactionRef: transactionRef.trim() || undefined,
        remarks: remarks.trim() || 'Bulk settlement processed',
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

  // Reject Single Payout
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
        remarks: remarks.trim(),
      });
      toast('success', `Payout of ₹${selectedPayout.amount} rejected & refunded to rider's wallet`);
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

  const openAudit = (p: PayoutRequest) => {
    setSelectedPayout(p);
    setAuditModalOpen(true);
  };

  const totalSelectedAmount = useMemo(() => {
    return payouts
      .filter(p => selectedIds.has(p._id))
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [payouts, selectedIds]);

  return (
    <div className="space-y-4 max-w-[1440px] mx-auto pb-10">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-woosh-dark">Rider Payouts & Settlements</h1>
            {counts.pending > 0 ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                {counts.pending} Awaiting Transfer
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <CheckCircle2 size={12} className="text-emerald-600" />
                All Payouts Settled
              </span>
            )}
          </div>
          <p className="text-sm text-woosh-muted mt-0.5">
            Audit rider withdrawal requests, verify bank IFSC details, execute bank transfers, and manage settlements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPayouts}
            disabled={loading}
            className="flex items-center gap-1.5 shadow-xs"
            title="Refresh payout requests"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh Data</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Metric Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className={`p-4 border shadow-xs transition ${counts.pending > 0 ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-200' : 'border-woosh-border'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">Pending Settlements</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${counts.pending > 0 ? 'bg-amber-100 text-amber-700 font-bold' : 'bg-gray-100 text-gray-500'}`}>
              <Clock size={16} />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 ${counts.pending > 0 ? 'text-amber-700' : 'text-woosh-dark'}`}>
            ₹{counts.pendingAmount.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center justify-between text-[11px] text-woosh-muted mt-0.5">
            <span>{counts.pending} Requests pending</span>
            {counts.pending > 0 && <span className="text-amber-600 font-bold">Needs action</span>}
          </div>
        </Card>

        <Card className="p-4 border border-woosh-border shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">Completed Payouts</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            ₹{counts.completedAmount.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-woosh-muted">{counts.completed} Successful bank transfers</span>
        </Card>

        <Card className="p-4 border border-woosh-border shadow-xs hover:border-rose-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">Rejected & Refunded</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">
            ₹{counts.rejectedAmount.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-woosh-muted">{counts.rejected} Returned to rider wallets</span>
        </Card>

        <Card className="p-4 border border-woosh-border shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">Total Cumulative Volume</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Banknote size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">
            ₹{counts.totalAmount.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-woosh-muted">{counts.total} All-time withdrawal requests</span>
        </Card>
      </div>

      {/* 3. Filter Tabs & Search Header Card */}
      <Card className="border border-woosh-border shadow-xs">
        <CardContent className="p-4 space-y-3.5">
          {/* Quick Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-gray-100">
            {[
              { id: 'all', label: 'All Requests', count: counts.total || totalCount },
              { id: 'pending', label: 'Pending', count: counts.pending, alert: counts.pending > 0 },
              { id: 'completed', label: 'Completed', count: counts.completed },
              { id: 'rejected', label: 'Rejected', count: counts.rejected },
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

          {/* Search bar & Bulk Selection Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <Input
                icon={<Search size={15} />}
                placeholder="Search by rider name, phone, bank name, account number, IFSC, or UTR ref..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* Bulk Action Trigger */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 shrink-0 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl animate-in fade-in">
                <span className="text-xs font-bold text-emerald-900">
                  {selectedIds.size} Selected · ₹{totalSelectedAmount.toLocaleString('en-IN')}
                </span>
                <Button
                  size="sm"
                  onClick={() => setBulkApproveModalOpen(true)}
                  className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <CheckCircle size={13} className="mr-1" />
                  Bulk Pay ({selectedIds.size})
                </Button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-[11px] text-gray-500 hover:text-gray-700 underline ml-1"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. Payouts Data Table */}
      <Card className="border border-woosh-border shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <SkeletonTable rows={6} />
          ) : payouts.length === 0 ? (
            <EmptyState
              icon={<Banknote size={36} className="text-gray-400" />}
              title="No Payout Requests Found"
              description="There are currently no withdrawal requests matching the selected filter."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/75 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    <TableHead className="w-[45px] text-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-woosh-primary focus:ring-woosh-primary"
                        onChange={handleSelectAll}
                        checked={pendingPayouts.length > 0 && selectedIds.size === pendingPayouts.length}
                        disabled={pendingPayouts.length === 0}
                        title="Select all pending payouts"
                      />
                    </TableHead>
                    <TableHead>Rider Profile</TableHead>
                    <TableHead>Withdrawal Amount</TableHead>
                    <TableHead>Bank Account Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction Ref (UTR)</TableHead>
                    <TableHead>Requested Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((p) => {
                    const isPending = p.status === 'pending';
                    const isCompleted = p.status === 'completed';
                    const isRejected = p.status === 'rejected';

                    return (
                      <TableRow key={p._id} className="hover:bg-gray-50/60 transition text-xs">
                        {/* Checkbox Column */}
                        <TableCell className="text-center">
                          {isPending ? (
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-woosh-primary focus:ring-woosh-primary"
                              checked={selectedIds.has(p._id)}
                              onChange={() => handleSelect(p._id)}
                            />
                          ) : (
                            <span className="text-gray-300 text-[10px]">—</span>
                          )}
                        </TableCell>

                        {/* Rider Profile Column */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-pink-50 text-woosh-primary flex items-center justify-center font-bold text-xs shrink-0">
                              <User size={14} />
                            </div>
                            <div>
                              <button
                                onClick={() => p.rider?._id && navigate(`/riders/${p.rider._id}`)}
                                className="font-bold text-woosh-dark hover:text-woosh-primary hover:underline block text-left"
                              >
                                {p.rider?.name || 'Unknown Rider'}
                              </button>
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-mono mt-0.5">
                                <span>{p.rider?.phoneNumber || 'No phone'}</span>
                                {p.rider?.phoneNumber && (
                                  <button
                                    onClick={() => handleCopy(p.rider.phoneNumber || '', 'Rider Phone')}
                                    className="text-gray-400 hover:text-gray-600"
                                    title="Copy Phone"
                                  >
                                    {copiedLabel === 'Rider Phone' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Withdrawal Amount Column */}
                        <TableCell>
                          <span className="font-black text-sm text-woosh-dark tracking-tight">
                            ₹{p.amount.toLocaleString('en-IN')}
                          </span>
                        </TableCell>

                        {/* Bank Details Column */}
                        <TableCell>
                          {p.bankAccount ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 font-bold text-gray-900">
                                <Building size={12} className="text-woosh-muted shrink-0" />
                                <span>{p.bankAccount.bankName}</span>
                              </div>
                              <div className="flex items-center gap-1 font-mono text-[11px] text-gray-600">
                                <span>A/C: {p.bankAccount.accountNumber}</span>
                                <button
                                  onClick={() => handleCopy(p.bankAccount?.accountNumber || '', 'Account Number')}
                                  className="text-gray-400 hover:text-gray-600"
                                  title="Copy Account Number"
                                >
                                  {copiedLabel === 'Account Number' ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                                </button>
                              </div>
                              <div className="flex items-center gap-1 font-mono text-[10px] text-gray-500">
                                <span>IFSC: {p.bankAccount.ifscCode}</span>
                                <button
                                  onClick={() => handleCopy(p.bankAccount?.ifscCode || '', 'IFSC')}
                                  className="text-gray-400 hover:text-gray-600"
                                  title="Copy IFSC"
                                >
                                  {copiedLabel === 'IFSC' ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">No bank account linked</span>
                          )}
                        </TableCell>

                        {/* Status Column */}
                        <TableCell>
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Pending
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              Completed
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle size={12} className="text-rose-600" />
                              Rejected
                            </span>
                          )}
                        </TableCell>

                        {/* Transaction Ref Column */}
                        <TableCell>
                          {p.transactionRef ? (
                            <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded max-w-[130px] truncate">
                              <span className="truncate">{p.transactionRef}</span>
                              <button
                                onClick={() => handleCopy(p.transactionRef || '', 'UTR')}
                                className="text-gray-400 hover:text-gray-600 shrink-0"
                                title="Copy UTR"
                              >
                                {copiedLabel === 'UTR' ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                              </button>
                            </div>
                          ) : isPending ? (
                            <span className="text-gray-400 text-[11px] italic">Awaiting UTR</span>
                          ) : (
                            <span className="text-gray-400 text-[11px] italic">Not provided</span>
                          )}
                        </TableCell>

                        {/* Date Column */}
                        <TableCell>
                          <div className="text-[11px] text-gray-500 whitespace-nowrap">
                            <span className="font-medium text-gray-800 block">
                              {new Date(p.requestedAt || p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(p.requestedAt || p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </TableCell>

                        {/* Action Column */}
                        <TableCell className="text-right whitespace-nowrap">
                          {isPending ? (
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openReject(p)}
                                className="h-7 text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 px-2.5"
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => openApprove(p)}
                                className="h-7 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs px-3"
                              >
                                Pay Now
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAudit(p)}
                              className="h-7 text-xs font-bold text-gray-600 hover:text-woosh-primary gap-1"
                            >
                              <Eye size={12} />
                              <span>Audit Details</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-mono">
                Showing page {page} of {totalPages} ({totalCount} total withdrawal records)
              </span>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Approve & Pay Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        maxWidth="md"
        title="Execute Payout Settlement"
        description="Verify bank details and confirm bank fund dispatch to rider."
      >
        <div className="space-y-4 pt-1">
          {selectedPayout && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <span className="text-xs font-medium text-emerald-800">Settlement Amount</span>
                <span className="text-xl font-black text-emerald-700">₹{selectedPayout.amount.toLocaleString('en-IN')}</span>
              </div>

              {selectedPayout.bankAccount && (
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Beneficiary:</span>
                    <span className="font-bold text-gray-900">{selectedPayout.bankAccount.accountHolderName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Bank Name:</span>
                    <span className="font-semibold text-gray-800">{selectedPayout.bankAccount.bankName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Account Number:</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-gray-900">
                      <span>{selectedPayout.bankAccount.accountNumber}</span>
                      <button
                        onClick={() => handleCopy(selectedPayout.bankAccount?.accountNumber || '', 'Account Number')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {copiedLabel === 'Account Number' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">IFSC Code:</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-gray-900">
                      <span>{selectedPayout.bankAccount.ifscCode}</span>
                      <button
                        onClick={() => handleCopy(selectedPayout.bankAccount?.ifscCode || '', 'IFSC Code')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {copiedLabel === 'IFSC Code' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Bank Transaction Reference / UTR Number</label>
            <Input
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. UTR1284719284 / IMPS Ref ID"
              className="text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Admin Remarks (Optional)</label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any internal transaction notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="outline" size="sm" onClick={() => setApproveModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              isLoading={actionLoading}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <CheckCircle size={14} className="mr-1" />
              <span>Confirm Payment Dispatched</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* 6. Bulk Approve Modal */}
      <Modal
        isOpen={bulkApproveModalOpen}
        onClose={() => setBulkApproveModalOpen(false)}
        maxWidth="md"
        title="Confirm Bulk Payout Settlement"
        description="Process multiple bank settlements in a single batch."
      >
        <div className="space-y-4 pt-1">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">Selected Payouts:</span>
              <span className="font-bold text-gray-900">{selectedIds.size} Riders</span>
            </div>
            <div className="flex justify-between items-center border-t border-emerald-100 pt-2">
              <span className="text-xs font-bold text-emerald-900">Total Settlement Amount:</span>
              <span className="text-xl font-black text-emerald-700">₹{totalSelectedAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Corporate Bulk UTR / Batch Transfer Reference</label>
            <Input
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. BATCH-20261023-01 / CMS Ref"
              className="text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Bulk Remarks (Optional)</label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Cleared via corporate netbanking batch"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="outline" size="sm" onClick={() => setBulkApproveModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleBulkApprove}
              isLoading={actionLoading}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <CheckCircle size={14} className="mr-1" />
              <span>Confirm Bulk Settlement (₹{totalSelectedAmount.toLocaleString('en-IN')})</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* 7. Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        maxWidth="md"
        title="Reject Payout Request"
        description="Reject this withdrawal and immediately refund the balance back to rider's wallet."
      >
        <div className="space-y-4 pt-1">
          {selectedPayout && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs text-rose-900">
              <div className="flex justify-between items-center">
                <span>Rider Name: <strong>{selectedPayout.rider?.name}</strong></span>
                <span className="font-black text-rose-700 text-sm">₹{selectedPayout.amount.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-[11px] text-rose-700">
                Notice: The full withdrawal amount will be refunded directly back into the rider's Woosh wallet instantly.
              </p>
            </div>
          )}

          {/* Quick Preset Reasons */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
              <Sparkles size={11} className="text-woosh-primary" />
              Quick Rejection Templates (Click to fill)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {REJECTION_PRESET_REASONS.map((reason, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRemarks(reason)}
                  className="text-[10px] bg-white border border-gray-200 hover:border-gray-400 text-gray-700 px-2 py-0.5 rounded-md transition"
                >
                  {reason.length > 40 ? reason.slice(0, 40) + '...' : reason}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Official Rejection Reason (Mandatory)</label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="State why this payout was rejected (e.g. Account number does not match IFSC)..."
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="outline" size="sm" onClick={() => setRejectModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleReject}
              isLoading={actionLoading}
              disabled={actionLoading || !remarks.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              <XCircle size={14} className="mr-1" />
              <span>Reject Request & Refund Wallet</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* 8. Audit Record Details Modal */}
      <Modal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        maxWidth="md"
        title="Payout Settlement Audit Record"
        description="Comprehensive audit trail of this withdrawal request and execution history."
      >
        {selectedPayout && (
          <div className="space-y-4 pt-1 text-xs">
            {/* Status & Amount Banner */}
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Withdrawal Amount</span>
                <span className="text-xl font-black text-gray-900">₹{selectedPayout.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Status</span>
                <Badge variant={selectedPayout.status === 'completed' ? 'success' : selectedPayout.status === 'rejected' ? 'error' : 'warning'}>
                  {selectedPayout.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Rider & Bank Profile */}
            <div className="p-3.5 bg-white border border-gray-200 rounded-xl space-y-2">
              <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block">Rider & Account Details</span>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Rider Name:</span>
                <span className="font-bold text-gray-900">{selectedPayout.rider?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Rider Contact:</span>
                <span className="font-mono font-bold text-gray-900">{selectedPayout.rider?.phoneNumber}</span>
              </div>
              {selectedPayout.bankAccount && (
                <>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Bank Name:</span>
                    <span className="font-semibold text-gray-900">{selectedPayout.bankAccount.bankName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Account Number:</span>
                    <span className="font-mono font-bold text-gray-900">{selectedPayout.bankAccount.accountNumber}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">IFSC Code:</span>
                    <span className="font-mono font-bold text-gray-900">{selectedPayout.bankAccount.ifscCode}</span>
                  </div>
                </>
              )}
            </div>

            {/* Transaction Reference & Audit Trail */}
            <div className="p-3.5 bg-slate-50 border border-gray-200 rounded-xl space-y-2">
              <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block">Execution & Audit Details</span>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Requested Timestamp:</span>
                <span className="font-medium text-gray-800">
                  {new Date(selectedPayout.requestedAt || selectedPayout.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              {selectedPayout.processedAt && (
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Processed Timestamp:</span>
                  <span className="font-medium text-gray-800">
                    {new Date(selectedPayout.processedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              )}
              {selectedPayout.processedBy && (
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Handled By:</span>
                  <span className="font-bold text-gray-900">{selectedPayout.processedBy.name || 'System Operator'}</span>
                </div>
              )}
              {selectedPayout.transactionRef && (
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Bank UTR / Reference:</span>
                  <span className="font-mono font-bold text-woosh-primary">{selectedPayout.transactionRef}</span>
                </div>
              )}
              {selectedPayout.remarks && (
                <div className="pt-1">
                  <span className="text-gray-500 block mb-1">Remarks / Rejection Note:</span>
                  <div className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-800 font-medium">
                    {selectedPayout.remarks}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setAuditModalOpen(false)}>
                Close Audit Record
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

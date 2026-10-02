import { useState, useEffect, useCallback } from 'react';
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
import { ShieldAlert, CheckCircle, XCircle, MapPin, Phone, User, RefreshCw, Clock } from 'lucide-react';

const STATUS_TABS = [
  { id: 'all', label: 'All Alerts' },
  { id: 'active', label: 'Active' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'false_alarm', label: 'False Alarm' },
];

export function SOSAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeCount, setActiveCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  // Resolve modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveAction, setResolveAction] = useState<'resolve' | 'false_alarm'>('resolve');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient(`/admin/sos?status=${statusFilter}&page=${page}&limit=15`);
      setAlerts(data.alerts || []);
      setTotalPages(data.totalPages || 1);
      setActiveCount(data.activeCount || 0);
    } catch (err: any) {
      toast('error', 'Failed to load SOS alerts', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const openResolveModal = (alert: any, action: 'resolve' | 'false_alarm') => {
    setSelectedAlert(alert);
    setResolveAction(action);
    setResolveNotes('');
    setShowResolveModal(true);
  };

  const handleResolve = async () => {
    if (!selectedAlert) return;
    try {
      setIsSubmitting(true);
      const endpoint = resolveAction === 'resolve'
        ? `/admin/sos/${selectedAlert._id}/resolve`
        : `/admin/sos/${selectedAlert._id}/false-alarm`;
      await apiClient(endpoint, { method: 'PUT', data: { resolutionNotes: resolveNotes } });
      toast('success', resolveAction === 'resolve' ? 'SOS Alert resolved' : 'Marked as false alarm');
      setShowResolveModal(false);
      fetchAlerts();
    } catch (err: any) {
      toast('error', 'Failed to update alert', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="error" dot>Active</Badge>;
      case 'resolved': return <Badge variant="success" dot>Resolved</Badge>;
      case 'false_alarm': return <Badge variant="neutral" dot>False Alarm</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-woosh-dark flex items-center gap-2">
            <ShieldAlert size={22} className="text-red-500" />
            SOS Alerts
            {activeCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                {activeCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-woosh-muted mt-0.5">Monitor and respond to emergency SOS alerts.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAlerts} disabled={isLoading}>
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
        </Button>
      </div>

      {/* Active Alerts Banner */}
      {activeCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-800">{activeCount} Active Emergency Alert{activeCount > 1 ? 's' : ''}</p>
            <p className="text-xs text-red-600 mt-0.5">Immediate attention required. Please review and take action.</p>
          </div>
        </div>
      )}

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
          ) : alerts.length === 0 ? (
            <EmptyState
              title="No SOS alerts found"
              description={statusFilter === 'active' ? "No active emergencies at the moment." : "No alerts match the current filter."}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Ride</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert._id} className={alert.status === 'active' ? 'bg-red-50/50' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-woosh-muted" />
                          <span className="font-medium text-woosh-dark">{alert.triggeredBy?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone size={10} className="text-woosh-muted" />
                          <span className="text-xs text-woosh-muted">{alert.triggeredBy?.phoneNumber || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={alert.role === 'passenger' ? 'info' : 'warning'}>{alert.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 max-w-[200px]">
                          <MapPin size={12} className="text-woosh-muted flex-shrink-0" />
                          <span className="text-sm text-woosh-muted truncate">{alert.location?.address || `${alert.location?.lat?.toFixed(4)}, ${alert.location?.lng?.toFixed(4)}`}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {alert.rideId ? (
                          <span className="font-mono text-xs font-medium text-woosh-primary bg-woosh-primary-light px-1.5 py-0.5 rounded">
                            {String(alert.rideId?._id || alert.rideId).slice(-6).toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-xs text-woosh-muted">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(alert.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-woosh-muted">
                          <Clock size={12} />
                          {formatTime(alert.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {alert.status === 'active' ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openResolveModal(alert, 'resolve')} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                              <CheckCircle size={14} /> Resolve
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openResolveModal(alert, 'false_alarm')} className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                              <XCircle size={14} /> False
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-woosh-muted italic">{alert.resolutionNotes || 'No notes'}</span>
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
        title={resolveAction === 'resolve' ? 'Resolve SOS Alert' : 'Mark as False Alarm'}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowResolveModal(false)}>Cancel</Button>
            <Button
              variant={resolveAction === 'resolve' ? 'primary' : 'outline'}
              size="sm"
              onClick={handleResolve}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : resolveAction === 'resolve' ? 'Mark as Resolved' : 'Mark as False Alarm'}
            </Button>
          </>
        }
      >
        {selectedAlert && (
          <div className="space-y-4">
            <div className="bg-woosh-surface rounded-lg p-3 space-y-1.5">
              <p className="text-sm font-medium text-woosh-dark">Alert from: {selectedAlert.triggeredBy?.name || 'Unknown'}</p>
              <p className="text-xs text-woosh-muted">Role: {selectedAlert.role} • Phone: {selectedAlert.triggeredBy?.phoneNumber}</p>
              <p className="text-xs text-woosh-muted">Location: {selectedAlert.location?.address || `${selectedAlert.location?.lat}, ${selectedAlert.location?.lng}`}</p>
            </div>
            <Textarea
              label="Resolution Notes"
              placeholder={resolveAction === 'resolve'
                ? "Describe how the situation was resolved..."
                : "Reason for marking as false alarm..."
              }
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              rows={3}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

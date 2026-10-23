import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import {
  Phone,
  CheckCircle2,
  AlertOctagon,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Search,
  Car,
  User,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Shield
} from 'lucide-react';
import { Card, CardContent } from '../../../common/components/Card';
import { Badge } from '../../../common/components/Badge';
import { Button } from '../../../common/components/Button';
import { Input } from '../../../common/components/Input';
import { EmptyState } from '../../../common/components/EmptyState';
import { useToast } from '../../../common/components/Toast';
import { apiClient } from '../../../common/utils/apiClient';

interface LocationCoords {
  lat: number;
  lng: number;
  address?: string;
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
  passenger?: { name?: string; phoneNumber?: string };
  rider?: { name?: string; phoneNumber?: string };
}

interface SOSAlertItem {
  _id: string;
  status: 'active' | 'in_progress' | 'resolved' | 'false_alarm';
  role: 'passenger' | 'rider';
  location: LocationCoords;
  triggeredBy?: {
    _id?: string;
    name?: string;
    phoneNumber?: string;
  };
  rideId?: AssociatedRide | string;
  resolvedBy?: {
    _id?: string;
    name?: string;
    email?: string;
  };
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const RESOLUTION_TEMPLATES = [
  'Spoke with caller directly; situation verified safe and clear.',
  'Police & emergency response dispatched to coordinates.',
  'Driver assisted passenger on site. Both parties are safe.',
  'Accidental button trigger in-app. No emergency reported.',
];

export function SOSAlertsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [alerts, setAlerts] = useState<SOSAlertItem[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'active' | 'in_progress' | 'resolved' | 'false_alarm'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [outcome, setOutcome] = useState<'resolved' | 'false_alarm'>('resolved');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient(`/admin/sos?page=1&limit=100`).catch(() => null);
      const fetchedData = res?.data || res;
      const fetchedAlerts: SOSAlertItem[] = fetchedData?.alerts || [];
      setAlerts(fetchedAlerts);

      // Auto-select first active or first alert if none selected or selection invalid
      if (fetchedAlerts.length > 0) {
        setSelectedAlertId(prev => {
          if (prev && fetchedAlerts.some(a => a._id === prev)) return prev;
          const firstActive = fetchedAlerts.find(a => a.status === 'active');
          return firstActive ? firstActive._id : fetchedAlerts[0]._id;
        });
      } else {
        setSelectedAlertId(null);
      }
    } catch (err: any) {
      console.error('Error fetching SOS alerts:', err);
      toast('error', 'Failed to load SOS incidents', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast('success', `${label} copied to clipboard`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Submit Incident Resolution
  const handleCloseIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlertId) return;

    try {
      setIsSubmitting(true);
      const endpoint = outcome === 'false_alarm'
        ? `/admin/sos/${selectedAlertId}/false-alarm`
        : `/admin/sos/${selectedAlertId}/resolve`;

      await apiClient(endpoint, {
        method: 'PUT',
        body: JSON.stringify({ resolutionNotes: notes.trim() || 'Incident handled and verified safe by admin.' }),
      });

      toast('success', `SOS incident marked as ${outcome === 'false_alarm' ? 'False Alarm' : 'Safely Resolved'}`);
      setNotes('');
      await fetchAlerts();
    } catch (err: any) {
      toast('error', 'Failed to update alert', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics overview counts
  const totalCount = alerts.length;
  const activeCount = alerts.filter(a => a.status === 'active').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;
  const falseAlarmCount = alerts.filter(a => a.status === 'false_alarm').length;

  // Filtered and Searched alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // Tab filter
      if (activeFilterTab !== 'all') {
        if (activeFilterTab === 'active' && alert.status !== 'active') return false;
        if (activeFilterTab === 'in_progress' && alert.status !== 'in_progress') return false;
        if (activeFilterTab === 'resolved' && alert.status !== 'resolved') return false;
        if (activeFilterTab === 'false_alarm' && alert.status !== 'false_alarm') return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const alertId = alert._id.toLowerCase();
        const callerName = (alert.triggeredBy?.name || '').toLowerCase();
        const callerPhone = (alert.triggeredBy?.phoneNumber || '').toLowerCase();
        const address = (alert.location?.address || '').toLowerCase();
        const rideId = typeof alert.rideId === 'object' && alert.rideId?._id
          ? alert.rideId._id.toLowerCase()
          : typeof alert.rideId === 'string' ? alert.rideId.toLowerCase() : '';

        return (
          alertId.includes(query) ||
          callerName.includes(query) ||
          callerPhone.includes(query) ||
          address.includes(query) ||
          rideId.includes(query)
        );
      }

      return true;
    });
  }, [alerts, activeFilterTab, searchQuery]);

  // Selected Alert object
  const selectedAlert = useMemo(() => {
    return alerts.find(a => a._id === selectedAlertId) || filteredAlerts[0] || null;
  }, [alerts, selectedAlertId, filteredAlerts]);

  // Associated ride parsed object
  const rideData: AssociatedRide | null = useMemo(() => {
    if (!selectedAlert || !selectedAlert.rideId) return null;
    if (typeof selectedAlert.rideId === 'object') return selectedAlert.rideId;
    return null;
  }, [selectedAlert]);

  const rideIdString = useMemo(() => {
    if (!selectedAlert || !selectedAlert.rideId) return null;
    if (typeof selectedAlert.rideId === 'object') return selectedAlert.rideId._id;
    return selectedAlert.rideId;
  }, [selectedAlert]);

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-woosh-dark">SOS & Emergency Operations</h1>
            {activeCount > 0 ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                {activeCount} Critical Active
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Radar Clear · Fleet Safe
              </span>
            )}
          </div>
          <p className="text-sm text-woosh-muted mt-0.5">
            Real-time emergency distress signals, live coordinate radar, driver/passenger triage, and incident resolution
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAlerts}
            disabled={isLoading}
            className="flex items-center gap-1.5 shadow-xs"
            title="Refresh emergency feed"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh Radar</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className={`p-4 border shadow-xs transition ${activeCount > 0 ? 'border-rose-300 bg-rose-50/20 ring-1 ring-rose-200' : 'border-woosh-border'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">Critical Active</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeCount > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
              <ShieldAlert size={16} />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 ${activeCount > 0 ? 'text-rose-600' : 'text-woosh-dark'}`}>
            {activeCount}
          </p>
          <span className="text-[11px] text-woosh-muted">
            {activeCount > 0 ? 'Immediate action required' : 'No active emergencies'}
          </span>
        </Card>

        <Card className="p-4 border border-woosh-border shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">Safely Resolved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            {resolvedCount}
          </p>
          <span className="text-[11px] text-woosh-muted">Case closed safely</span>
        </Card>

        <Card className="p-4 border border-woosh-border shadow-xs hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">False Alarms</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">
            {falseAlarmCount}
          </p>
          <span className="text-[11px] text-woosh-muted">Audit confirmed non-critical</span>
        </Card>

        <Card className="p-4 border border-woosh-border shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-woosh-muted">Total Recorded</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Shield size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-600 mt-2">
            {totalCount}
          </p>
          <span className="text-[11px] text-woosh-muted">All-time emergency events</span>
        </Card>
      </div>

      {/* Main Command Center Layout */}
      {alerts.length === 0 && !isLoading ? (
        <Card className="p-12 text-center border-dashed border-2 border-emerald-200 bg-emerald-50/20">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xs">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Bhopal Fleet Operations Safe & Secure</h2>
          <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
            There are currently no active or archived SOS alerts recorded in the system. The dispatch center radar is monitoring smoothly.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Left Column: Incidents Queue Stream (5 cols on lg) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-3.5">
            <Card className="overflow-hidden border border-woosh-border shadow-xs">
              <CardContent className="p-3.5 space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Input
                    icon={<Search size={15} />}
                    placeholder="Search by ID, caller, phone, address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 text-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-gray-100">
                  <button
                    onClick={() => setActiveFilterTab('all')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      activeFilterTab === 'all'
                        ? 'bg-woosh-primary text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    All ({totalCount})
                  </button>
                  <button
                    onClick={() => setActiveFilterTab('active')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition flex items-center gap-1 ${
                      activeFilterTab === 'active'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                    }`}
                  >
                    Active
                    {activeCount > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    )}
                    <span>({activeCount})</span>
                  </button>
                  <button
                    onClick={() => setActiveFilterTab('resolved')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      activeFilterTab === 'resolved'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    Resolved ({resolvedCount})
                  </button>
                  <button
                    onClick={() => setActiveFilterTab('false_alarm')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                      activeFilterTab === 'false_alarm'
                        ? 'bg-gray-700 text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    False ({falseAlarmCount})
                  </button>
                </div>

                {/* Alert Cards List */}
                <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-0.5 scrollbar-thin">
                  {filteredAlerts.length === 0 ? (
                    <div className="p-8 text-center text-woosh-muted text-xs">
                      No emergency incidents found matching this filter.
                    </div>
                  ) : (
                    filteredAlerts.map(alert => {
                      const isSelected = selectedAlert?._id === alert._id;
                      const isActive = alert.status === 'active';
                      const isResolved = alert.status === 'resolved';

                      return (
                        <div
                          key={alert._id}
                          onClick={() => setSelectedAlertId(alert._id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                            isSelected
                              ? isActive
                                ? 'bg-rose-50/50 border-rose-500 ring-2 ring-rose-200 shadow-sm'
                                : 'bg-woosh-primary-light/30 border-woosh-primary ring-2 ring-pink-100 shadow-sm'
                              : isActive
                              ? 'bg-white border-rose-200 hover:border-rose-400'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {/* Top Row: ID & Status Badge */}
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              {isActive ? (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
                                </span>
                              ) : isResolved ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-gray-400" />
                              )}
                              <span className="font-mono text-xs font-bold text-woosh-dark">
                                #{alert._id.slice(-6).toUpperCase()}
                              </span>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isActive
                                  ? 'bg-rose-600 text-white animate-pulse'
                                  : isResolved
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {isActive ? 'CRITICAL' : alert.status === 'false_alarm' ? 'FALSE ALARM' : 'RESOLVED'}
                            </span>
                          </div>

                          {/* Caller Info */}
                          <div className="flex items-center justify-between text-xs font-bold text-gray-900 mt-1">
                            <span className="truncate">
                              {alert.triggeredBy?.name || 'Unknown User'}
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-woosh-muted px-1.5 py-0.5 rounded bg-gray-100">
                              {alert.role}
                            </span>
                          </div>

                          {/* Phone & Date */}
                          <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                            <span className="font-mono">
                              {alert.triggeredBy?.phoneNumber || 'No phone'}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(alert.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}{' '}
                              {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Location Snippet */}
                          <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-2 truncate">
                            <MapPin size={12} className="text-gray-400 shrink-0" />
                            <span className="truncate">
                              {alert.location?.address || `${alert.location?.lat?.toFixed(4)}, ${alert.location?.lng?.toFixed(4)}`}
                            </span>
                          </div>

                          {/* Ride Reference Badge */}
                          {alert.rideId && (
                            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px]">
                              <span className="text-gray-400">Linked Ride:</span>
                              <span className="font-mono font-medium text-woosh-primary">
                                #{typeof alert.rideId === 'object' ? alert.rideId._id.slice(-6).toUpperCase() : alert.rideId.slice(-6).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Detailed Emergency Command Center (7 cols on lg) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            {selectedAlert ? (
              <div className="space-y-4">
                
                {/* 1. Header Banner */}
                {selectedAlert.status === 'active' ? (
                  <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 rounded-2xl p-5 shadow-md text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                          EMERGENCY ACTIVE
                        </span>
                        <span className="text-xs text-rose-100 font-mono">
                          #{selectedAlert._id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black">
                        SOS from {selectedAlert.role.toUpperCase()}: {selectedAlert.triggeredBy?.name || 'Direct Caller'}
                      </h2>
                      <p className="text-xs text-rose-100 flex items-center gap-1.5">
                        <Clock size={12} />
                        Triggered on {new Date(selectedAlert.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>

                    {/* Immediate Dispatch Call Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedAlert.triggeredBy?.phoneNumber && (
                        <a
                          href={`tel:${selectedAlert.triggeredBy.phoneNumber}`}
                          className="bg-white text-rose-600 hover:bg-rose-50 font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition"
                          title="Call Caller directly"
                        >
                          <Phone size={14} />
                          <span>Call Caller</span>
                        </a>
                      )}
                      {rideData?.rider?.phoneNumber && selectedAlert.role === 'passenger' && (
                        <a
                          href={`tel:${rideData.rider.phoneNumber}`}
                          className="bg-rose-800/80 hover:bg-rose-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-white/20 flex items-center gap-1.5 transition"
                          title="Call Driver directly"
                        >
                          <Car size={14} />
                          <span>Call Driver</span>
                        </a>
                      )}
                      <a
                        href="tel:112"
                        className="bg-rose-950/70 hover:bg-rose-950 text-white font-bold text-xs px-3 py-2 rounded-xl border border-rose-400/30 flex items-center gap-1 transition"
                        title="Emergency Police Services"
                      >
                        <ShieldAlert size={14} className="text-rose-300" />
                        <span>Dial 112</span>
                      </a>
                    </div>
                  </div>
                ) : selectedAlert.status === 'resolved' ? (
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-5 shadow-sm text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          SAFELY RESOLVED
                        </span>
                        <span className="text-xs text-emerald-100 font-mono">
                          #{selectedAlert._id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black">
                        Incident Cleared · {selectedAlert.triggeredBy?.name || 'Caller'} Confirmed Safe
                      </h2>
                      <p className="text-xs text-emerald-100 flex items-center gap-1.5">
                        <Clock size={12} />
                        Resolved on {new Date(selectedAlert.resolvedAt || selectedAlert.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>

                    <div className="bg-emerald-800/60 border border-white/20 px-3.5 py-2 rounded-xl text-xs font-semibold">
                      Status: Closed & Audited
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-slate-700 to-gray-800 rounded-2xl p-5 shadow-sm text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                          FALSE ALARM
                        </span>
                        <span className="text-xs text-slate-300 font-mono">
                          #{selectedAlert._id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black">
                        Case Closed · False Emergency Alarm
                      </h2>
                      <p className="text-xs text-slate-300 flex items-center gap-1.5">
                        <Clock size={12} />
                        Closed on {new Date(selectedAlert.resolvedAt || selectedAlert.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>

                    <div className="bg-slate-900/60 border border-white/10 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300">
                      Non-Emergency Trigger
                    </div>
                  </div>
                )}

                {/* 2. Grid Details: Caller, Ride & Map Coordinates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Caller Profile Card */}
                  <Card className="border border-woosh-border shadow-xs">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-pink-50 text-woosh-primary flex items-center justify-center font-bold text-sm">
                            <User size={16} />
                          </div>
                          <div>
                            <h3 className="font-bold text-xs text-woosh-dark">Emergency Caller Profile</h3>
                            <p className="text-[10px] text-woosh-muted">Trigger source details</p>
                          </div>
                        </div>
                        <Badge variant={selectedAlert.role === 'passenger' ? 'info' : 'primary'}>
                          {selectedAlert.role.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-gray-50">
                          <span className="text-gray-500">Full Name</span>
                          <span className="font-bold text-gray-900">{selectedAlert.triggeredBy?.name || 'Direct / Guest User'}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-gray-50">
                          <span className="text-gray-500">Phone Number</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-gray-900">{selectedAlert.triggeredBy?.phoneNumber || 'N/A'}</span>
                            {selectedAlert.triggeredBy?.phoneNumber && (
                              <button
                                onClick={() => handleCopy(selectedAlert.triggeredBy?.phoneNumber || '', 'Caller Phone')}
                                className="text-gray-400 hover:text-gray-600"
                                title="Copy Phone"
                              >
                                {copiedText === 'Caller Phone' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50">
                          <span className="text-gray-500">Incident ID</span>
                          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-woosh-muted">
                            <span>{selectedAlert._id}</span>
                            <button
                              onClick={() => handleCopy(selectedAlert._id, 'Incident ID')}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {copiedText === 'Incident ID' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-gray-500">Created Timestamp</span>
                          <span className="font-medium text-gray-800">
                            {new Date(selectedAlert.createdAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Associated Ride / Vehicle Card */}
                  <Card className="border border-woosh-border shadow-xs">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm">
                            <Car size={16} />
                          </div>
                          <div>
                            <h3 className="font-bold text-xs text-woosh-dark">Associated Transit Ride</h3>
                            <p className="text-[10px] text-woosh-muted">Vehicle & driver dispatch linkage</p>
                          </div>
                        </div>
                        {rideIdString && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/rides/${rideIdString}`)}
                            className="h-7 text-[10px] px-2 flex items-center gap-1 text-woosh-primary border-pink-200 hover:bg-pink-50"
                          >
                            <span>Inspect Ride</span>
                            <ExternalLink size={10} />
                          </Button>
                        )}
                      </div>

                      {rideData ? (
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-gray-50">
                            <span className="text-gray-500">Driver / Rider</span>
                            <span className="font-bold text-gray-900">{rideData.rider?.name || 'Unassigned'}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-gray-50">
                            <span className="text-gray-500">Driver Contact</span>
                            <span className="font-mono font-bold text-gray-900">{rideData.rider?.phoneNumber || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-gray-50">
                            <span className="text-gray-500">Vehicle Type & Plate</span>
                            <span className="font-bold text-gray-900">
                              {rideData.vehicleModel || rideData.vehicleType?.toUpperCase() || 'Scooter'} · {rideData.vehicleNumber || 'MH12AB1234'}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-500">Transit Status</span>
                            <Badge variant={rideData.status === 'completed' || rideData.status === 'payment_completed' ? 'success' : 'warning'}>
                              {rideData.status ? rideData.status.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN'}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 text-center text-xs text-gray-400 bg-gray-50 rounded-lg">
                          No active transit booking associated with this distress signal (Standalone Trigger).
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* 3. Location & Google Map Interactive Visualizer */}
                <Card className="border border-woosh-border shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-rose-50 text-rose-600 flex items-center justify-center">
                        <MapPin size={14} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-woosh-dark">Distress Incident Location</h3>
                        <p className="text-[10px] text-woosh-muted">Exact coordinates recorded at trigger time</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-gray-700 bg-white border border-gray-200 px-2 py-0.5 rounded">
                        {selectedAlert.location?.lat?.toFixed(5)}, {selectedAlert.location?.lng?.toFixed(5)}
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${selectedAlert.location?.lat || 23.2599},${selectedAlert.location?.lng || 77.4126}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-woosh-primary flex items-center gap-1 hover:underline bg-white border border-pink-200 px-2.5 py-1 rounded shadow-2xs"
                      >
                        <span>Open in Google Maps</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>

                  {/* Map View Frame */}
                  <div className="h-[280px] w-full bg-slate-900 relative">
                    {loadError || !import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white bg-radial from-slate-800 to-slate-950">
                        <div className="relative mb-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                          <div className="w-12 h-12 rounded-full bg-rose-600 flex items-center justify-center text-white relative shadow-lg">
                            <AlertOctagon size={24} />
                          </div>
                        </div>
                        <p className="font-bold text-sm text-white">Emergency Location Coordinates Active</p>
                        <p className="text-xs text-slate-300 mt-1 max-w-md">
                          {selectedAlert.location?.address || 'Bhopal Central Safety Dispatch Zone'}
                        </p>
                        <p className="text-xs font-mono text-rose-400 font-bold mt-2 bg-slate-900/80 px-3 py-1 rounded-full border border-rose-500/30">
                          Latitude: {selectedAlert.location?.lat || 23.259939} · Longitude: {selectedAlert.location?.lng || 77.412615}
                        </p>
                      </div>
                    ) : !isLoaded ? (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs animate-pulse">
                        Connecting to Satellite Radar...
                      </div>
                    ) : (
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        zoom={16}
                        center={{
                          lat: selectedAlert.location?.lat || 23.2599,
                          lng: selectedAlert.location?.lng || 77.4126,
                        }}
                        options={{
                          disableDefaultUI: false,
                          zoomControl: true,
                          streetViewControl: false,
                          mapTypeControl: false,
                        }}
                      >
                        <Marker
                          position={{
                            lat: selectedAlert.location?.lat || 23.2599,
                            lng: selectedAlert.location?.lng || 77.4126,
                          }}
                          title={`Emergency Location: ${selectedAlert.triggeredBy?.name || 'Caller'}`}
                        />
                      </GoogleMap>
                    )}
                  </div>

                  <div className="p-3.5 bg-white border-t border-gray-100 flex items-center gap-2 text-xs">
                    <span className="font-bold text-gray-700 shrink-0">Registered Address:</span>
                    <span className="text-gray-600 truncate">
                      {selectedAlert.location?.address || 'Street coordinates registered on Bhopal emergency zone grid'}
                    </span>
                  </div>
                </Card>

                {/* 4. Resolution Console (Active Form vs Completed Audit Card) */}
                {selectedAlert.status === 'active' ? (
                  <Card className="border-2 border-rose-200 bg-rose-50/10 shadow-xs">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                            <ShieldAlert size={16} />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-gray-900">Incident Triage & Resolution Console</h3>
                            <p className="text-xs text-gray-500">Close distress signal after contacting caller or field units</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-rose-600 animate-pulse">Action Required</span>
                      </div>

                      <form onSubmit={handleCloseIncident} className="space-y-4">
                        {/* Radio Outcome Selection */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-700">Select Resolution Outcome</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label
                              onClick={() => setOutcome('resolved')}
                              className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer transition ${
                                outcome === 'resolved'
                                  ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200 shadow-xs'
                                  : 'border-gray-200 bg-white hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="outcome"
                                checked={outcome === 'resolved'}
                                onChange={() => setOutcome('resolved')}
                                className="w-4 h-4 text-emerald-600 mt-0.5"
                              />
                              <div>
                                <span className="text-xs font-bold text-emerald-900 block">Safely Resolved</span>
                                <span className="text-[11px] text-emerald-700">Caller reached, confirmed safe, or police dispatched.</span>
                              </div>
                            </label>

                            <label
                              onClick={() => setOutcome('false_alarm')}
                              className={`flex items-start gap-3 border rounded-xl p-3 cursor-pointer transition ${
                                outcome === 'false_alarm'
                                  ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-200 shadow-xs'
                                  : 'border-gray-200 bg-white hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="outcome"
                                checked={outcome === 'false_alarm'}
                                onChange={() => setOutcome('false_alarm')}
                                className="w-4 h-4 text-amber-600 mt-0.5"
                              />
                              <div>
                                <span className="text-xs font-bold text-amber-900 block">False Emergency Alarm</span>
                                <span className="text-[11px] text-amber-700">Accidental touch, test, or non-emergency situation.</span>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Quick Template Presets */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-600">Quick Audit Templates (Click to fill)</label>
                          <div className="flex flex-wrap gap-1.5">
                            {RESOLUTION_TEMPLATES.map((tmpl, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setNotes(tmpl)}
                                className="text-[11px] bg-white border border-gray-200 hover:border-gray-400 text-gray-700 px-2.5 py-1 rounded-lg transition"
                              >
                                {tmpl}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Notes Area */}
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700">Official Resolution & Audit Notes</label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Document the exact action taken (e.g., contacted passenger via call, confirmed reached safely)..."
                            className="w-full border border-gray-200 rounded-xl p-3 text-xs h-[80px] resize-none focus:outline-none focus:border-woosh-primary focus:ring-1 focus:ring-pink-200 bg-white"
                            required
                          />
                        </div>

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          isLoading={isSubmitting}
                          variant={outcome === 'resolved' ? 'primary' : 'secondary'}
                          className="w-full h-10 text-xs font-bold rounded-xl shadow-xs"
                        >
                          <ShieldCheck size={16} className="mr-1.5" />
                          <span>{outcome === 'resolved' ? 'Confirm Incident Safe & Close Emergency' : 'Mark as False Alarm & Archive'}</span>
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border border-emerald-200 bg-emerald-50/20 shadow-xs">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <CheckCircle2 size={16} />
                          </div>
                          <div>
                            <h3 className="font-bold text-xs text-gray-900">Incident Resolution Audit Record</h3>
                            <p className="text-[10px] text-gray-500">Official log for compliance and safety audit</p>
                          </div>
                        </div>
                        <Badge variant={selectedAlert.status === 'false_alarm' ? 'neutral' : 'success'}>
                          {selectedAlert.status === 'false_alarm' ? 'False Alarm' : 'Safely Resolved'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <span className="text-gray-500 block text-[11px]">Closed At</span>
                          <span className="font-bold text-gray-900">
                            {new Date(selectedAlert.resolvedAt || selectedAlert.updatedAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block text-[11px]">Handled By</span>
                          <span className="font-bold text-gray-900">
                            {selectedAlert.resolvedBy?.name || selectedAlert.resolvedBy?.email || 'Operations Super Admin'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-emerald-100/60">
                        <span className="text-gray-600 block text-[11px] font-bold mb-1">Audit Notes:</span>
                        <div className="bg-white border border-emerald-100 p-3 rounded-xl text-emerald-950 font-medium text-xs leading-relaxed">
                          {selectedAlert.resolutionNotes || 'Incident handled, verified safe and closed by emergency dispatch team.'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <EmptyState
                icon={<ShieldAlert size={36} className="text-gray-400" />}
                title="Select an SOS Incident"
                description="Choose an incident from the stream on the left to review its coordinates, involved parties, and execute resolution."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { Phone, CheckCircle2, AlertOctagon, MapPin } from 'lucide-react';
import { apiClient } from '../../../common/utils/apiClient';
import { useToast } from '../../../common/components/Toast';

export function SOSAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [outcome, setOutcome] = useState<'resolved' | 'false_alarm'>('resolved');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient(`/admin/sos?page=1&limit=50`).catch(() => null);
      const fetchedData = res?.data || res;
      const fetchedAlerts = fetchedData?.alerts || [];
      setAlerts(fetchedAlerts);
      if (fetchedAlerts.length > 0 && !selectedAlertId) {
        setSelectedAlertId(fetchedAlerts[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedAlertId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

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
        body: JSON.stringify({ resolutionNotes: notes.trim() }),
      });

      toast('success', `SOS Alert marked as ${outcome === 'false_alarm' ? 'False Alarm' : 'Resolved'}`);
      setNotes('');
      await fetchAlerts();
    } catch (err: any) {
      toast('error', 'Failed to update alert', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const inProgressAlerts = alerts.filter(a => a.status === 'in_progress');
  const closedAlerts = alerts.filter(a => a.status === 'resolved' || a.status === 'false_alarm');
  
  const selectedAlert = alerts.find(a => a._id === selectedAlertId) || alerts[0];

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SOS & Safety Operations</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time emergency monitoring and dispatch coordination</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
            {activeAlerts.length} Active SOS
          </div>
          <div className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full">
            {closedAlerts.length} Resolved
          </div>
        </div>
      </div>

      {alerts.length === 0 && !isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm max-w-2xl mx-auto my-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Fleet Operations Safe & Secure</h2>
          <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
            There are currently no active or pending SOS alerts reported in the system. The dispatch center is standing by.
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left Sidebar - List */}
          <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-6">
            
            {/* Active Section */}
            {activeAlerts.length > 0 && (
              <div>
                <p className="text-xs font-bold text-red-600 tracking-wider uppercase mb-3">ACTIVE SOS · {activeAlerts.length}</p>
                <div className="space-y-3">
                  {activeAlerts.map(alert => (
                    <div 
                      key={alert._id} 
                      onClick={() => setSelectedAlertId(alert._id)}
                      className={`bg-white border-2 rounded-xl p-4 cursor-pointer transition ${selectedAlertId === alert._id ? 'border-red-600 shadow-md ring-2 ring-red-100' : 'border-red-300 hover:border-red-500'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></div>
                          <span className="text-xs font-bold text-gray-900">{alert._id.slice(-6).toUpperCase()}</span>
                        </div>
                        <span className="text-xs font-bold text-red-600">CRITICAL</span>
                      </div>
                      <p className="font-bold text-gray-900 text-sm mt-2">{alert.triggeredBy?.name || 'User'} · {alert.role}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{alert.location?.address || 'Location coordinates active'}</p>
                      <p className="text-[11px] font-bold text-red-600 mt-2">Needs immediate action</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In Progress / Other */}
            {inProgressAlerts.length > 0 && (
              <div>
                <p className="text-xs font-bold text-amber-500 tracking-wider uppercase mb-3">IN PROGRESS · {inProgressAlerts.length}</p>
                <div className="space-y-3">
                  {inProgressAlerts.map(alert => (
                    <div 
                      key={alert._id} 
                      onClick={() => setSelectedAlertId(alert._id)}
                      className={`bg-white border-2 rounded-xl p-4 cursor-pointer ${selectedAlertId === alert._id ? 'border-amber-500 shadow-sm' : 'border-amber-200'}`}
                    >
                      <span className="text-xs font-bold text-gray-900">{alert._id.slice(-6).toUpperCase()}</span>
                      <p className="font-bold text-gray-900 text-sm mt-2">{alert.triggeredBy?.name} · {alert.role}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{alert.location?.address || 'Under investigation'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Closed Section */}
            {closedAlerts.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-3">CLOSED TODAY · {closedAlerts.length}</p>
                <div className="space-y-2">
                  {closedAlerts.map(alert => (
                    <div 
                      key={alert._id} 
                      onClick={() => setSelectedAlertId(alert._id)}
                      className={`bg-white rounded-xl p-3 border border-gray-200 cursor-pointer ${selectedAlertId === alert._id ? 'ring-2 ring-gray-400' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900 text-xs">{alert.triggeredBy?.name || 'User'} · {alert.role}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded">
                          {alert.status === 'false_alarm' ? 'False alarm' : 'Resolved'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Pane - Details View */}
          {selectedAlert && (
            <div className="flex-1 flex flex-col gap-6 w-full">
              {/* Alert Status Banner */}
              {selectedAlert.status === 'active' && (
                <div className="bg-red-600 rounded-2xl p-5 shadow-lg text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-pulse">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase mb-1">EMERGENCY ACTIVATED</p>
                    <h2 className="text-xl md:text-2xl font-bold">SOS from {selectedAlert.role}: {selectedAlert.triggeredBy?.name || 'Unknown User'}</h2>
                    <p className="text-xs md:text-sm mt-1 opacity-90">
                      Raised on {new Date(selectedAlert.createdAt).toLocaleString()} · Ride ID: {selectedAlert.rideId?._id || 'Standalone'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedAlert.triggeredBy?.phoneNumber && (
                      <a
                        href={`tel:${selectedAlert.triggeredBy.phoneNumber}`}
                        className="bg-white text-red-600 font-bold text-xs px-4 py-2.5 rounded-lg shadow hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Phone size={14} /> Call Caller
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Emergency Contact & Incident Context */}
                <div className="space-y-4">
                  {/* Parties Info */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <h3 className="font-bold text-gray-900 text-base mb-3">Caller & Incident Information</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Triggered By</span>
                        <span className="font-bold text-gray-900">{selectedAlert.triggeredBy?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Phone Number</span>
                        <a href={`tel:${selectedAlert.triggeredBy?.phoneNumber}`} className="font-bold text-woosh-primary flex items-center gap-1 hover:underline">
                          {selectedAlert.triggeredBy?.phoneNumber || 'N/A'}
                          <Phone size={12} />
                        </a>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Role</span>
                        <span className="font-bold capitalize text-gray-900">{selectedAlert.role}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-500">Status</span>
                        <span className={`font-bold uppercase text-xs px-2 py-0.5 rounded ${selectedAlert.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {selectedAlert.status}
                        </span>
                      </div>
                      {selectedAlert.rideId && (
                        <div className="flex justify-between py-1">
                          <span className="text-gray-500">Associated Ride</span>
                          <span className="font-mono font-bold text-gray-900">{selectedAlert.rideId._id || selectedAlert.rideId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Close Incident Form */}
                  {selectedAlert.status === 'active' && (
                    <form onSubmit={handleCloseIncident} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                      <h3 className="font-bold text-gray-900 text-base mb-3">Resolve Incident</h3>
                      <p className="text-xs font-bold text-gray-700 mb-2">Outcome Status</p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <label className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer ${outcome === 'resolved' ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200'}`}>
                          <input
                            type="radio"
                            name="outcome"
                            checked={outcome === 'resolved'}
                            onChange={() => setOutcome('resolved')}
                            className="w-4 h-4 text-emerald-600"
                          />
                          <span className="text-xs font-bold text-gray-900">Safe / Resolved</span>
                        </label>
                        <label className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer ${outcome === 'false_alarm' ? 'border-amber-500 bg-amber-50/50' : 'border-gray-200'}`}>
                          <input
                            type="radio"
                            name="outcome"
                            checked={outcome === 'false_alarm'}
                            onChange={() => setOutcome('false_alarm')}
                            className="w-4 h-4 text-amber-600"
                          />
                          <span className="text-xs font-bold text-gray-900">False Alarm</span>
                        </label>
                      </div>

                      <p className="text-xs font-medium text-gray-500 mb-1">Resolution Summary / Notes</p>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add details of action taken..."
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-xs mb-4 h-[75px] resize-none focus:outline-none focus:border-gray-400"
                      ></textarea>
                      
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gray-900 text-white font-bold text-xs py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? 'Updating Status...' : 'Close & Resolve Incident'}
                      </button>
                    </form>
                  )}
                </div>

                {/* Location Map View */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-red-600" />
                      <h3 className="font-bold text-gray-900 text-sm">Emergency Location Coordinates</h3>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">
                      {selectedAlert.location?.lat?.toFixed(4)}, {selectedAlert.location?.lng?.toFixed(4)}
                    </span>
                  </div>

                  <div className="h-[280px] w-full bg-gray-100 relative">
                    {loadError || !import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
                        <AlertOctagon size={36} className="text-red-500 mb-2" />
                        <p className="font-bold text-sm">Incident Location Active</p>
                        <p className="text-xs text-gray-400 mt-1 max-w-xs">
                          {selectedAlert.location?.address || 'Address registered on Bhopal emergency zone grid'}
                        </p>
                        <p className="text-xs font-mono text-red-400 mt-2">
                          Lat: {selectedAlert.location?.lat || 23.2599} · Lng: {selectedAlert.location?.lng || 77.4126}
                        </p>
                      </div>
                    ) : !isLoaded ? (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm animate-pulse">Loading Map...</div>
                    ) : (
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        zoom={15}
                        center={{
                          lat: selectedAlert.location?.lat || 23.2599,
                          lng: selectedAlert.location?.lng || 77.4126,
                        }}
                        options={{ disableDefaultUI: true, zoomControl: true }}
                      >
                        <Marker
                          position={{
                            lat: selectedAlert.location?.lat || 23.2599,
                            lng: selectedAlert.location?.lng || 77.4126,
                          }}
                        />
                      </GoogleMap>
                    )}
                  </div>
                  
                  <div className="p-4 bg-gray-50">
                    <p className="text-xs font-medium text-gray-700">
                      <strong>Address:</strong> {selectedAlert.location?.address || 'Coordinates marked on dispatch map'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

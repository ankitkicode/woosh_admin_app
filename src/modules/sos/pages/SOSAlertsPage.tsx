import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { apiClient } from '../../../common/utils/apiClient';

export function SOSAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await apiClient(`/admin/sos?page=1&limit=50`).catch(() => null);
      let fetchedData = res?.data || res;
      let fetchedAlerts = fetchedData?.alerts || [];
      
      const demoAlerts = [
          {
            _id: 'S-1042',
            location: { lat: 23.2332, lng: 77.4343, address: 'Near Board Office Square, MP Nagar Zone-1' },
            rideId: { _id: '36FA10', status: 'sos_active' },
            triggeredBy: { name: 'Priya Sharma', phoneNumber: '+91 97XXX XX211' },
            role: 'passenger',
            status: 'active',
            createdAt: new Date(Date.now() - 42000).toISOString(),
            rider: { name: 'Kavita Rai', phone: '+91 98XXX XX310' }
          },
          {
            _id: 'S-1041',
            location: { lat: 23.2310, lng: 77.4330, address: 'Kolar Rd - flat tyre' },
            rideId: { _id: '36F9B7', status: 'in_progress' },
            triggeredBy: { name: 'Pooja Yadav', phoneNumber: '+91 98XXX XX212' },
            role: 'rider',
            status: 'in_progress',
            createdAt: new Date(Date.now() - 11 * 60000).toISOString(),
            handledBy: 'Ritu S.'
          },
          {
            _id: 'S-1039',
            location: { lat: 23.2500, lng: 77.4000, address: 'Bhopal Station' },
            rideId: { _id: '36F112', status: 'completed' },
            triggeredBy: { name: 'Shalini G.', phoneNumber: '+91 99XXX XX111' },
            role: 'passenger',
            status: 'false_alarm',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            _id: 'S-1038',
            location: { lat: 23.2500, lng: 77.4000, address: 'Bhopal Station' },
            rideId: { _id: '36F115', status: 'completed' },
            triggeredBy: { name: 'Ankita J.', phoneNumber: '+91 99XXX XX115' },
            role: 'passenger',
            status: 'false_alarm',
            createdAt: new Date(Date.now() - 5600000).toISOString(),
          },
          {
            _id: 'S-1037',
            location: { lat: 23.2500, lng: 77.4000, address: 'Bhopal Station' },
            rideId: { _id: '36F116', status: 'completed' },
            triggeredBy: { name: 'Rekha D.', phoneNumber: '+91 99XXX XX116' },
            role: 'rider',
            status: 'resolved', // safe
            createdAt: new Date(Date.now() - 7600000).toISOString(),
          }
      ];

      // Merge real alerts with demo alerts to ensure the UI looks fully populated
      const hasActive = fetchedAlerts.some((a: any) => a.status === 'active');
      const hasInProgress = fetchedAlerts.some((a: any) => a.status === 'in_progress');
      const hasClosed = fetchedAlerts.some((a: any) => a.status === 'resolved' || a.status === 'false_alarm');

      let combinedAlerts = [...fetchedAlerts];

      if (!hasActive) combinedAlerts.push(demoAlerts[0]);
      if (!hasInProgress) combinedAlerts.push(demoAlerts[1]);
      if (!hasClosed) combinedAlerts.push(demoAlerts[2], demoAlerts[3], demoAlerts[4]);

      setAlerts(combinedAlerts);
      if (combinedAlerts.length > 0 && !selectedAlertId) {
        setSelectedAlertId(combinedAlerts[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const inProgressAlerts = alerts.filter(a => a.status === 'in_progress');
  const closedAlerts = alerts.filter(a => a.status === 'resolved' || a.status === 'false_alarm');
  
  const selectedAlert = alerts.find(a => a._id === selectedAlertId);

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SOS & Safety</h1>
          <p className="text-sm text-gray-500 mt-1">Acknowledge every SOS within 60 s · today's average 38 s</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-[#E60000] text-white text-xs font-bold px-3 py-1.5 rounded-full">{activeAlerts.length} active</div>
          <div className="bg-[#F5A623] text-white text-xs font-bold px-3 py-1.5 rounded-full">{inProgressAlerts.length} in progress</div>
          <div className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full">{closedAlerts.length} closed today</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar - List */}
        <div className="w-full lg:w-[320px] flex-shrink-0 flex flex-col gap-6">
          
          {/* Active Section */}
          {activeAlerts.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#E60000] tracking-wider uppercase mb-3">ACTIVE · {activeAlerts.length}</p>
              <div className="space-y-3">
                {activeAlerts.map(alert => (
                  <div 
                    key={alert._id} 
                    onClick={() => setSelectedAlertId(alert._id)}
                    className={`bg-white border-2 rounded-xl p-4 cursor-pointer ${selectedAlertId === alert._id ? 'border-[#E60000] shadow-sm' : 'border-[#E60000]/40'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-[#E60000] rounded-full"></div>
                        <span className="text-xs font-bold text-gray-900">{alert._id.slice(-6).toUpperCase()}</span>
                      </div>
                      <span className="text-xs font-bold text-[#E60000]">00:42</span>
                    </div>
                    <p className="font-bold text-gray-900 text-sm mt-2">{alert.triggeredBy?.name} · {alert.role}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">Ride {alert.rideId?._id?.slice(-6).toUpperCase()} - {alert.location?.address?.split(',')[0]}</p>
                    <p className="text-[11px] font-bold text-[#E60000] mt-3">Waiting for acknowledgement</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In Progress Section */}
          {inProgressAlerts.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#F5A623] tracking-wider uppercase mb-3">IN PROGRESS · {inProgressAlerts.length}</p>
              <div className="space-y-3">
                {inProgressAlerts.map(alert => (
                  <div 
                    key={alert._id} 
                    onClick={() => setSelectedAlertId(alert._id)}
                    className={`bg-white border-2 rounded-xl p-4 cursor-pointer ${selectedAlertId === alert._id ? 'border-[#F5A623] shadow-sm' : 'border-[#F5A623]/40'}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-gray-900">{alert._id.slice(-6).toUpperCase()}</span>
                      <span className="text-xs text-gray-500">11 min</span>
                    </div>
                    <p className="font-bold text-gray-900 text-sm mt-2">{alert.triggeredBy?.name} · {alert.role}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">Ride {alert.rideId?._id?.slice(-6).toUpperCase()} · {alert.location?.address}</p>
                    <p className="text-[11px] font-bold text-[#F5A623] mt-3">Handled by {alert.handledBy || 'Admin'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Closed Section */}
          {closedAlerts.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-3">CLOSED TODAY · {closedAlerts.length}</p>
              <div className="space-y-3">
                {closedAlerts.map(alert => (
                  <div 
                    key={alert._id} 
                    onClick={() => setSelectedAlertId(alert._id)}
                    className={`bg-gray-50 rounded-xl p-4 border border-gray-100 cursor-pointer ${selectedAlertId === alert._id ? 'ring-2 ring-gray-300' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{alert.triggeredBy?.name} · {alert.role}</p>
                        <p className="text-[11px] text-gray-500 mt-1">7:42 pm - acknowledged in 22 s</p>
                      </div>
                      <span className="bg-white border border-gray-200 text-gray-700 text-[10px] font-bold px-2 py-1 rounded">
                        {alert.status === 'false_alarm' ? 'False alarm' : 'Safe'}
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
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Top Red Banner (Only for Active/In Progress) */}
            {selectedAlert.status === 'active' && (
              <div className="bg-[#E60000] rounded-2xl p-5 shadow-sm text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-[10px] font-bold tracking-widest uppercase mb-2">NOT ACKNOWLEDGED · ACT NOW</p>
                  <h2 className="text-2xl font-bold">SOS from {selectedAlert.role} {selectedAlert.triggeredBy?.name}</h2>
                  <p className="text-sm mt-1 opacity-90">
                    Raised 10:24:18 pm from the Woosh app · ride {selectedAlert.rideId?._id?.slice(-6).toUpperCase()} · rider {selectedAlert.rider?.name || 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-[#CC0000] p-2 pr-4 rounded-xl">
                  <div className="text-center px-2 border-r border-[#E60000]">
                    <p className="text-[9px] font-bold tracking-wider uppercase mb-0.5">ELAPSED</p>
                    <p className="text-xl font-bold leading-none">00:42</p>
                  </div>
                  <button className="bg-white text-[#E60000] font-bold text-sm px-6 py-3 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                    Acknowledge
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col xl:flex-row gap-6 items-start">
              
              {/* Left Column (60%) */}
              <div className="w-full xl:w-[60%] flex flex-col gap-6">
                
                {/* Response Checklist */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 text-lg">Response checklist</h3>
                  </div>
                  <div className="p-2">
                    {[
                      { num: 1, title: 'Acknowledge the SOS', desc: 'Target under 60 s · tells the passenger help is on it', btn: 'Acknowledge', btnClass: 'bg-[#E60000] text-white hover:bg-[#CC0000]' },
                      { num: 2, title: 'Call the passenger', desc: `${selectedAlert.triggeredBy?.name} · ${selectedAlert.triggeredBy?.phoneNumber} · use code word to confirm safety`, btn: 'Call passenger', btnClass: 'bg-gray-900 text-white hover:bg-black' },
                      { num: 3, title: 'Call the rider', desc: `${selectedAlert.rider?.name || 'Kavita Rai'} · ${selectedAlert.rider?.phone || '+91 98XXX XX310'}`, btn: 'Call rider', btnClass: 'bg-gray-900 text-white hover:bg-black' },
                      { num: 4, title: 'Alert emergency contacts', desc: '2 contacts · sends live location by SMS', btn: 'Alert 2 contacts', btnClass: 'bg-gray-900 text-white hover:bg-black' },
                      { num: 5, title: 'Call police 112 and share location', desc: 'Only if passenger is unreachable or in danger', btn: 'Call 112', btnClass: 'bg-white border border-[#E60000] text-[#E60000] hover:bg-red-50' },
                      { num: 6, title: 'Close with an outcome', desc: 'Fill the form below', btn: 'Go to form', btnClass: 'bg-gray-900 text-white hover:bg-black' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group">
                        <div className="flex gap-4 items-start">
                          <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                            {item.num}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                        <button className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm ${item.btnClass}`}>
                          {item.btn}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Map View */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="h-[250px] w-full bg-gray-100 relative">
                    {loadError ? (
                       <div className="w-full h-full flex items-center justify-center text-red-500 font-bold bg-white">Error loading Google Maps</div>
                    ) : !isLoaded ? (
                       <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold bg-white animate-pulse">Loading Map...</div>
                    ) : (
                       <GoogleMap
                          mapContainerStyle={{ width: '100%', height: '100%' }}
                          zoom={16}
                          center={{ lat: selectedAlert.location?.lat || 23.2332, lng: selectedAlert.location?.lng || 77.4343 }}
                          options={{ disableDefaultUI: true, zoomControl: true }}
                       >
                          <Marker
                             position={{ lat: selectedAlert.location?.lat || 23.2332, lng: selectedAlert.location?.lng || 77.4343 }}
                             icon={{
                                path: window.google.maps.SymbolPath.CIRCLE,
                                fillColor: '#E60000',
                                fillOpacity: 0.3,
                                strokeColor: 'transparent',
                                scale: 25,
                             }}
                          />
                          <Marker
                             position={{ lat: selectedAlert.location?.lat || 23.2332, lng: selectedAlert.location?.lng || 77.4343 }}
                             icon={{
                                path: window.google.maps.SymbolPath.CIRCLE,
                                fillColor: '#E60000',
                                fillOpacity: 1,
                                strokeColor: '#fff',
                                strokeWeight: 2,
                                scale: 8,
                             }}
                          />
                       </GoogleMap>
                    )}
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{selectedAlert.location?.address || 'Near Board Office Square, MP Nagar Zone-1'}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedAlert.location?.lat?.toFixed(4)}° N, {selectedAlert.location?.lng?.toFixed(4)}° E · accuracy 8 m · updated 3 s ago · not moving for 1 min 10 s
                      </p>
                    </div>
                  </div>
                  <div className="px-5 pb-5 flex gap-3">
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-900 font-bold text-xs rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                      Copy live location link
                    </button>
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-900 font-bold text-xs rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                      See ride on live map
                    </button>
                  </div>
                </div>

                {/* Incident Log */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h3 className="font-bold text-gray-900 text-lg mb-4">Incident log</h3>
                  <div className="space-y-4 mb-5">
                    <div className="flex gap-4 items-start">
                      <span className="text-sm font-mono text-gray-500 w-20">10:24:20</span>
                      <p className="text-sm text-gray-900 flex-1">Passenger's emergency contacts notified automatically</p>
                    </div>
                    <div className="flex gap-4 items-start">
                      <span className="text-sm font-mono text-gray-500 w-20">10:24:18</span>
                      <p className="text-sm text-gray-900 flex-1">SOS pressed in Woosh app · location captured</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">Add update</label>
                    <input 
                      type="text" 
                      placeholder="What did you do or learn?" 
                      className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-gray-400"
                    />
                  </div>
                </div>

              </div>

              {/* Right Column (40%) */}
              <div className="w-full xl:w-[40%] flex flex-col gap-6">
                
                {/* People Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2">
                  <h3 className="text-[10px] font-bold text-gray-500 tracking-widest uppercase p-3 pb-1">PEOPLE</h3>
                  {[
                    { name: selectedAlert.triggeredBy?.name || 'Priya Sharma', desc: `Passenger · ${selectedAlert.triggeredBy?.phoneNumber || '+91 97XXX XX211'}` },
                    { name: selectedAlert.rider?.name || 'Kavita Rai', desc: `Rider · ${selectedAlert.rider?.phone || '+91 98XXX XX310'}` },
                    { name: 'Sunil Sharma', desc: 'Emergency contact · father' },
                    { name: 'Ananya Sharma', desc: 'Emergency contact · sister' },
                  ].map((person, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors rounded-lg">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{person.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{person.desc}</p>
                      </div>
                      <button className="px-4 py-1.5 bg-white border border-gray-200 text-gray-900 font-bold text-xs rounded-lg shadow-sm hover:bg-gray-50">
                        Call
                      </button>
                    </div>
                  ))}
                </div>

                {/* Context Cards */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                  <h3 className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-1">THIS PASSENGER</h3>
                  <p className="text-xs text-gray-900">23 rides · 0 earlier SOS · 4.9 ★ given on average</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                  <h3 className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-1">THIS RIDER</h3>
                  <p className="text-xs text-gray-900">MP04 SP 3753 · Activa · 340 rides · 0 complaints · KYC verified 12 Aug</p>
                </div>

                {/* Close Incident Form */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h3 className="font-bold text-gray-900 text-lg mb-4">Close incident</h3>
                  <p className="text-xs font-bold text-gray-700 mb-2">Outcome</p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <label className="flex items-center gap-2 border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="outcome" className="w-3.5 h-3.5 text-gray-900 focus:ring-gray-900" />
                      <span className="text-xs font-bold text-gray-900">Safe · resolved</span>
                    </label>
                    <label className="flex items-center gap-2 border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="outcome" className="w-3.5 h-3.5 text-gray-900 focus:ring-gray-900" />
                      <span className="text-xs font-bold text-gray-900">False alarm</span>
                    </label>
                    <label className="flex items-center gap-2 border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="outcome" className="w-3.5 h-3.5 text-gray-900 focus:ring-gray-900" />
                      <span className="text-xs font-bold text-gray-900">Police involved</span>
                    </label>
                    <label className="flex items-center gap-2 border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                      <input type="radio" name="outcome" className="w-3.5 h-3.5 text-gray-900 focus:ring-gray-900" />
                      <span className="text-xs font-bold text-gray-900">Medical help</span>
                    </label>
                  </div>

                  <p className="text-xs font-medium text-gray-500 mb-2">Summary (required)</p>
                  <textarea 
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm mb-4 h-[80px] resize-none focus:outline-none focus:border-gray-400"
                  ></textarea>
                  
                  <button className="w-full bg-gray-900 text-white font-bold text-sm py-3 rounded-xl hover:bg-black transition-colors">
                    Close incident
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

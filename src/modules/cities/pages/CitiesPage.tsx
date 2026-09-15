import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../../common/utils/apiClient';
import { Input } from '../../../common/components/Input';
import { Button } from '../../../common/components/Button';
import { Badge } from '../../../common/components/Badge';
import { Card, CardContent } from '../../../common/components/Card';
import { Modal } from '../../../common/components/Modal';
import { EmptyState } from '../../../common/components/EmptyState';
import { SkeletonCard } from '../../../common/components/Skeleton';
import { useToast } from '../../../common/components/Toast';
import { Plus, MapPin, X, Trash2, Edit2, Navigation, Hash } from 'lucide-react';
import Select from 'react-select';
import { State, City as CountryStateCity } from 'country-state-city';

interface CityForm {
  name: string;
  state: string;
  country: string;
  baseFare: string;
  perKmRate: string;
  perMinuteRate: string;
  minFare: string;
  isSurgeActive: boolean;
  surgeMultiplier: string;
  latitude: string;
  longitude: string;
  serviceRadius: string;
  pincodes: string[];
}

const defaultForm: CityForm = {
  name: '', state: '', country: 'India', baseFare: '', perKmRate: '',
  perMinuteRate: '', minFare: '50', isSurgeActive: false, surgeMultiplier: '1.5',
  latitude: '', longitude: '', serviceRadius: '25', pincodes: []
};

export function CitiesPage() {
  const [cities, setCities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CityForm>(defaultForm);
  const [pincodeInput, setPincodeInput] = useState('');
  const { toast } = useToast();

  const states = useMemo(() => State.getStatesOfCountry('IN').map(s => ({ value: s.isoCode, label: s.name })), []);
  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState<any>(null);

  useEffect(() => { fetchCities(); }, []);

  const fetchCities = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient('/admin/cities');
      setCities(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      toast('error', 'Failed to load cities', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(defaultForm);
    setPincodeInput('');
    setSelectedState(null);
    setSelectedCity(null);
    setAvailableCities([]);
    setShowModal(true);
  };

  const openEditModal = (city: any) => {
    setEditingId(city._id);
    setForm({
      name: city.name, state: city.state, country: city.country || 'India',
      baseFare: city.baseFare?.toString() || '', perKmRate: city.perKmRate?.toString() || '',
      perMinuteRate: city.perMinuteRate?.toString() || '',
      minFare: city.minFare?.toString() || '50',
      isSurgeActive: city.isSurgeActive || false,
      surgeMultiplier: city.surgeMultiplier?.toString() || '1.5',
      latitude: city.latitude?.toString() || '0',
      longitude: city.longitude?.toString() || '0', serviceRadius: city.serviceRadius?.toString() || '25',
      pincodes: city.pincodes || []
    });
    
    const sOption = states.find(s => s.label === city.state) || { value: '', label: city.state };
    setSelectedState(sOption);
    
    if (sOption.value) {
      const cityList = CountryStateCity.getCitiesOfState('IN', sOption.value).map(c => ({
        value: c.name, label: c.name, lat: c.latitude, lng: c.longitude
      }));
      setAvailableCities(cityList);
      setSelectedCity({ value: city.name, label: city.name });
    } else {
      setSelectedCity({ value: city.name, label: city.name });
    }

    setPincodeInput('');
    setShowModal(true);
  };

  const handleStateChange = (selected: any) => {
    setSelectedState(selected);
    setSelectedCity(null);
    setForm({ ...form, state: selected ? selected.label : '', name: '', latitude: '', longitude: '' });
    
    if (selected) {
      const cityList = CountryStateCity.getCitiesOfState('IN', selected.value).map(c => ({
        value: c.name, label: c.name, lat: c.latitude, lng: c.longitude
      }));
      setAvailableCities(cityList);
    } else {
      setAvailableCities([]);
    }
  };

  const handleCityChange = (selected: any) => {
    setSelectedCity(selected);
    if (selected) {
      setForm({ 
        ...form, 
        name: selected.value, 
        latitude: selected.lat || '', 
        longitude: selected.lng || '' 
      });
    } else {
      setForm({ ...form, name: '', latitude: '', longitude: '' });
    }
  };

  const handlePincodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && pincodeInput.trim()) {
      e.preventDefault();
      const pin = pincodeInput.trim().replace(',', '');
      if (pin && !form.pincodes.includes(pin)) {
        setForm({ ...form, pincodes: [...form.pincodes, pin] });
      }
      setPincodeInput('');
    }
    if (e.key === 'Backspace' && !pincodeInput && form.pincodes.length > 0) {
      setForm({ ...form, pincodes: form.pincodes.slice(0, -1) });
    }
  };

  const removePincode = (pin: string) => {
    setForm({ ...form, pincodes: form.pincodes.filter(p => p !== pin) });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.state) {
      toast('error', 'Please select a state and city');
      return;
    }
    
    try {
      const payload = {
        name: form.name, state: form.state, country: form.country,
        baseFare: Number(form.baseFare), perKmRate: Number(form.perKmRate),
        perMinuteRate: Number(form.perMinuteRate), minFare: Number(form.minFare),
        isSurgeActive: form.isSurgeActive, surgeMultiplier: Number(form.surgeMultiplier),
        latitude: Number(form.latitude), longitude: Number(form.longitude), 
        serviceRadius: Number(form.serviceRadius), pincodes: form.pincodes,
      };

      if (editingId) {
        await apiClient(`/admin/cities/${editingId}`, { method: 'PUT', data: payload });
        toast('success', 'City updated successfully');
      } else {
        await apiClient('/admin/cities', { data: payload });
        toast('success', 'City added successfully');
      }
      setShowModal(false);
      fetchCities();
    } catch (err: any) {
      toast('error', editingId ? 'Failed to update city' : 'Failed to add city', err.message);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      await apiClient(`/admin/cities/${id}/toggle`, { method: 'PUT' });
      fetchCities();
      toast('success', 'City status updated');
    } catch (err: any) {
      toast('error', 'Failed to toggle status', err.message);
    }
  };

  const deleteCity = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    try {
      await apiClient(`/admin/cities/${id}`, { method: 'DELETE' });
      fetchCities();
      toast('success', `City "${name}" deleted`);
    } catch (err: any) {
      toast('error', 'Failed to delete city', err.message);
    }
  };

  // Custom styles for react-select to match Woosh theme
  const customStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderColor: state.isFocused ? '#E91E63' : '#E2E8F0',
      boxShadow: state.isFocused ? '0 0 0 1px #E91E63' : 'none',
      '&:hover': { borderColor: '#E91E63' },
      borderRadius: '0.5rem',
      minHeight: '38px',
      fontSize: '0.875rem'
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? '#E91E63' : state.isFocused ? '#FDF2F8' : 'white',
      color: state.isSelected ? 'white' : '#1E293B',
      fontSize: '0.875rem',
      cursor: 'pointer'
    })
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-woosh-dark">Cities & Service Areas</h1>
          <p className="text-sm text-woosh-muted mt-0.5">Manage operational cities, pricing, and boundaries.</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus size={16} /> Add City
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : cities.length === 0 ? (
        <Card>
          <EmptyState
            icon={<MapPin size={24} />}
            title="No cities configured"
            description="Add your first operational city to configure pricing."
            actionLabel="Add City"
            onAction={openAddModal}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cities.map((city) => (
            <Card key={city._id} className="group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-woosh-primary-light flex items-center justify-center">
                      <MapPin size={18} className="text-woosh-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-woosh-dark text-sm">{city.name}</h3>
                      <p className="text-xs text-woosh-muted">{city.state}, {city.country}</p>
                    </div>
                  </div>
                  <Badge variant={city.isActive ? 'success' : 'error'} dot>
                    {city.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-woosh-surface rounded-md px-2 py-1.5 text-center">
                    <p className="text-[10px] text-woosh-muted uppercase">Base</p>
                    <p className="text-sm font-semibold text-woosh-dark">₹{city.baseFare}</p>
                  </div>
                  <div className="bg-woosh-surface rounded-md px-2 py-1.5 text-center">
                    <p className="text-[10px] text-woosh-muted uppercase">/km</p>
                    <p className="text-sm font-semibold text-woosh-dark">₹{city.perKmRate}</p>
                  </div>
                  <div className="bg-woosh-surface rounded-md px-2 py-1.5 text-center flex flex-col justify-center items-center">
                    <p className="text-[10px] text-woosh-muted uppercase">Surge</p>
                    {city.isSurgeActive ? (
                      <Badge variant="warning" className="mt-0.5 text-[10px] px-1 py-0">{city.surgeMultiplier}x</Badge>
                    ) : (
                      <p className="text-xs font-semibold text-woosh-muted">Off</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-woosh-muted mb-3">
                  {city.latitude && city.longitude && city.latitude !== 0 && (
                    <span className="flex items-center gap-1">
                      <Navigation size={10} /> {city.latitude?.toFixed(2)}, {city.longitude?.toFixed(2)}
                    </span>
                  )}
                  {city.serviceRadius > 0 && (
                    <span className="flex items-center gap-1">📍 {city.serviceRadius}km radius</span>
                  )}
                </div>

                {city.pincodes?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {city.pincodes.slice(0, 5).map((pin: string) => (
                      <span key={pin} className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5">
                        <Hash size={8} />{pin}
                      </span>
                    ))}
                    {city.pincodes.length > 5 && (
                      <span className="text-[10px] text-woosh-muted">+{city.pincodes.length - 5} more</span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1.5 pt-2 border-t border-woosh-divider">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(city)} className="flex-1 text-woosh-muted hover:text-woosh-primary">
                    <Edit2 size={13} /> Edit Pricing & Area
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleStatus(city._id)} className="flex-1 text-woosh-muted">
                    {city.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteCity(city._id, city.name)} className="text-woosh-muted hover:text-red-600 hover:bg-red-50">
                    <Trash2 size={13} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit City & Pricing' : 'Add New City'}
        maxWidth="xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>{editingId ? 'Update' : 'Save City'}</Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-6">
          {/* Smart Location Section */}
          <div className="bg-woosh-surface/50 p-4 border border-woosh-divider rounded-lg space-y-4">
            <h4 className="text-sm font-semibold text-woosh-dark">1. Smart Location Search</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-woosh-dark mb-1.5">State (India)</label>
                <Select
                  options={states}
                  value={selectedState}
                  onChange={handleStateChange}
                  placeholder="Search state..."
                  styles={customStyles}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-woosh-dark mb-1.5">City</label>
                <Select
                  options={availableCities}
                  value={selectedCity}
                  onChange={handleCityChange}
                  placeholder={selectedState ? "Search city..." : "Select a state first"}
                  isDisabled={!selectedState}
                  styles={customStyles}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Input label="Latitude (Auto-filled)" type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} required />
              <Input label="Longitude (Auto-filled)" type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} required />
              <Input label="Service Radius (km)" type="number" value={form.serviceRadius} onChange={e => setForm({ ...form, serviceRadius: e.target.value })} hint="Operational area size" required />
            </div>
          </div>

          {/* Pricing Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-woosh-dark">2. Pricing Configurations</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Base Fare (₹)" type="number" value={form.baseFare} onChange={e => setForm({ ...form, baseFare: e.target.value })} hint="Initial booking charge" required />
              <Input label="Per Km Rate (₹)" type="number" value={form.perKmRate} onChange={e => setForm({ ...form, perKmRate: e.target.value })} hint="Charge per kilometer" required />
              <Input label="Per Minute Rate (₹)" type="number" value={form.perMinuteRate} onChange={e => setForm({ ...form, perMinuteRate: e.target.value })} hint="Wait/travel time charge" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-woosh-divider pt-4">
              <Input label="Minimum Fare (₹)" type="number" value={form.minFare} onChange={e => setForm({ ...form, minFare: e.target.value })} hint="Lowest possible ride cost" required />
              <div>
                <label className="block text-xs font-semibold text-woosh-dark mb-1.5 flex justify-between">
                  <span>Enable Peak Pricing (Surge)</span>
                  <input type="checkbox" checked={form.isSurgeActive} onChange={e => setForm({ ...form, isSurgeActive: e.target.checked })} className="rounded border-woosh-border text-woosh-primary" />
                </label>
                <Input type="number" step="0.1" value={form.surgeMultiplier} onChange={e => setForm({ ...form, surgeMultiplier: e.target.value })} disabled={!form.isSurgeActive} hint="Multiplier (e.g. 1.5x during high demand)" />
              </div>
            </div>
          </div>

          {/* Pincodes */}
          <div>
            <h4 className="text-sm font-semibold text-woosh-dark mb-3">3. Serviceable Pincodes (Optional)</h4>
            <div className="border border-woosh-border rounded-lg p-3 bg-white min-h-[60px]">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.pincodes.map((pin) => (
                  <span key={pin} className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-2 py-1">
                    {pin}
                    <button type="button" onClick={() => removePincode(pin)} className="hover:text-red-500 transition-colors">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value)}
                onKeyDown={handlePincodeKeyDown}
                placeholder="Type pincode and press Enter..."
                className="w-full outline-none text-sm text-woosh-dark placeholder:text-woosh-placeholder bg-transparent"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

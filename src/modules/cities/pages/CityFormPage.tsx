import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../../../common/utils/apiClient';
import { Input } from '../../../common/components/Input';
import { Button } from '../../../common/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../common/components/Card';
import { useToast } from '../../../common/components/Toast';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';
import Select from 'react-select';
import { State, City as CountryStateCity } from 'country-state-city';

interface AreaDetails {
  name: string;
  latitude: number | string;
  longitude: number | string;
  serviceRadius: number | string;
  isActive: boolean;
}

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
  pincodes: string[];
  areas: AreaDetails[];
}

const defaultForm: CityForm = {
  name: '', state: '', country: 'India', baseFare: '', perKmRate: '',
  perMinuteRate: '', minFare: '50', isSurgeActive: false, surgeMultiplier: '1.5',
  pincodes: [], areas: []
};

export function CityFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { toast } = useToast();
  
  const [form, setForm] = useState<CityForm>(defaultForm);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);


  const states = useMemo(() => State.getStatesOfCountry('IN').map(s => ({ value: s.isoCode, label: s.name })), []);
  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState<any>(null);

  const fetchCity = React.useCallback(async (cityId: string) => {
    try {
      setIsLoading(true);
      const data = await apiClient(`/admin/cities/${cityId}`);
      const city = data.data || data;
      setForm({
        name: city.name, state: city.state, country: city.country || 'India',
        baseFare: city.baseFare?.toString() || '', perKmRate: city.perKmRate?.toString() || '',
        perMinuteRate: city.perMinuteRate?.toString() || '', minFare: city.minFare?.toString() || '50',
        isSurgeActive: city.isSurgeActive || false, surgeMultiplier: city.surgeMultiplier?.toString() || '1.5',
        pincodes: city.pincodes || [],
        areas: city.areas?.map((a: any) => typeof a === 'string' ? { name: a, latitude: '', longitude: '', serviceRadius: '5', isActive: true } : a) || []
      });
      
      const sOption = states.find(s => s.label === city.state) || { value: '', label: city.state };
      setSelectedState(sOption);
      if (sOption.value) {
        const cityList = CountryStateCity.getCitiesOfState('IN', sOption.value).map(c => ({
          value: c.name, label: c.name, lat: c.latitude, lng: c.longitude
        }));
        setAvailableCities(cityList);
        setSelectedCity({ value: city.name, label: city.name });
      }
    } catch (err: any) {
      toast('error', 'Failed to load city details', err.message);
      navigate('/cities');
    } finally {
      setIsLoading(false);
    }
  }, [states, navigate, toast]);

  useEffect(() => {
    if (isEdit && id) {
      fetchCity(id);
    }
  }, [id, isEdit, fetchCity]);

  const handleStateChange = (selected: any) => {
    setSelectedState(selected);
    setSelectedCity(null);
    setForm({ ...form, state: selected ? selected.label : '', name: '' });
    
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
      setForm(prev => ({ 
        ...prev, 
        name: selected.value
      }));
    } else {
      setForm(prev => ({ ...prev, name: '' }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.state) {
      toast('error', 'Please select a state and city');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        ...form,
        baseFare: Number(form.baseFare), perKmRate: Number(form.perKmRate),
        perMinuteRate: Number(form.perMinuteRate), minFare: Number(form.minFare),
        surgeMultiplier: Number(form.surgeMultiplier),
        areas: form.areas.map(a => ({
          name: a.name, latitude: Number(a.latitude), longitude: Number(a.longitude),
          serviceRadius: Number(a.serviceRadius), isActive: a.isActive
        }))
      };

      if (isEdit) {
        await apiClient(`/admin/cities/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast('success', 'City updated successfully');
      } else {
        await apiClient('/admin/cities', { method: 'POST', body: JSON.stringify(payload) });
        toast('success', 'City added successfully');
      }
      navigate('/cities');
    } catch (err: any) {
      toast('error', err.message || 'Failed to save city');
    } finally {
      setIsSaving(false);
    }
  };
  const autoFetchCoordinates = async (index: number) => {
    const area = form.areas[index];
    if (!area.name || !form.name) {
      toast('error', 'Please enter area name and select a city first');
      return;
    }
    
    try {
      const query = `${area.name}, ${form.name}, India`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        updateArea(index, 'latitude', data[0].lat);
        updateArea(index, 'longitude', data[0].lon);
        toast('success', `Coordinates found for ${area.name}`);
      } else {
        toast('error', `Could not find coordinates for ${area.name}. Please enter manually.`);
      }
    } catch (err: any) {
      toast('error', err.message || 'Failed to fetch coordinates');
    }
  };

  const addEmptyArea = () => {
    setForm(prev => ({
      ...prev,
      areas: [...prev.areas, { name: '', latitude: '', longitude: '', serviceRadius: '5', isActive: true }]
    }));
  };

  const updateArea = (index: number, field: keyof AreaDetails, value: any) => {
    setForm(prev => {
      const newAreas = [...prev.areas];
      newAreas[index] = { ...newAreas[index], [field]: value };
      return { ...prev, areas: newAreas };
    });
  };

  const removeArea = (index: number) => {
    setForm(prev => {
      const newAreas = [...prev.areas];
      newAreas.splice(index, 1);
      return { ...prev, areas: newAreas };
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-woosh-muted">Loading city details...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/cities')} className="p-2">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-woosh-dark">{isEdit ? 'Edit City' : 'Add New City'}</h1>
          <p className="text-sm text-woosh-muted">Configure pricing, boundaries, and sub-areas.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Basic Info */}
        <Card>
          <CardHeader><CardTitle>1. Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-woosh-dark mb-1.5">State</label>
                <Select
                  options={states}
                  value={selectedState}
                  onChange={handleStateChange}
                  placeholder="Select State"
                  className="react-select-container text-sm"
                  classNamePrefix="react-select"
                  menuPosition="fixed"
                  menuPortalTarget={document.body}
                  styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-woosh-dark mb-1.5">City</label>
                <Select
                  options={availableCities}
                  value={selectedCity}
                  onChange={handleCityChange}
                  placeholder={!selectedState ? 'Select state first' : 'Select City'}
                  className="react-select-container text-sm"
                  classNamePrefix="react-select"
                  isDisabled={!selectedState}
                  menuPosition="fixed"
                  menuPortalTarget={document.body}
                  styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Pricing */}
        <Card>
          <CardHeader><CardTitle>2. Pricing Configurations</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Base Fare (₹)" type="number" value={form.baseFare} onChange={e => setForm({ ...form, baseFare: e.target.value })} required />
              <Input label="Per Km Rate (₹)" type="number" value={form.perKmRate} onChange={e => setForm({ ...form, perKmRate: e.target.value })} required />
              <Input label="Per Minute Rate (₹)" type="number" value={form.perMinuteRate} onChange={e => setForm({ ...form, perMinuteRate: e.target.value })} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-woosh-divider pt-4">
              <Input label="Minimum Fare (₹)" type="number" value={form.minFare} onChange={e => setForm({ ...form, minFare: e.target.value })} required />
              <div>
                <label className="block text-xs font-semibold text-woosh-dark mb-1.5 flex justify-between">
                  <span>Enable Peak Pricing (Surge)</span>
                  <input type="checkbox" checked={form.isSurgeActive} onChange={e => setForm({ ...form, isSurgeActive: e.target.checked })} className="rounded border-woosh-border text-woosh-primary" />
                </label>
                <Input type="number" step="0.1" value={form.surgeMultiplier} onChange={e => setForm({ ...form, surgeMultiplier: e.target.value })} disabled={!form.isSurgeActive} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Detailed Areas */}
        <Card>
          <CardHeader><CardTitle>3. Serviceable Areas (Zones)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-woosh-muted mb-4">Define specific operating areas within the city along with their coordinates and service radius.</p>
            
            <div className="space-y-3">
              {form.areas.map((area, idx) => (
                <div key={idx} className="p-4 border border-woosh-border/50 rounded-xl bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full">
                    <div className="lg:col-span-2">
                      <div className="flex justify-between items-end mb-1.5">
                        <label className="block text-xs font-semibold text-woosh-dark">Area Name</label>
                        <button type="button" onClick={() => autoFetchCoordinates(idx)} className="text-[10px] text-woosh-primary font-medium hover:underline flex items-center gap-1">
                          📍 Auto-fetch Lat/Lng
                        </button>
                      </div>
                      <input 
                        type="text" 
                        value={area.name} 
                        onChange={e => updateArea(idx, 'name', e.target.value)} 
                        placeholder="e.g. MP Nagar" 
                        required 
                        className="w-full h-11 px-4 rounded-xl border border-woosh-border focus:border-woosh-primary focus:ring-1 focus:ring-woosh-primary outline-none text-sm transition-all bg-white text-woosh-dark placeholder:text-woosh-placeholder"
                      />
                    </div>
                    <div>
                      <Input label="Latitude" type="number" step="any" value={area.latitude} onChange={e => updateArea(idx, 'latitude', e.target.value)} required />
                    </div>
                    <div>
                      <Input label="Longitude" type="number" step="any" value={area.longitude} onChange={e => updateArea(idx, 'longitude', e.target.value)} required />
                    </div>
                    <div>
                      <Input label="Radius (km)" type="number" step="any" value={area.serviceRadius} onChange={e => updateArea(idx, 'serviceRadius', e.target.value)} required />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                      <input type="checkbox" checked={area.isActive} onChange={e => updateArea(idx, 'isActive', e.target.checked)} className="rounded text-woosh-primary" />
                      Active
                    </label>
                    <button type="button" onClick={() => removeArea(idx)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" onClick={addEmptyArea} className="w-full border-dashed">
              <Plus size={16} className="mr-2" /> Add Area Zone
            </Button>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 sticky bottom-4 p-4 bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-woosh-border/30">
          <Button type="button" variant="ghost" onClick={() => navigate('/cities')} disabled={isSaving}>Cancel</Button>
          <Button type="submit" isLoading={isSaving}>{isEdit ? 'Update City Details' : 'Create City'}</Button>
        </div>
      </form>
    </div>
  );
}

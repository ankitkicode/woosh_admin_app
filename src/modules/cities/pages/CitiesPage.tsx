import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../common/utils/apiClient';
import { Button } from '../../../common/components/Button';
import { Badge } from '../../../common/components/Badge';
import { Card, CardContent } from '../../../common/components/Card';
import { EmptyState } from '../../../common/components/EmptyState';
import { SkeletonCard } from '../../../common/components/Skeleton';
import { useToast } from '../../../common/components/Toast';
import { Plus, MapPin, Trash2, Edit2, Hash } from 'lucide-react';



export function CitiesPage() {
  const [cities, setCities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchCities = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiClient('/admin/cities');
      setCities(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      toast('error', 'Failed to load cities', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchCities(); }, [fetchCities]);

  const openAddModal = () => {
    navigate('/cities/add');
  };

  const openEditModal = (city: any) => {
    navigate(`/cities/${city._id}/edit`);
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
                {city.areas?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {city.areas.slice(0, 5).map((area: any) => {
                      const areaName = typeof area === 'string' ? area : area.name;
                      return (
                        <span key={areaName} className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded px-1.5 py-0.5">
                          {areaName}
                        </span>
                      );
                    })}
                    {city.areas.length > 5 && (
                      <span className="text-[10px] text-woosh-muted">+{city.areas.length - 5} more</span>
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
    </div>
  );
}

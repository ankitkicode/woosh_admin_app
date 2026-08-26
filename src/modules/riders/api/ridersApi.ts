import { apiClient } from '../../../common/utils/apiClient';

export interface RiderListResponse {
  riders: any[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RiderDetailsResponse {
  profile: any;
  recentTransactions: any[];
  recentRides: any[];
}

export const fetchAllRiders = async (page = 1, limit = 15, status?: string, search?: string): Promise<RiderListResponse> => {
  let url = `/admin/riders?page=${page}&limit=${limit}`;
  if (status && status !== 'all') url += `&status=${status}`;
  if (search) url += `&search=${search}`;
  return apiClient<RiderListResponse>(url);
};

export const fetchRiderById = async (id: string): Promise<RiderDetailsResponse> => {
  return apiClient<RiderDetailsResponse>(`/admin/riders/${id}`);
};

export const approveRider = async (id: string): Promise<any> => {
  return apiClient(`/admin/riders/${id}/approve`, { method: 'PUT' });
};

export const rejectRider = async (id: string, reason: string): Promise<any> => {
  return apiClient(`/admin/riders/${id}/reject`, { method: 'PUT', data: { reason } });
};

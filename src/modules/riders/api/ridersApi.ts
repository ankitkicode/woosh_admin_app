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

export const reviewRiderDocument = async (id: string, docType: string, status: 'approved' | 'rejected', rejectionReason?: string): Promise<any> => {
  return apiClient(`/admin/riders/${id}/documents/${docType}/status`, { 
    method: 'PUT', 
    data: { status, reason: rejectionReason, rejectionReason } 
  });
};

export const deleteRider = async (id: string): Promise<void> => {
  await apiClient(`/admin/riders/${id}`, { method: 'DELETE' });
};

export const toggleRiderOnlineStatus = async (id: string, isOnline?: boolean): Promise<any> => {
  return apiClient(`/admin/riders/${id}/status`, {
    method: 'PUT',
    data: isOnline !== undefined ? { isOnline } : {},
  });
};

export interface WalletTransaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  referenceId?: string;
  balanceAfter: number;
  createdAt: string;
}

export interface WalletHistoryResponse {
  walletBalance: number;
  totalEarnings: number;
  transactions: WalletTransaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const fetchRiderWalletHistory = async (id: string, page = 1, limit = 15): Promise<WalletHistoryResponse> => {
  const data = await apiClient(`/admin/riders/${id}/wallet?page=${page}&limit=${limit}`);
  return data;
};

export const updateRiderProfile = async (id: string, data: any): Promise<any> => {
  return apiClient(`/admin/riders/${id}/profile`, { method: 'PUT', data });
};

export const uploadRiderDocument = async (id: string, docType: string, file: File, status = 'APPROVED'): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('status', status);
  return apiClient(`/admin/riders/${id}/documents/${docType}`, {
    method: 'POST',
    data: formData,
  });
};

export const uploadRiderAvatar = async (id: string, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('image', file);
  return apiClient(`/admin/riders/${id}/profile-image`, {
    method: 'POST',
    data: formData,
  });
};

import { apiClient } from '../../../common/utils/apiClient';

export interface PassengerDetailsResponse {
  user: any;
  profile?: any;
  passengerProfile?: any;
  childProfiles: any[];
  recentRides: any[];
  transactions: any[];
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  totalSpent: number;
  walletBalance: number;
  rating: number;
}

export const fetchPassengerById = async (id: string): Promise<PassengerDetailsResponse> => {
  const res = await apiClient<any>(`/admin/passengers/${id}`);
  return res?.data || res;
};

export const deletePassenger = async (id: string): Promise<void> => {
  await apiClient(`/admin/passengers/${id}`, { method: 'DELETE' });
};

export const toggleBanPassenger = async (userId: string, action: 'ban' | 'unban'): Promise<any> => {
  return apiClient(`/admin/users/${userId}/${action}`, { method: 'PUT' });
};

export const sendPassengerPush = async (userId: string, title: string, body: string, type = 'GENERAL'): Promise<any> => {
  return apiClient('/admin/notifications/send-user', {
    method: 'POST',
    data: { userId, title, body, type },
  });
};

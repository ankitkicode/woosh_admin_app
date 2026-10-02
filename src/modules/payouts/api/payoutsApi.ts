import { apiClient } from '../../../common/utils/apiClient';

export interface PayoutRequest {
  _id: string;
  rider: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
  };
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: string;
  processedAt?: string;
  processedBy?: {
    _id: string;
    name: string;
  };
  remarks?: string;
  transactionRef?: string;
  bankAccount?: {
    _id: string;
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
}

export interface PayoutsResponse {
  payouts: PayoutRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const fetchPayouts = async (page = 1, limit = 15): Promise<PayoutsResponse> => {
  return apiClient(`/admin/payouts?page=${page}&limit=${limit}`);
};

export const updatePayoutStatus = async (
  id: string,
  data: { status: 'approved' | 'rejected' | 'completed'; remarks?: string; transactionRef?: string }
): Promise<any> => {
  return apiClient(`/admin/payouts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const bulkUpdatePayouts = async (
  data: { payoutIds: string[]; status: 'approved' | 'rejected' | 'completed'; remarks?: string; transactionRef?: string }
): Promise<any> => {
  return apiClient(`/admin/payouts/bulk`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

import { apiClient } from '../../../common/utils/apiClient';

export interface PayoutRider {
  _id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
}

export interface BankAccountDetails {
  _id: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  isPrimary?: boolean;
}

export interface PayoutRequest {
  _id: string;
  rider: PayoutRider;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: string;
  processedAt?: string;
  processedBy?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
  remarks?: string;
  transactionRef?: string;
  bankAccount?: BankAccountDetails;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutCounts {
  total: number;
  totalAmount: number;
  pending: number;
  pendingAmount: number;
  completed: number;
  completedAmount: number;
  rejected: number;
  rejectedAmount: number;
  approved: number;
  approvedAmount: number;
}

export interface PayoutsResponse {
  payouts: PayoutRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts?: PayoutCounts;
}

export const fetchPayouts = async (
  page = 1,
  limit = 15,
  status = 'all',
  search = ''
): Promise<PayoutsResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (status && status !== 'all') params.append('status', status);
  if (search.trim()) params.append('search', search.trim());

  const res = await apiClient(`/admin/payouts?${params.toString()}`);
  return res?.data || res || { payouts: [], total: 0, page: 1, limit: 15, totalPages: 1 };
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

import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export interface BillTypeInfo {
  id: string;
  label: string;
  icon: string;
  color: string;
  providerCount: number;
}

export interface BillProviderInfo {
  _id: string;
  name: string;
  code: string;
  type: string;
  logo: string;
  region?: string;
  requiredFields: Array<{
    fieldName: string;
    label: string;
    placeholder: string;
    type: 'text' | 'number';
  }>;
  cashbackPercent: number;
}

export interface FetchedBillInfo {
  provider: {
    _id: string;
    name: string;
    code: string;
    logo: string;
    type: string;
  };
  customerNumber: string;
  amount: number;
  dueDate: string;
  cashbackPercent: number;
  cashbackAmount: number;
}

export interface BillPaymentRecord {
  _id: string;
  userId: string;
  provider: {
    _id: string;
    name: string;
    code: string;
    logo: string;
    type: string;
  };
  billType: string;
  customerNumber: string;
  amount: number;
  cashbackAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transactionRef?: string;
  paidAt?: string;
  createdAt: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export async function getBillTypes(): Promise<ApiResponse<BillTypeInfo[]>> {
  return apiClient.get<BillTypeInfo[]>('/bill-payments/types');
}

export async function getProviders(
  type: string,
  page = 1,
  limit = 20
): Promise<ApiResponse<{ providers: BillProviderInfo[]; pagination: PaginationInfo }>> {
  return apiClient.get<{ providers: BillProviderInfo[]; pagination: PaginationInfo }>(
    `/bill-payments/providers?type=${type}&page=${page}&limit=${limit}`
  );
}

export async function fetchBill(
  providerId: string,
  customerNumber: string
): Promise<ApiResponse<FetchedBillInfo>> {
  return apiClient.post<FetchedBillInfo>('/bill-payments/fetch-bill', {
    providerId,
    customerNumber,
  });
}

export async function payBill(
  providerId: string,
  customerNumber: string,
  amount: number
): Promise<ApiResponse<BillPaymentRecord>> {
  return apiClient.post<BillPaymentRecord>('/bill-payments/pay', {
    providerId,
    customerNumber,
    amount,
  });
}

export async function getPaymentHistory(
  page = 1,
  limit = 10,
  billType?: string
): Promise<ApiResponse<{ payments: BillPaymentRecord[]; pagination: PaginationInfo }>> {
  let url = `/bill-payments/history?page=${page}&limit=${limit}`;
  if (billType) url += `&billType=${billType}`;
  return apiClient.get<{ payments: BillPaymentRecord[]; pagination: PaginationInfo }>(url);
}

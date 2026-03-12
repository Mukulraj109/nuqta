// Store Promo Coin API Service
// Handles all API calls related to store-specific promotional coins

import apiClient, { ApiResponse } from './apiClient';

export interface StorePromoCoinTransaction {
  type: 'earned' | 'used' | 'expired' | 'refunded';
  amount: number;
  orderId?: string;
  description: string;
  date: string;
}

export interface StoreInfo {
  storeId: string;
  storeName: string;
  storeLogo?: string;
}

export interface StorePromoCoinDetails {
  user: string;
  store: StoreInfo | any;
  amount: number;
  earned: number;
  used: number;
  pending: number;
  transactions: StorePromoCoinTransaction[];
  lastEarnedAt?: string;
  lastUsedAt?: string;
  expiryDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _id: string;
}

export interface StorePromoCoinSummary {
  totalAvailable: number;
  totalEarned: number;
  totalUsed: number;
  storeCount: number;
}

export interface GetUserStoreCoinsResponse {
  storeCoins: StorePromoCoinDetails[];
  summary: StorePromoCoinSummary;
}

export interface GetStoreCoinsResponse {
  availableCoins: number;
  details: StorePromoCoinDetails | null;
}

export interface TransactionWithStore extends StorePromoCoinTransaction {
  store: StoreInfo;
}

export interface GetTransactionsResponse {
  transactions: TransactionWithStore[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface UseCoinsResponse {
  remainingCoins: number;
  storeId: string;
  amountUsed: number;
}

class StorePromoCoinApiService {
  /**
   * Get all store promo coins for the authenticated user
   */
  async getUserStorePromoCoins(): Promise<ApiResponse<GetUserStoreCoinsResponse>> {
    try {
      const response = await apiClient.get<GetUserStoreCoinsResponse>(
        '/store-promo-coins'
      );
      return response;
      
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get promo coins for a specific store
   * @param storeId The ID of the store
   */
  async getStorePromoCoins(storeId: string): Promise<ApiResponse<GetStoreCoinsResponse>> {
    try {
      const response = await apiClient.get<GetStoreCoinsResponse>(
        `/store-promo-coins/store/${storeId}`
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get transaction history for all store promo coins
   * @param options Query options
   */
  async getTransactions(options?: {
    storeId?: string;
    type?: 'earned' | 'used' | 'expired' | 'refunded';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<GetTransactionsResponse>> {
    try {
      const response = await apiClient.get<GetTransactionsResponse>(
        '/store-promo-coins/transactions',
        options
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Use promo coins (internal use, called during checkout)
   * @param storeId The ID of the store
   * @param amount Amount of coins to use
   * @param orderId The order ID
   */
  async useCoins(
    storeId: string,
    amount: number,
    orderId: string
  ): Promise<ApiResponse<UseCoinsResponse>> {
    try {
      const response = await apiClient.post<UseCoinsResponse>(
        '/store-promo-coins/use',
        {
          storeId,
          amount,
          orderId
        }
      );
      return response;
    } catch (error: any) {
      throw error;
    }
  }
}

// Export singleton instance
export const storePromoCoinApi = new StorePromoCoinApiService();


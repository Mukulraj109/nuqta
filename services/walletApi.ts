import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// WALLET API SERVICE
// ============================================================================

/**
 * Coin Balance from Backend (new schema)
 */
export interface BackendCoinBalance {
  type: 'rez' | 'promo' | 'branded';
  amount: number;
  isActive: boolean;
  color?: string;
  earnedDate?: string;
  lastUsed?: string;
  expiryDate?: string;
  promoDetails?: {
    maxRedemptionPercentage: number;
    expiryDate: string;
  };
}

/**
 * Branded Coin from Backend
 */
export interface BackendBrandedCoin {
  merchantId: string;
  merchantName: string;
  merchantLogo?: string;
  merchantColor?: string;
  amount: number;
  earnedDate?: string;
  lastUsed?: string;
}

/**
 * Savings Insights from Backend
 */
export interface BackendSavingsInsights {
  totalSaved: number;
  thisMonth: number;
  avgPerVisit: number;
  lastCalculated?: string;
}

/**
 * Wallet Balance Response
 */
export interface CategoryBalance {
  available: number;
  earned: number;
  spent: number;
}

export interface WalletBalanceResponse {
  balance: {
    total: number;
    available: number;
    pending: number;
    cashback: number;
  };
  totalValue: number;
  breakdown: {
    rezCoins: { amount: number; color: string; expiryDate?: string };
    cashbackBalance: number;
    pendingRewards: number;
  };
  coins: BackendCoinBalance[];
  brandedCoins: BackendBrandedCoin[];
  brandedCoinsTotal: number;
  promoCoins: {
    amount: number;
    color: string;
    isActive?: boolean;
    expiryCountdown?: string;
    maxRedemptionPercentage?: number;
    earnedDate?: string;
    lastUsed?: string;
    expiryDate?: string;
    promoDetails?: {
      maxRedemptionPercentage: number;
      expiryDate: string;
    };
  };
  coinUsageOrder: string[];
  categoryBalances?: Record<string, CategoryBalance>;
  savingsInsights: BackendSavingsInsights;
  currency: string;
  statistics: {
    totalEarned: number;
    totalSpent: number;
    totalCashback: number;
    totalRefunds: number;
    totalTopups: number;
    totalWithdrawals: number;
  };
  limits: {
    maxBalance: number;
    dailySpendLimit: number;
    dailySpentToday: number;
    remainingToday: number;
  };
  status: {
    isActive: boolean;
    isFrozen: boolean;
    frozenReason?: string;
  };
  lastUpdated: string;
}

/**
 * Transaction Response
 */
export interface TransactionResponse {
  id: string;
  transactionId: string;
  user: string;
  type: 'credit' | 'debit';
  category: 'earning' | 'spending' | 'refund' | 'withdrawal' | 'topup' | 'bonus' | 'penalty' | 'cashback';
  amount: number;
  currency: string;
  description: string;
  source: {
    type: string;
    reference: string;
    description?: string;
    metadata?: any;
  };
  status: {
    current: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'reversed';
    history: Array<{
      status: string;
      timestamp: string;
      reason?: string;
    }>;
  };
  balanceBefore: number;
  balanceAfter: number;
  fees?: number;
  tax?: number;
  netAmount?: number;
  processingTime?: number;
  receiptUrl?: string;
  notes?: string;
  isReversible: boolean;
  reversedAt?: string;
  reversalReason?: string;
  reversalTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transaction List Response
 */
export interface TransactionListResponse {
  transactions: TransactionResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Topup Request
 */
export interface TopupRequest {
  amount: number;
  paymentMethod?: string;
  paymentId?: string;
}

/**
 * Topup Response
 */
export interface TopupResponse {
  transaction: TransactionResponse;
  wallet: {
    balance: {
      total: number;
      available: number;
      pending: number;
    };
    currency: string;
  };
}

/**
 * Withdrawal Request
 */
export interface WithdrawalRequest {
  amount: number;
  method: 'bank' | 'upi' | 'paypal';
  accountDetails?: string;
}

/**
 * Withdrawal Response
 */
export interface WithdrawalResponse {
  transaction: TransactionResponse;
  withdrawalId: string;
  netAmount: number;
  fees: number;
  wallet: {
    balance: {
      total: number;
      available: number;
      pending: number;
    };
    currency: string;
  };
  estimatedProcessingTime: string;
}

/**
 * Payment Request
 */
export interface PaymentRequest {
  amount: number;
  orderId?: string;
  storeId?: string;
  storeName?: string;
  description?: string;
  items?: any[];
}

/**
 * Payment Response
 */
export interface PaymentResponse {
  transaction: TransactionResponse;
  wallet: {
    balance: {
      total: number;
      available: number;
      pending: number;
    };
    currency: string;
  };
  paymentStatus: 'success' | 'failed' | 'pending';
}

/**
 * Transaction Summary Response
 */
export interface TransactionSummaryResponse {
  summary: {
    summary: Array<{
      type: 'credit' | 'debit';
      totalAmount: number;
      count: number;
      avgAmount: number;
    }>;
    totalTransactions: number;
  };
  period: string;
  wallet: {
    balance: {
      total: number;
      available: number;
      pending: number;
    };
    statistics: {
      totalEarned: number;
      totalSpent: number;
      totalCashback: number;
      totalRefunds: number;
      totalTopups: number;
      totalWithdrawals: number;
    };
  } | null;
}

/**
 * Wallet Settings Request
 */
export interface WalletSettingsRequest {
  autoTopup?: boolean;
  autoTopupThreshold?: number;
  autoTopupAmount?: number;
  lowBalanceAlert?: boolean;
  lowBalanceThreshold?: number;
}

/**
 * Categories Breakdown Response
 */
export interface CategoriesBreakdownResponse {
  categories: Array<{
    _id: string;
    totalAmount: number;
    count: number;
    avgAmount: number;
  }>;
  totalCategories: number;
}

/**
 * Transaction Filters
 */
export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: 'credit' | 'debit';
  category?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Wallet API Service Class
 */
class WalletService {
  /**
   * Get wallet balance and status
   */
  async getBalance(): Promise<ApiResponse<WalletBalanceResponse>> {

    return apiClient.get('/wallet/balance');
  }

  /**
   * Get transaction history with optional filters
   */
  async getTransactions(
    filters?: TransactionFilters
  ): Promise<ApiResponse<TransactionListResponse>> {
    return apiClient.get<TransactionListResponse>('/wallet/transactions', filters);
  }

  /**
   * Get single transaction by ID
   */
  async getTransactionById(
    transactionId: string
  ): Promise<ApiResponse<{ transaction: TransactionResponse }>> {

    return apiClient.get(`/wallet/transaction/${transactionId}`);
  }

  /**
   * Topup wallet
   */
  async topup(data: TopupRequest): Promise<ApiResponse<TopupResponse>> {

    return apiClient.post('/wallet/topup', data);
  }

  /**
   * Withdraw funds from wallet
   */
  async withdraw(
    data: WithdrawalRequest
  ): Promise<ApiResponse<WithdrawalResponse>> {

    return apiClient.post('/wallet/withdraw', data);
  }

  /**
   * Process payment (deduct from wallet)
   */
  async processPayment(
    data: PaymentRequest
  ): Promise<ApiResponse<PaymentResponse>> {

    return apiClient.post('/wallet/payment', data);
  }

  /**
   * Get transaction summary/statistics
   */
  async getSummary(
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<ApiResponse<TransactionSummaryResponse>> {

    return apiClient.get('/wallet/summary', { period });
  }

  /**
   * Update wallet settings
   */
  async updateSettings(
    settings: WalletSettingsRequest
  ): Promise<ApiResponse<{ settings: any }>> {

    return apiClient.put('/wallet/settings', settings);
  }

  /**
   * Get spending breakdown by categories
   */
  async getCategoriesBreakdown(): Promise<
    ApiResponse<CategoriesBreakdownResponse>
  > {

    return apiClient.get('/wallet/categories');
  }

  /**
   * Credit loyalty points to wallet
   */
  async creditLoyaltyPoints(data: {
    amount: number;
    source?: {
      type?: string;
      reference?: string;
      description?: string;
      metadata?: any;
    };
  }): Promise<ApiResponse<{
    balance: {
      total: number;
      available: number;
      pending: number;
    };
    coins: any[];
    credited: number;
    message: string;
  }>> {

    return apiClient.post('/wallet/credit-loyalty-points', data);
  }

  /**
   * Add test funds to wallet (DEVELOPMENT ONLY)
   * @param amount Amount to add (default: 1000)
   * @param type 'rez' | 'promo' | 'cashback' (default: 'rez')
   */
  async devTopup(amount: number = 1000, type: 'rez' | 'promo' | 'cashback' = 'rez'): Promise<ApiResponse<{
    wallet: {
      balance: {
        total: number;
        available: number;
        pending: number;
        cashback: number;
      };
      currency: string;
    };
    addedAmount: number;
    type: string;
  }>> {
    return apiClient.post('/wallet/dev-topup', { amount, type });
  }

  /**
   * Sync wallet balance from CoinTransaction (fixes discrepancies)
   * Call this to ensure wallet balance matches the actual coin transactions
   */
  async syncBalance(): Promise<ApiResponse<{
    previousBalance: number;
    newBalance: number;
    wallet: {
      balance: {
        total: number;
        available: number;
        pending: number;
        cashback: number;
      };
      coins: any[];
      currency: string;
    };
    synced: boolean;
  }>> {
    return apiClient.post('/wallet/sync-balance', {});
  }

  /**
   * Refund a wallet payment (used when order creation fails after payment)
   * @param data Refund details including transaction ID and reason
   */
  async refundPayment(data: {
    transactionId: string;
    amount: number;
    reason: string;
  }): Promise<ApiResponse<{
    refundId: string;
    refundedAmount: number;
    wallet: {
      balance: {
        total: number;
        available: number;
        pending: number;
      };
    };
    status: 'success' | 'failed' | 'pending';
  }>> {
    return apiClient.post('/wallet/refund', data);
  }
  // ========================================================================
  // TRANSFER APIs
  // ========================================================================

  async initiateTransfer(data: {
    recipientPhone?: string;
    recipientId?: string;
    amount: number;
    coinType: 'nuqta' | 'promo' | 'branded';
    merchantId?: string;
    note?: string;
    idempotencyKey?: string;
  }): Promise<ApiResponse<{
    transferId: string;
    requiresOtp: boolean;
    recipientName: string;
    amount: number;
    coinType: string;
    status?: string;
  }>> {
    return apiClient.post('/wallet/transfer/initiate', data);
  }

  async confirmTransfer(data: {
    transferId: string;
    otp: string;
  }): Promise<ApiResponse<{
    transferId: string;
    status: string;
    amount: number;
    coinType: string;
  }>> {
    return apiClient.post('/wallet/transfer/confirm', data);
  }

  async getTransferHistory(params?: {
    page?: number;
    limit?: number;
    type?: 'sent' | 'received';
  }): Promise<ApiResponse<{
    transfers: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
  }>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.type) query.set('type', params.type);
    return apiClient.get(`/wallet/transfer/history?${query.toString()}`);
  }

  async getRecentRecipients(search?: string): Promise<ApiResponse<{ recipients: any[] }>> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiClient.get(`/wallet/transfer/recipients${query}`);
  }

  // ========================================================================
  // GIFT APIs
  // ========================================================================

  async getGiftConfig(): Promise<ApiResponse<{
    themes: Array<{
      id: string;
      label: string;
      emoji: string;
      colors: string[];
      tags: string[];
    }>;
    denominations: number[];
    limits: {
      min: number;
      max: number;
      dailyMax: number;
      maxPerDay: number;
      otpAbove: number;
    };
    features: {
      scheduledDelivery: boolean;
      messageMaxLength: number;
    };
  }>> {
    return apiClient.get('/wallet/gift/config');
  }

  async validateGiftRecipient(phone: string): Promise<ApiResponse<{
    exists: boolean;
    name?: string;
    isSelf: boolean;
  }>> {
    return apiClient.post('/wallet/gift/validate-recipient', { phone });
  }

  async sendGift(data: {
    recipientPhone?: string;
    recipientId?: string;
    amount: number;
    coinType?: string;
    theme: string;
    message?: string;
    deliveryType?: 'instant' | 'scheduled';
    scheduledAt?: string;
    idempotencyKey?: string;
  }): Promise<ApiResponse<{
    giftId: string;
    status: string;
    recipientName: string;
    amount: number;
    theme: string;
    expiresAt: string;
  }>> {
    return apiClient.post('/wallet/gift/send', data);
  }

  async getReceivedGifts(): Promise<ApiResponse<{ gifts: any[] }>> {
    return apiClient.get('/wallet/gift/received');
  }

  async claimGift(giftId: string): Promise<ApiResponse<{ giftId: string; amount: number; status: string }>> {
    return apiClient.post(`/wallet/gift/${giftId}/claim`, {});
  }

  async getSentGifts(): Promise<ApiResponse<{ gifts: any[] }>> {
    return apiClient.get('/wallet/gift/sent');
  }

  // ========================================================================
  // GIFT CARD APIs
  // ========================================================================

  async getGiftCardCatalog(params?: {
    category?: string;
    search?: string;
  }): Promise<ApiResponse<{ giftCards: any[]; categories: string[] }>> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    return apiClient.get(`/wallet/gift-cards/catalog?${query.toString()}`);
  }

  async purchaseGiftCard(data: {
    giftCardId: string;
    amount: number;
  }): Promise<ApiResponse<{ userGiftCard: any }>> {
    return apiClient.post('/wallet/gift-cards/purchase', data);
  }

  async getMyGiftCards(status?: string): Promise<ApiResponse<{ giftCards: any[] }>> {
    const query = status ? `?status=${status}` : '';
    return apiClient.get(`/wallet/gift-cards/mine${query}`);
  }

  async revealGiftCardCode(giftCardId: string): Promise<ApiResponse<{ code: string; pin?: string }>> {
    return apiClient.get(`/wallet/gift-cards/${giftCardId}/reveal`);
  }

  // ========================================================================
  // EXPIRY & RECHARGE APIs
  // ========================================================================

  async getExpiringCoins(): Promise<ApiResponse<{
    expiringCoins: Record<string, { totalAmount: number; coins: any[]; count: number }>;
    totalExpiring: number;
  }>> {
    return apiClient.get('/wallet/expiring-coins');
  }

  async previewRechargeCashback(amount: number): Promise<ApiResponse<{
    rechargeAmount: number;
    cashbackPercentage: number;
    cashback: number;
    maxCashback: number;
    cappedAt: number | null;
  }>> {
    return apiClient.get(`/wallet/recharge/preview?amount=${amount}`);
  }

  async getCoinRules(): Promise<ApiResponse<{
    coinRules: Record<string, { usageRules: string[]; earningMethods: string[] }>;
    coinExpiryConfig: Record<string, { expiryDays: number; maxUsagePct: number }>;
  }>> {
    return apiClient.get('/wallet/coin-rules');
  }

  async getScheduledDrops(): Promise<ApiResponse<{
    drops: Array<{
      id: string;
      title: string;
      amount: number;
      type: 'daily' | 'weekly' | 'special' | 'cashback';
      scheduledDate: string;
      description: string;
      icon: string;
      source: string;
      claimable: boolean;
      storeLogo?: string;
    }>;
    totalUpcoming: number;
  }>> {
    return apiClient.get('/wallet/scheduled-drops');
  }
}

// Export singleton instance
const walletService = new WalletService();
export default walletService;
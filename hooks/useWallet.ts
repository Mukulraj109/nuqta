import { colors } from '@/constants/theme';
import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  WalletState,
  WalletData,
  WalletError,
  WalletErrorCode,
  CoinBalance
} from '@/types/wallet';
import walletApi from '@/services/walletApi';
import { BRAND } from '@/constants/brand';

function classifyError(error: any): { code: WalletErrorCode; recoverable: boolean } {
  // Check for ApiResponse error shape (from apiClient fetch)
  const status = error?.status || error?.response?.status;
  const message = error?.error || error?.message || '';
  const data = error?.response?.data || error?.data;

  if (status === 403) {
    if (data?.requiresReAuth) return { code: 'REAUTH_REQUIRED', recoverable: true };
    if (data?.frozenReason || message.includes('frozen')) return { code: 'WALLET_FROZEN', recoverable: false };
    return { code: 'UNAUTHORIZED', recoverable: false };
  }
  if (status === 429) return { code: 'VELOCITY_LIMIT', recoverable: true };
  if (status === 503) return { code: 'FEATURE_DISABLED', recoverable: false };
  if (status >= 500) return { code: 'SERVER_ERROR', recoverable: true };
  if (!status && (message.includes('network') || message.includes('fetch') || message.includes('timeout'))) {
    return { code: 'NETWORK_ERROR', recoverable: true };
  }
  return { code: 'SERVER_ERROR', recoverable: true };
}

function createWalletError(
  code: WalletErrorCode,
  message: string,
  details?: string,
  recoverable?: boolean
): WalletError {
  return {
    code,
    message,
    details,
    timestamp: new Date(),
    recoverable: recoverable ?? (code === 'NETWORK_ERROR' || code === 'TIMEOUT' || code === 'VELOCITY_LIMIT'),
  };
}

/**
 * Transform backend wallet response into frontend WalletData.
 * Shared by fetchWallet and refreshWallet to avoid duplication.
 */
function transformWalletResponse(backendData: any, userId: string): WalletData {
  if (!backendData || typeof backendData !== 'object') {
    throw new Error('Invalid wallet data received');
  }
  const backendCoins = Array.isArray(backendData.coins) ? backendData.coins : [];
  const rezCoin = backendCoins.find((c: any) => c.type === 'rez');
  const promoData = backendData.promoCoins;

  const coins: CoinBalance[] = [
    {
      id: 'rez-0',
      type: 'rez',
      name: BRAND.COIN_NAME,
      amount: rezCoin?.amount || 0,
      currency: BRAND.CURRENCY_CODE,
      formattedAmount: `${BRAND.CURRENCY_CODE} ${rezCoin?.amount || 0}`,
      description: `Universal rewards usable anywhere on ${BRAND.APP_NAME}`,
      iconPath: BRAND.COIN_IMAGE,
      backgroundColor: '#FFF9E6',
      color: colors.brand.amberDeep,
      isActive: rezCoin?.isActive !== false,
      earnedDate: rezCoin?.earnedDate ? new Date(rezCoin.earnedDate) : new Date(backendData.lastUpdated),
      lastUsed: rezCoin?.lastUsed ? new Date(rezCoin.lastUsed) : new Date(backendData.lastUpdated),
      expiryDate: rezCoin?.expiryDate ? new Date(rezCoin.expiryDate) : undefined,
    },
    {
      id: 'promo-0',
      type: 'promo',
      name: 'Promo Coins',
      amount: promoData?.amount || 0,
      currency: BRAND.CURRENCY_CODE,
      formattedAmount: `${BRAND.CURRENCY_CODE} ${promoData?.amount || 0}`,
      description: 'Special coins from campaigns & events (max 20% per bill)',
      iconPath: require('@/assets/images/promo-coin.png'),
      backgroundColor: '#FEF9E7',
      color: colors.warningScale[700],
      isActive: promoData?.isActive !== false,
      earnedDate: promoData?.earnedDate ? new Date(promoData.earnedDate) : new Date(backendData.lastUpdated),
      lastUsed: promoData?.lastUsed ? new Date(promoData.lastUsed) : new Date(backendData.lastUpdated),
      expiryDate: promoData?.expiryDate ? new Date(promoData.expiryDate) : undefined,
      promoDetails: promoData?.promoDetails,
    }
  ];

  const cashbackBalance = backendData.balance?.cashback || 0;
  const coinBalance = coins.reduce((sum, coin) => sum + coin.amount, 0) + cashbackBalance;
  const brandedCoinsData = backendData.brandedCoins || [];
  const brandedCoinsTotal = brandedCoinsData.reduce((sum: number, bc: any) => sum + (bc.amount || 0), 0);
  // Always compute total as nuqta + promo + branded to ensure consistency
  // (backend totalValue excludes branded coins, which causes mismatch)
  const calculatedTotalBalance = coinBalance + brandedCoinsTotal;

  return {
    userId: userId || 'unknown',
    totalBalance: calculatedTotalBalance,
    availableBalance: backendData.balance.available,
    cashbackBalance,
    pendingRewards: backendData.balance?.pending || 0,
    currency: BRAND.CURRENCY_CODE,
    formattedTotalBalance: `${BRAND.CURRENCY_CODE} ${calculatedTotalBalance}`,
    coins,
    brandedCoins: brandedCoinsData,
    brandedCoinsTotal,
    savingsInsights: backendData.savingsInsights || { totalSaved: 0, thisMonth: 0, avgPerVisit: 0 },
    recentTransactions: [],
    lastUpdated: new Date(backendData.lastUpdated),
    isActive: backendData.status.isActive,
    isFrozen: backendData.status?.isFrozen || false,
    frozenReason: backendData.status?.frozenReason,
  };
}

interface UseWalletOptions {
  userId?: string;
  autoFetch?: boolean;
  refreshInterval?: number;
}

interface UseWalletReturn {
  walletState: WalletState;
  fetchWallet: () => Promise<void>;
  refreshWallet: (forceRefresh?: boolean) => Promise<void>;
  clearError: () => void;
  resetWallet: () => void;
  retryLastOperation: () => Promise<void>;
}

/**
 * @deprecated Use `useWalletContext()` from `@/contexts/WalletContext` instead.
 * This hook creates per-component wallet state (each consumer makes its own API call).
 * The shared WalletContext provides a single source of truth across all pages.
 *
 * @deprecated No production consumers remain. Use `useWalletContext()` from
 * `@/contexts/WalletContext` instead. This hook will be removed in a future cleanup.
 */
export const useWallet = ({
  userId,
  autoFetch = true,
  refreshInterval
}: UseWalletOptions): UseWalletReturn => {
  const [walletState, setWalletState] = useState<WalletState>({
    data: null,
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastFetched: null,
  });

  const lastOperationRef = useRef<() => Promise<void>>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout>(null);
  const abortControllerRef = useRef<AbortController>(null);
  const pendingRequestRef = useRef<Promise<void> | null>(null);
  const walletStateRef = useRef(walletState); // Ref to track state without triggering effects

  // Cleanup function
  const cleanup = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Fetch wallet data
  const fetchWallet = useCallback(async (): Promise<void> => {
    // Prevent race condition - wait for pending request to complete
    if (pendingRequestRef.current) {
      await pendingRequestRef.current;
    }

    const requestPromise = (async () => {
      try {
        // Cancel any ongoing requests
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

      setWalletState(prev => ({
        ...prev,
        isLoading: true,
        error: null
      }));

      // Call real backend API
      const response = await walletApi.getBalance();

      // Check if request was aborted
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch wallet');
      }

      const walletData = transformWalletResponse(response.data, userId || 'unknown');

      setWalletState({
        data: walletData,
        isLoading: false,
        isRefreshing: false,
        error: null,
        lastFetched: new Date(),
      });

        lastOperationRef.current = fetchWallet;
      } catch (error) {
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        const classified = classifyError(error);
        const walletError = createWalletError(
          classified.code,
          'Failed to load wallet data',
          error instanceof Error ? error.message : 'Unknown error occurred',
          classified.recoverable
        );

        setWalletState(prev => ({
          ...prev,
          isLoading: false,
          isRefreshing: false,
          error: walletError,
        }));

        lastOperationRef.current = fetchWallet;
      } finally {
        pendingRequestRef.current = null;
      }
    })();

    // Store pending request
    pendingRequestRef.current = requestPromise;
    await requestPromise;
  }, [userId]);

  // Refresh wallet data
  const refreshWallet = useCallback(async (forceRefresh = false): Promise<void> => {
    // Prevent race condition - wait for pending request to complete
    if (pendingRequestRef.current) {
      await pendingRequestRef.current;
    }

    const requestPromise = (async () => {
      try {
        // Cancel any ongoing requests
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

      setWalletState(prev => ({
        ...prev,
        isRefreshing: true,
        error: null
      }));

      // Call real backend API
      const response = await walletApi.getBalance();

      // Check if request was aborted
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to refresh wallet');
      }

      const walletData = transformWalletResponse(response.data, userId || 'unknown');

      setWalletState(prev => ({
        ...prev,
        data: walletData,
        isRefreshing: false,
        lastFetched: new Date(),
      }));

        lastOperationRef.current = () => refreshWallet(forceRefresh);
      } catch (error) {
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        const classified = classifyError(error);
        const walletError = createWalletError(
          classified.code,
          'Failed to refresh wallet',
          error instanceof Error ? error.message : 'Unknown error occurred',
          classified.recoverable
        );

        setWalletState(prev => ({
          ...prev,
          isRefreshing: false,
          error: walletError,
        }));

        lastOperationRef.current = () => refreshWallet(forceRefresh);
      } finally {
        pendingRequestRef.current = null;
      }
    })();

    // Store pending request
    pendingRequestRef.current = requestPromise;
    await requestPromise;
  }, [userId]);

  // Clear error
  const clearError = useCallback(() => {
    setWalletState(prev => ({ ...prev, error: null }));
  }, []);

  // Reset wallet state
  const resetWallet = useCallback(() => {
    cleanup();
    setWalletState({
      data: null,
      isLoading: false,
      isRefreshing: false,
      error: null,
      lastFetched: null,
    });
  }, [cleanup]);

  // Retry last operation
  const retryLastOperation = useCallback(async (): Promise<void> => {
    if (lastOperationRef.current) {
      await lastOperationRef.current();
    } else {
      await fetchWallet();
    }
  }, [fetchWallet]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchWallet();
    }
  }, [autoFetch, fetchWallet]);

  // Keep ref in sync with state
  useEffect(() => {
    walletStateRef.current = walletState;
  }, [walletState]);

  // Setup refresh interval — pause when app is backgrounded
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const startInterval = () => {
      if (refreshIntervalRef.current) return; // already running
      refreshIntervalRef.current = setInterval(() => {
        if (!walletStateRef.current.isLoading && !walletStateRef.current.isRefreshing) {
          refreshWallet(false);
        }
      }, refreshInterval) as unknown as NodeJS.Timeout;
    };

    const stopInterval = () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        startInterval();
      } else {
        stopInterval();
      }
    });

    // Only start if app is currently active
    if (AppState.currentState === 'active') {
      startInterval();
    }

    return () => {
      stopInterval();
      subscription.remove();
    };
  }, [refreshInterval, refreshWallet]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    walletState,
    fetchWallet,
    refreshWallet,
    clearError,
    resetWallet,
    retryLastOperation,
  };
};

export default useWallet;
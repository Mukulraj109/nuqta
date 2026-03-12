import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
import { WalletData, CoinBalance } from '@/types/wallet';
import walletApi from '@/services/walletApi';
import { useAuth } from './AuthContext';
import { BRAND } from '@/constants/brand';

// ---------------------------------------------------------------------------
// Transform backend wallet response into frontend WalletData
// (Same logic as hooks/useWallet.ts — kept in sync)
// ---------------------------------------------------------------------------
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
      iconPath: require('@/assets/images/wasil-coin.png'),
      backgroundColor: '#FFF9E6',
      color: '#B45309',
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
      color: '#D97706',
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

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------
interface WalletContextType {
  /** Full transformed wallet data (null until first fetch completes) */
  walletData: WalletData | null;
  /** Rez Coins (rez type) balance — 0 if not yet loaded */
  rezBalance: number;
  /** Total balance across all coin types */
  totalBalance: number;
  /** Available (spendable) balance */
  availableBalance: number;
  /** Branded coins array from backend */
  brandedCoins: any[];
  /** Savings insights */
  savingsInsights: { totalSaved: number; thisMonth: number; avgPerVisit: number };
  /** Whether the initial fetch is in progress */
  isLoading: boolean;
  /** Whether a background refresh is in progress */
  isRefreshing: boolean;
  /** Re-fetch wallet data from API (call after earning/spending coins) */
  refreshWallet: () => Promise<void>;
  /** Raw backend response data (for pages that need fields not in WalletData) */
  rawBackendData: any | null;
}

const WALLET_DEFAULTS: WalletContextType = {
  walletData: null,
  rezBalance: 0,
  totalBalance: 0,
  availableBalance: 0,
  brandedCoins: [],
  savingsInsights: { totalSaved: 0, thisMonth: 0, avgPerVisit: 0 },
  isLoading: false,
  isRefreshing: false,
  refreshWallet: async () => {},
  rawBackendData: null,
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// ── Module-level dedup: survives component remounts caused by DeferredProviders ──
let _walletPending: Promise<void> | null = null;
let _walletLastFetch = 0;
const WALLET_DEDUP_MS = 10_000; // 10 seconds dedup window

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function WalletProvider({ children }: { children: ReactNode }) {
  const { state: authState } = useAuth();

  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [rawBackendData, setRawBackendData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // Fetch wallet from API (module-level dedup prevents duplicate calls on remount)
  const fetchWallet = useCallback(async (isRefresh: boolean = false) => {
    // Coalesce with in-flight request (module-level — survives remounts)
    if (_walletPending) {
      await _walletPending;
      return;
    }

    // Skip if fetched very recently (dedup across DeferredProvider remounts)
    if (!isRefresh && Date.now() - _walletLastFetch < WALLET_DEDUP_MS) {
      return;
    }

    const promise = (async () => {
      try {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const response = await walletApi.getBalance();

        if (abortRef.current.signal.aborted) return;

        if (response.success && response.data) {
          const userId = authState.user?._id || authState.user?.id || 'unknown';
          const transformed = transformWalletResponse(response.data, userId);
          setWalletData(transformed);
          setRawBackendData(response.data);
          _walletLastFetch = Date.now();
        }
      } catch (error) {
        if (abortRef.current?.signal.aborted) return;
        // silently handle
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        _walletPending = null;
      }
    })();

    _walletPending = promise;
    await promise;
  }, [authState.user?._id]);

  // Stable ref for fetchWallet to break the dependency chain:
  // fetchWallet → refreshWallet → context value → all consumers re-render
  const fetchWalletRef = useRef(fetchWallet);
  fetchWalletRef.current = fetchWallet;

  // Public refresh function (always bypasses dedup cache)
  // Uses ref to maintain stable identity — prevents 46 consumer re-renders
  const refreshWallet = useCallback(async () => {
    await fetchWalletRef.current(true);
  }, []); // Empty deps — stable identity

  // Auto-fetch when user authenticates, clear on logout
  // Skip during onboarding to prevent thundering herd of API calls on Android
  useEffect(() => {
    if (authState.isAuthenticated && authState.user && authState.user.isOnboarded) {
      // Module-level dedup handles preventing duplicate fetches across remounts
      fetchWallet(false);
    } else if (!authState.isAuthenticated) {
      // Clear on logout
      setWalletData(null);
      setRawBackendData(null);
      _walletLastFetch = 0;
      if (abortRef.current) abortRef.current.abort();
    }
  }, [authState.isAuthenticated, authState.user]);

  // Retry wallet fetch if first attempt failed (e.g., 401 race on page refresh)
  // Waits 2s then retries once if walletData is still null
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.user?.isOnboarded) return;
    if (walletData) return; // Already loaded
    if (isLoading) return; // Still loading

    const retryTimer = setTimeout(() => {
      if (!walletData && _walletLastFetch === 0) {
        fetchWallet(false);
      }
    }, 2000);

    return () => clearTimeout(retryTimer);
  }, [authState.isAuthenticated, authState.user, walletData, isLoading, fetchWallet]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // All derived values computed INSIDE useMemo to prevent reference instability
  const value = useMemo<WalletContextType>(() => {
    const rezBalance = walletData?.coins?.find(c => c.type === 'rez')?.amount ?? 0;
    const totalBalance = walletData?.totalBalance ?? 0;
    const availableBalance = walletData?.availableBalance ?? 0;
    const brandedCoins = walletData?.brandedCoins ?? [];
    const savingsInsights = walletData?.savingsInsights ?? { totalSaved: 0, thisMonth: 0, avgPerVisit: 0 };

    return {
      walletData,
      rezBalance,
      totalBalance,
      availableBalance,
      brandedCoins,
      savingsInsights,
      isLoading,
      isRefreshing,
      refreshWallet,
      rawBackendData,
    };
  }, [walletData, isLoading, isRefreshing, refreshWallet, rawBackendData]);

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useWalletContext(): WalletContextType {
  const context = useContext(WalletContext);
  if (context === undefined) {
    // Return safe defaults if provider hasn't loaded yet (deferred loading)
    return WALLET_DEFAULTS;
  }
  return context;
}

export { WalletContext };

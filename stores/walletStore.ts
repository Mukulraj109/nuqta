import { create } from 'zustand';
import { WalletData } from '@/types/wallet';

// ---------------------------------------------------------------------------
// State types (mirrors WalletContext)
// ---------------------------------------------------------------------------
interface WalletStoreData {
  walletData: WalletData | null;
  rezBalance: number;
  totalBalance: number;
  availableBalance: number;
  brandedCoins: any[];
  savingsInsights: { totalSaved: number; thisMonth: number; avgPerVisit: number };
  refreshWallet: () => Promise<void>;
  rawBackendData: any | null;
  isLoading: boolean;
  isRefreshing: boolean;
}

interface WalletStoreState extends WalletStoreData {
  _setFromProvider: (data: WalletStoreData) => void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------
const defaults: WalletStoreData = {
  walletData: null,
  rezBalance: 0,
  totalBalance: 0,
  availableBalance: 0,
  brandedCoins: [],
  savingsInsights: { totalSaved: 0, thisMonth: 0, avgPerVisit: 0 },
  refreshWallet: async () => {},
  rawBackendData: null,
  isLoading: false,
  isRefreshing: false,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useWalletStore = create<WalletStoreState>((set) => ({
  ...defaults,

  // Called by WalletProvider on every render to keep store in sync
  _setFromProvider: (data: WalletStoreData) => {
    set(data);
  },
}));

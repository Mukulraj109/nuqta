import {
  WalletData,
  CoinBalance,
  WalletTransaction,
  WalletState,
  WalletError,
  CoinType,
  COIN_TYPES,
  DEFAULT_CURRENCY
} from '@/types/wallet';
import { BRAND } from '@/constants/brand';

// Mock Assets - Update paths as needed for your project structure
const WALLET_ASSETS = {
  rezCoin: BRAND.COIN_IMAGE,
  promoCoin: require('../assets/images/promo-coin.png'),
  coinStack: require('../assets/images/coin-stack.png'),
  cashbackCoin: BRAND.COIN_IMAGE, // Using rez as fallback
  rewardCoin: require('../assets/images/promo-coin.png'), // Using promo as fallback
};

// Helper function to format currency
export const formatCurrency = (amount: number, currency: string = DEFAULT_CURRENCY): string => {
  return `${currency}${amount.toLocaleString('en-IN')}`;
};

// Helper function to format date
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Mock Coin Balances Data
const createMockCoinBalance = (
  id: string,
  type: CoinType,
  amount: number,
  description?: string
): CoinBalance => ({
  id,
  type,
  name: COIN_TYPES[type].name,
  amount,
  currency: DEFAULT_CURRENCY,
  formattedAmount: formatCurrency(amount),
  description: description || `There is no cap or limit on the uses of this coin`,
  iconPath: type === 'rez' ? WALLET_ASSETS.rezCoin : WALLET_ASSETS.promoCoin,
  backgroundColor: COIN_TYPES[type].color,
  isActive: true,
  earnedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
  lastUsed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date in last 7 days
});

export const mockCoinBalances: CoinBalance[] = [
  createMockCoinBalance(
    'rez-001',
    'rez',
    1955,
    'There is no cap or limit on the uses of this coin'
  ),
  createMockCoinBalance(
    'promo-001',
    'promo',
    120,
    'There is no cap or limit on the uses of this coin'
  ),
];

// Mock Transaction Data
const createMockTransaction = (
  id: string,
  type: WalletTransaction['type'],
  coinType: CoinType,
  amount: number,
  description: string,
  daysAgo: number = 0
): WalletTransaction => ({
  id,
  type,
  coinType,
  amount,
  currency: DEFAULT_CURRENCY,
  formattedAmount: formatCurrency(amount),
  description,
  timestamp: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
  status: 'completed',
  merchantName: type === 'spent' ? 'Reliance Trends' : undefined,
  orderId: type === 'spent' ? `ORD${Math.random().toString(36).substr(2, 8)}` : undefined,
  balanceAfter: Math.random() * 2000 + 500, // Random balance after transaction
});

export const mockTransactions: WalletTransaction[] = [
  createMockTransaction(
    'txn-001',
    'earned',
    'rez',
    50,
    'Cashback from purchase at Reliance Trends',
    1
  ),
  createMockTransaction(
    'txn-002',
    'spent',
    'promo',
    25,
    'Used for discount on fashion items',
    2
  ),
  createMockTransaction(
    'txn-003',
    'earned',
    'promo',
    75,
    'Welcome bonus promotion',
    3
  ),
  createMockTransaction(
    'txn-004',
    'earned',
    'rez',
    30,
    'Review reward for product feedback',
    5
  ),
  createMockTransaction(
    'txn-005',
    'spent',
    'rez',
    100,
    'Purchase discount applied',
    7
  ),
];

// Mock Wallet Data
export const mockWalletData: WalletData = {
  userId: 'user-12345',
  totalBalance: mockCoinBalances.reduce((sum, coin) => sum + coin.amount, 0),
  currency: DEFAULT_CURRENCY,
  formattedTotalBalance: formatCurrency(
    mockCoinBalances.reduce((sum, coin) => sum + coin.amount, 0)
  ),
  coins: mockCoinBalances,
  recentTransactions: mockTransactions,
  lastUpdated: new Date(),
  isActive: true,
};

// Mock Wallet State
export const initialWalletState: WalletState = {
  data: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastFetched: null,
};

export const mockWalletStateWithData: WalletState = {
  data: mockWalletData,
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastFetched: new Date(),
};

export const mockWalletStateLoading: WalletState = {
  data: null,
  isLoading: true,
  isRefreshing: false,
  error: null,
  lastFetched: null,
};

export const mockWalletStateError: WalletState = {
  data: null,
  isLoading: false,
  isRefreshing: false,
  error: {
    code: 'NETWORK_ERROR',
    message: 'Failed to load wallet data',
    details: 'Please check your internet connection and try again',
    timestamp: new Date(),
    recoverable: true,
  },
  lastFetched: null,
};

// Mock API Functions (for simulation)
export const mockFetchWallet = async (userId: string): Promise<WalletData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate random failures (10% chance)
  if (Math.random() < 0.1) {
    throw new Error('Network error occurred');
  }
  
  return {
    ...mockWalletData,
    userId,
    lastUpdated: new Date(),
  };
};

export const mockRefreshWallet = async (userId: string, forceRefresh?: boolean): Promise<WalletData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate slight balance changes on refresh
  const updatedCoins = mockCoinBalances.map(coin => ({
    ...coin,
    amount: coin.amount + Math.floor(Math.random() * 10 - 5), // Random change of -5 to +5
    formattedAmount: formatCurrency(coin.amount + Math.floor(Math.random() * 10 - 5)),
  }));
  
  const newTotalBalance = updatedCoins.reduce((sum, coin) => sum + coin.amount, 0);
  
  return {
    ...mockWalletData,
    userId,
    totalBalance: newTotalBalance,
    formattedTotalBalance: formatCurrency(newTotalBalance),
    coins: updatedCoins,
    lastUpdated: new Date(),
  };
};

// Utility Functions
export const getCoinsByType = (coins: CoinBalance[], type: CoinType): CoinBalance[] => {
  return coins.filter(coin => coin.type === type);
};

export const getActiveCoinTypes = (coins: CoinBalance[]): CoinType[] => {
  return [...new Set(coins.filter(coin => coin.isActive && coin.amount > 0).map(coin => coin.type))];
};

export const getTotalBalanceByType = (coins: CoinBalance[], type: CoinType): number => {
  return coins
    .filter(coin => coin.type === type)
    .reduce((sum, coin) => sum + coin.amount, 0);
};

export const getRecentTransactionsByType = (
  transactions: WalletTransaction[], 
  type: CoinType, 
  limit: number = 10
): WalletTransaction[] => {
  return transactions
    .filter(txn => txn.coinType === type)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
};

// Error Creation Helpers
export const createWalletError = (
  code: WalletError['code'],
  message: string,
  details?: string
): WalletError => ({
  code,
  message,
  details,
  timestamp: new Date(),
  recoverable: code !== 'UNAUTHORIZED',
});

// Default Export
export default {
  mockWalletData,
  mockCoinBalances,
  mockTransactions,
  initialWalletState,
  mockWalletStateWithData,
  mockWalletStateLoading,
  mockWalletStateError,
  mockFetchWallet,
  mockRefreshWallet,
  formatCurrency,
  formatDate,
  getCoinsByType,
  getActiveCoinTypes,
  getTotalBalanceByType,
  getRecentTransactionsByType,
  createWalletError,
};
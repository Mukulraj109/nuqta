import { Deal, DealCategory, StoreDealConfig } from '@/types/deals';

// Mock deals data matching the design screenshot and additional variety
export const mockDeals: Deal[] = [
  {
    id: 'deal-001',
    title: 'Get Instant Discount',
    discountType: 'percentage',
    discountValue: 20,
    minimumBill: 5000,
    maxDiscount: 1000,
    isOfflineOnly: true,
    terms: [
      'Not valid above store discount',
      'Single voucher per bill'
    ],
    isActive: true,
    validUntil: new Date('2025-12-31'),
    category: 'instant-discount',
    description: 'Get 20% instant discount on your purchase',
    priority: 1,
    usageLimit: 5,
    usageCount: 0,
    applicableProducts: ['Fashion', 'Electronics', 'Home'],
    badge: {
      text: 'Save 20%',
      backgroundColor: '#E5E7EB',
      textColor: '#374151'
    }
  },
  {
    id: 'deal-002',
    title: 'Get Instant Discount',
    discountType: 'percentage',
    discountValue: 20,
    minimumBill: 5000,
    maxDiscount: 1000,
    isOfflineOnly: true,
    terms: [
      'Not valid above store discount',
      'Single voucher per bill'
    ],
    isActive: true,
    validUntil: new Date('2025-12-31'),
    category: 'instant-discount',
    description: 'Get 20% instant discount on your purchase',
    priority: 2,
    usageLimit: 5,
    usageCount: 0,
    applicableProducts: ['Fashion', 'Electronics', 'Home'],
    badge: {
      text: 'Save 20%',
      backgroundColor: '#E5E7EB',
      textColor: '#374151'
    }
  },
  {
    id: 'deal-003',
    title: 'First Time Buyer Special',
    discountType: 'percentage',
    discountValue: 30,
    minimumBill: 3000,
    maxDiscount: 1500,
    isOfflineOnly: true,
    terms: [
      'Valid for first-time customers only',
      'Cannot be combined with other offers',
      'Valid ID required'
    ],
    isActive: true,
    validUntil: new Date('2025-12-31'),
    category: 'first-time',
    description: 'Special discount for first-time shoppers',
    priority: 3,
    usageLimit: 1,
    usageCount: 0,
    applicableProducts: ['Fashion', 'Personal Care'],
    badge: {
      text: 'Save 30%',
      backgroundColor: '#DBEAFE',
      textColor: '#1E40AF'
    }
  },
  {
    id: 'deal-004',
    title: 'Weekend Cashback Offer',
    discountType: 'percentage',
    discountValue: 15,
    minimumBill: 2500,
    maxDiscount: 750,
    isOfflineOnly: false,
    terms: [
      'Cashback credited within 24 hours',
      'Valid on weekends only',
      'Maximum 2 transactions per day'
    ],
    isActive: true,
    validUntil: new Date('2025-12-31'),
    category: 'cashback',
    description: 'Get cashback on weekend purchases',
    priority: 4,
    usageLimit: 10,
    usageCount: 0,
    applicableProducts: ['Fashion', 'Electronics', 'Home', 'Personal Care'],
    badge: {
      text: '15% Cashback',
      backgroundColor: '#D1FAE5',
      textColor: '#065F46'
    }
  },
  {
    id: 'deal-005',
    title: 'Buy 2 Get 1 Free',
    discountType: 'fixed',
    discountValue: 0, // Special BOGO logic
    minimumBill: 4000,
    isOfflineOnly: true,
    terms: [
      'Lowest priced item will be free',
      'Valid on selected categories only',
      'Cannot be clubbed with other offers'
    ],
    isActive: true,
    validUntil: new Date('2025-11-30'),
    category: 'buy-one-get-one',
    description: 'Buy any 2 items and get the lowest priced item free',
    priority: 5,
    usageLimit: 3,
    usageCount: 0,
    applicableProducts: ['Fashion', 'Personal Care'],
    badge: {
      text: 'BOGO',
      backgroundColor: '#FEF3C7',
      textColor: '#92400E'
    }
  },
  {
    id: 'deal-006',
    title: 'Seasonal Clearance Sale',
    discountType: 'percentage',
    discountValue: 50,
    minimumBill: 1500,
    maxDiscount: 2000,
    isOfflineOnly: true,
    terms: [
      'Valid on clearance items only',
      'No returns or exchanges',
      'While stocks last'
    ],
    isActive: true,
    validUntil: new Date('2025-09-30'),
    category: 'clearance',
    description: 'Huge discounts on seasonal clearance items',
    priority: 6,
    usageLimit: 2,
    usageCount: 0,
    applicableProducts: ['Fashion', 'Home'],
    badge: {
      text: 'Save 50%',
      backgroundColor: '#FEE2E2',
      textColor: '#991B1B'
    }
  },
  {
    id: 'deal-007',
    title: 'Loyalty Member Exclusive',
    discountType: 'percentage',
    discountValue: 25,
    minimumBill: 6000,
    maxDiscount: 2500,
    isOfflineOnly: false,
    terms: [
      'Valid for loyalty members only',
      'Show membership card',
      'Earn double loyalty points'
    ],
    isActive: true,
    validUntil: new Date('2025-12-31'),
    category: 'loyalty',
    description: 'Exclusive discount for loyal customers',
    priority: 7,
    usageLimit: 8,
    usageCount: 0,
    applicableProducts: ['Fashion', 'Electronics', 'Home', 'Personal Care'],
    badge: {
      text: 'VIP 25%',
      backgroundColor: '#F3E8FF',
      textColor: '#7C3AED'
    }
  }
];

// Store-specific deal configurations
export const storeDealConfigs: Record<string, StoreDealConfig> = {
  'store-001': {
    storeId: 'store-001',
    storeName: 'Reliance Trends',
    availableDeals: mockDeals,
    dealCategories: [
      'instant-discount',
      'first-time',
      'cashback',
      'buy-one-get-one',
      'clearance',
      'loyalty'
    ],
    maxConcurrentDeals: 2,
    allowDealStacking: false
  },
  'store-002': {
    storeId: 'store-002',
    storeName: 'Fashion Hub',
    availableDeals: mockDeals.filter(deal => 
      deal.applicableProducts?.includes('Fashion')
    ),
    dealCategories: [
      'instant-discount',
      'seasonal',
      'clearance'
    ],
    maxConcurrentDeals: 1,
    allowDealStacking: false
  }
};

// Helper functions for deal data
export const getDealsByStore = (storeId: string): Deal[] => {
  const config = storeDealConfigs[storeId];
  return config ? config.availableDeals.filter(deal => deal.isActive) : mockDeals;
};

export const getDealsByCategory = (category: DealCategory): Deal[] => {
  return mockDeals.filter(deal => deal.category === category && deal.isActive);
};

export const getActiveDealsByPriority = (storeId?: string): Deal[] => {
  const deals = storeId ? getDealsByStore(storeId) : mockDeals;
  return deals
    .filter(deal => deal.isActive)
    .sort((a, b) => a.priority - b.priority);
};

export const getTopDeals = (limit: number = 3, storeId?: string): Deal[] => {
  return getActiveDealsByPriority(storeId).slice(0, limit);
};

// Deal category metadata
export const dealCategoryInfo: Record<DealCategory, { name: string; icon: string; color: string }> = {
  'instant-discount': {
    name: 'Instant Discount',
    icon: 'flash-outline',
    color: '#7C3AED'
  },
  'cashback': {
    name: 'Cashback',
    icon: 'wallet-outline',
    color: '#059669'
  },
  'buy-one-get-one': {
    name: 'BOGO',
    icon: 'gift-outline',
    color: '#D97706'
  },
  'seasonal': {
    name: 'Seasonal',
    icon: 'sunny-outline',
    color: '#DC2626'
  },
  'first-time': {
    name: 'First Time',
    icon: 'star-outline',
    color: '#2563EB'
  },
  'loyalty': {
    name: 'Loyalty',
    icon: 'diamond-outline',
    color: '#7C3AED'
  },
  'clearance': {
    name: 'Clearance',
    icon: 'pricetag-outline',
    color: '#DC2626'
  }
};
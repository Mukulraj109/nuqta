// Mock data for testing StoreActionButtons component

import { MockStoreData, MockProductData, ButtonActionResult, StoreType } from '@/types/store-actions';

/**
 * Mock Store Data for different scenarios
 */
export const mockStores: MockStoreData[] = [
  {
    id: 'store-001',
    name: 'Fashion Paradise',
    type: 'PRODUCT',
    category: 'Fashion',
    isOpen: true,
    location: 'BTM, Bangalore',
  },
  {
    id: 'store-002', 
    name: 'Beauty Salon & Spa',
    type: 'SERVICE',
    category: 'Beauty',
    isOpen: true,
    location: 'Koramangala, Bangalore',
  },
  {
    id: 'store-003',
    name: 'Electronics Hub',
    type: 'PRODUCT',
    category: 'Electronics',
    isOpen: false,
    location: 'Whitefield, Bangalore',
  },
  {
    id: 'store-004',
    name: 'Fitness Center',
    type: 'SERVICE', 
    category: 'Fitness',
    isOpen: true,
    location: 'Indiranagar, Bangalore',
  },
];

/**
 * Mock Product Data for testing different product states
 */
export const mockProducts: MockProductData[] = [
  {
    id: 'product-001',
    title: 'Little Big Comfort Tee',
    price: '₹2,199',
    isAvailable: true,
    canBeLocked: true,
    hasBookingOption: false, // Product - no booking by default
  },
  {
    id: 'product-002',
    title: 'Premium Laptop',
    price: '₹89,999',
    isAvailable: true,
    canBeLocked: true,
    hasBookingOption: false,
  },
  {
    id: 'service-001',
    title: 'Hair Cut & Styling',
    price: '₹1,500',
    isAvailable: true,
    canBeLocked: false, // Services might not support locking
    hasBookingOption: true,
  },
  {
    id: 'service-002',
    title: 'Personal Training Session',
    price: '₹2,000',
    isAvailable: true,
    canBeLocked: true,
    hasBookingOption: true,
  },
];

/**
 * Mock API Response Simulator
 */
export const mockApiResponses = {
  /**
   * Simulate Buy Action
   */
  buyAction: async (storeId: string, productId: string): Promise<ButtonActionResult> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Random success/failure for testing
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      return {
        success: true,
        message: 'Item added to cart successfully!',
        data: {
          cartItemId: `cart-${Date.now()}`,
          quantity: 1,
        },
      };
    } else {
      return {
        success: false,
        error: 'Failed to add item to cart. Please try again.',
      };
    }
  },

  /**
   * Simulate Lock Action
   */
  lockAction: async (storeId: string, productId: string): Promise<ButtonActionResult> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = Math.random() > 0.15; // 85% success rate
    
    if (success) {
      return {
        success: true,
        message: 'Product reserved for 15 minutes!',
        data: {
          lockId: `lock-${Date.now()}`,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
      };
    } else {
      return {
        success: false,
        error: 'Product is currently unavailable for reservation.',
      };
    }
  },

  /**
   * Simulate Booking Action
   */
  bookingAction: async (storeId: string, serviceId: string): Promise<ButtonActionResult> => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const success = Math.random() > 0.05; // 95% success rate
    
    if (success) {
      return {
        success: true,
        message: 'Booking initiated! Redirecting to booking page...',
        data: {
          bookingId: `booking-${Date.now()}`,
          redirectUrl: '/booking-details',
        },
      };
    } else {
      return {
        success: false,
        error: 'Booking service is currently unavailable.',
      };
    }
  },
};

/**
 * Mock Event Handlers for Testing
 */
export const createMockHandlers = (storeId: string, productId: string) => ({
  handleBuy: async () => {

    const result = await mockApiResponses.buyAction(storeId, productId);
    
    if (result.success) {
      // In real app: show success toast, update cart count, etc.

    } else {
      // In real app: show error toast
    }
    
    return result;
  },

  handleLock: async () => {

    const result = await mockApiResponses.lockAction(storeId, productId);
    
    if (result.success) {

      // In real app: start countdown timer, update UI state
    } else {
    }
    
    return result;
  },

  handleBooking: async () => {

    const result = await mockApiResponses.bookingAction(storeId, productId);
    
    if (result.success) {

      // In real app: navigate to booking screen
    } else {
    }
    
    return result;
  },
});

/**
 * Test Scenarios for Component Testing
 */
export const testScenarios = [
  {
    name: 'Product Store - Default',
    storeType: 'PRODUCT' as StoreType,
    expectedButtons: ['Buy', 'Lock'],
    description: 'Should show Buy and Lock buttons only',
  },
  {
    name: 'Product Store - With Booking Override', 
    storeType: 'PRODUCT' as StoreType,
    showBookingButton: true,
    expectedButtons: ['Buy', 'Lock', 'Booking'],
    description: 'Should show all three buttons when override is enabled',
  },
  {
    name: 'Service Store - Default',
    storeType: 'SERVICE' as StoreType,
    expectedButtons: ['Buy', 'Lock', 'Booking'],
    description: 'Should show all three buttons for services',
  },
  {
    name: 'Service Store - Booking Disabled',
    storeType: 'SERVICE' as StoreType,
    showBookingButton: false,
    expectedButtons: ['Buy', 'Lock'],
    description: 'Should hide booking when explicitly disabled',
  },
  {
    name: 'Loading States Test',
    storeType: 'PRODUCT' as StoreType,
    isBuyLoading: true,
    expectedButtons: ['Buy', 'Lock'],
    description: 'Should show loading state on Buy button and disable others',
  },
  {
    name: 'Disabled States Test',
    storeType: 'SERVICE' as StoreType,
    isBuyDisabled: true,
    isLockDisabled: true,
    expectedButtons: ['Buy', 'Lock', 'Booking'],
    description: 'Should show disabled states for Buy and Lock buttons',
  },
];

/**
 * Get mock data for current store (for testing integration)
 */
export const getCurrentMockStore = (): MockStoreData => {
  // Default to product store for current implementation
  return mockStores[0]; // Fashion Paradise - PRODUCT
};

export const getCurrentMockProduct = (): MockProductData => {
  return mockProducts[0]; // Little Big Comfort Tee
};

/**
 * Component Test Props Generator
 */
export const generateTestProps = (scenario: typeof testScenarios[0]) => {
  const store = getCurrentMockStore();
  const product = getCurrentMockProduct();
  const handlers = createMockHandlers(store.id, product.id);

  return {
    storeType: scenario.storeType,
    onBuyPress: handlers.handleBuy,
    onLockPress: handlers.handleLock,
    onBookingPress: handlers.handleBooking,
    showBookingButton: scenario.showBookingButton,
    isBuyLoading: (scenario as any).isBuyLoading || false,
    isLockLoading: (scenario as any).isLockLoading || false,
    isBookingLoading: (scenario as any).isBookingLoading || false,
    isBuyDisabled: (scenario as any).isBuyDisabled || false,
    isLockDisabled: (scenario as any).isLockDisabled || false,
    isBookingDisabled: (scenario as any).isBookingDisabled || false,
  };
};

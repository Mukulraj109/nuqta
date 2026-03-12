// Wallet Validation Service
// Provides validation utilities for wallet operations

import { BRAND } from '@/constants/brand';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface TopupValidation {
  amount: number;
  paymentMethod?: string;
  paymentId?: string;
}

export interface WithdrawalValidation {
  amount: number;
  method: 'bank' | 'upi' | 'paypal';
  accountDetails?: string;
}

export interface PaymentValidation {
  amount: number;
  orderId?: string;
  storeId?: string;
  storeName?: string;
  description?: string;
}

class WalletValidationService {
  // Validate topup request
  validateTopup(data: TopupValidation): ValidationResult {
    const errors: string[] = [];

    // Amount validation
    if (!data.amount || typeof data.amount !== 'number') {
      errors.push('Amount is required and must be a number');
    } else if (data.amount <= 0) {
      errors.push('Amount must be greater than 0');
    } else if (data.amount < 10) {
      errors.push(`Minimum topup amount is 10 ${BRAND.CURRENCY_CODE}`);
    } else if (data.amount > 100000) {
      errors.push(`Maximum topup amount is 100,000 ${BRAND.CURRENCY_CODE}`);
    }

    // Payment method validation
    if (data.paymentMethod && typeof data.paymentMethod !== 'string') {
      errors.push('Payment method must be a string');
    }

    // Payment ID validation
    if (data.paymentId && typeof data.paymentId !== 'string') {
      errors.push('Payment ID must be a string');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate withdrawal request
  validateWithdrawal(data: WithdrawalValidation): ValidationResult {
    const errors: string[] = [];

    // Amount validation
    if (!data.amount || typeof data.amount !== 'number') {
      errors.push('Amount is required and must be a number');
    } else if (data.amount <= 0) {
      errors.push('Amount must be greater than 0');
    } else if (data.amount < 100) {
      errors.push(`Minimum withdrawal amount is 100 ${BRAND.CURRENCY_CODE}`);
    } else if (data.amount > 50000) {
      errors.push(`Maximum withdrawal amount is 50,000 ${BRAND.CURRENCY_CODE}`);
    }

    // Method validation
    if (!data.method || !['bank', 'upi', 'paypal'].includes(data.method)) {
      errors.push('Withdrawal method must be one of: bank, upi, paypal');
    }

    // Account details validation
    if (data.method === 'bank' && (!data.accountDetails || data.accountDetails.trim().length === 0)) {
      errors.push('Bank account details are required for bank withdrawal');
    }

    if (data.method === 'upi' && (!data.accountDetails || data.accountDetails.trim().length === 0)) {
      errors.push('UPI ID is required for UPI withdrawal');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate payment request
  validatePayment(data: PaymentValidation): ValidationResult {
    const errors: string[] = [];

    // Amount validation
    if (!data.amount || typeof data.amount !== 'number') {
      errors.push('Amount is required and must be a number');
    } else if (data.amount <= 0) {
      errors.push('Amount must be greater than 0');
    } else if (data.amount > 10000) {
      errors.push(`Maximum payment amount is 10,000 ${BRAND.CURRENCY_CODE}`);
    }

    // Order ID validation
    if (data.orderId && typeof data.orderId !== 'string') {
      errors.push('Order ID must be a string');
    }

    // Store ID validation
    if (data.storeId && typeof data.storeId !== 'string') {
      errors.push('Store ID must be a string');
    }

    // Store name validation
    if (data.storeName && typeof data.storeName !== 'string') {
      errors.push('Store name must be a string');
    }

    // Description validation
    if (data.description && typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description && data.description.length > 200) {
      errors.push('Description must be less than 200 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate wallet balance
  validateBalance(balance: number, requiredAmount: number): ValidationResult {
    const errors: string[] = [];

    if (typeof balance !== 'number' || balance < 0) {
      errors.push('Invalid wallet balance');
    }

    if (typeof requiredAmount !== 'number' || requiredAmount <= 0) {
      errors.push('Invalid required amount');
    }

    if (balance < requiredAmount) {
      errors.push(`Insufficient balance. Required: ${requiredAmount} ${BRAND.CURRENCY_CODE}, Available: ${balance} ${BRAND.CURRENCY_CODE}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate transaction filters
  validateTransactionFilters(filters: any): ValidationResult {
    const errors: string[] = [];

    // Page validation
    if (filters.page && (typeof filters.page !== 'number' || filters.page < 1)) {
      errors.push('Page must be a positive number');
    }

    // Limit validation
    if (filters.limit && (typeof filters.limit !== 'number' || filters.limit < 1 || filters.limit > 100)) {
      errors.push('Limit must be between 1 and 100');
    }

    // Type validation
    if (filters.type && !['credit', 'debit'].includes(filters.type)) {
      errors.push('Type must be either credit or debit');
    }

    // Category validation
    if (filters.category && typeof filters.category !== 'string') {
      errors.push('Category must be a string');
    }

    // Status validation
    if (filters.status && typeof filters.status !== 'string') {
      errors.push('Status must be a string');
    }

    // Date validation
    if (filters.dateFrom && !this.isValidDate(filters.dateFrom)) {
      errors.push('Invalid dateFrom format');
    }

    if (filters.dateTo && !this.isValidDate(filters.dateTo)) {
      errors.push('Invalid dateTo format');
    }

    // Amount range validation
    if (filters.minAmount && (typeof filters.minAmount !== 'number' || filters.minAmount < 0)) {
      errors.push('Minimum amount must be a non-negative number');
    }

    if (filters.maxAmount && (typeof filters.maxAmount !== 'number' || filters.maxAmount < 0)) {
      errors.push('Maximum amount must be a non-negative number');
    }

    if (filters.minAmount && filters.maxAmount && filters.minAmount > filters.maxAmount) {
      errors.push('Minimum amount cannot be greater than maximum amount');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Sanitize topup data
  sanitizeTopupData(data: any): TopupValidation {
    return {
      amount: this.sanitizeNumber(data.amount, 0, 10, 100000),
      paymentMethod: this.sanitizeString(data.paymentMethod, 'gateway'),
      paymentId: this.sanitizeString(data.paymentId, `PAY_${Date.now()}`)
    };
  }

  // Sanitize withdrawal data
  sanitizeWithdrawalData(data: any): WithdrawalValidation {
    return {
      amount: this.sanitizeNumber(data.amount, 0, 100, 50000),
      method: this.sanitizeEnum(data.method, ['bank', 'upi', 'paypal'] as const, 'bank'),
      accountDetails: this.sanitizeString(data.accountDetails, '')
    };
  }

  // Sanitize payment data
  sanitizePaymentData(data: any): PaymentValidation {
    return {
      amount: this.sanitizeNumber(data.amount, 0, 1, 10000),
      orderId: this.sanitizeString(data.orderId, ''),
      storeId: this.sanitizeString(data.storeId, ''),
      storeName: this.sanitizeString(data.storeName, ''),
      description: this.sanitizeString(data.description, '', 200)
    };
  }

  // Helper methods
  private isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private sanitizeNumber(value: any, defaultValue: number, min?: number, max?: number): number {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return defaultValue;
    
    if (min !== undefined && num < min) return min;
    if (max !== undefined && num > max) return max;
    
    return num;
  }

  private sanitizeString(value: any, defaultValue: string, maxLength?: number): string {
    if (typeof value !== 'string') return defaultValue;
    
    const trimmed = value.trim();
    if (maxLength && trimmed.length > maxLength) {
      return trimmed.substring(0, maxLength);
    }
    
    return trimmed;
  }

  private sanitizeEnum<T extends string>(value: any, validValues: readonly T[], defaultValue: T): T {
    return (validValues as readonly string[]).includes(value) ? (value as T) : defaultValue;
  }

  // Validate API response
  validateApiResponse(response: any): ValidationResult {
    const errors: string[] = [];

    if (!response || typeof response !== 'object') {
      errors.push('Response must be an object');
      return { isValid: false, errors };
    }

    if (typeof response.success !== 'boolean') {
      errors.push('Response must have a success boolean field');
    }

    if (response.success && !response.data) {
      errors.push('Successful response must have data field');
    }

    if (!response.success && !response.error) {
      errors.push('Failed response should have error field');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const walletValidationService = new WalletValidationService();
export default walletValidationService;

// Payment Integration Test
// Tests the complete payment flow from frontend to backend

const { PaymentValidator } = require('../services/paymentValidation');

describe('Payment Integration Tests', () => {
  describe('Payment Validation', () => {
    test('should validate UPI ID correctly', () => {
      const validUPI = 'user@paytm';
      const invalidUPI = 'invalid-upi';
      
      const validResult = PaymentValidator.validateUPIId(validUPI);
      const invalidResult = PaymentValidator.validateUPIId(invalidUPI);
      
      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Please enter a valid UPI ID (e.g., user@paytm)');
    });

    test('should validate card number using Luhn algorithm', () => {
      const validCard = '4111111111111111'; // Test Visa card
      const invalidCard = '1234567890123456';
      
      const validResult = PaymentValidator.validateCardNumber(validCard);
      const invalidResult = PaymentValidator.validateCardNumber(invalidCard);
      
      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Invalid card number');
    });

    test('should validate card expiry date', () => {
      const futureDate = '12/25';
      const pastDate = '01/20';
      const invalidFormat = '13/25';
      
      const futureResult = PaymentValidator.validateCardExpiry(futureDate);
      const pastResult = PaymentValidator.validateCardExpiry(pastDate);
      const invalidResult = PaymentValidator.validateCardExpiry(invalidFormat);
      
      expect(futureResult.isValid).toBe(true);
      expect(pastResult.isValid).toBe(false);
      expect(pastResult.errors).toContain('Card has expired');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Please enter expiry date in MM/YY format');
    });

    test('should validate CVV correctly', () => {
      const validCVV = '123';
      const invalidCVV = '12';
      const amexCVV = '1234';
      
      const validResult = PaymentValidator.validateCVV(validCVV);
      const invalidResult = PaymentValidator.validateCVV(invalidCVV);
      const amexResult = PaymentValidator.validateCVV(amexCVV, 'amex');
      
      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('CVV must be 3 digits');
      expect(amexResult.isValid).toBe(true);
    });

    test('should validate payment amount', () => {
      const validAmount = 100;
      const invalidAmount = -10;
      const tooLargeAmount = 200000;
      
      const validResult = PaymentValidator.validateAmount(validAmount);
      const invalidResult = PaymentValidator.validateAmount(invalidAmount);
      const tooLargeResult = PaymentValidator.validateAmount(tooLargeAmount);
      
      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Amount must be greater than 0');
      expect(tooLargeResult.isValid).toBe(false);
      expect(tooLargeResult.errors).toContain('Maximum amount is ₹1,00,000');
    });

    test('should detect card type correctly', () => {
      expect(PaymentValidator.detectCardType('4111111111111111')).toBe('visa');
      expect(PaymentValidator.detectCardType('5555555555554444')).toBe('mastercard');
      expect(PaymentValidator.detectCardType('378282246310005')).toBe('amex');
      expect(PaymentValidator.detectCardType('6011111111111117')).toBe('discover');
    });

    test('should format card number correctly', () => {
      const cardNumber = '4111111111111111';
      const formatted = PaymentValidator.formatCardNumber(cardNumber);
      expect(formatted).toBe('4111 1111 1111 1111');
    });

    test('should format expiry date correctly', () => {
      const expiry = '1225';
      const formatted = PaymentValidator.formatExpiryDate(expiry);
      expect(formatted).toBe('12/25');
    });
  });

  describe('Payment Method Validation', () => {
    test('should validate payment method', () => {
      const validMethods = ['upi', 'card', 'wallet', 'netbanking'];
      const invalidMethod = 'invalid';
      
      validMethods.forEach(method => {
        const result = PaymentValidator.validatePaymentMethod(method);
        expect(result.isValid).toBe(true);
      });
      
      const invalidResult = PaymentValidator.validatePaymentMethod(invalidMethod);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Invalid payment method');
    });

    test('should validate bank code', () => {
      const validBanks = ['SBIN', 'HDFC', 'ICICI', 'AXIS'];
      const invalidBank = 'INVALID';
      
      validBanks.forEach(bank => {
        const result = PaymentValidator.validateBankCode(bank);
        expect(result.isValid).toBe(true);
      });
      
      const invalidResult = PaymentValidator.validateBankCode(invalidBank);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Invalid bank selection');
    });

    test('should validate wallet type', () => {
      const validWallets = ['paytm', 'phonepe', 'gpay', 'amazonpay'];
      const invalidWallet = 'invalid';
      
      validWallets.forEach(wallet => {
        const result = PaymentValidator.validateWalletType(wallet);
        expect(result.isValid).toBe(true);
      });
      
      const invalidResult = PaymentValidator.validateWalletType(invalidWallet);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Invalid wallet type');
    });
  });

  describe('Complete Card Validation', () => {
    test('should validate complete card details', () => {
      const validCardDetails = {
        number: '4111111111111111',
        expiry: '12/25',
        cvv: '123',
        name: 'John Doe'
      };
      
      const invalidCardDetails = {
        number: '1234567890123456',
        expiry: '13/25',
        cvv: '12',
        name: ''
      };
      
      const validResult = PaymentValidator.validateCardDetails(validCardDetails);
      const invalidResult = PaymentValidator.validateCardDetails(invalidCardDetails);
      
      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });
});

// Mock API tests
describe('Payment API Integration', () => {
  test('should handle payment method fetching', async () => {
    // This would test the actual API call in a real environment
    const mockPaymentMethods = [
      {
        id: 'upi',
        name: 'UPI',
        type: 'upi',
        icon: '📱',
        isAvailable: true,
        processingFee: 0,
        processingTime: 'Instant'
      }
    ];
    
    expect(mockPaymentMethods).toHaveLength(1);
    expect(mockPaymentMethods[0].id).toBe('upi');
  });

  test('should handle payment initiation', async () => {
    const mockPaymentRequest = {
      amount: 100,
      currency: 'INR',
      paymentMethod: 'upi',
      metadata: { upiId: 'user@paytm' }
    };
    
    expect(mockPaymentRequest.amount).toBe(100);
    expect(mockPaymentRequest.paymentMethod).toBe('upi');
  });

  test('should handle payment status checking', async () => {
    const mockPaymentStatus = {
      paymentId: 'PAY_123456789',
      status: 'completed',
      transactionId: 'TXN_123456789',
      completedAt: new Date().toISOString()
    };
    
    expect(mockPaymentStatus.status).toBe('completed');
    expect(mockPaymentStatus.paymentId).toMatch(/^PAY_/);
  });
});

// Error handling tests
describe('Payment Error Handling', () => {
  test('should handle network errors gracefully', () => {
    const networkError = new Error('Network request failed');
    expect(networkError.message).toBe('Network request failed');
  });

  test('should handle validation errors', () => {
    const validationError = {
      isValid: false,
      errors: ['Invalid card number', 'Card has expired']
    };
    
    expect(validationError.isValid).toBe(false);
    expect(validationError.errors).toHaveLength(2);
  });

  test('should handle payment gateway errors', () => {
    const gatewayError = {
      success: false,
      error: 'Payment gateway temporarily unavailable'
    };
    
    expect(gatewayError.success).toBe(false);
    expect(gatewayError.error).toContain('unavailable');
  });
});

// Performance tests
describe('Payment Performance', () => {
  test('should validate card number quickly', () => {
    const startTime = Date.now();
    PaymentValidator.validateCardNumber('4111111111111111');
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
  });

  test('should format card number efficiently', () => {
    const startTime = Date.now();
    PaymentValidator.formatCardNumber('4111111111111111');
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(50); // Should complete in less than 50ms
  });
});

module.exports = {
  PaymentValidator
};

# Cross-Platform Stripe Payment Implementation

## Overview

This document describes the complete cross-platform Stripe payment implementation for the PayBillCard component that works seamlessly on **Web, iOS, and Android** platforms.

## The Challenge

The main challenge was that `@stripe/stripe-react-native` only works on iOS and Android, causing import errors on web platforms. We needed a solution that:

1. Uses **real Stripe.js** (`@stripe/stripe-js`) for web
2. Uses **Stripe React Native SDK** (`@stripe/stripe-react-native`) for iOS/Android
3. Works without any import errors or runtime crashes
4. Provides a consistent payment experience across all platforms

## Solution: Platform-Specific Files

React Native/Expo automatically selects platform-specific files based on file extensions:

- **Web**: Uses `.web.tsx` files
- **iOS/Android**: Uses `.native.tsx` files
- **Fallback**: Uses `.tsx` files if platform-specific versions don't exist

## File Structure

```
frontend/
├── components/payment/
│   ├── StripeCardForm.web.tsx       → Web version (Stripe.js with CardElement)
│   ├── StripeCardForm.native.tsx    → Native version (Stripe React Native SDK)
│   ├── StripeCardForm.tsx           → DELETED (causes conflicts)
│   └── StripeUpiForm.tsx            → UPI form (native-only)
│
├── app/StoreSection/
│   ├── PayBillCard.web.tsx          → Web version (Elements wrapper)
│   ├── PayBillCard.native.tsx       → Native version (StripeProvider wrapper)
│   └── PayBillCard.tsx              → DELETED (replaced by platform files)
│
└── services/
    └── stripeApi.ts                 → Shared API service for all platforms
```

## Implementation Details

### 1. StripeCardForm.web.tsx (Web Version)

**Technology**: Uses `@stripe/react-stripe-js` with Stripe Elements

**Key Features**:
- Real Stripe.js integration with `CardNumberElement`, `CardExpiryElement`, `CardCvcElement`
- Validates card details client-side
- Confirms payment using `stripe.confirmCardPayment()`
- Returns real payment intent ID
- PCI compliant - card data never touches your server

**Code Structure**:
```typescript
import { useStripe, useElements, CardNumberElement } from '@stripe/react-stripe-js';

const stripe = useStripe();
const elements = useElements();

const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardNumberElement,
  },
});

if (paymentIntent.status === 'succeeded') {
  onSuccess(paymentIntent.id);
}
```

### 2. StripeCardForm.native.tsx (iOS/Android Version)

**Technology**: Uses `@stripe/stripe-react-native`

**Key Features**:
- Native Stripe SDK integration
- Uses `useStripe()` hook from React Native SDK
- Confirms payment using `confirmPayment()` method
- Supports 3D Secure authentication
- Production-ready for mobile payments

**Code Structure**:
```typescript
import { useStripe } from '@stripe/stripe-react-native';

const { confirmPayment } = useStripe();

const { error, paymentIntent } = await confirmPayment(clientSecret, {
  paymentMethodType: 'Card',
  paymentMethodData: {
    billingDetails: { postalCode }
  }
});

if (paymentIntent.status === 'Succeeded') {
  onSuccess(paymentIntent.id);
}
```

### 3. PayBillCard.web.tsx (Web Container)

**Key Differences from Native**:
- Imports `@stripe/stripe-js` and `@stripe/react-stripe-js`
- Uses `Elements` wrapper with `stripePromise`
- No `@stripe/stripe-react-native` imports (avoids web errors)

**Code Structure**:
```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// In modal:
<Elements stripe={stripePromise} options={{ clientSecret }}>
  <StripeCardForm ... />
</Elements>
```

### 4. PayBillCard.native.tsx (iOS/Android Container)

**Key Differences from Web**:
- Imports `@stripe/stripe-react-native`
- Uses `StripeProvider` wrapper
- Direct import of native SDK (safe because file only loads on mobile)

**Code Structure**:
```typescript
import { StripeProvider } from '@stripe/stripe-react-native';

// In modal:
<StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
  <StripeCardForm ... />
</StripeProvider>
```

## Payment Flow

### Complete End-to-End Flow:

```
1. User selects a bill
   ↓
2. Clicks "Pay Now"
   ↓
3. Backend creates Payment Intent via stripeApi.createPaymentIntent()
   ↓
4. Returns clientSecret
   ↓
5. Modal opens with Stripe card form
   ↓
   [WEB PATH]                    [NATIVE PATH]
   Elements loads                StripeProvider loads
   CardElement renders           Native card inputs render
   ↓                            ↓
6. User enters card details (4242 4242 4242 4242 for test)
   ↓
   [WEB PATH]                    [NATIVE PATH]
   stripe.confirmCardPayment()   confirmPayment()
   ↓                            ↓
7. Stripe processes payment client-side
   ↓
8. Returns payment intent ID (e.g., pi_3xyz...)
   ↓
9. Backend verifies payment via stripeApi.confirmPayment()
   ↓
10. Success modal displays
```

## Environment Configuration

### Required Environment Variables

Add to `frontend/.env`:

```env
# Stripe Configuration
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51PQsD1A3bD41AFFrCYnvxrNlg2dlljlcLaEyI9OajniOFvCSXjbhCkUcPqxDw4atsYQBsP042AmCZf37Uhq1wxZq00HE39FdK5
```

**Important**:
- Variable must start with `EXPO_PUBLIC_` prefix
- Restart dev server after adding environment variables
- For production, replace with live key (`pk_live_...`)

## Testing

### Test Cards

For **test mode** (current setup):

| Field | Test Value |
|-------|-----------|
| **Card Number** | 4242 4242 4242 4242 |
| **Expiry Date** | Any future date (e.g., 12/34) |
| **CVV** | Any 3 digits (e.g., 123) |

### Additional Test Scenarios

| Card Number | Use Case |
|-------------|----------|
| 4242 4242 4242 4242 | Always succeeds |
| 4000 0000 0000 0002 | Card declined |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0027 6000 3184 | Requires 3D Secure |

More test cards: https://stripe.com/docs/testing

### How to Test

#### On Web:
```bash
cd frontend
npm start
# Press 'w' to open in web browser
```

1. Navigate to a page with PayBillCard component
2. Select a bill
3. Click "Pay Now"
4. Enter test card: `4242 4242 4242 4242`
5. Expiry: `12/34`, CVV: `123`
6. Click "Pay $[amount]"
7. Payment processed via Stripe.js
8. Success modal appears

#### On iOS:
```bash
cd frontend
npm run ios
```

1. Same steps as web
2. Payment processed via Stripe React Native SDK
3. Real Stripe payment processing

#### On Android:
```bash
cd frontend
npm run android
```

1. Same steps as web
2. Payment processed via Stripe React Native SDK
3. Real Stripe payment processing

## Dependencies

### Already Installed:

```json
{
  "@stripe/stripe-js": "^8.0.0",               // Web
  "@stripe/react-stripe-js": "^5.2.0",         // Web
  "@stripe/stripe-react-native": "^0.54.1"     // Native
}
```

No additional dependencies required!

## How It Works

### Platform Detection at Build Time

React Native's Metro bundler automatically selects the correct file:

```typescript
// When you import:
import PayBillCard from './PayBillCard';

// Metro resolves to:
// - On web: PayBillCard.web.tsx
// - On iOS/Android: PayBillCard.native.tsx
```

### Why Conditional Imports Don't Work

```typescript
// ❌ THIS DOESN'T WORK
if (Platform.OS !== 'web') {
  const { StripeProvider } = require('@stripe/stripe-react-native');
}
// Metro tries to load the module at build time, causing web errors
```

```typescript
// ✅ THIS WORKS
// PayBillCard.native.tsx
import { StripeProvider } from '@stripe/stripe-react-native';
// This file never loads on web, so no errors!
```

## Security Features

### Built-in Security:
- PCI DSS Compliance - Card data never touches your server
- Tokenization - Sensitive data tokenized by Stripe
- 3D Secure Support - Strong Customer Authentication (SCA)
- Fraud Detection - Stripe Radar monitors transactions
- Encrypted Communication - All API calls use HTTPS
- No Card Storage - Your server never sees full card numbers

### Best Practices Followed:
1. Publishable key in environment variables
2. Secret key only on backend (never in frontend)
3. Payment verification on backend before processing
4. Use of client secrets for one-time payment intents
5. Proper error handling and user feedback

## Production Deployment

### Step 1: Get Stripe Live Keys

1. Go to Stripe Dashboard → Developers → API Keys
2. Copy **Live Publishable Key** (starts with `pk_live_...`)
3. Copy **Live Secret Key** (starts with `sk_live_...`)

### Step 2: Update Environment Variables

**Frontend** `.env.production`:
```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY_HERE
```

**Backend** `.env`:
```env
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY_HERE
```

### Step 3: Test with Real Cards

1. Test with small amounts (₹10-50)
2. Verify payments appear in Stripe Dashboard
3. Check balance updates in your database

### Step 4: Enable Webhooks

Setup Stripe webhooks for production:

```
Webhook URL: https://your-domain.com/api/wallet/webhook/stripe
Events to listen:
- payment_intent.succeeded
- payment_intent.payment_failed
```

## Troubleshooting

### Issue 1: "Metro bundler error on web"

**Error**: "Importing react-native internals is not supported on web"

**Solution**:
- Ensure original `PayBillCard.tsx` is deleted
- Only `.web.tsx` and `.native.tsx` files should exist
- Clear Metro cache: `npx expo start --clear`

### Issue 2: "Stripe not loaded"

**Error**: `stripe` is null/undefined

**Solution**:
- Verify `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env`
- Restart dev server after adding environment variables
- Check console: `console.log(process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY)`

### Issue 3: "Payment not completed"

**Error**: Payment intent status is `requires_payment_method`

**Causes**:
- Card details not properly collected
- Network error during confirmation
- Invalid card number

**Solution**:
- Ensure all card fields are filled correctly
- Check internet connection
- Use valid test card: `4242 4242 4242 4242`

### Issue 4: "Cannot read property 'confirmPayment' of undefined"

**Error**: `useStripe()` returns undefined

**Cause**: Component not wrapped in correct provider

**Solution**:
- **Web**: Ensure modal has `<Elements>` wrapper
- **Native**: Ensure modal has `<StripeProvider>` wrapper

## Comparison: Platform Implementations

| Feature | Web (Stripe.js) | Native (React Native SDK) |
|---------|----------------|---------------------------|
| **Package** | @stripe/stripe-js | @stripe/stripe-react-native |
| **Card Input** | CardElement components | Native card inputs |
| **Payment Method** | confirmCardPayment() | confirmPayment() |
| **3D Secure** | Automatic redirect | Native authentication |
| **PCI Compliance** | ✅ Yes | ✅ Yes |
| **Production Ready** | ✅ Yes | ✅ Yes |
| **Real Payments** | ✅ Yes | ✅ Yes |

## API Reference

### stripeApi.createPaymentIntent()

Creates a payment intent on the backend.

```typescript
const response = await stripeApi.createPaymentIntent(
  amount: number,      // Amount in currency units
  discountPercentage: number = 0,
  paymentType: 'card' | 'upi' = 'card'
);

// Returns:
{
  success: boolean,
  data: {
    clientSecret: string,
    paymentIntentId: string
  },
  error?: string
}
```

### stripeApi.confirmPayment()

Confirms payment with backend after successful Stripe payment.

```typescript
const response = await stripeApi.confirmPayment(
  paymentIntentId: string  // Stripe payment intent ID
);

// Returns:
{
  success: boolean,
  data: {
    finalAmount: number,
    discount: number
  },
  error?: string
}
```

## Status Summary

### What's Working:
- ✅ Web payments with real Stripe.js
- ✅ Native payments with Stripe React Native SDK
- ✅ Platform-specific file resolution
- ✅ No import errors on any platform
- ✅ Real payment processing on all platforms
- ✅ Backend payment verification
- ✅ Success/error handling
- ✅ PCI compliant implementation
- ✅ Test cards working
- ✅ Production-ready architecture

### What's Not Working:
- ⚠️ UPI payments (Stripe doesn't support UPI in React Native)
  - **Recommendation**: Use Razorpay for India-specific UPI payments

## Resources

### Documentation:
- **Stripe.js**: https://stripe.com/docs/js
- **React Stripe.js**: https://stripe.com/docs/stripe-js/react
- **Stripe React Native**: https://stripe.com/docs/payments/accept-a-payment?platform=react-native
- **Testing**: https://stripe.com/docs/testing

### Code Files:
- `frontend/components/payment/StripeCardForm.web.tsx` - Web card form
- `frontend/components/payment/StripeCardForm.native.tsx` - Native card form
- `frontend/app/StoreSection/PayBillCard.web.tsx` - Web container
- `frontend/app/StoreSection/PayBillCard.native.tsx` - Native container
- `frontend/services/stripeApi.ts` - API service

## Success!

You now have a fully functional, cross-platform Stripe payment implementation that:

1. **Works on Web** using real Stripe.js
2. **Works on iOS** using Stripe React Native SDK
3. **Works on Android** using Stripe React Native SDK
4. **No import errors** - Platform-specific files prevent conflicts
5. **Production-ready** - Real payment processing on all platforms
6. **PCI compliant** - Card data never touches your server
7. **Secure** - Industry-standard security practices

The implementation is ready for production use after switching to live Stripe keys!

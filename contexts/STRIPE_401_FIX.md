# Fix for Stripe 401 Unauthorized Error

## Problem
You're getting a 401 error when trying to confirm a Stripe payment intent:
```
POST https://api.stripe.com/v1/payment_intents/pi_3SGyzBA3bD41AFFr1gfscu0B/confirm 401 (Unauthorized)
```

## Root Cause
The payment intent was created with one Stripe account/key, but you're trying to confirm it with a different key. This happens when:
- Frontend and backend are using keys from different Stripe accounts
- Frontend uses test keys while backend uses live keys (or vice versa)

## Solution Steps

### 1. Verify Your Current Setup

Run the test script to check your configuration:
```bash
cd frontend
node scripts/test-stripe-config.js
```

### 2. Get Matching Keys from Stripe Dashboard

1. **Login to Stripe**: https://dashboard.stripe.com
2. **Switch to TEST mode** (toggle in top-right corner)
3. **Go to**: Developers → API Keys
4. **Copy BOTH keys** from the SAME account:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`)

### 3. Update Frontend Configuration

Edit `frontend/.env`:
```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

### 4. Update Backend Configuration

Edit `user-backend/.env`:
```env
STRIPE_SECRET_KEY=sk_test_YOUR_MATCHING_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

**CRITICAL**: Both keys MUST be from the SAME Stripe account!

### 5. Clear Cache and Restart

```bash
# Frontend
cd frontend
npx expo start -c  # Clear cache

# Backend (in another terminal)
cd user-backend
npm run dev
```

### 6. Verify Keys Match

Check that your payment intents are being created correctly:

1. Make a test payment in your app
2. Go to Stripe Dashboard → Payments
3. You should see the payment intent created by your backend
4. The payment intent ID should match what you see in console logs

## Quick Checklist

- [ ] Frontend key starts with `pk_test_`
- [ ] Backend key starts with `sk_test_`
- [ ] Both keys are from the SAME Stripe account
- [ ] You're using TEST mode keys (not LIVE)
- [ ] Both servers have been restarted after updating keys
- [ ] Cache has been cleared

## Test Card for Verification

Once keys are properly configured, test with:
- **Card Number**: 4242 4242 4242 4242
- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 42424)

## Still Getting 401?

If you're still getting 401 after following these steps:

1. **Check Payment Intent Age**: Payment intents expire after 24 hours
2. **Verify Account**: Log into Stripe and check you're in the right account
3. **Check Mode**: Ensure both Dashboard and keys are in TEST mode
4. **Backend Logs**: Check backend console for any Stripe-related errors
5. **Try New Payment**: Create a fresh payment to rule out expired intents

## Backend Verification

To verify your backend is using the correct key, you can add this temporary endpoint to your backend:

```javascript
// In your backend routes (temporarily for testing)
app.get('/api/test-stripe', async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  try {
    // Try to create a test payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100, // ₹1 in smallest unit
      currency: 'inr',
      metadata: { test: true }
    });

    res.json({
      success: true,
      message: 'Stripe configured correctly',
      paymentIntentId: paymentIntent.id,
      keyMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TEST' : 'LIVE'
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      keyConfigured: !!process.env.STRIPE_SECRET_KEY
    });
  }
});
```

Then test it:
```bash
curl http://localhost:5001/api/test-stripe
```

---

## The Text Node Error

The text node error has been fixed. It was caused by improper string formatting in the test card display.

---

**Last Updated**: 2025-10-11
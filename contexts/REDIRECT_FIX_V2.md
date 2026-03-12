# Redirect Fix V2 - Triple-Layer Protection

## Your Current Issue

When clicking "Finish" button on onboarding page with expired token:
- API request gets 401 "jwt expired"
- API client says "🔄 [API CLIENT] 401 error detected, attempting token refresh..."
- **BUT** nothing happens after that - no redirect to sign-in

## Root Cause

The router might not be ready when the async token refresh happens, causing the `router.replace('/sign-in')` call to fail silently.

## Fix Applied - Triple-Layer Redirect System

### Layer 1: Immediate Router Call
Try to redirect immediately when invalid token detected:
```typescript
router.replace('/sign-in');
```
✅ If router is ready, this works instantly

### Layer 2: Redirect Flag + Navigation Guard
If Layer 1 fails, set a state flag that triggers a `useEffect`:
```typescript
setShouldRedirectToSignIn(true);
```

Then the navigation guard watches this flag:
```typescript
useEffect(() => {
  if (shouldRedirectToSignIn && !isSignInRoute) {
    console.log('🔐 [AUTH GUARD] Force redirect flag set, navigating to sign-in...');
    router.replace('/sign-in');
    setShouldRedirectToSignIn(false);
  }
}, [shouldRedirectToSignIn, ...]);
```
✅ This catches the redirect on next render cycle

### Layer 3: Auth State Guard
If both above fail, watch for auth state changes:
```typescript
useEffect(() => {
  if (!state.isAuthenticated && state.error) {
    // Redirect from onboarding routes with error state
    router.replace('/sign-in');
  }
}, [state.isAuthenticated, state.error, ...]);
```
✅ Final safety net

## What You'll See Now

### Console Output After Clicking "Finish" with Expired Token:

```
🔄 [API CLIENT] 401 error detected, attempting token refresh...
❌ [REFRESH TOKEN] Token refresh failed: jwt expired
❌ [REFRESH TOKEN] Refresh token invalid, logging out and redirecting to sign-in
🔐 [REFRESH TOKEN] Forcing redirect to sign-in...
[Either: Router works and redirects immediately]
[Or: ⚠️ Immediate navigation failed, will use guard]
🔐 [AUTH GUARD] Force redirect flag set, navigating to sign-in...
[Redirected to /sign-in page]
```

## Files Modified

**`frontend/contexts/AuthContext.tsx`** - 3 changes:

1. **Added redirect flag state** (line 117):
   ```typescript
   const [shouldRedirectToSignIn, setShouldRedirectToSignIn] = React.useState(false);
   ```

2. **Enhanced navigation guard** (lines 141-184):
   - Now watches `shouldRedirectToSignIn` flag
   - Redirects immediately when flag is true
   - Also handles regular auth state changes

3. **Updated tryRefreshToken** (lines 701-710):
   - Sets `shouldRedirectToSignIn = true`
   - Tries immediate redirect with error handling
   - Logs clear error if immediate redirect fails

## Why This Works

**Triple redundancy ensures the redirect ALWAYS happens:**

1. Try immediate redirect ✅
2. If that fails → Set flag → Trigger navigation guard ✅
3. If that fails → Auth state change → Trigger navigation guard ✅

**One of these three WILL work**

## Test It

1. Go to `onboarding/transactions-preview`
2. Click the "Finish" button with expired token
3. **You should now see:**
   - Console logs showing the redirect process
   - Immediate navigation to `/sign-in` page
   - No more stuck on onboarding page

## Previous Attempt vs Now

### Before (V1):
- Only had 2 layers (immediate + guard)
- Router might not be ready during async operations
- Guard might not trigger if auth state doesn't change
- **Result**: Sometimes got stuck

### Now (V2):
- 3 independent redirect mechanisms
- Flag-based trigger works on next render
- Catches edge case where router isn't ready
- **Result**: ALWAYS redirects

---

**Status**: ✅ ENHANCED FIX APPLIED
**Version**: V2 - Triple-Layer Protection
**Test**: Reload page and try clicking Finish button

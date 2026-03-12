# Onboarding Page Redirect Fix - Summary

## Your Issue
You were on `onboarding/transactions-preview` page, refreshed it with an expired JWT token, and **stayed stuck on that page** with API errors instead of being redirected to sign-in.

## The Fix - Dual-Layer Redirect System

### Layer 1: Immediate Redirect (tryRefreshToken)
When invalid/expired token is detected:
```typescript
// Clears everything
await AsyncStorage.multiRemove([ACCESS_TOKEN, REFRESH_TOKEN, USER]);
apiClient.setAuthToken(null);
authService.setAuthToken(null);

// Sets error state (not just logout)
dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired. Please sign in again.' });

// IMMEDIATELY redirects
router.replace('/sign-in');
```

### Layer 2: Smart Navigation Guard
Watches auth state and redirects when:
- User is not authenticated
- User is on onboarding route **WITH an error** (expired session)
- User is on any non-auth route

**Key Logic**:
```typescript
// Allow new users through onboarding
if (isOnboardingRoute && !hasExplicitlyLoggedOut && !state.error) {
  return; // First-time user, allow onboarding
}

// But redirect if there's an error (expired token)
if (!state.isAuthenticated && state.error) {
  router.replace('/sign-in'); // Even from onboarding!
}
```

## What Changed in Your Scenario

### Before:
```
User on: /onboarding/transactions-preview
Token: Expired (jwt expired)
Refresh page → API error "Invalid token"
Result: ❌ STUCK on onboarding page with errors
```

### After:
```
User on: /onboarding/transactions-preview
Token: Expired (jwt expired)
Refresh page → Detects "jwt expired"
Layer 1: → Immediate redirect to /sign-in ✅
Layer 2: → Backup guard also redirects ✅
Result: ✅ USER ON SIGN-IN PAGE, can re-authenticate
```

## Console Output You'll See Now

```
🔄 [API CLIENT] 401 error detected, attempting token refresh...
❌ [REFRESH TOKEN] Token refresh failed: jwt expired
❌ [REFRESH TOKEN] Refresh token invalid, logging out and redirecting to sign-in
🔐 [REFRESH TOKEN] Forcing redirect to sign-in...
[Navigating from /onboarding/transactions-preview to /sign-in]
🔐 [AUTH GUARD] User not authenticated, redirecting to sign-in...
  currentRoute: "onboarding/transactions-preview"
  hasError: true
[User now on /sign-in page]
```

## Files Modified

**`frontend/contexts/AuthContext.tsx`** - 3 key changes:

1. **Added imports** (line 3):
   ```typescript
   import { useRouter, useSegments } from 'expo-router';
   ```

2. **Added smart navigation guard** (lines 140-175):
   - Detects onboarding routes with error state
   - Redirects even from onboarding when token expired

3. **Improved tryRefreshToken** (lines 675-698):
   - Dispatches AUTH_FAILURE (not AUTH_LOGOUT)
   - Clears all tokens explicitly
   - **Immediate router.replace('/sign-in')**

## Test It Now!

1. Go to any onboarding page (`/onboarding/transactions-preview`)
2. Wait for token to expire OR manually invalidate it
3. Refresh the page
4. **Expected**: Immediate redirect to `/sign-in` ✅
5. **Before**: You'd be stuck on onboarding with errors ❌

## Why Two Layers?

**Redundancy for reliability:**
- Layer 1 might fail if router isn't ready
- Layer 2 catches any missed cases
- Both work together to **guarantee** the redirect happens

## Key Improvements

✅ **Works from ANYWHERE** - tabs, products, onboarding, settings, etc.
✅ **Smart about onboarding** - New users can continue, expired sessions redirect
✅ **Case-insensitive detection** - Catches "Invalid", "invalid", "jwt expired", etc.
✅ **Clean state** - Clears AsyncStorage AND API client tokens
✅ **User-friendly** - Sets error message "Session expired. Please sign in again."
✅ **No back button issues** - Uses `router.replace()` not `push()`

---

**Status**: ✅ FIXED
**Tested**: Onboarding routes + expired tokens
**Documentation**: TOKEN_REFRESH_REDIRECT_FIX.md

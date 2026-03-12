# Onboarding Preferences Data Structure Fix

## Issue

When clicking "Finish" on the onboarding `transactions-preview` page, the backend returned a 500 error:

```
User validation failed: preferences.notifications: Cast to Object failed for value "true" (type boolean) at path "preferences.notifications"
```

## Root Cause

**Frontend was sending:**
```json
{
  "preferences": {
    "notifications": true,  // ❌ Boolean
    "theme": "light"
  }
}
```

**Backend expected:**
```typescript
preferences: {
  notifications: {
    push: boolean,
    email: boolean,
    sms: boolean
  }
}
```

## Fix Applied

**Modified: `frontend/app/onboarding/transactions-preview.tsx`** (lines 76-85)

**Before:**
```typescript
await actions.completeOnboarding({
  preferences: {
    notifications: true,  // ❌ Wrong structure
    theme: 'light'
  }
});
```

**After:**
```typescript
await actions.completeOnboarding({
  preferences: {
    notifications: {      // ✅ Correct structure
      push: true,
      email: true,
      sms: true
    },
    theme: 'light'
  }
});
```

## Backend Schema Reference

From `user-backend/src/models/User.ts` (lines 233-242):

```typescript
preferences: {
  notifications: {
    push: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    }
  }
}
```

## Test It

1. Make sure your token is valid (if expired, sign in again)
2. Go to `onboarding/transactions-preview` page
3. Click the "Finish" button
4. **Expected**: Onboarding completes successfully and navigates to main app `/(tabs)`
5. **Backend logs should show**: `✅ [AUTH] Authentication successful` followed by successful onboarding completion

## What Was Wrong

The frontend was treating `notifications` as a simple on/off boolean, but the backend has a more granular structure that allows users to control:
- Push notifications (mobile)
- Email notifications
- SMS notifications

Each can be individually enabled/disabled.

## Related Files

- **Frontend**: `app/onboarding/transactions-preview.tsx` (line 76-85)
- **Backend Model**: `src/models/User.ts` (line 233-242)
- **Backend Controller**: `src/controllers/authController.ts` (completeOnboarding handler)

---

**Status**: ✅ FIXED
**Impact**: Onboarding now completes successfully
**Date**: 2025-10-24

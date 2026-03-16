/**
 * Granular Zustand selectors for maximum performance.
 *
 * Instead of: const { state } = useAuth() — re-renders on ANY auth change
 * Use:        const user = useAuthUser() — re-renders ONLY when user changes
 *
 * These selectors give components surgical precision over what they subscribe to.
 */

import { useAuthStore } from './authStore';
import { useWalletStore } from './walletStore';
import { useCartStore } from './cartStore';
import { useRegionStore } from './regionStore';
import { useHomeTabStore } from './homeTabStore';
import { useThemeStore } from './themeStore';
import { useGamificationStore } from './gamificationStore';
import { useSubscriptionStore } from './subscriptionStore';
import { useWishlistStore } from './wishlistStore';
import { useProfileStore } from './profileStore';

// ============================================================================
// AUTH SELECTORS — 150 imports, most critical
// ============================================================================

/** Only re-renders when user object changes */
export const useAuthUser = () => useAuthStore((s) => s.state.user);

/** Only re-renders when auth status flips */
export const useIsAuthenticated = () => useAuthStore((s) => s.state.isAuthenticated);

/** Only re-renders when loading state changes */
export const useAuthLoading = () => useAuthStore((s) => s.state.isLoading);

/** Only re-renders when error changes */
export const useAuthError = () => useAuthStore((s) => s.state.error);

/** Never re-renders — actions are stable references */
export const useAuthActions = () => useAuthStore((s) => s.actions);

/** Common pattern: just need user ID for API guards */
export const useUserId = () => useAuthStore((s) => s.state.user?.id || s.state.user?._id);

/** Common pattern: check if onboarded */
export const useIsOnboarded = () => useAuthStore((s) => s.state.user?.isOnboarded ?? false);

// ============================================================================
// WALLET SELECTORS — 48 imports
// ============================================================================

/** Only re-renders when balance changes */
export const useRezBalance = () => useWalletStore((s) => s.rezBalance);

/** Only re-renders when total balance changes */
export const useTotalBalance = () => useWalletStore((s) => s.totalBalance);

/** Only re-renders when available balance changes */
export const useAvailableBalance = () => useWalletStore((s) => s.availableBalance);

/** Only re-renders when branded coins change */
export const useBrandedCoins = () => useWalletStore((s) => s.brandedCoins);

/** Only re-renders when wallet loading state changes */
export const useWalletLoading = () => useWalletStore((s) => s.isLoading);

/** Never re-renders — stable function reference */
export const useRefreshWallet = () => useWalletStore((s) => s.refreshWallet);

/** Full wallet data (use sparingly — re-renders on any wallet change) */
export const useWalletData = () => useWalletStore((s) => s.walletData);

// ============================================================================
// CART SELECTORS — 37 imports
// ============================================================================

/** Only re-renders when item count changes */
export const useCartItemCount = () => useCartStore((s) => s.state.items?.length ?? 0);

/** Only re-renders when cart items change */
export const useCartItems = () => useCartStore((s) => s.state.items);

/** Only re-renders when cart total changes */
export const useCartTotal = () => useCartStore((s) => s.state.totalAmount ?? 0);

/** Only re-renders when cart loading changes */
export const useCartLoading = () => useCartStore((s) => s.state.isLoading);

/** Never re-renders — stable action references */
export const useCartActions = () => useCartStore((s) => s.actions);

// ============================================================================
// REGION SELECTORS — 426 imports (!)
// ============================================================================

/** Only re-renders when region ID changes */
export const useCurrentRegionId = () => useRegionStore((s) => s.currentRegion);

/** Only re-renders when currency changes */
export const useCurrency = () => useRegionStore((s) => s.currency);

/** Stable function — never re-renders */
export const useGetCurrencySymbol = () => useRegionStore((s) => s.getCurrencySymbol);

/** Stable function — never re-renders */
export const useFormatPrice = () => useRegionStore((s) => s.formatPrice);

// ============================================================================
// HOME TAB SELECTORS — 5 imports
// ============================================================================

/** Only re-renders when active tab changes */
export const useActiveTab = () => useHomeTabStore((s) => s.activeTab);

/** Stable function — never re-renders */
export const useSetActiveTab = () => useHomeTabStore((s) => s.setActiveTab);

/** Derived booleans */
export const useIsPriveActive = () => useHomeTabStore((s) => s.isPriveActive);
export const useIsMallActive = () => useHomeTabStore((s) => s.isMallActive);

// ============================================================================
// THEME SELECTORS — most used
// ============================================================================

/** Only re-renders when dark mode toggles */
export const useIsDark = () => {
  const mode = useThemeStore((s) => s.mode);
  // Can't call useColorScheme here (not a hook context), so just return stored mode
  return mode === 'dark';
};

// ============================================================================
// GAMIFICATION SELECTORS — 16 imports
// ============================================================================

/** Only re-renders when streak changes */
export const useStreak = () => useGamificationStore((s) => s.state?.streak);

/** Only re-renders when daily check-in status changes */
export const useHasCheckedIn = () => useGamificationStore((s) => s.state?.hasCheckedInToday);

// ============================================================================
// SUBSCRIPTION SELECTORS — 10 imports
// ============================================================================

/** Only re-renders when subscription tier changes */
export const useSubscriptionTier = () => useSubscriptionStore((s) => s.state?.currentTier);

/** Only re-renders when subscribed status changes */
export const useIsSubscribed = () => useSubscriptionStore((s) => s.computed?.isSubscribed ?? false);

// ============================================================================
// WISHLIST SELECTORS — 15 imports
// ============================================================================

/** Only re-renders when wishlist count changes */
export const useWishlistCount = () => useWishlistStore((s) => s.wishlistItems?.length ?? 0);

/** Stable function — never re-renders */
export const useIsInWishlist = () => useWishlistStore((s) => s.isInWishlist);

// ============================================================================
// PROFILE SELECTORS — 9 imports
// ============================================================================

/** Only re-renders when profile data changes */
export const useUserProfile = () => useProfileStore((s) => s.user);

import React, { Suspense, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  RefreshControl,
  Platform,
  InteractionManager,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { platformAlertSimple } from '@/utils/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useRegion } from '@/contexts/RegionContext';

import { colors, spacing, borderRadius, shadows, typography } from '@/constants/theme';
import StickySearchHeader from '@/components/homepage/StickySearchHeader';
import HeroBanner from '@/components/homepage/HeroBanner';
import HomeTabSection, { TabId } from '@/components/homepage/HomeTabSection';
import NearUTabContent from '@/components/homepage/NearUTabContent';
import { useHomepage, useHomepageNavigation } from '@/hooks/useHomepage';
import { useLoyaltySection } from '@/hooks/useLoyaltySection';

// Lazy-loaded tab containers (code-split — prefetched in background after mount)
const MallSectionContainer = React.lazy(() => import('@/components/mall/MallSectionContainer'));
const MallHeaderWrapper = React.lazy(() => import('@/components/mall/MallHeaderWrapper'));
const CashStoreHeaderWrapper = React.lazy(() => import('@/components/cash-store/CashStoreHeaderWrapper'));
const CashStoreSectionContainer = React.lazy(() => import('@/components/cash-store/CashStoreSectionContainer'));
const PriveHeaderWrapper = React.lazy(() => import('@/components/prive/PriveHeaderWrapper'));
const PriveSectionContainer = React.lazy(() =>
  import('@/components/prive/PriveSectionContainer').then(m => ({ default: m.PriveSectionContainer }))
);
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useProfile, useProfileMenu } from '@/contexts/ProfileContext';
import { profileMenuSections } from '@/data/profileData';
import LocationDisplay from '@/components/location/LocationDisplay';
import LocationPickerModal from '@/components/location/LocationPickerModal';
import { useCurrentLocation, useLocationPermission } from '@/hooks/useLocation';
import { AddressSearchResult } from '@/types/location.types';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { HomepageCacheWarmer } from '@/services/homepageApi';
import { useWalletContext } from '@/contexts/WalletContext';
import WhatsNewBadge from '@/components/common/WhatsNewBadge';
import { useHomeTab } from '@/contexts/HomeTabContext';
import CachedImage, { prefetchImages } from '@/components/ui/CachedImage';
import HomepageSkeleton from '@/components/homepage/HomepageSkeleton';
import { BRAND } from '@/constants/brand';

// Lazy-loaded components (below-the-fold)
const ProfileMenuModal = React.lazy(() => import('@/components/profile/ProfileMenuModal'));
const QuickAccessFAB = React.lazy(() => import('@/components/navigation/QuickAccessFAB'));
const PushNotificationInitializer = React.lazy(() => import('@/components/common/PushNotificationInitializer'));

// ── Module-level state: survives component remounts caused by DeferredProviders ──
let _lastFocusRefreshTime = 0; // Throttle focus refreshes across remounts
let _statsLoadedGlobal = false; // Prevent redundant stats loads across remounts

// Prefetch lazy chunks + API data in background after initial render
// This ensures Mall/Cash Store are ready BEFORE the user taps the tab
const prefetchTabsRef = { done: false };
function prefetchOtherTabs() {
  if (prefetchTabsRef.done) return;
  prefetchTabsRef.done = true;

  // Prefetch JS chunks (import() caches the module — next React.lazy render is instant)
  import('@/components/mall/MallSectionContainer').catch(() => {});
  import('@/components/mall/MallHeaderWrapper').catch(() => {});
  import('@/components/cash-store/CashStoreHeaderWrapper').catch(() => {});
  import('@/components/cash-store/CashStoreSectionContainer').catch(() => {});

  // Prefetch API data (backend caches in Redis — first call warms it)
  import('@/services/mallApi').then(m => m.mallApi.getMallHomepageBatch().catch(() => {})).catch(() => {});
  import('@/services/cashStoreApi').then(m => m.default.getHomepageData().catch(() => {})).catch(() => {});

  // Prefetch top homepage product/store images into expo-image disk cache
  import('@/services/homepageDataService').then(m => {
    const service = m.default;
    if (service && typeof service.getCachedSections === 'function') {
      const sections = service.getCachedSections?.();
      if (sections) {
        const imageUrls: string[] = [];
        for (const section of sections) {
          const items = (section as any).items || (section as any).data || [];
          for (const item of items.slice(0, 10)) {
            const url = item.image || item.imageUrl || item.logo || item.banner?.[0];
            if (url && typeof url === 'string' && url.startsWith('http')) {
              imageUrls.push(url);
            }
            if (imageUrls.length >= 15) break;
          }
          if (imageUrls.length >= 15) break;
        }
        if (imageUrls.length > 0) {
          prefetchImages(imageUrls);
        }
      }
    }
  }).catch(() => {});
}

// Tab content loading fallback — static styles to avoid creating objects per render
const fallbackStyles = StyleSheet.create({
  container: { flex: 1, paddingTop: spacing.lg, paddingHorizontal: spacing.base, gap: spacing.base },
  bar1: { height: 24, width: 160, backgroundColor: colors.border.default, borderRadius: borderRadius.sm },
  hero: { height: 120, backgroundColor: colors.gray[50], borderRadius: borderRadius.lg },
  bar2: { height: 24, width: 200, backgroundColor: colors.border.default, borderRadius: borderRadius.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  card: { height: 100, flex: 1, backgroundColor: colors.gray[50], borderRadius: borderRadius.md },
  footer: { height: 80, backgroundColor: colors.gray[50], borderRadius: borderRadius.md },
});
const TabContentFallback = React.memo(() => (
  <View style={fallbackStyles.container}>
    <View style={fallbackStyles.bar1} />
    <View style={fallbackStyles.hero} />
    <View style={fallbackStyles.bar2} />
    <View style={fallbackStyles.row}>
      <View style={fallbackStyles.card} />
      <View style={fallbackStyles.card} />
      <View style={fallbackStyles.card} />
    </View>
    <View style={fallbackStyles.footer} />
  </View>
));

// Fallback components for Suspense boundaries
const ModalFallback = () => null;
const FABFallback = () => null;


// Badge/Shield shaped avatar component - View-based (no SVG dependency)
interface BadgeAvatarProps {
  size?: number;
  color?: string;
}

const BadgeAvatar: React.FC<BadgeAvatarProps> = React.memo(({ size = 24, color }) => {
  const shieldColor = color || colors.lightMustard;
  const iconColor = color === '#0284C7' ? '#0EA5E9' : color === '#C9A962' ? '#D4AF37' : colors.nileBlue;

  return (
    <View style={{
      width: size,
      height: size * 1.15,
      backgroundColor: shieldColor,
      borderTopLeftRadius: size * 0.15,
      borderTopRightRadius: size * 0.15,
      borderBottomLeftRadius: size * 0.45,
      borderBottomRightRadius: size * 0.45,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: size * 0.05,
    }}>
      <Ionicons name="person" size={size * 0.5} color={iconColor} />
    </View>
  );
});

export default function HomeScreen() {
  const router = useRouter();
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const { state, actions, getUserContext: getHomepageUserContext } = useHomepage();
  const { handleItemPress, handleAddToCart } = useHomepageNavigation();
  const { user, isModalVisible, showModal, hideModal } = useProfile();
  const { handleMenuItemPress } = useProfileMenu();
  const { state: cartState, refreshCart } = useCart();
  const { state: authState, actions: authActions } = useAuth();
  const { rezBalance: userPoints, savingsInsights, refreshWallet, isLoading: isWalletLoading, walletData } = useWalletContext();
  const totalSaved = savingsInsights.totalSaved;
  // Get mode context for 4-mode system
  const {
    activeTab,
    setActiveTab,
    priveEligibility,
    isPriveEligible,
    activeHomeTab,
    setActiveHomeTab,
    registerScrollToTop,
  } = useHomeTab();
  const [refreshing, setRefreshing] = React.useState(false);
  const [showDetailedLocation, setShowDetailedLocation] = React.useState(false);
  // On web, InteractionManager resolves synchronously — start as true to avoid an extra re-render
  const [interactionsComplete, setInteractionsComplete] = React.useState(Platform.OS === 'web');
  const [pushReady, setPushReady] = React.useState(false); // Deferred push notification init
  const [selectedCategory, setSelectedCategory] = React.useState('for-you'); // Category tab state
  // activeTab now comes directly from useHomeTab() context
  // Batched stats state — single setState for voucher + offers count to reduce re-renders
  const [statsState, setStatsState] = React.useState({ voucherCount: 0, newOffersCount: 0 });
  const voucherCount = statsState.voucherCount;
  const newOffersCount = statsState.newOffersCount;
  const [isLocationModalVisible, setIsLocationModalVisible] = React.useState(false); // Location picker modal
  // Deferred location prompt — shown to users who skipped location during onboarding
  const { permissionStatus, requestPermission: requestLocPermission } = useLocationPermission();
  const [locationBannerDismissed, setLocationBannerDismissed] = React.useState(true); // default hidden
  React.useEffect(() => {
    if (permissionStatus === 'granted' || permissionStatus === 'denied') return;
    // Check if user already dismissed the banner
    import('@react-native-async-storage/async-storage').then(({ default: AS }) =>
      AS.getItem('location_banner_dismissed').then(v => {
        if (v !== 'true') setLocationBannerDismissed(false);
      })
    ).catch(() => {});
  }, [permissionStatus]);

  // Handler for tab changes
  const handleTabChange = React.useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, [setActiveTab]);

  // Get current location hook for editable location
  const { currentLocation, updateLocation: updateUserLocation } = useCurrentLocation();

  // Get recently viewed items
  const { items: recentlyViewedItems, isLoading: isLoadingRecentlyViewed, refresh: refreshRecentlyViewed } = useRecentlyViewed();

  // Get loyalty section data for homepage cards - only fetch when near-u tab is active
  const {
    loyaltyHub,
    featuredLockProduct,
    trendingService,
    isLoading: isLoyaltySectionLoading
  } = useLoyaltySection({ autoFetch: activeTab === 'near-u' });

  const animatedHeight = React.useRef(new Animated.Value(0)).current;
  const animatedOpacity = React.useRef(new Animated.Value(0)).current;
  const scrollY = React.useRef(new Animated.Value(0)).current; // For sticky header
  const statsLoadedRef = React.useRef(_statsLoadedGlobal); // Sync with module-level flag
  const lastFocusRefreshRef = React.useRef(_lastFocusRefreshTime); // Sync with module-level timestamp
  const scrollViewRef = React.useRef<any>(null); // ScrollView ref for scrollToTop

  // Register scroll to top callback
  React.useEffect(() => {
    registerScrollToTop(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, [registerScrollToTop]);

  // Defer heavy renders until after animations complete, then prefetch other tabs
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      // Already set to true on web — just prefetch in background
      const webTimer = setTimeout(prefetchOtherTabs, 1000);
      return () => clearTimeout(webTimer);
    }
    let prefetchTimer: ReturnType<typeof setTimeout>;
    const handle = InteractionManager.runAfterInteractions(() => {
      setInteractionsComplete(true);
      // After Near U renders, prefetch Mall/Cash Store JS chunks + API data in background
      prefetchTimer = setTimeout(prefetchOtherTabs, 1000);
    });

    return () => {
      handle.cancel();
      if (prefetchTimer) clearTimeout(prefetchTimer);
    };
  }, []);

  // Defer push notification init by 3 seconds after mount
  React.useEffect(() => {
    const timer = setTimeout(() => setPushReady(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-complete onboarding for users who reached /(tabs) via shortcut path
  // (Android location-denied → notification-permission → tabs, skipping transactions-preview)
  // This triggers all deferred context providers to initialize
  const onboardingCompletedRef = React.useRef(false);
  React.useEffect(() => {
    if (authState.isAuthenticated && authState.user && !authState.user.isOnboarded && !onboardingCompletedRef.current) {
      onboardingCompletedRef.current = true;
      authActions.completeOnboarding({
        preferences: {
          notifications: { push: true, email: true, sms: true },
          currency: 'AED',
          language: 'en',
        },
      }).catch(() => {
        // If completeOnboarding API fails, reset so it can retry on next render
        onboardingCompletedRef.current = false;
      });
    }
  }, [authState.isAuthenticated, authState.user]);

  // Load supplementary homepage data (wallet balance comes from WalletContext)
  const loadUserContext = useCallback(async () => {
    if (!authState.isAuthenticated || !authState.user) {
      setStatsState({ voucherCount: 0, newOffersCount: 0 });
      return;
    }

    // First, try to use userContext from homepage batch response (already fetched, no extra API call)
    const batchContext = getHomepageUserContext();
    if (batchContext) {
      setStatsState({
        voucherCount: batchContext.voucherCount || 0,
        newOffersCount: batchContext.offersCount || 0,
      });
      return;
    }

    // Fallback: separate API call if batch didn't include userContext (e.g., not authenticated during batch)
    const contextResult = await HomepageCacheWarmer.getUserContext()
      .then(r => ({ status: 'fulfilled' as const, value: r }))
      .catch(e => ({ status: 'rejected' as const, reason: e }));

    if (contextResult.status === 'fulfilled' && contextResult.value.success && contextResult.value.data) {
      setStatsState({
        voucherCount: contextResult.value.data.voucherCount || 0,
        newOffersCount: contextResult.value.data.offersCount || 0,
      });
    }
  }, [authState.isAuthenticated, authState.user, getHomepageUserContext]);

  // Load user context once after interactions complete + authenticated
  React.useEffect(() => {
    if (interactionsComplete && authState.isAuthenticated && !statsLoadedRef.current) {
      statsLoadedRef.current = true;
      _statsLoadedGlobal = true; // Module-level — survives remounts
      loadUserContext();
    }
    // Reset flag on logout so next login triggers a fresh load
    if (!authState.isAuthenticated) {
      statsLoadedRef.current = false;
      _statsLoadedGlobal = false;
    }
  }, [authState.isAuthenticated, interactionsComplete, loadUserContext]);

  // Refresh all dynamic data when screen comes into focus (throttled to prevent continuous refreshing)
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      // Use module-level timestamp to survive remounts from DeferredProviders
      const timeSinceLastRefresh = now - _lastFocusRefreshTime;

      // Throttle focus refreshes: only refresh if more than 60 seconds since last
      // (homepage data is cached server-side for 5min, so refreshing more often is wasteful)
      if (timeSinceLastRefresh < 60000) {
        return;
      }

      lastFocusRefreshRef.current = now;
      _lastFocusRefreshTime = now; // Module-level — survives remounts

      // Refresh recently viewed items when returning to homepage
      refreshRecentlyViewed();

      // Only refresh user data if authenticated
      if (authState.user && authState.isAuthenticated) {
        // Single API call for wallet, vouchers, offers, cart, subscription
        loadUserContext();

        // Refresh cart context (for badge updates from context)
        refreshCart();
      }
    }, [authState.user, authState.isAuthenticated, refreshCart, refreshRecentlyViewed, loadUserContext])
  );


  // Auth status check removed — AuthContext already calls checkAuthStatus on mount.
  // Calling it again here caused a redundant AUTH_LOADING→AUTH_SUCCESS cycle = flicker.

  // Debug function removed for production

  // Debug user and modal state (removed for production)

  const handleRefresh = React.useCallback(
    async () => {
      setRefreshing(true);
      // Reset dedup timers so explicit refresh always works
      _lastFocusRefreshTime = 0;
      _statsLoadedGlobal = false;
      statsLoadedRef.current = false;
      try {
        // Refresh sections first (visual feedback) — force=true bypasses dedup
        await actions.refreshAllSections(true);

        // Refresh all user data in background (non-blocking)
        if (authState.user && authState.isAuthenticated) {
          // Single API call for all user-specific data
          loadUserContext().catch(() => {});

          // Refresh cart context
          refreshCart();

          // Refresh recently viewed
          refreshRecentlyViewed();
        }
      } catch (error) {
        // silently handle
      } finally {
        setRefreshing(false);
      }
    },
    [actions, authState.user, authState.isAuthenticated, loadUserContext, refreshCart, refreshRecentlyViewed]);

  const handleSearchPress = useCallback(() => {
    router.push('/search');
  }, [router]);

  const handleCoinPress = useCallback(() => {
    if (Platform.OS === 'ios') {
      setTimeout(() => router.push('/coins'), 50);
    } else {
      router.push('/coins');
    }
  }, [router]);

  const handlePriveLockedPress = useCallback(() => {
    router.push('/prive/eligibility');
  }, [router]);

  // Handle location selection from the picker modal
  const handleLocationSelect = async (selectedLocation: AddressSearchResult) => {
    try {
      const coordinates = {
        latitude: selectedLocation.coordinates.latitude,
        longitude: selectedLocation.coordinates.longitude,
      };
      // Pass city/state/pincode from search results
      await updateUserLocation(coordinates, selectedLocation.formattedAddress, 'manual', {
        city: selectedLocation.city,
        state: selectedLocation.state,
        pincode: selectedLocation.pincode,
      });
      setIsLocationModalVisible(false);
    } catch (error) {
      platformAlertSimple('Error', 'Failed to update location. Please try again.');
    }
  };

  // Memoize gradient colors to avoid new array allocation on every scroll frame
  const gradientColors = useMemo((): string[] => {
    switch (activeTab) {
      case 'prive': return ['#1F2937', '#1F2937', '#111827', '#111827'];
      case 'mall': return ['#BAE6FD', '#E0F2FE', '#F0F9FF', colors.background.primary];
      case 'cash': return [colors.lightPeach, '#FFE5D0', '#FFF0E6', colors.background.primary];
      default: return ['#ffe8a8', '#fff0c4', colors.linen, colors.background.primary];
    }
  }, [activeTab]);

  // Show full-page skeleton while initial data is loading
  // This prevents layout shift and provides instant visual feedback
  if (!interactionsComplete && state.loading) {
    return <HomepageSkeleton />;
  }

  return (
    <View style={viewStyles.mainContainer}>
      <Animated.ScrollView
        ref={scrollViewRef}
        style={viewStyles.container}
        contentContainerStyle={viewStyles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={Platform.OS === 'android' ? 32 : 16}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.lightMustard} colors={[colors.lightMustard]} />
        }
      >
      {/* Header - Dynamic gradient based on active tab */}
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={viewStyles.header}
      >
        <View style={viewStyles.headerTop}>
          {/* Modern Location Pill - Tap to expand details */}
          <Pressable
            style={viewStyles.locationPill}
            onPress={() => {
              const newState = !showDetailedLocation;
              setShowDetailedLocation(newState);

              // Smooth animation for expand/collapse
              Animated.parallel([
                Animated.timing(animatedHeight, {
                  toValue: newState ? 1 : 0,
                  duration: 300,
                  useNativeDriver: false,
                }),
                Animated.timing(animatedOpacity, {
                  toValue: newState ? 1 : 0,
                  duration: 300,
                  useNativeDriver: false,
                }),
              ]).start();
            }}
            accessibilityLabel="Current location"
            accessibilityHint={showDetailedLocation ? "Tap to collapse location details" : "Tap to expand location details"}
            accessibilityState={{ expanded: showDetailedLocation }}
          >
            <View style={[
              viewStyles.locationIconWrapper,
              activeTab === 'prive' && { backgroundColor: '#C9A962' },
              activeTab === 'mall' && { backgroundColor: '#0284C7' },
              activeTab === 'cash' && { backgroundColor: '#D4A07A' }
            ]}>
              <Ionicons name="location" size={14} color={colors.text.inverse} />
            </View>
            <LocationDisplay
              compact={true}
              showCoordinates={false}
              showLastUpdated={false}
              showRefreshButton={false}
              style={viewStyles.locationDisplay}
              textStyle={activeTab === 'prive' ? { color: colors.text.inverse, ...typography.body, fontWeight: '600' } : textStyles.locationText}
            />
            <View style={viewStyles.locationChevron}>
              <Ionicons
                name={showDetailedLocation ? "chevron-up" : "chevron-down"}
                size={14}
                color={activeTab === 'prive' ? '#C9A962' : activeTab === 'mall' ? '#0284C7' : activeTab === 'cash' ? '#D4A07A' : colors.text.tertiary}
              />
            </View>
          </Pressable>

          {/* Modern Header Actions */}
          <View style={viewStyles.headerActions}>
            {/* Coin Balance Display - Horizontal Pill Style */}
            <Pressable
              onPress={() => {
                if (Platform.OS === 'ios') {
                  setTimeout(() => router.push('/coins'), 50);
                } else {
                  router.push('/coins');
                }
              }}
             
              style={[
                viewStyles.headerCoinContainer,
                activeTab === 'prive' && { backgroundColor: 'rgba(201, 169, 98, 0.2)', borderColor: 'rgba(201, 169, 98, 0.4)' },
                activeTab === 'mall' && { backgroundColor: 'rgba(2, 132, 199, 0.15)', borderColor: 'rgba(2, 132, 199, 0.3)' },
                activeTab === 'cash' && { backgroundColor: 'rgba(212, 160, 122, 0.15)', borderColor: 'rgba(212, 160, 122, 0.3)' }
              ]}
            >
              <CachedImage
                source={BRAND.COIN_IMAGE}
                style={viewStyles.headerCoinImage}
                contentFit="contain"
                showShimmer={false}
              />
              <Text style={[
                viewStyles.headerCoinText, 
                activeTab === 'prive' && { color: '#C9A962' },
                activeTab === 'mall' && { color: '#0284C7' },
                activeTab === 'cash' && { color: '#D4A07A' }
              ]}>{!walletData && isWalletLoading ? '...' : userPoints}</Text>
            </Pressable>

            {/* What's New Badge */}
            <WhatsNewBadge
              onPress={() => router.push('/whats-new')}
              style={viewStyles.whatsNewBadge}
              variant={activeTab === 'mall' ? 'blue' : activeTab === 'prive' ? 'gold' : 'green'}
            />

            {/* Cart Button with Modern Badge */}
            <Pressable
              onPress={() => {
                if (Platform.OS === 'ios') {
                  setTimeout(() => router.push('/cart'), 50);
                } else {
                  router.push('/cart');
                }
              }}
             
              accessibilityLabel={`Shopping cart: ${cartState.totalItems} items`}
              accessibilityRole="button"
              accessibilityHint="Double tap to view your shopping cart"
              style={viewStyles.headerIconButton}
            >
              <Ionicons name="cart-outline" size={24} color={activeTab === 'prive' ? colors.text.inverse : activeTab === 'mall' ? '#0284C7' : colors.text.primary} />
              {cartState.totalItems > 0 && (
                <LinearGradient
                  colors={[colors.error, '#FF5252']}
                  style={viewStyles.cartBadgeModern}
                >
                  <Text style={viewStyles.cartBadgeTextModern}>
                    {cartState.totalItems > 9 ? '9+' : cartState.totalItems}
                  </Text>
                </LinearGradient>
              )}
            </Pressable>

            {/* Notification Bell */}
            <Pressable
              onPress={() => router.push('/account/notification-history' as any)}
             
              accessibilityLabel="Notifications"
              accessibilityRole="button"
              style={viewStyles.headerIconButton}
            >
              <Ionicons name="notifications-outline" size={22} color={activeTab === 'prive' ? colors.text.inverse : activeTab === 'mall' ? '#0284C7' : colors.text.primary} />
            </Pressable>

            {/* Profile Badge Avatar with Savings - Badge then text pill */}
            <Pressable
              onPress={() => {
                if (authState.isAuthenticated && authState.user) {
                  showModal();
                }
              }}
             
              accessibilityLabel="User profile menu"
              accessibilityRole="button"
              accessibilityHint="Double tap to open profile menu and account settings"
              style={viewStyles.profileSavingsContainer}
            >
              {/* Text pill - on left */}
              <View style={[
                viewStyles.savedTextPill,
                activeTab === 'prive' && { backgroundColor: 'rgba(201, 169, 98, 0.25)' },
                activeTab === 'mall' && { backgroundColor: 'rgba(2, 132, 199, 0.2)' },
                activeTab === 'cash' && { backgroundColor: 'rgba(212, 160, 122, 0.2)' }
              ]}>
                <Text style={[
                  viewStyles.savedText,
                  activeTab === 'prive' && { color: '#C9A962' },
                  activeTab === 'mall' && { color: '#0284C7' },
                  activeTab === 'cash' && { color: '#D4A07A' }
                ]}>
                  {!walletData && isWalletLoading ? '...' : `${currencySymbol}${totalSaved} saved`}
                </Text>
              </View>
              {/* Badge on right - overlaps text slightly with negative margin */}
              <View style={viewStyles.badgeOverlay}>
                <BadgeAvatar color={activeTab === 'mall' ? '#0284C7' : activeTab === 'prive' ? '#C9A962' : activeTab === 'cash' ? '#D4A07A' : undefined} />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Detailed Location Section - Animated */}
        <Animated.View
          style={[
            viewStyles.detailedLocationContainer,
            {
              height: animatedHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 145], // Height for address and change button only
              }),
              opacity: animatedOpacity,
              overflow: 'hidden',
            },
          ]}
        >
          <View style={viewStyles.detailedLocationContent}>
            {/* Full Address Section */}
            <View style={viewStyles.addressSection}>
              <View style={viewStyles.addressHeader}>
                <Ionicons name="location" size={16} color={activeTab === 'mall' ? '#0284C7' : activeTab === 'cash' ? '#D4A07A' : colors.lightMustard} />
                <Text style={viewStyles.addressHeaderText}>Current Location</Text>
              </View>
              <LocationDisplay
                compact={false}
                showCoordinates={false}
                showLastUpdated={false}
                showRefreshButton={false}
                style={viewStyles.detailedLocationDisplay}
                textStyle={viewStyles.detailedLocationText}
              />
            </View>

            {/* Change Location Button */}
            <Pressable
              style={[
                viewStyles.changeLocationButton,
                activeTab === 'mall' && { 
                  backgroundColor: '#E0F2FE', 
                  borderColor: '#BAE6FD' 
                }
              ]}
              onPress={() => {
                setShowDetailedLocation(false);
                // Collapse animation then open modal
                Animated.parallel([
                  Animated.timing(animatedHeight, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: false,
                  }),
                  Animated.timing(animatedOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: false,
                  }),
                ]).start(() => {
                  setIsLocationModalVisible(true);
                });
              }}
             
            >
              <View style={[
                viewStyles.changeLocationIconWrapper,
                activeTab === 'mall' && { backgroundColor: '#0EA5E9' }
              ]}>
                <Ionicons name="search" size={12} color={colors.text.inverse} />
              </View>
              <Text style={viewStyles.changeLocationText}>Change Location</Text>
              <Ionicons name="chevron-forward" size={14} color={activeTab === 'mall' ? '#0284C7' : activeTab === 'cash' ? '#D4A07A' : colors.lightMustard} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Hero Banner - Dynamic content based on user - Only show when "near-u" tab is active */}
        {activeTab === 'near-u' && <HeroBanner totalSaved={totalSaved} />}

        {/* Mall Hero Banner */}
        {activeTab === 'mall' && (
          <Suspense fallback={<View style={{ height: 185 }} />}>
            <MallHeaderWrapper />
          </Suspense>
        )}

        {/* Cash Store Header */}
        {activeTab === 'cash' && (
          <Suspense fallback={<View style={{ height: 60 }} />}>
            <CashStoreHeaderWrapper />
          </Suspense>
        )}

        {/* Privé Member Card */}
        {activeTab === 'prive' && (
          <Suspense fallback={<View style={{ height: 60 }} />}>
            <PriveHeaderWrapper />
          </Suspense>
        )}

        </LinearGradient>

      {/* Home Tab Section with 4 Tabs - Outside gradient */}
      <HomeTabSection
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isPriveEligible={isPriveEligible}
        onPriveLockedPress={handlePriveLockedPress}
        onSearchPress={handleSearchPress}
        coinBalance={userPoints}
        onCoinPress={handleCoinPress}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Deferred location permission banner */}
      {!locationBannerDismissed && permissionStatus !== 'granted' && permissionStatus !== 'denied' && (
        <View style={viewStyles.locationBanner}>
          <Ionicons name="location" size={20} color={colors.lightMustard} />
          <Text style={viewStyles.locationBannerText}>
            Enable location to find deals near you
          </Text>
          <Pressable
            style={viewStyles.locationBannerBtn}
            onPress={async () => {
              await requestLocPermission();
              setLocationBannerDismissed(true);
            }}
          >
            <Text style={viewStyles.locationBannerBtnText}>Enable</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              setLocationBannerDismissed(true);
              const { default: AS } = await import('@react-native-async-storage/async-storage');
              AS.setItem('location_banner_dismissed', 'true').catch(() => {});
            }}
            hitSlop={8}
          >
            <Ionicons name="close" size={18} color={colors.text.tertiary} />
          </Pressable>
        </View>
      )}

      {/* Content */}
      <View style={[
        viewStyles.content,
        activeTab === 'mall' && viewStyles.mallContent,
        activeTab === 'cash' && viewStyles.cashStoreContent,
        activeTab === 'prive' && viewStyles.priveContent
      ]}>
        {/* Near-U Tab Content - All sections with viewport-based lazy loading */}
        {activeTab === 'near-u' && (
          <NearUTabContent
            state={state}
            actions={actions}
            handleItemPress={handleItemPress}
            handleAddToCart={handleAddToCart}
            voucherCount={voucherCount}
            userPoints={userPoints}
            newOffersCount={newOffersCount}
            recentlyViewedItems={recentlyViewedItems}
            isLoadingRecentlyViewed={isLoadingRecentlyViewed}
            loyaltyHub={loyaltyHub}
            featuredLockProduct={featuredLockProduct}
            trendingService={trendingService}
            isLoyaltySectionLoading={isLoyaltySectionLoading}
            scrollY={scrollY}
          />
        )}



        {/* Mall Tab Content */}
        {activeTab === 'mall' && (
          <Suspense fallback={<TabContentFallback />}>
            <MallSectionContainer />
          </Suspense>
        )}

        {/* Cash Store Tab Content */}
        {activeTab === 'cash' && (
          <Suspense fallback={<TabContentFallback />}>
            <CashStoreSectionContainer />
          </Suspense>
        )}

        {/* Privé Tab Content */}
        {activeTab === 'prive' && (
          <Suspense fallback={<TabContentFallback />}>
            <PriveSectionContainer />
          </Suspense>
        )}
      </View>

      {/* Profile Menu Modal - Lazy Loaded */}
      {user && (
        <Suspense fallback={<ModalFallback />}>
          <ProfileMenuModal visible={isModalVisible} onClose={hideModal} user={user} menuSections={profileMenuSections} onMenuItemPress={handleMenuItemPress} />
        </Suspense>
      )}

      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        onLocationSelect={handleLocationSelect}
        currentLocation={currentLocation}
      />

      {/* Quick Access FAB - Lazy Loaded */}
      <Suspense fallback={<FABFallback />}>
        <QuickAccessFAB />
      </Suspense>

      {/* Push Notification Init - deferred 3s after mount */}
      {pushReady && (
        <Suspense fallback={null}>
          <PushNotificationInitializer />
        </Suspense>
      )}
      </Animated.ScrollView>

      {/* Sticky Search Header with Glass Effect - Rendered after ScrollView to avoid blocking touches */}
      {/* showThreshold should be high enough so sticky header only appears after category section scrolls out of view */}
      {/* Hide for Privé tab as it has its own dark theme */}
      {activeTab !== 'prive' && (
        <StickySearchHeader
          scrollY={scrollY}
          showThreshold={580}
          onSearchPress={handleSearchPress}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      )}
    </View>
  );
}

/* ---------------------------
   Styles: split into textStyles and viewStyles
   --------------------------- */

const textStyles = StyleSheet.create({
  locationText: {
    color: colors.text.primary,
    ...typography.body,
    fontWeight: '600',
  },
});

const viewStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    ...Platform.select({
      web: {
        touchAction: 'pan-y', // Only handle vertical scrolling, let children handle horizontal
        WebkitOverflowScrolling: 'touch',
      },
    }),
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 120, // Ensure content is visible above bottom tab navbar
    ...Platform.select({
      web: {
        minHeight: '100%',
      },
    }),
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  // Modern Location Pill Style
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  locationIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.md,
    backgroundColor: colors.lightMustard,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  locationChevron: {
    marginLeft: spacing.xs,
  },
  // Modern Header Actions
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  // What's New Badge
  whatsNewBadge: {
    // aligned with other elements
  },
  // Header Coin - Horizontal Pill Style
  headerCoinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 200, 87, 0.18)',
    borderRadius: borderRadius.md,
    paddingVertical: 2,
    paddingLeft: 2,
    paddingRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 87, 0.35)',
    gap: 2,
  },
  headerCoinImage: {
    width: 18,
    height: 18,
  },
  headerCoinText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerIconButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadgeModern: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeTextModern: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: '700',
  },
  // Container for badge + text pill - badge overlaps pill
  profileSavingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Text pill with background - positioned to the left of badge
  savedTextPill: {
    backgroundColor: 'rgba(255, 200, 87, 0.35)',
    paddingLeft: 6,
    paddingRight: 4,
    paddingVertical: 2,
    borderRadius: 0,
    marginRight: -4,
    marginTop: -6,
  },
  // Badge overlay - overlaps text from right
  badgeOverlay: {
    zIndex: 1,
  },
  // Savings text - Nuqta Nile Blue
  savedText: {
    color: colors.nileBlue,
    fontSize: 8,
    fontWeight: '600',
  },
  locationDisplay: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    padding: 0,
  },
  detailedLocationContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.nileBlue,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
    borderWidth: 1,
    borderColor: 'rgba(255, 205, 87, 0.1)',
  },
  detailedLocationContent: {
    padding: spacing.base,
  },
  addressSection: {
    marginBottom: -10,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addressHeaderText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.nileBlue,
    marginLeft: 6,
  },
  changeLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successScale[50],
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  changeLocationIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.md,
    backgroundColor: colors.lightMustard,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  changeLocationText: {
    flex: 1,
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.lightMustard,
  },
  detailedLocationDisplay: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    padding: 0,
  },
  detailedLocationText: {
    color: colors.text.primary,
    ...typography.body,
    lineHeight: 20,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
    backgroundColor: colors.background.primary,
  },
  mallContent: {
    padding: 0,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  cashStoreContent: {
    padding: 0,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  priveContent: {
    padding: 0,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    gap: 8,
    ...shadows.subtle,
  },
  locationBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.primary,
  },
  locationBannerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.lightMustard,
    borderRadius: 8,
  },
  locationBannerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.nileBlue,
  },
});

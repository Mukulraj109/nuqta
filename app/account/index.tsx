// Account Settings Page — Redesigned
// Compact header, sticky segmented control, sectioned cards, dynamic insights,
// micro-interactions, skeleton loading, and production-ready design tokens.

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  RefreshControl,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import AccountTabs from '@/components/account/AccountTabs';
import SettingsItem from '@/components/account/SettingsItem';
import AccountSkeleton from '@/components/account/AccountSkeleton';
import useAccountData from '@/hooks/useAccountData';
import { useWalletContext } from '@/contexts/WalletContext';
import {
  AccountTabType,
  AccountSettingsCategory,
  AccountSection,
} from '@/types/account.types';
import { accountTabs } from '@/data/accountData';
import {
  Colors,
  Spacing,
  BorderRadius,
} from '@/constants/DesignSystem';
import analyticsService from '@/services/analyticsService';
import { BRAND } from '@/constants/brand';

// ---------------------------------------------------------------------------
// Section Card Component (memoized)
// ---------------------------------------------------------------------------

const SectionCard = React.memo(function SectionCard({
  section,
  onItemPress,
}: {
  section: AccountSection;
  onItemPress: (cat: AccountSettingsCategory) => void;
}) {
  return (
    <View style={styles.sectionContainer}>
      <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
      <View style={styles.sectionCard}>
        {section.items.map((item, idx) => (
          <SettingsItem
            key={item.id}
            category={item}
            onPress={onItemPress}
            isLast={idx === section.items.length - 1}
          />
        ))}
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Main Account Page
// ---------------------------------------------------------------------------

export default function AccountPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AccountTabType>('SETTINGS');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const { sections, loading, error, refreshing, refresh } =
    useAccountData(activeTab);

  // Wallet context for dynamic insights
  const { rezBalance } = useWalletContext();

  // Inject dynamic insights into sections
  const enrichedSections = useMemo(() => {
    if (!sections.length) return sections;
    return sections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        if (item.id === 'wallet' && rezBalance > 0) {
          return {
            ...item,
            insight: `${BRAND.CURRENCY_CODE} ${rezBalance.toLocaleString()} available`,
          };
        }
        return item;
      }),
    }));
  }, [sections, rezBalance]);

  // ---------- Handlers ----------

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const handleTabChange = useCallback(
    (tab: AccountTabType) => {
      if (tab === activeTab) return;
      analyticsService.track('account_tab_changed', { tab });

      // Fade out → switch → fade in
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
      }).start(() => {
        setActiveTab(tab);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start();
      });
    },
    [activeTab, fadeAnim]
  );

  const handleCategoryPress = useCallback(
    (category: AccountSettingsCategory) => {
      analyticsService.track('account_category_pressed', {
        categoryId: category.id,
        tab: activeTab,
      });

      switch (category.id) {
        case 'subscription':
          router.push('/subscription/manage');
          break;
        case 'delivery':
          router.push('/account/delivery');
          break;
        case 'payment':
          router.push('/account/payment');
          break;
        case 'wallet':
          router.push('/wallet');
          break;
        case 'voucher':
          router.push('/my-vouchers');
          break;
        case 'my_deals':
          router.push('/my-deals');
          break;
        case 'coupon':
          router.push('/account/coupons');
          break;
        case 'bill_upload':
          router.push('/bill-upload');
          break;
        case 'achievements':
          router.push('/profile/achievements');
          break;
        default:
          if (category.route) {
            router.push(category.route as any);
          }
          break;
      }
    },
    [activeTab, router]
  );

  // ---------- Render ----------

  const totalSections = enrichedSections.reduce(
    (sum, s) => sum + s.items.length,
    0
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.secondary[600]}
        translucent={true}
      />

      {/* Compact Gradient Header */}
      <LinearGradient
        colors={[Colors.secondary[600], Colors.secondary[700]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backButton}
            onPress={handleBackPress}
           
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>

          <ThemedText style={styles.headerTitle}>Account</ThemedText>

          <Pressable
            style={styles.headerAction}
            onPress={() => router.push('/account/settings')}
           
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Sticky Segmented Control */}
      <View style={styles.tabsWrapper}>
        <AccountTabs
          tabs={accountTabs.map((tab) => ({
            ...tab,
            isActive: tab.id === activeTab,
          }))}
          activeTab={activeTab}
          onTabPress={handleTabChange}
        />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={Colors.primary[500]}
            colors={[Colors.primary[500]]}
          />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Loading State */}
          {loading && <AccountSkeleton />}

          {/* Error State */}
          {!loading && error && (
            <View style={styles.errorContainer}>
              <View style={styles.errorIconBg}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={32}
                  color={Colors.gray[400]}
                />
              </View>
              <ThemedText style={styles.errorTitle}>
                Something went wrong
              </ThemedText>
              <ThemedText style={styles.errorMessage}>{error}</ThemedText>
              <Pressable style={styles.retryButton} onPress={refresh}>
                <ThemedText style={styles.retryText}>Try Again</ThemedText>
              </Pressable>
            </View>
          )}

          {/* Empty State */}
          {!loading && !error && totalSections === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="folder-open-outline"
                size={44}
                color={Colors.gray[400]}
              />
              <ThemedText style={styles.emptyText}>
                No items in this section
              </ThemedText>
            </View>
          )}

          {/* Section Cards */}
          {!loading &&
            enrichedSections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                onItemPress={handleCategoryPress}
              />
            ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },

  // Header
  header: {
    paddingBottom: 14,
    paddingHorizontal: Spacing.base,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerAction: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tabs
  tabsWrapper: {
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
  },

  // Section
  sectionContainer: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.base,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gray[600],
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...Platform.select({
      ios: {
        shadowColor: Colors.midnightNavy,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any,
    }),
  },

  // Error state
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.xl,
  },
  errorIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0EDE6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary[600],
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.gray[600],
    marginTop: Spacing.md,
  },
});

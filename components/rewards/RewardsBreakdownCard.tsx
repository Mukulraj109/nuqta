// RewardsBreakdownCard - Unified post-order rewards display
// Shows earned rewards, progress bar, and checklist of earnable actions

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/DesignTokens';
import { BRAND } from '@/constants/brand';
import { RewardChecklistItem } from '@/hooks/usePostOrderRewards';
import { colors } from '@/constants/theme';

interface RewardsBreakdownCardProps {
  totalEarned: number;
  totalPossible: number;
  progressPercent: number;
  checklistItems: RewardChecklistItem[];
  onReviewPress: () => void;
  onSharePress: () => void;
  currencySymbol?: string;
}

const COIN_IMAGE = BRAND.COIN_IMAGE;

function RewardsBreakdownCard({
  totalEarned,
  totalPossible,
  progressPercent,
  checklistItems,
  onReviewPress,
  onSharePress,
  currencySymbol = '',
}: RewardsBreakdownCardProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: progressPercent,
        duration: 800,
        delay: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [progressPercent]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const getItemIcon = (item: RewardChecklistItem): keyof typeof Ionicons.glyphMap => {
    switch (item.id) {
      case 'cashback': return 'wallet';
      case 'review': return 'star';
      case 'share': return 'share-social';
      default: return 'gift';
    }
  };

  const getItemAction = (item: RewardChecklistItem) => {
    switch (item.id) {
      case 'review': return onReviewPress;
      case 'share': return onSharePress;
      default: return undefined;
    }
  };

  const renderStatusBadge = (item: RewardChecklistItem) => {
    if (item.isLoading) {
      return (
        <View style={styles.statusBadgeLoading}>
          <ActivityIndicator size="small" color={COLORS.secondary[500]} />
        </View>
      );
    }

    switch (item.status) {
      case 'completed':
        return (
          <View style={styles.statusBadgeCompleted}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          </View>
        );
      case 'available': {
        const action = getItemAction(item);
        return action ? (
          <Pressable
            style={styles.statusBadgeAvailable}
            onPress={action}
           
            accessibilityRole="button"
          >
            <Text style={styles.statusBadgeAvailableText}>
              {item.id === 'share' ? 'Share' : 'Review'}
            </Text>
          </Pressable>
        ) : null;
      }
      case 'locked':
        return (
          <View style={styles.statusBadgeLocked}>
            <Ionicons name="lock-closed" size={14} color={COLORS.neutral[400]} />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <CachedImage source={COIN_IMAGE} style={styles.headerCoinImage} contentFit="contain" />
          <Text style={styles.headerTitle}>Your Rewards</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.totalEarnedValue}>{totalEarned}</Text>
          <Text style={styles.totalEarnedLabel}>{BRAND.CURRENCY_CODE} earned</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.progressText}>
          {totalEarned} of {totalPossible} {BRAND.CURRENCY_CODE} earned
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Earn More Label */}
      <Text style={styles.earnMoreLabel}>Earn More Coins</Text>

      {/* Checklist */}
      {checklistItems.map((item, index) => (
        <View
          key={item.id}
          style={[
            styles.checklistItem,
            index === checklistItems.length - 1 && styles.checklistItemLast,
          ]}
        >
          {/* Icon Circle */}
          <View
            style={[
              styles.itemIconCircle,
              item.status === 'completed' && styles.itemIconCircleCompleted,
              item.status === 'locked' && styles.itemIconCircleLocked,
            ]}
          >
            {item.status === 'completed' ? (
              <Ionicons name="checkmark" size={18} color={colors.success} />
            ) : (
              <Ionicons
                name={getItemIcon(item)}
                size={18}
                color={item.status === 'locked' ? COLORS.neutral[400] : COLORS.secondary[500]}
              />
            )}
          </View>

          {/* Content */}
          <View style={styles.itemContent}>
            <Text
              style={[
                styles.itemLabel,
                item.status === 'locked' && styles.itemLabelLocked,
              ]}
            >
              {item.label}
            </Text>
            <Text
              style={[
                styles.itemDescription,
                item.status === 'locked' && styles.itemDescriptionLocked,
              ]}
            >
              {item.description}
            </Text>
          </View>

          {/* Coin Amount + Status */}
          <View style={styles.itemRight}>
            {item.status !== 'completed' && item.id !== 'cashback' && (
              <View style={styles.coinBadge}>
                <CachedImage source={COIN_IMAGE} style={styles.coinBadgeImage} contentFit="contain" />
                <Text style={styles.coinBadgeText}>+{item.coinAmount}</Text>
              </View>
            )}
            {renderStatusBadge(item)}
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
    width: '100%',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.secondary[500],
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerCoinImage: {
    width: 28,
    height: 28,
  },
  headerTitle: {
    ...TYPOGRAPHY.h4,
    color: colors.background.primary,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  totalEarnedValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary[500],
    lineHeight: 26,
  },
  totalEarnedLabel: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Progress
  progressSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.neutral[200],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary[500],
    borderRadius: 4,
  },
  progressText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    textAlign: 'right',
    marginTop: 4,
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.border.light,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.xs,
  },
  // Earn More
  earnMoreLabel: {
    ...TYPOGRAPHY.overline,
    color: COLORS.text.secondary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  // Checklist
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  checklistItemLast: {
    borderBottomWidth: 0,
    paddingBottom: SPACING.lg,
  },
  // Icon Circle
  itemIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.neutral[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIconCircleCompleted: {
    backgroundColor: '#E8FFF3',
  },
  itemIconCircleLocked: {
    backgroundColor: colors.neutral[100],
  },
  // Content
  itemContent: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  itemLabelLocked: {
    color: COLORS.neutral[400],
  },
  itemDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  itemDescriptionLocked: {
    color: COLORS.neutral[400],
  },
  // Right side
  itemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  coinBadgeImage: {
    width: 16,
    height: 16,
  },
  coinBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary[500],
  },
  // Status badges
  statusBadgeCompleted: {
    padding: 2,
  },
  statusBadgeAvailable: {
    backgroundColor: COLORS.primary[500],
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
  },
  statusBadgeAvailableText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary[500],
  },
  statusBadgeLocked: {
    padding: 4,
  },
  statusBadgeLoading: {
    padding: 4,
  },
});

export default React.memo(RewardsBreakdownCard);

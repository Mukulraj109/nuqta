/**
 * Pay In Store - Success Screen
 *
 * Payment success confirmation with:
 * - Transaction summary
 * - Rewards earned (cashback, coins)
 * - Loyalty progress
 * - Social share prompt
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/DesignTokens';
import { SuccessScreenParams, PaymentRewards } from '@/types/storePayment.types';
import { useRewardPopup } from '@/contexts/RewardPopupContext';
import { useRegion } from '@/contexts/RegionContext';
import usePostOrderRewards from '@/hooks/usePostOrderRewards';
import RewardsBreakdownCard from '@/components/rewards/RewardsBreakdownCard';
import { BRAND } from '@/constants/brand';
import { colors } from '@/constants/theme';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<SuccessScreenParams>();
  const { paymentId, storeId, storeName, storeLogo, amount, coinsUsed, rewards: rewardsParam } = params;
  const { showCoinsEarned, showCashbackEarned, showRewardPopup } = useRewardPopup();
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  // Parse rewards - handle both old and new format
  const rawRewards = rewardsParam ? JSON.parse(rewardsParam) : {};
  const rewards: PaymentRewards = {
    cashbackEarned: rawRewards.cashbackEarned || rawRewards.cashback || 0,
    coinsEarned: rawRewards.coinsEarned || 0,
    bonusCoins: rawRewards.bonusCoins || 0,
    firstVisitBonus: rawRewards.firstVisitBonus || 0,
    loyaltyProgress: rawRewards.loyaltyProgress || {
      currentVisits: 0,
      nextMilestone: 5,
      milestoneReward: 'Bonus 50 Coins',
    },
  };

  const billAmount = parseFloat(amount || '0');
  const coinsRedeemed = parseInt(coinsUsed || '0', 10);

  // Post-order rewards hook
  // Pay-in-store: both review and share are immediately available
  // (user is physically at the store, transaction complete)
  const postRewards = usePostOrderRewards({
    orderId: paymentId,
    storeId: storeId,
    storeName: storeName,
    storeLogo: storeLogo,
    cashbackEarned: rewards.cashbackEarned,
    coinsEarned: rewards.coinsEarned,
    bonusCoins: rewards.bonusCoins,
    firstVisitBonus: rewards.firstVisitBonus,
    orderTotal: billAmount,
    // reviewAllowed defaults to true — user already experienced the store
  });

  // Animations
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const rewardsSlide = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Trigger haptic feedback
    if (Platform.OS !== 'web') {
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); } catch (e) {}
    }

    // Run animations
    Animated.sequence([
      Animated.spring(checkmarkScale, {
        toValue: 1,
        tension: 150,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(rewardsSlide, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Show reward popup after a short delay (let the success screen animate first)
    const popupTimer = setTimeout(() => {
      // Show coins earned popup if any coins were earned
      if (rewards.coinsEarned > 0) {
        showCoinsEarned(
          rewards.coinsEarned,
          `${BRAND.COIN_NAME} earned from purchase`,
          () => router.push('/wallet-screen')
        );
      }
      // Show cashback popup if any cashback was earned (after coins popup)
      else if (rewards.cashbackEarned > 0) {
        showCashbackEarned(
          rewards.cashbackEarned,
          `${currencySymbol}${rewards.cashbackEarned} added to your wallet`,
          () => router.push('/wallet-screen')
        );
      }
    }, 1500); // Show popup 1.5s after screen loads

    return () => clearTimeout(popupTimer);
  }, []);

  const handleViewReceipt = () => {
    router.push({
      pathname: '/transactions/[id]',
      params: { id: paymentId },
    });
  };

  const handleBackToHome = () => {
    router.replace('/(tabs)');
  };

  const loyaltyProgress = rewards.loyaltyProgress || {
    currentVisits: 0,
    nextMilestone: 5,
    milestoneReward: 'Bonus 50 Coins',
  };
  const progressPercent =
    loyaltyProgress.nextMilestone > 0
      ? (loyaltyProgress.currentVisits / loyaltyProgress.nextMilestone) * 100
      : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Animation */}
        <Animated.View
          style={[styles.successIconContainer, { transform: [{ scale: checkmarkScale }] }]}
        >
          <LinearGradient
            colors={[COLORS.success[400], COLORS.success[600]]}
            style={styles.successIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="checkmark" size={64} color={colors.background.primary} />
          </LinearGradient>
        </Animated.View>

        {/* Success Text */}
        <Animated.View style={[styles.successTextContainer, { opacity: contentOpacity }]}>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.successSubtitle}>
            Paid {currencySymbol}{billAmount.toFixed(0)} to {storeName}
          </Text>
          {coinsRedeemed > 0 && (
            <Text style={styles.coinsUsedText}>
              Used {coinsRedeemed} {BRAND.COIN_NAME}
            </Text>
          )}
          <Text style={styles.transactionId}>Transaction ID: {paymentId?.slice(-8).toUpperCase()}</Text>
        </Animated.View>

        {/* First Visit Bonus */}
        {rewards.firstVisitBonus != null && rewards.firstVisitBonus > 0 && (
          <Animated.View style={[styles.firstVisitCard, { opacity: contentOpacity }]}>
            <LinearGradient
              colors={[colors.tint.orange, colors.tint.amberLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.firstVisitGradient}
            >
              <View style={styles.firstVisitContent}>
                <Text style={styles.firstVisitEmoji}>🎊</Text>
                <View style={styles.firstVisitTextContainer}>
                  <Text style={styles.firstVisitTitle}>First Visit Bonus!</Text>
                  <Text style={styles.firstVisitSubtitle}>
                    You earned {rewards.firstVisitBonus} extra coins for your first payment here
                  </Text>
                </View>
                <View style={styles.firstVisitBadge}>
                  <Text style={styles.firstVisitBadgeText}>+{rewards.firstVisitBonus}</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Rewards Breakdown Card */}
        <Animated.View
          style={[
            { width: '100%', marginBottom: SPACING.lg },
            { opacity: contentOpacity, transform: [{ translateY: rewardsSlide }] },
          ]}
        >
          <RewardsBreakdownCard
            totalEarned={postRewards.totalEarned}
            totalPossible={postRewards.totalPossible}
            progressPercent={postRewards.progressPercent}
            checklistItems={postRewards.checklistItems}
            onReviewPress={postRewards.handleReview}
            onSharePress={postRewards.handleShare}
            currencySymbol={currencySymbol}
          />
        </Animated.View>

        {/* Loyalty Progress */}
        {loyaltyProgress.nextMilestone > 0 && (
          <Animated.View style={[styles.loyaltyCard, { opacity: contentOpacity }]}>
            <View style={styles.loyaltyHeader}>
              <Ionicons name="trophy-outline" size={20} color={COLORS.warning[500]} />
              <Text style={styles.loyaltyTitle}>Loyalty Progress</Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(progressPercent, 100)}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {loyaltyProgress.currentVisits} / {loyaltyProgress.nextMilestone} visits
              </Text>
            </View>

            {loyaltyProgress.milestoneReward && (
              <View style={styles.milestoneContainer}>
                <Ionicons name="gift" size={16} color={COLORS.secondary[500]} />
                <Text style={styles.milestoneText}>
                  Next reward: {loyaltyProgress.milestoneReward}
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Pressable style={styles.receiptButton} onPress={handleViewReceipt}>
          <Ionicons name="receipt-outline" size={20} color={COLORS.primary[500]} />
          <Text style={styles.receiptButtonText}>View Receipt</Text>
        </Pressable>

        <Pressable style={styles.homeButton} onPress={handleBackToHome}>
          <LinearGradient
            colors={[COLORS.primary[500], COLORS.primary[600]]}
            style={styles.homeButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  successIconContainer: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  successIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  successTextContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  successTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  successSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  coinsUsedText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary[600],
    marginTop: SPACING.xs,
  },
  transactionId: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    marginTop: SPACING.sm,
  },
  firstVisitCard: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  firstVisitGradient: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.warningScale[400],
  },
  firstVisitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  firstVisitEmoji: {
    fontSize: 28,
  },
  firstVisitTextContainer: {
    flex: 1,
  },
  firstVisitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.brand.amberDark,
    marginBottom: 2,
  },
  firstVisitSubtitle: {
    fontSize: 13,
    color: colors.brand.amberDeep,
    lineHeight: 18,
  },
  firstVisitBadge: {
    backgroundColor: colors.warningScale[400],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  firstVisitBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background.primary,
  },
  loyaltyCard: {
    width: '100%',
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  loyaltyTitle: {
    ...TYPOGRAPHY.button,
    color: COLORS.text.primary,
  },
  progressContainer: {
    marginBottom: SPACING.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.neutral[200],
    borderRadius: 4,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.warning[500],
    borderRadius: 4,
  },
  progressText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    textAlign: 'right',
  },
  milestoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.secondary[50],
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  milestoneText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.secondary[700],
  },
  bottomActions: {
    flexDirection: 'row',
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    backgroundColor: COLORS.background.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    gap: SPACING.md,
    ...SHADOWS.lg,
  },
  receiptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.primary[500],
    gap: SPACING.sm,
  },
  receiptButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary[500],
  },
  homeButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  homeButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  homeButtonText: {
    ...TYPOGRAPHY.button,
    color: colors.background.primary,
  },
});

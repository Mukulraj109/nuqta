/**
 * Store Info Card
 * 
 * Displays store details with membership badge and rewards banner
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/DesignTokens';
import { StoreMembership, MembershipTier } from '@/types/storePayment.types';

interface StoreInfoCardProps {
  storeName: string;
  storeLogo?: string;
  storeCategory?: string;
  membership?: StoreMembership | null;
}

const TIER_COLORS: Record<MembershipTier, { bg: string; text: string; icon: string }> = {
  new: { bg: COLORS.neutral[100], text: COLORS.neutral[700], icon: 'person-outline' },
  bronze: { bg: '#FDF2E9', text: '#B45309', icon: 'medal-outline' },
  silver: { bg: '#F3F4F6', text: '#4B5563', icon: 'medal' },
  gold: { bg: '#FEF3C7', text: '#B45309', icon: 'trophy' },
};

export const StoreInfoCard: React.FC<StoreInfoCardProps> = ({
  storeName,
  storeLogo,
  storeCategory,
  membership,
}) => {
  const tierStyle = membership ? TIER_COLORS[membership.tier] : TIER_COLORS.new;

  return (
    <View style={styles.container}>
      <View style={styles.storeRow}>
        <View style={styles.logoContainer}>
          {storeLogo ? (
            <CachedImage source={{ uri: storeLogo }} style={styles.logo} cachePolicy="memory-disk" />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="storefront" size={24} color={COLORS.neutral[400]} />
            </View>
          )}
        </View>
        
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{storeName}</Text>
          {storeCategory && (
            <Text style={styles.storeCategory}>{storeCategory}</Text>
          )}
        </View>

        {membership && (
          <View style={[styles.membershipBadge, { backgroundColor: tierStyle.bg }]}>
            <Ionicons name={tierStyle.icon as any} size={14} color={tierStyle.text} />
            <Text style={[styles.membershipText, { color: tierStyle.text }]}>
              {membership.tierName}
            </Text>
          </View>
        )}
      </View>

      {/* Rewards Banner */}
      <LinearGradient
        colors={[COLORS.primary[500], COLORS.primary[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.rewardsBanner}
      >
        <Ionicons name="gift" size={16} color="#FFFFFF" />
        <Text style={styles.rewardsText}>
          You're earning rewards on this purchase!
        </Text>
        {membership?.benefits.cashbackBonus && membership.benefits.cashbackBonus > 0 && (
          <View style={styles.bonusBadge}>
            <Text style={styles.bonusText}>+{membership.benefits.cashbackBonus}%</Text>
          </View>
        )}
      </LinearGradient>

      {/* Membership Progress */}
      {membership && membership.nextTier && membership.visitsToNextTier > 0 && (
        <View style={styles.progressRow}>
          <Ionicons name="trending-up" size={14} color={COLORS.info[500]} />
          <Text style={styles.progressText}>
            {membership.visitsToNextTier} more visits to become a {membership.nextTier}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoContainer: {
    marginRight: SPACING.md,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
  },
  storeCategory: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  membershipText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  rewardsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  rewardsText: {
    ...TYPOGRAPHY.bodySmall,
    color: '#FFFFFF',
    flex: 1,
  },
  bonusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  bonusText: {
    ...TYPOGRAPHY.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    gap: SPACING.xs,
  },
  progressText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.info[600],
  },
});

export default React.memo(StoreInfoCard);

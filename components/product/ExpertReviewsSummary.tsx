import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SPACING, TYPOGRAPHY, COLORS, BORDER_RADIUS } from '@/constants/DesignTokens';

interface ExpertReviewsSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: number[];
  onViewAll?: () => void;
}

export default function ExpertReviewsSummary({
  averageRating,
  totalReviews,
  ratingDistribution,
  onViewAll,
}: ExpertReviewsSummaryProps) {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Text key={index} style={styles.star}>
        {index < rating ? '⭐' : '☆'}
      </Text>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expert Rating</Text>
        <View style={styles.expertBadge}>
          <Text style={styles.expertBadgeText}>✓ {totalReviews} Experts</Text>
        </View>
      </View>

      <View style={styles.ratingSection}>
        <View style={styles.averageRatingBox}>
          <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
          <View style={styles.starsRow}>{renderStars(Math.round(averageRating))}</View>
          <Text style={styles.totalReviews}>Based on {totalReviews} reviews</Text>
        </View>

        <View style={styles.distributionBox}>
          {ratingDistribution.map((count, index) => {
            const stars = 5 - index;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            return (
              <View key={stars} style={styles.distributionRow}>
                <Text style={styles.starsLabel}>{stars}★</Text>
                <View style={styles.barContainer}>
                  <View
                    style={[styles.barFill, { width: `${percentage}%` }]}
                  />
                </View>
                <Text style={styles.countLabel}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {onViewAll && (
        <Pressable style={styles.viewAllButton} onPress={onViewAll}>
          <Text style={styles.viewAllText}>View All Expert Reviews</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
  },
  expertBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primary[500],
    borderRadius: BORDER_RADIUS.full,
  },
  expertBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },
  ratingSection: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  averageRatingBox: {
    alignItems: 'center',
    flex: 1,
  },
  averageRating: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary[500],
    marginBottom: SPACING.xs,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  star: {
    fontSize: 20,
  },
  totalReviews: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
  },
  distributionBox: {
    flex: 1,
    gap: SPACING.xs,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  starsLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    width: 30,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.neutral[200],
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.warning[500],
    borderRadius: BORDER_RADIUS.sm,
  },
  countLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    width: 25,
    textAlign: 'right',
  },
  viewAllButton: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  viewAllText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary[500],
  },
});

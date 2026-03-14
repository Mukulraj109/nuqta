import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { SPACING, TYPOGRAPHY, COLORS, BORDER_RADIUS } from '@/constants/DesignTokens';
import Card from '@/components/ui/Card';

interface ExpertReview {
  id: string;
  author: {
    name: string;
    title: string;
    company: string;
    avatar: string;
    verified: boolean;
  };
  rating: number;
  headline: string;
  content: string;
  pros: string[];
  cons: string[];
  verdict: string;
  publishedAt: Date;
  helpful: number;
  images?: string[];
}

interface ExpertReviewsProps {
  productId: string;
  reviews?: ExpertReview[];
  onMarkHelpful?: (reviewId: string) => void;
}

function ExpertReviews({
  productId,
  reviews = [],
  onMarkHelpful,
}: ExpertReviewsProps) {
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Text key={index} style={styles.star}>
        {index < rating ? '⭐' : '☆'}
      </Text>
    ));
  };

  if (reviews.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.emptyTitle}>No Expert Reviews Yet</Text>
        <Text style={styles.emptyMessage}>
          Expert reviews from industry professionals coming soon
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expert Reviews</Text>
        <View style={styles.expertBadge}>
          <Text style={styles.expertBadgeText}>✓ Verified Experts</Text>
        </View>
      </View>

      <ScrollView nestedScrollEnabled>
        {reviews.map((review) => {
          const isExpanded = expandedReview === review.id;
          const contentPreview = review.content.substring(0, 200);
          const showReadMore = review.content.length > 200;

          return (
            <Card
              key={review.id}
              variant="outlined"
              padding="md"
              style={styles.reviewCard}
            >
              {/* Author Info */}
              <View style={styles.authorSection}>
                <CachedImage
                  source={{ uri: review.author.avatar }}
                  style={styles.authorAvatar}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <View style={styles.authorInfo}>
                  <View style={styles.authorNameRow}>
                    <Text style={styles.authorName}>{review.author.name}</Text>
                    {review.author.verified && (
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedText}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.authorTitle}>{review.author.title}</Text>
                  <Text style={styles.authorCompany}>{review.author.company}</Text>
                  <Text style={styles.publishDate}>{formatDate(review.publishedAt)}</Text>
                </View>
              </View>

              {/* Rating */}
              <View style={styles.ratingSection}>
                <View style={styles.starsRow}>{renderStars(review.rating)}</View>
                <Text style={styles.ratingText}>{review.rating}/5</Text>
              </View>

              {/* Headline */}
              <Text style={styles.headline}>{review.headline}</Text>

              {/* Content */}
              <Text style={styles.content}>
                {isExpanded ? review.content : contentPreview}
                {!isExpanded && showReadMore && '...'}
              </Text>

              {showReadMore && (
                <Pressable
                  onPress={() =>
                    setExpandedReview(isExpanded ? null : review.id)
                  }
                >
                  <Text style={styles.readMore}>
                    {isExpanded ? 'Show Less' : 'Read More'}
                  </Text>
                </Pressable>
              )}

              {/* Pros & Cons */}
              <View style={styles.prosConsSection}>
                <View style={styles.prosColumn}>
                  <Text style={styles.prosConsTitle}>✓ Pros</Text>
                  {review.pros.map((pro, index) => (
                    <View key={index} style={styles.prosConsItem}>
                      <Text style={styles.prosBullet}>•</Text>
                      <Text style={styles.prosConsText}>{pro}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.consColumn}>
                  <Text style={styles.prosConsTitle}>✗ Cons</Text>
                  {review.cons.map((con, index) => (
                    <View key={index} style={styles.prosConsItem}>
                      <Text style={styles.consBullet}>•</Text>
                      <Text style={styles.prosConsText}>{con}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Verdict */}
              <View style={styles.verdictSection}>
                <Text style={styles.verdictLabel}>Expert Verdict</Text>
                <Text style={styles.verdictText}>{review.verdict}</Text>
              </View>

              {/* Images */}
              {review.images && review.images.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imagesScroll}
                >
                  {review.images.map((image, index) => (
                    <CachedImage
                      key={index}
                      source={{ uri: image }}
                      style={styles.reviewImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ))}
                </ScrollView>
              )}

              {/* Helpful Button */}
              <View style={styles.actionsRow}>
                <Pressable
                  style={styles.helpfulButton}
                  onPress={() => onMarkHelpful?.(review.id)}
                >
                  <Text style={styles.helpfulIcon}>👍</Text>
                  <Text style={styles.helpfulText}>
                    Helpful ({review.helpful})
                  </Text>
                </Pressable>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h3,
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
  reviewCard: {
    marginBottom: SPACING.md,
  },
  authorSection: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  authorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.background.secondary,
  },
  authorInfo: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  authorName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '700',
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: COLORS.text.inverse,
    fontSize: 12,
    fontWeight: '700',
  },
  authorTitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  authorCompany: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.tertiary,
  },
  publishDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    marginTop: SPACING.xs,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  starsRow: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 20,
  },
  ratingText: {
    ...TYPOGRAPHY.button,
    color: COLORS.warning[700],
  },
  headline: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  content: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
  readMore: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary[500],
    marginBottom: SPACING.md,
  },
  prosConsSection: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginVertical: SPACING.md,
  },
  prosColumn: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.success[50],
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success[500],
  },
  consColumn: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.error[50],
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error[500],
  },
  prosConsTitle: {
    ...TYPOGRAPHY.button,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  prosConsItem: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  prosBullet: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.success[700],
    fontWeight: '700',
  },
  consBullet: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.error[700],
    fontWeight: '700',
  },
  prosConsText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    flex: 1,
  },
  verdictSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.primary[50],
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary[500],
    marginBottom: SPACING.md,
  },
  verdictLabel: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary[700],
    marginBottom: SPACING.xs,
  },
  verdictText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontStyle: 'italic',
  },
  imagesScroll: {
    marginBottom: SPACING.md,
  },
  reviewImage: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.md,
    marginRight: SPACING.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
  },
  helpfulIcon: {
    fontSize: 16,
  },
  helpfulText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  emptyMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});

export default React.memo(ExpertReviews);

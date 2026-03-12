import { useMemo } from 'react';
import { ReviewStats, RatingDistribution } from '@/types/review.types';

interface UseReviewStatsReturn {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution[];
  ratingPercentages: { [key: number]: number };
  hasReviews: boolean;
  formattedAverage: string;
}

/**
 * Custom hook to calculate and format review statistics
 * @param stats - ReviewStats object from API
 * @returns Calculated review statistics and formatting helpers
 */
export function useReviewStats(stats: ReviewStats | null | undefined): UseReviewStatsReturn {
  const calculated = useMemo(() => {
    if (!stats) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: [],
        ratingPercentages: {},
        hasReviews: false,
        formattedAverage: '0.0',
      };
    }

    const { average, count, distribution } = stats;

    // Calculate percentages for each rating
    const ratingPercentages: { [key: number]: number } = {};
    for (let i = 1; i <= 5; i++) {
      const ratingCount = distribution[i as keyof typeof distribution] || 0;
      ratingPercentages[i] = count > 0 ? (ratingCount / count) * 100 : 0;
    }

    // Create rating distribution array (sorted from 5 to 1)
    const ratingDistribution: RatingDistribution[] = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: distribution[rating as keyof typeof distribution] || 0,
      percentage: ratingPercentages[rating],
    }));

    return {
      averageRating: average,
      totalReviews: count,
      ratingDistribution,
      ratingPercentages,
      hasReviews: count > 0,
      formattedAverage: average.toFixed(1),
    };
  }, [stats]);

  return calculated;
}

/**
 * Get a text description of the average rating
 */
export function getRatingDescription(rating: number): string {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 4.0) return 'Very Good';
  if (rating >= 3.0) return 'Good';
  if (rating >= 2.0) return 'Fair';
  if (rating >= 1.0) return 'Poor';
  return 'No ratings yet';
}

/**
 * Get color based on rating value
 */
export function getRatingColor(rating: number): string {
  if (rating >= 4.0) return '#10B981'; // Green
  if (rating >= 3.0) return '#F59E0B'; // Yellow
  if (rating >= 2.0) return '#F97316'; // Orange
  return '#EF4444'; // Red
}

/**
 * Format review count for display
 */
export function formatReviewCount(count: number): string {
  if (count === 0) return 'No reviews';
  if (count === 1) return '1 review';
  if (count < 1000) return `${count} reviews`;
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k reviews`;
  return `${(count / 1000000).toFixed(1)}M reviews`;
}

/**
 * Calculate rating insights
 */
export function getRatingInsights(stats: ReviewStats | null | undefined): {
  mostCommonRating: number;
  positivePercentage: number;
  negativePercentage: number;
} {
  if (!stats || stats.count === 0) {
    return {
      mostCommonRating: 0,
      positivePercentage: 0,
      negativePercentage: 0,
    };
  }

  const { distribution, count } = stats;

  // Find most common rating
  let mostCommonRating = 5;
  let maxCount = 0;
  for (let i = 1; i <= 5; i++) {
    const ratingCount = distribution[i as keyof typeof distribution] || 0;
    if (ratingCount > maxCount) {
      maxCount = ratingCount;
      mostCommonRating = i;
    }
  }

  // Calculate positive (4-5 stars) and negative (1-2 stars) percentages
  const positiveCount = (distribution[4] || 0) + (distribution[5] || 0);
  const negativeCount = (distribution[1] || 0) + (distribution[2] || 0);

  const positivePercentage = (positiveCount / count) * 100;
  const negativePercentage = (negativeCount / count) * 100;

  return {
    mostCommonRating,
    positivePercentage,
    negativePercentage,
  };
}

export default useReviewStats;

/**
 * ReviewsListSkeleton - Vertical list of review card skeletons
 *
 * Usage:
 * <ReviewsListSkeleton count={5} />
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import ReviewCardSkeleton from './ReviewCardSkeleton';

interface ReviewsListSkeletonProps {
  count?: number;
}

export default function ReviewsListSkeleton({ count = 5 }: ReviewsListSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <ReviewCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
});

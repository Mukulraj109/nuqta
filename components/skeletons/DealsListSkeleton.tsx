/**
 * DealsListSkeleton - Vertical list of deal card skeletons
 *
 * Usage:
 * <DealsListSkeleton count={5} />
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import DealCardSkeleton from './DealCardSkeleton';

interface DealsListSkeletonProps {
  count?: number;
}

export default function DealsListSkeleton({ count = 5 }: DealsListSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <DealCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
});

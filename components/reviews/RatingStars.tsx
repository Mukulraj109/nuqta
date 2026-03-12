import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  color?: string;
  emptyColor?: string;
  showCount?: boolean;
  count?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  style?: any;
}

export default function RatingStars({
  rating,
  maxRating = 5,
  size = 16,
  color = '#F59E0B',
  emptyColor = '#D1D5DB',
  showCount = false,
  count = 0,
  interactive = false,
  onRatingChange,
  style
}: RatingStarsProps) {
  const renderStars = () => {
    const stars = [];

    for (let i = 1; i <= maxRating; i++) {
      const filled = i <= Math.floor(rating);
      const half = i === Math.ceil(rating) && rating % 1 !== 0;

      const StarComponent = interactive ? Pressable : View;

      stars.push(
        <StarComponent
          key={i}
          onPress={() => interactive && onRatingChange?.(i)}
         
          style={styles.starWrapper}
        >
          <Ionicons
            name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
            size={size}
            color={filled || half ? color : emptyColor}
          />
        </StarComponent>
      );
    }

    return stars;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsContainer}>
        {renderStars()}
      </View>
      {showCount && count > 0 && (
        <ThemedText style={styles.countText}>
          ({count})
        </ThemedText>
      )}
    </View>
);
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starWrapper: {
    padding: 0,
  },
  countText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});

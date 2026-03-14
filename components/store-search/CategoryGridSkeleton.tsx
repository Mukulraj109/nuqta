import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';

interface CategoryGridSkeletonProps {
  itemCount?: number;
}

const { width } = Dimensions.get('window');
const CARD_GAP = 14;
const H_PADDING = 18;
const CARD_WIDTH = (width - H_PADDING * 2 - CARD_GAP) / 2;

const CategoryGridSkeleton: React.FC<CategoryGridSkeletonProps> = ({
  itemCount = 6,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const cards = Array.from({ length: itemCount }, (_, i) => i);

  // Render in rows of 2
  const rows: number[][] = [];
  for (let i = 0; i < cards.length; i += 2) {
    rows.push(cards.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((_, index) => (
            <View key={index} style={styles.card}>
              {/* Gradient placeholder */}
              <Animated.View style={[styles.imagePlaceholder, { opacity: shimmerOpacity }]} />
              {/* Title placeholder */}
              <Animated.View style={[styles.titlePlaceholder, { opacity: shimmerOpacity }]} />
              {/* Description placeholder */}
              <Animated.View style={[styles.descriptionPlaceholder, { opacity: shimmerOpacity }]} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    gap: CARD_GAP,
  },
  row: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    shadowColor: '#1a3a52',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: CARD_WIDTH - 28,
    height: 100,
    borderRadius: 18,
    backgroundColor: '#E8EBF0',
    marginBottom: 10,
  },
  titlePlaceholder: {
    width: '65%',
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
    marginBottom: 6,
  },
  descriptionPlaceholder: {
    width: '45%',
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F0F1F3',
  },
});

export default React.memo(CategoryGridSkeleton);

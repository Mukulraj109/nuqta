import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';

interface CategoryGridSkeletonProps {
  numItems?: number;
  numColumns?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SkeletonItem: React.FC<{ circleSize: number; delay: number }> = ({
  circleSize,
  delay,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          delay,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [shimmerAnim, delay]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.skeletonItem}>
      <Animated.View
        style={[
          styles.skeletonCircle,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            opacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.skeletonText,
          { opacity },
        ]}
      />
    </View>
  );
};

const CategoryGridSkeleton: React.FC<CategoryGridSkeletonProps> = ({
  numItems = 8,
  numColumns = 2,
}) => {
  const circleSize = 64;
  const containerPadding = 32;
  const gap = 16 * (numColumns - 1);
  const itemWidth = (SCREEN_WIDTH - containerPadding - gap) / numColumns;

  const rows = Math.ceil(numItems / numColumns);
  const items = Array.from({ length: numItems }, (_, i) => i);

  return (
    <View style={styles.container}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {items
            .slice(rowIndex * numColumns, (rowIndex + 1) * numColumns)
            .map((item, colIndex) => (
              <View
                key={`item-${item}`}
                style={[styles.itemContainer, { width: itemWidth }]}
              >
                <SkeletonItem
                  circleSize={circleSize}
                  delay={(rowIndex * numColumns + colIndex) * 100}
                />
              </View>
            ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  itemContainer: {
    alignItems: 'center',
  },
  skeletonItem: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skeletonCircle: {
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  skeletonText: {
    width: 60,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: 4,
  },
});

export default CategoryGridSkeleton;

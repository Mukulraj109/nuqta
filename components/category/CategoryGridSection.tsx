/**
 * CategoryGridSection Component
 * 4-column grid display of subcategories with icons and cashback
 * Adapted from Rez_v-2-main FashionCategoryGrid
 */

import React, { memo, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color?: string;
  cashback?: number;
  items?: number;
}

interface CategoryGridSectionProps {
  subcategories: Subcategory[];
  categorySlug: string;
  onSubcategoryPress?: (subcategory: Subcategory) => void;
}

const COLORS = [
  '#ffcd57', '#3B82F6', '#EC4899', '#F59E0B',
  '#8B5CF6', '#EF4444', '#06B6D4', '#ffcd57',
  '#22C55E', '#F97316', '#6366F1', '#14B8A6',
];

// Check if icon is an Ionicons name (contains "-outline" or "-sharp") vs emoji
const isIoniconName = (icon: string): boolean => {
  return icon.includes('-outline') || icon.includes('-sharp') || icon.includes('-');
};

const CategoryGridItem = memo(({
  subcategory,
  index,
  onPress,
}: {
  subcategory: Subcategory;
  index: number;
  onPress: () => void;
}) => {
  const color = subcategory.color || COLORS[index % COLORS.length];
  // Fixed cashback per category item instead of random
  const cashback = subcategory.cashback || (10 + (index % 8) * 2);
  const isIonicon = isIoniconName(subcategory.icon || '');

  return (
    <Pressable
      style={styles.gridItem}
      onPress={onPress}
     
      accessibilityLabel={`${subcategory.name} category`}
      accessibilityRole="button"
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        {isIonicon ? (
          <Ionicons
            name={subcategory.icon as any}
            size={26}
            color={color}
          />
        ) : (
          <Text style={styles.iconEmoji}>{subcategory.icon}</Text>
        )}
      </View>
      <Text style={styles.itemName} numberOfLines={2}>{subcategory.name}</Text>
      <View style={[styles.cashbackBadge, { backgroundColor: `${color}15` }]}>
        <Text style={[styles.cashbackText, { color }]}>{cashback}%</Text>
      </View>
    </Pressable>
  );
});

CategoryGridItem.displayName = 'CategoryGridItem';

const CategoryGridSection: React.FC<CategoryGridSectionProps> = ({
  subcategories,
  categorySlug,
  onSubcategoryPress,
}) => {
  const router = useRouter();

  const handlePress = useCallback((subcategory: Subcategory) => {
    if (onSubcategoryPress) {
      onSubcategoryPress(subcategory);
    } else {
      router.push({
        pathname: `/category/${subcategory.slug}`,
        params: { parentCategory: categorySlug },
      } as any);
    }
  }, [router, categorySlug, onSubcategoryPress]);

  if (!subcategories || subcategories.length === 0) {
    return null;
  }

  // Take first 12 items for the grid (3 rows x 4 columns)
  const displayItems = subcategories.slice(0, 12);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
        <Pressable
          style={styles.seeAllButton}
          onPress={() => router.push(`/categories?parent=${categorySlug}` as any)}
          accessibilityLabel="See all categories"
        >
          <Text style={styles.seeAllText}>See All</Text>
        </Pressable>
      </View>

      <View style={styles.grid}>
        {displayItems.map((subcategory, index) => (
          <CategoryGridItem
            key={subcategory.id || subcategory.slug}
            subcategory={subcategory}
            index={index}
            onPress={() => handlePress(subcategory)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#1a3a52',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(11, 34, 64, 0.04), 0 8px 24px rgba(11, 34, 64, 0.06)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
  },
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconEmoji: {
    fontSize: 26,
  },
  itemName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 14,
    minHeight: 28,
  },
  cashbackBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cashbackText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

export default memo(CategoryGridSection);

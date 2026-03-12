/**
 * FilterChips Component
 *
 * Premium filter pills for mall pages with gradient active states
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export type FilterType = 'all' | 'featured' | 'new' | 'top-rated' | 'luxury' | 'trending' | 'reward-boosters';

interface FilterOption {
  key: FilterType;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeColors: [string, string];
}

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'all', label: 'All', icon: 'grid-outline', activeColors: ['#1a3a52', '#234b68'] },
  { key: 'featured', label: 'Featured', icon: 'star', activeColors: ['#F59E0B', '#1a3a52'] },
  { key: 'new', label: 'New', icon: 'sparkles', activeColors: ['#F97316', '#D97706'] },
  { key: 'top-rated', label: 'Top Rated', icon: 'trending-up', activeColors: ['#dfebf7', '#1a3a52'] },
  { key: 'luxury', label: 'Premium', icon: 'diamond', activeColors: ['#1a3a52', '#234b68'] },
  { key: 'trending', label: 'Trending', icon: 'flame', activeColors: ['#EF4444', '#DC2626'] },
  { key: 'reward-boosters', label: 'Rewards', icon: 'gift', activeColors: ['#8B5CF6', '#7C3AED'] },
];

interface FilterChipsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const FilterChips: React.FC<FilterChipsProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTER_OPTIONS.map((option) => {
        const isActive = activeFilter === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => onFilterChange(option.key)}
           
            style={styles.chipWrapper}
          >
            {isActive ? (
              <LinearGradient
                colors={option.activeColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.chipActive}
              >
                <Ionicons
                  name={option.icon}
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.chipTextActive}>
                  {option.label}
                </Text>
              </LinearGradient>
            ) : (
              <View style={styles.chip}>
                <Ionicons
                  name={option.icon}
                  size={16}
                  color="#6B7280"
                />
                <Text style={styles.chipText}>
                  {option.label}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 12,
    gap: 10,
  },
  chipWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  chipTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default memo(FilterChips);

import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// New Color Palette
const PALETTE = {
  nileBlue: '#1a3a52',
  lightMustard: '#ffcd57',
  linen: '#faf1e0',
  lightPeach: '#ffd7b5',
  lavenderMist: '#dfebf7',
};

interface FilterChipsProps {
  filters: {
    nearMe: boolean;
    offersAvailable: boolean;
    cashback: boolean;
  };
  onFilterChange: (filter: 'nearMe' | 'offersAvailable' | 'cashback', value: boolean) => void;
}

interface ChipConfig {
  key: 'nearMe' | 'offersAvailable' | 'cashback';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CHIP_CONFIGS: ChipConfig[] = [
  { key: 'nearMe', label: 'Near Me', icon: 'location' },
  { key: 'offersAvailable', label: 'Offers Available', icon: 'pricetag' },
  { key: 'cashback', label: 'Cashback', icon: 'cash' },
];

const FilterChips: React.FC<FilterChipsProps> = ({ filters, onFilterChange }) => {
  const handlePress = (filterKey: 'nearMe' | 'offersAvailable' | 'cashback') => {
    onFilterChange(filterKey, !filters[filterKey]);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scrollView}
    >
      {CHIP_CONFIGS.map((chip) => {
        const isActive = filters[chip.key];

        return (
          <Pressable
            key={chip.key}
            onPress={() => handlePress(chip.key)}
            style={({ pressed }) => [
              styles.chip,
              isActive ? styles.chipActive : styles.chipInactive,
              pressed && styles.chipPressed,
            ]}
          >
            <Ionicons
              name={chip.icon}
              size={16}
              color={isActive ? '#FFFFFF' : '#6B7280'}
              style={styles.icon}
            />
            <Text style={[
              styles.chipText,
              isActive ? styles.chipTextActive : styles.chipTextInactive,
            ]}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: PALETTE.nileBlue,
    borderWidth: 0,
  },
  chipInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipPressed: {
    opacity: 0.7,
  },
  icon: {
    marginRight: 5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  chipTextInactive: {
    color: '#6B7280',
  },
});

export default React.memo(FilterChips);

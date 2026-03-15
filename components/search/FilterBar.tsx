import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

export type SortOption = 'best_value' | 'price_low' | 'price_high' | 'cashback_high' | 'distance' | 'rating';

interface FilterBarProps {
  onFilterPress: (filter: string) => void;
  onSortChange: (sort: SortOption) => void;
  currentSort?: SortOption;
  activeFilters?: string[];
}

function FilterBar({
  onFilterPress,
  onSortChange,
  currentSort = 'best_value',
  activeFilters = [],
}: FilterBarProps) {
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'best_value', label: 'Best Value' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'cashback_high', label: 'Cashback: High to Low' },
    { value: 'distance', label: 'Distance: Near to Far' },
    { value: 'rating', label: 'Rating: High to Low' },
  ];

  const currentSortLabel = sortOptions.find(opt => opt.value === currentSort)?.label || 'Best Value';

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Filters Button */}
        <Pressable
          style={[
            styles.filterButton,
            activeFilters.length > 0 && styles.filterButtonActive
          ]}
          onPress={() => onFilterPress('filters')}
         
        >
          <Text style={[
            styles.filterButtonText,
            activeFilters.length > 0 && styles.filterButtonTextActive
          ]}>Filters</Text>
          <Ionicons 
            name="chevron-down" 
            size={16} 
            color={activeFilters.length > 0 ? colors.nileBlue : colors.neutral[500]} 
          />
          {activeFilters.length > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilters.length}</Text>
            </View>
          )}
        </Pressable>

        {/* Filter Options */}
        {['Price', 'Cashback', 'Distance', 'Rating'].map((filter) => (
          <Pressable
            key={filter}
            style={[
              styles.filterButton,
              activeFilters.includes(filter.toLowerCase()) && styles.filterButtonActive
            ]}
            onPress={() => onFilterPress(filter.toLowerCase())}
           
          >
            <Text style={[
              styles.filterButtonText,
              activeFilters.includes(filter.toLowerCase()) && styles.filterButtonTextActive
            ]}>{filter}</Text>
          </Pressable>
        ))}

        {/* Sort Dropdown */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort:</Text>
          <Pressable
            style={styles.sortButton}
            onPress={() => setShowSortDropdown(!showSortDropdown)}
           
          >
            <Text style={styles.sortButtonText}>{currentSortLabel}</Text>
            <Ionicons
              name={showSortDropdown ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.neutral[500]}
            />
          </Pressable>
        </View>
      </ScrollView>

      {/* Sort Dropdown Menu */}
      {showSortDropdown && (
        <View style={styles.dropdown}>
          {sortOptions.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.dropdownItem,
                currentSort === option.value && styles.dropdownItemActive
              ]}
              onPress={() => {
                onSortChange(option.value);
                setShowSortDropdown(false);
              }}
             
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  currentSort === option.value && styles.dropdownItemTextActive
                ]}
              >
                {option.label}
              </Text>
              {currentSort === option.value && (
                <Ionicons name="checkmark" size={16} color={colors.nileBlue} />
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    position: 'relative',
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: colors.linen,
    gap: 6,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(26, 58, 82, 0.08)',
    borderColor: colors.nileBlue,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  filterButtonTextActive: {
    color: colors.nileBlue,
    fontWeight: '700',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.brand.goldWarm,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: colors.background.primary,
    ...Platform.select({
      ios: {
        shadowColor: colors.brand.goldWarm,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 2px 10px rgba(255, 200, 87, 0.4)',
      },
    }),
  },
  filterBadgeText: {
    color: colors.neutral[800],
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 16,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(26, 58, 82, 0.06)',
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.neutral[700],
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: colors.nileBlue,
    fontWeight: '700',
  },
});

export default React.memo(FilterBar);

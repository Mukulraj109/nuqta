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
            color={activeFilters.length > 0 ? '#1a3a52' : '#6B7280'} 
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
              color="#6B7280"
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
                <Ionicons name="checkmark" size={16} color="#1a3a52" />
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    backgroundColor: '#faf1e0',
    gap: 6,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(26, 58, 82, 0.08)',
    borderColor: '#1a3a52',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  filterButtonTextActive: {
    color: '#1a3a52',
    fontWeight: '700',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFC857',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#FFC857',
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
    color: '#1F2937',
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
    color: '#374151',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 16,
    backgroundColor: '#FFFFFF',
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
    color: '#374151',
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: '#1a3a52',
    fontWeight: '700',
  },
});

export default React.memo(FilterBar);

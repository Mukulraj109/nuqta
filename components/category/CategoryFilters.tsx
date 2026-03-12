import React, { useState } from 'react';
import {
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@/components/common/CrossPlatformSlider';

import { ThemedText } from '@/components/ThemedText';
import { CategoryFilter } from '@/types/category.types';
import { useRegion } from '@/contexts/RegionContext';

interface CategoryFiltersProps {
  filters: CategoryFilter[];
  activeFilters: Record<string, any>;
  onFilterChange: (filterId: string, value: any) => void;
  onReset: () => void;
}

export default function CategoryFilters({
  filters,
  activeFilters,
  onFilterChange,
  onReset,
}: CategoryFiltersProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set());

  const toggleFilterExpansion = (filterId: string) => {
    const newExpanded = new Set(expandedFilters);
    if (newExpanded.has(filterId)) {
      newExpanded.delete(filterId);
    } else {
      newExpanded.add(filterId);
    }
    setExpandedFilters(newExpanded);
  };

  const renderSingleFilter = (filter: CategoryFilter) => {
    const activeValue = activeFilters[filter.id];
    
    return (
      <View key={filter.id} style={styles.filterSection}>
        <Pressable
          style={styles.filterHeader}
          onPress={() => toggleFilterExpansion(filter.id)}
          accessibilityRole="button"
          accessibilityLabel={`${filter.name} filter`}
          accessibilityHint={expandedFilters.has(filter.id) ? 'Double tap to collapse' : 'Double tap to expand'}
          accessibilityState={{ expanded: expandedFilters.has(filter.id) }}
        >
          <ThemedText style={styles.filterTitle}>{filter.name}</ThemedText>
          <Ionicons
            name={expandedFilters.has(filter.id) ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7280"
          />
        </Pressable>

        {expandedFilters.has(filter.id) && (
          <View style={styles.filterOptions}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionsContainer}
            >
              {filter.options?.map((option) => {
                const isSelected = activeValue === option.value;
                
                return (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.optionChip,
                      isSelected && styles.selectedOptionChip,
                    ]}
                    onPress={() => {
                      const newValue = isSelected ? null : option.value;
                      onFilterChange(filter.id, newValue);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${option.label} option`}
                    accessibilityHint={isSelected ? 'Double tap to deselect' : 'Double tap to select'}
                    accessibilityState={{ selected: isSelected }}
                  >
                    {option.icon && (
                      <Ionicons
                        name={option.icon as any}
                        size={16}
                        color={isSelected ? '#FFFFFF' : '#6B7280'}
                        style={styles.optionIcon}
                      />
                    )}
                    <ThemedText
                      style={[
                        styles.optionText,
                        isSelected && styles.selectedOptionText,
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const renderMultipleFilter = (filter: CategoryFilter) => {
    const activeValues = activeFilters[filter.id] || [];
    
    return (
      <View key={filter.id} style={styles.filterSection}>
        <Pressable
          style={styles.filterHeader}
          onPress={() => toggleFilterExpansion(filter.id)}
          accessibilityRole="button"
          accessibilityLabel={`${filter.name} filter. ${activeValues.length} selected`}
          accessibilityHint={expandedFilters.has(filter.id) ? 'Double tap to collapse' : 'Double tap to expand'}
          accessibilityState={{ expanded: expandedFilters.has(filter.id) }}
        >
          <ThemedText style={styles.filterTitle}>{filter.name}</ThemedText>
          {activeValues.length > 0 && (
            <View style={styles.activeFilterBadge}>
              <ThemedText style={styles.activeFilterBadgeText}>
                {activeValues.length}
              </ThemedText>
            </View>
          )}
          <Ionicons
            name={expandedFilters.has(filter.id) ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7280"
          />
        </Pressable>

        {expandedFilters.has(filter.id) && (
          <View style={styles.filterOptions}>
            <View style={styles.multipleOptionsContainer}>
              {filter.options?.map((option) => {
                const isSelected = activeValues.includes(option.value);
                
                return (
                  <Pressable
                    key={option.id}
                    style={styles.multipleOptionRow}
                    onPress={() => {
                      let newValues = [...activeValues];
                      if (isSelected) {
                        newValues = newValues.filter(val => val !== option.value);
                      } else {
                        newValues.push(option.value);
                      }
                      onFilterChange(filter.id, newValues);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityHint={isSelected ? 'Double tap to uncheck' : 'Double tap to check'}
                    accessibilityState={{ checked: isSelected }}
                  >
                    <View style={styles.checkboxContainer}>
                      <View style={[
                        styles.checkbox,
                        isSelected && styles.checkedCheckbox,
                      ]}>
                        {isSelected && (
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        )}
                      </View>
                      <ThemedText style={styles.multipleOptionText}>
                        {option.label}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderRangeFilter = (filter: CategoryFilter) => {
    const activeValue = activeFilters[filter.id] || {
      min: filter.range?.min || 0,
      max: filter.range?.max || 100,
    };
    
    return (
      <View key={filter.id} style={styles.filterSection}>
        <Pressable
          style={styles.filterHeader}
          onPress={() => toggleFilterExpansion(filter.id)}
          accessibilityRole="button"
          accessibilityLabel={`${filter.name} filter. Range: ${currencySymbol}${activeValue.min} to ${currencySymbol}${activeValue.max}`}
          accessibilityHint={expandedFilters.has(filter.id) ? 'Double tap to collapse' : 'Double tap to expand'}
          accessibilityState={{ expanded: expandedFilters.has(filter.id) }}
        >
          <ThemedText style={styles.filterTitle}>{filter.name}</ThemedText>
          <ThemedText style={styles.rangeValue}>
            {currencySymbol}{activeValue.min} - {currencySymbol}{activeValue.max}
          </ThemedText>
          <Ionicons
            name={expandedFilters.has(filter.id) ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6B7280"
          />
        </Pressable>

        {expandedFilters.has(filter.id) && (
          <View style={styles.filterOptions}>
            <View style={styles.rangeContainer}>
              <View style={styles.rangeLabels}>
                <ThemedText style={styles.rangeLabel}>
                  Min: {currencySymbol}{activeValue.min}
                </ThemedText>
                <ThemedText style={styles.rangeLabel}>
                  Max: {currencySymbol}{activeValue.max}
                </ThemedText>
              </View>
              
              <View style={styles.slidersContainer}>
                <View style={styles.sliderContainer}>
                  <ThemedText style={styles.sliderLabel}>Min</ThemedText>
                  <Slider
                    style={styles.slider}
                    minimumValue={filter.range?.min || 0}
                    maximumValue={activeValue.max}
                    value={activeValue.min}
                    step={filter.range?.step || 1}
                    minimumTrackTintColor="#ffcd57"
                    maximumTrackTintColor="#E5E7EB"
                    onValueChange={(value) => {
                      onFilterChange(filter.id, { ...activeValue, min: value });
                    }}
                    accessibilityLabel="Minimum price"
                    accessibilityValue={{ now: activeValue.min, min: filter.range?.min || 0, max: activeValue.max }}
                    accessibilityHint="Adjust minimum price range"
                  />
                </View>
                
                <View style={styles.sliderContainer}>
                  <ThemedText style={styles.sliderLabel}>Max</ThemedText>
                  <Slider
                    style={styles.slider}
                    minimumValue={activeValue.min}
                    maximumValue={filter.range?.max || 100}
                    value={activeValue.max}
                    step={filter.range?.step || 1}
                    minimumTrackTintColor="#ffcd57"
                    maximumTrackTintColor="#E5E7EB"
                    onValueChange={(value) => {
                      onFilterChange(filter.id, { ...activeValue, max: value });
                    }}
                    accessibilityLabel="Maximum price"
                    accessibilityValue={{ now: activeValue.max, min: activeValue.min, max: filter.range?.max || 100 }}
                    accessibilityHint="Adjust maximum price range"
                  />
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderToggleFilter = (filter: CategoryFilter) => {
    const activeValue = activeFilters[filter.id];
    
    return (
      <View key={filter.id} style={styles.filterSection}>
        <View style={styles.toggleFilterHeader}>
          <ThemedText style={styles.filterTitle}>{filter.name}</ThemedText>
        </View>
        
        <View style={styles.toggleOptions}>
          {filter.options?.map((option) => {
            const isSelected = activeValue === option.value;
            
            return (
              <View key={option.id} style={styles.toggleOptionRow}>
                <ThemedText style={styles.toggleOptionText}>
                  {option.label}
                </ThemedText>
                <Switch
                  value={isSelected}
                  onValueChange={(value) => {
                    onFilterChange(filter.id, value ? option.value : null);
                  }}
                  trackColor={{ false: '#E5E7EB', true: '#ffcd57' }}
                  thumbColor={isSelected ? '#FFFFFF' : '#F3F4F6'}
                  accessibilityLabel={`${option.label} toggle`}
                  accessibilityState={{ checked: isSelected }}
                  accessibilityHint={isSelected ? 'Double tap to turn off' : 'Double tap to turn on'}
                />
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderFilter = (filter: CategoryFilter) => {
    switch (filter.type) {
      case 'single':
        return renderSingleFilter(filter);
      case 'multiple':
        return renderMultipleFilter(filter);
      case 'range':
        return renderRangeFilter(filter);
      case 'toggle':
        return renderToggleFilter(filter);
      default:
        return null;
    }
  };

  const hasActiveFilters = Object.keys(activeFilters).some(key => {
    const value = activeFilters[key];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== null && value !== undefined;
  });

  if (filters.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Filters</ThemedText>
        {hasActiveFilters && (
          <Pressable
            style={styles.resetButton}
            onPress={onReset}
            accessibilityRole="button"
            accessibilityLabel="Reset all filters"
            accessibilityHint="Double tap to clear all active filters"
          >
            <ThemedText style={styles.resetButtonText}>Reset All</ThemedText>
          </Pressable>
        )}
      </View>

      <ScrollView 
        style={styles.filtersContainer}
        showsVerticalScrollIndicator={false}
      >
        {filters.map(renderFilter)}
      </ScrollView>
    </View>
);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  filtersContainer: {
    maxHeight: 300,
  },
  filterSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  toggleFilterHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  filterTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  activeFilterBadge: {
    backgroundColor: '#ffcd57',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  activeFilterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filterOptions: {
    paddingBottom: 12,
  },
  optionsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    gap: 4,
  },
  selectedOptionChip: {
    backgroundColor: '#ffcd57',
  },
  optionIcon: {
    marginRight: 4,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  multipleOptionsContainer: {
    paddingHorizontal: 16,
  },
  multipleOptionRow: {
    paddingVertical: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#ffcd57',
    borderColor: '#ffcd57',
  },
  multipleOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  toggleOptions: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  toggleOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  rangeContainer: {
    paddingHorizontal: 16,
  },
  rangeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffcd57',
    marginRight: 8,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  slidersContainer: {
    gap: 16,
  },
  sliderContainer: {
    gap: 8,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  slider: {
    height: 40,
  },
});
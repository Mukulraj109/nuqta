import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRegion } from '@/contexts/RegionContext';

const { width, height } = Dimensions.get('window');

export interface ProductFilters {
  categories: string[];
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: ('in_stock' | 'out_of_stock' | 'low_stock')[];
  minRating?: number;
}

interface FilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: ProductFilters) => void;
  currentFilters: ProductFilters;
  categories: string[];
  priceRange: { min: number; max: number };
}

const STOCK_STATUS_OPTIONS = [
  { value: 'in_stock', label: 'In Stock', icon: 'checkmark-circle', color: '#10B981' },
  { value: 'out_of_stock', label: 'Out of Stock', icon: 'close-circle', color: '#EF4444' },
  { value: 'low_stock', label: 'Low Stock', icon: 'alert-circle', color: '#F59E0B' },
] as const;

const RATING_OPTIONS = [
  { value: 5, label: '5 Stars' },
  { value: 4, label: '4+ Stars' },
  { value: 3, label: '3+ Stars' },
  { value: 2, label: '2+ Stars' },
  { value: 1, label: '1+ Stars' },
];

export default function FilterDrawer({
  visible,
  onClose,
  onApplyFilters,
  currentFilters,
  categories,
  priceRange,
}: FilterDrawerProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const [filters, setFilters] = useState<ProductFilters>(currentFilters);
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    stock: true,
    rating: true,
  });

  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setFilters(currentFilters);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: ProductFilters = {
      categories: [],
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      stockStatus: [],
      minRating: undefined,
    };
    setFilters(resetFilters);
  };

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const toggleStockStatus = (status: 'in_stock' | 'out_of_stock' | 'low_stock') => {
    setFilters(prev => ({
      ...prev,
      stockStatus: prev.stockStatus?.includes(status)
        ? prev.stockStatus.filter(s => s !== status)
        : [...(prev.stockStatus || []), status],
    }));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.categories.length > 0) count += filters.categories.length;
    if (filters.minPrice !== priceRange.min || filters.maxPrice !== priceRange.max) count += 1;
    if (filters.stockStatus && filters.stockStatus.length > 0) count += filters.stockStatus.length;
    if (filters.minRating) count += 1;
    return count;
  };

  const renderStars = (rating: number, isSelected: boolean) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color={isSelected ? '#FFFFFF' : '#F59E0B'}
          />
        ))}
      </View>
    );
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.overlayBackground,
              { opacity: fadeAnim },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.drawerContainer,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableWithoutFeedback>
          <View style={styles.drawer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>Filters</Text>
                {activeFilterCount > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                  </View>
                )}
              </View>
              <Pressable
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#1F2937" />
              </Pressable>
            </View>

            {/* Drawer Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Content */}
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {/* Categories Section */}
              <View style={styles.section}>
                <Pressable
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('categories')}
                 
                >
                  <View style={styles.sectionHeaderLeft}>
                    <Ionicons name="grid-outline" size={20} color="#7C3AED" />
                    <Text style={styles.sectionTitle}>Category</Text>
                    {filters.categories.length > 0 && (
                      <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>{filters.categories.length}</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons
                    name={expandedSections.categories ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#9CA3AF"
                  />
                </Pressable>

                {expandedSections.categories && (
                  <View style={styles.sectionContent}>
                    {categories.map((category) => (
                      <Pressable
                        key={category}
                        style={styles.checkboxItem}
                        onPress={() => toggleCategory(category)}
                       
                      >
                        <View
                          style={[
                            styles.checkbox,
                            filters.categories.includes(category) && styles.checkboxActive,
                          ]}
                        >
                          {filters.categories.includes(category) && (
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          )}
                        </View>
                        <Text style={styles.checkboxLabel}>{category}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Price Range Section */}
              <View style={styles.section}>
                <Pressable
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('price')}
                 
                >
                  <View style={styles.sectionHeaderLeft}>
                    <Ionicons name="cash-outline" size={20} color="#7C3AED" />
                    <Text style={styles.sectionTitle}>Price Range</Text>
                  </View>
                  <Ionicons
                    name={expandedSections.price ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#9CA3AF"
                  />
                </Pressable>

                {expandedSections.price && (
                  <View style={styles.sectionContent}>
                    <View style={styles.priceInputContainer}>
                      <View style={styles.priceInputWrapper}>
                        <Text style={styles.priceInputLabel}>Min Price</Text>
                        <View style={styles.priceInput}>
                          <Text style={styles.currencySymbolText}>{currencySymbol}</Text>
                          <TextInput
                            style={styles.priceInputField}
                            value={filters.minPrice?.toString() || ''}
                            onChangeText={(text) => {
                              const value = parseInt(text) || priceRange.min;
                              setFilters(prev => ({ ...prev, minPrice: value }));
                            }}
                            keyboardType="numeric"
                            placeholder={priceRange.min.toString()}
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>
                      </View>

                      <View style={styles.priceInputSeparator}>
                        <View style={styles.priceInputLine} />
                      </View>

                      <View style={styles.priceInputWrapper}>
                        <Text style={styles.priceInputLabel}>Max Price</Text>
                        <View style={styles.priceInput}>
                          <Text style={styles.currencySymbolText}>{currencySymbol}</Text>
                          <TextInput
                            style={styles.priceInputField}
                            value={filters.maxPrice?.toString() || ''}
                            onChangeText={(text) => {
                              const value = parseInt(text) || priceRange.max;
                              setFilters(prev => ({ ...prev, maxPrice: value }));
                            }}
                            keyboardType="numeric"
                            placeholder={priceRange.max.toString()}
                            placeholderTextColor="#9CA3AF"
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.priceRangeDisplay}>
                      <Text style={styles.priceRangeText}>
                        {currencySymbol}{filters.minPrice || priceRange.min} - {currencySymbol}{filters.maxPrice || priceRange.max}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Stock Status Section */}
              <View style={styles.section}>
                <Pressable
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('stock')}
                 
                >
                  <View style={styles.sectionHeaderLeft}>
                    <Ionicons name="cube-outline" size={20} color="#7C3AED" />
                    <Text style={styles.sectionTitle}>Stock Status</Text>
                    {filters.stockStatus && filters.stockStatus.length > 0 && (
                      <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>{filters.stockStatus.length}</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons
                    name={expandedSections.stock ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#9CA3AF"
                  />
                </Pressable>

                {expandedSections.stock && (
                  <View style={styles.sectionContent}>
                    {STOCK_STATUS_OPTIONS.map((option) => (
                      <Pressable
                        key={option.value}
                        style={styles.stockStatusItem}
                        onPress={() => toggleStockStatus(option.value)}
                       
                      >
                        <View
                          style={[
                            styles.checkbox,
                            filters.stockStatus?.includes(option.value) && [
                              styles.checkboxActive,
                              { backgroundColor: option.color },
                            ],
                          ]}
                        >
                          {filters.stockStatus?.includes(option.value) && (
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          )}
                        </View>
                        <Ionicons
                          name={option.icon as any}
                          size={18}
                          color={option.color}
                          style={styles.stockStatusIcon}
                        />
                        <Text style={styles.stockStatusLabel}>{option.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Rating Section */}
              <View style={styles.section}>
                <Pressable
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('rating')}
                 
                >
                  <View style={styles.sectionHeaderLeft}>
                    <Ionicons name="star-outline" size={20} color="#7C3AED" />
                    <Text style={styles.sectionTitle}>Minimum Rating</Text>
                  </View>
                  <Ionicons
                    name={expandedSections.rating ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#9CA3AF"
                  />
                </Pressable>

                {expandedSections.rating && (
                  <View style={styles.sectionContent}>
                    {RATING_OPTIONS.map((option) => {
                      const isSelected = filters.minRating === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          style={[
                            styles.ratingOption,
                            isSelected && styles.ratingOptionActive,
                          ]}
                          onPress={() =>
                            setFilters(prev => ({
                              ...prev,
                              minRating: prev.minRating === option.value ? undefined : option.value,
                            }))
                          }
                         
                        >
                          {renderStars(option.value, isSelected)}
                          <Text
                            style={[
                              styles.ratingOptionText,
                              isSelected && styles.ratingOptionTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                          {isSelected && (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color="#FFFFFF"
                              style={styles.ratingCheckmark}
                            />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Bottom Padding */}
              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <Pressable
                style={styles.resetButton}
                onPress={handleReset}
               
              >
                <Ionicons name="refresh-outline" size={18} color="#6B7280" />
                <Text style={styles.resetButtonText}>Reset</Text>
              </Pressable>

              <Pressable
                style={styles.applyButton}
                onPress={handleApply}
               
              >
                <Text style={styles.applyButtonText}>
                  Apply Filters
                  {activeFilterCount > 0 && ` (${activeFilterCount})`}
                </Text>
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '90%',
  },
  drawer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  filterBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  sectionContent: {
    paddingTop: 8,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  currencySymbolText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
    marginRight: 4,
  },
  priceInputField: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    padding: 0,
  },
  priceInputSeparator: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  priceInputLine: {
    width: 12,
    height: 2,
    backgroundColor: '#D1D5DB',
  },
  priceRangeDisplay: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  priceRangeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7C3AED',
  },
  stockStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  stockStatusIcon: {
    marginRight: 8,
  },
  stockStatusLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  ratingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 10,
  },
  ratingOptionActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 12,
  },
  ratingOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  ratingOptionTextActive: {
    color: '#FFFFFF',
  },
  ratingCheckmark: {
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    gap: 6,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

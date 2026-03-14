import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  TextInput,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { DealCategory } from '@/types/deals';
import { SortOption, FilterOption } from '@/components/DealList';

interface DealFilterModalProps {
  visible: boolean;
  onClose: () => void;
  currentSort: SortOption;
  currentFilter: FilterOption;
  onApplyFilters: (sort: SortOption, filter: FilterOption, searchTerm: string) => void;
  dealCategories: DealCategory[];
}

function DealFilterModal({
  visible,
  onClose,
  currentSort,
  currentFilter,
  onApplyFilters,
  dealCategories,
}: DealFilterModalProps) {
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [selectedSort, setSelectedSort] = useState<SortOption>(currentSort);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>(currentFilter);
  const [searchTerm, setSearchTerm] = useState('');
  
  const slideAnim = useRef(new Animated.Value(screenData.height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
      slideAnim.setValue(window.height);
    });

    return () => subscription?.remove();
  }, [slideAnim]);

  // Reset filters when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedSort(currentSort);
      setSelectedFilter(currentFilter);
      setSearchTerm('');
    }
  }, [visible, currentSort, currentFilter]);

  const styles = createStyles(screenData);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenData.height,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleBackdropPress = () => {
    onClose();
  };

  const handleModalPress = (event: any) => {
    event.stopPropagation();
  };

  const handleApply = () => {
    onApplyFilters(selectedSort, selectedFilter, searchTerm);
    onClose();
  };

  const handleReset = () => {
    setSelectedSort('priority');
    setSelectedFilter('all');
    setSearchTerm('');
  };

  const sortOptions: { key: SortOption; label: string; icon: string; description: string }[] = [
    { 
      key: 'priority', 
      label: 'Priority', 
      icon: 'star-outline',
      description: 'Featured deals first'
    },
    { 
      key: 'discount', 
      label: 'Highest Discount', 
      icon: 'trending-up-outline',
      description: 'Best savings first'
    },
    { 
      key: 'expiry', 
      label: 'Expiring Soon', 
      icon: 'time-outline',
      description: 'Ending soonest first'
    },
    { 
      key: 'alphabetical', 
      label: 'A to Z', 
      icon: 'text-outline',
      description: 'Alphabetical order'
    },
  ];

  const getCategoryInfo = (category: DealCategory | 'all') => {
    const categoryMap: Record<DealCategory | 'all', { label: string; icon: string; color: string }> = {
      'all': { label: 'All Deals', icon: 'apps-outline', color: '#6B7280' },
      'instant-discount': { label: 'Instant Discount', icon: 'flash-outline', color: '#8B5CF6' },
      'cashback': { label: 'Cashback', icon: 'wallet-outline', color: '#10B981' },
      'buy-one-get-one': { label: 'Buy One Get One', icon: 'gift-outline', color: '#F59E0B' },
      'seasonal': { label: 'Seasonal', icon: 'sunny-outline', color: '#EF4444' },
      'first-time': { label: 'First Time User', icon: 'star-outline', color: '#3B82F6' },
      'loyalty': { label: 'Loyalty Program', icon: 'diamond-outline', color: '#7C3AED' },
      'clearance': { label: 'Clearance Sale', icon: 'pricetag-outline', color: '#DC2626' },
    };
    return categoryMap[category] || categoryMap['all'];
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
      accessibilityLabel="Filter and sort deals dialog"
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <Animated.View style={[styles.blurContainer, { opacity: fadeAnim }]}>
            <BlurView intensity={50} style={styles.blur} />
          </Animated.View>

          <TouchableWithoutFeedback onPress={handleModalPress}>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.modal}>
                {/* Header */}
                <View style={styles.header}>
                  <Pressable
                    style={styles.closeButton}
                    onPress={onClose}
                    accessibilityLabel="Close filter dialog"
                    accessibilityRole="button"
                    accessibilityHint="Double tap to close this dialog"
                  >
                    <Ionicons name="close" size={20} color="#555" />
                  </Pressable>
                  
                  <ThemedText style={styles.title}>Filter & Sort Deals</ThemedText>
                  <ThemedText style={styles.subtitle}>Find the perfect deals for you</ThemedText>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
                  {/* Search */}
                  <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Search Deals</ThemedText>
                    <View style={styles.searchContainer}>
                      <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search by deal title or description"
                        placeholderTextColor="#9CA3AF"
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                      />
                      {searchTerm.length > 0 && (
                        <Pressable
                          onPress={() => setSearchTerm('')}
                          style={styles.clearSearchButton}
                          accessibilityLabel="Clear search"
                          accessibilityRole="button"
                          accessibilityHint="Double tap to clear search text"
                        >
                          <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                        </Pressable>
                      )}
                    </View>
                  </View>

                  {/* Sort Options */}
                  <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Sort By</ThemedText>
                    {sortOptions.map((option) => (
                      <Pressable
                        key={option.key}
                        style={[
                          styles.optionItem,
                          selectedSort === option.key && styles.optionItemSelected
                        ]}
                        onPress={() => setSelectedSort(option.key)}
                      >
                        <Ionicons 
                          name={option.icon as any} 
                          size={20} 
                          color={selectedSort === option.key ? '#8B5CF6' : '#6B7280'} 
                        />
                        <View style={styles.optionContent}>
                          <ThemedText style={[
                            styles.optionLabel,
                            selectedSort === option.key && styles.optionLabelSelected
                          ]}>
                            {option.label}
                          </ThemedText>
                          <ThemedText style={styles.optionDescription}>
                            {option.description}
                          </ThemedText>
                        </View>
                        {selectedSort === option.key && (
                          <Ionicons name="checkmark-circle" size={20} color="#8B5CF6" />
                        )}
                      </Pressable>
                    ))}
                  </View>

                  {/* Filter by Category */}
                  <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Filter by Category</ThemedText>
                    
                    {/* All option */}
                    <Pressable
                      style={[
                        styles.categoryItem,
                        selectedFilter === 'all' && styles.categoryItemSelected
                      ]}
                      onPress={() => setSelectedFilter('all')}
                    >
                      <View style={[
                        styles.categoryIcon,
                        { backgroundColor: selectedFilter === 'all' ? '#8B5CF6' : '#F3F4F6' }
                      ]}>
                        <Ionicons 
                          name="apps-outline" 
                          size={16} 
                          color={selectedFilter === 'all' ? '#fff' : '#6B7280'} 
                        />
                      </View>
                      <ThemedText style={[
                        styles.categoryLabel,
                        selectedFilter === 'all' && styles.categoryLabelSelected
                      ]}>
                        All Deals
                      </ThemedText>
                      {selectedFilter === 'all' && (
                        <Ionicons name="checkmark-circle" size={18} color="#8B5CF6" />
                      )}
                    </Pressable>

                    {/* Category options */}
                    {dealCategories.map((category) => {
                      const categoryInfo = getCategoryInfo(category);
                      const isSelected = selectedFilter === category;
                      
                      return (
                        <Pressable
                          key={category}
                          style={[
                            styles.categoryItem,
                            isSelected && styles.categoryItemSelected
                          ]}
                          onPress={() => setSelectedFilter(category)}
                        >
                          <View style={[
                            styles.categoryIcon,
                            { backgroundColor: isSelected ? categoryInfo.color : '#F3F4F6' }
                          ]}>
                            <Ionicons 
                              name={categoryInfo.icon as any} 
                              size={16} 
                              color={isSelected ? '#fff' : '#6B7280'} 
                            />
                          </View>
                          <ThemedText style={[
                            styles.categoryLabel,
                            isSelected && styles.categoryLabelSelected
                          ]}>
                            {categoryInfo.label}
                          </ThemedText>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={18} color={categoryInfo.color} />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>

                {/* Footer Actions */}
                <View style={styles.footer}>
                  <Pressable
                    style={styles.resetButton}
                    onPress={handleReset}
                    accessibilityLabel="Reset filters"
                    accessibilityRole="button"
                    accessibilityHint="Double tap to reset all filters to default"
                  >
                    <Ionicons name="refresh-outline" size={16} color="#6B7280" />
                    <ThemedText style={styles.resetButtonText}>Reset</ThemedText>
                  </Pressable>

                  <Pressable
                    style={styles.applyButton}
                    onPress={handleApply}
                    accessibilityLabel="Apply filters"
                    accessibilityRole="button"
                    accessibilityHint="Double tap to apply selected filters and close dialog"
                  >
                    <ThemedText style={styles.applyButtonText}>Apply Filters</ThemedText>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
);
}

const createStyles = (screenData: { width: number; height: number }) => {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    blurContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    blur: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    modal: {
      backgroundColor: '#fff',
      borderRadius: 20,
      width: '100%',
      maxHeight: '90%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 6,
    },
    header: {
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
      position: 'relative',
    },
    closeButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: '#f2f2f2',
      borderRadius: 20,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: '#6B7280',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    searchIcon: {
      marginRight: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: '#374151',
    },
    clearSearchButton: {
      padding: 4,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    optionItemSelected: {
      backgroundColor: '#F3F4F6',
      borderColor: '#8B5CF6',
    },
    optionContent: {
      flex: 1,
      marginLeft: 12,
    },
    optionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 2,
    },
    optionLabelSelected: {
      color: '#8B5CF6',
    },
    optionDescription: {
      fontSize: 12,
      color: '#6B7280',
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: '#F9FAFB',
      borderRadius: 8,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    categoryItemSelected: {
      backgroundColor: '#F3F4F6',
      borderColor: '#8B5CF6',
    },
    categoryIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    categoryLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: '#374151',
    },
    categoryLabelSelected: {
      color: '#374151',
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: '#F1F5F9',
      gap: 12,
    },
    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      paddingVertical: 14,
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    resetButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#6B7280',
      marginLeft: 6,
    },
    applyButton: {
      flex: 2,
      paddingVertical: 14,
      backgroundColor: '#8B5CF6',
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
  });
};

export default React.memo(DealFilterModal);

/**
 * EventsSortModal Component
 * Bottom sheet modal for sorting events
 */

import React, { memo, useCallback } from 'react';
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { EventSortOption } from '@/hooks/useEventsPage';

interface SortOption {
  id: EventSortOption;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const SORT_OPTIONS: SortOption[] = [
  {
    id: 'date_asc',
    label: 'Upcoming First',
    description: 'Show nearest events first',
    icon: 'calendar-outline',
  },
  {
    id: 'date_desc',
    label: 'Latest Added',
    description: 'Show recently added events first',
    icon: 'time-outline',
  },
  {
    id: 'price_asc',
    label: 'Price: Low to High',
    description: 'Show cheapest events first',
    icon: 'arrow-up-outline',
  },
  {
    id: 'price_desc',
    label: 'Price: High to Low',
    description: 'Show premium events first',
    icon: 'arrow-down-outline',
  },
  {
    id: 'popularity',
    label: 'Most Popular',
    description: 'Show trending events first',
    icon: 'trending-up-outline',
  },
];

interface EventsSortModalProps {
  visible: boolean;
  sortBy: EventSortOption;
  onClose: () => void;
  onSortChange: (sortBy: EventSortOption) => void;
}

const EventsSortModal: React.FC<EventsSortModalProps> = ({
  visible,
  sortBy,
  onClose,
  onSortChange,
}) => {
  const handleSortSelect = useCallback((option: EventSortOption) => {
    onSortChange(option);
    onClose();
  }, [onSortChange, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.overlay}
       
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>Sort By</ThemedText>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close sort options"
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          {/* Sort Options */}
          <View style={styles.optionsList}>
            {SORT_OPTIONS.map((option) => {
              const isActive = sortBy === option.id;
              return (
                <Pressable
                  key={option.id}
                  style={[
                    styles.optionItem,
                    isActive && styles.optionItemActive,
                  ]}
                  onPress={() => handleSortSelect(option.id)}
                 
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: isActive }}
                >
                  <View style={styles.optionContent}>
                    <View
                      style={[
                        styles.optionIcon,
                        isActive && styles.optionIconActive,
                      ]}
                    >
                      <Ionicons
                        name={option.icon}
                        size={18}
                        color={isActive ? '#FFFFFF' : '#6B7280'}
                      />
                    </View>
                    <View style={styles.optionText}>
                      <ThemedText
                        style={[
                          styles.optionLabel,
                          isActive && styles.optionLabelActive,
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                      <ThemedText style={styles.optionDescription}>
                        {option.description}
                      </ThemedText>
                    </View>
                  </View>
                  {isActive && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color="#1a3a52"
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  optionItemActive: {
    backgroundColor: 'rgba(0, 192, 106, 0.1)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionIconActive: {
    backgroundColor: '#1a3a52',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  optionLabelActive: {
    color: '#1a3a52',
  },
  optionDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default memo(EventsSortModal);

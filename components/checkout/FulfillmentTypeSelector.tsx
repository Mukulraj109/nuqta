import React, { memo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FulfillmentType, FulfillmentOption } from '@/types/checkout.types';

interface FulfillmentTypeSelectorProps {
  availableTypes: FulfillmentOption[];
  selectedType: FulfillmentType;
  onSelect: (type: FulfillmentType) => void;
}

const ICON_MAP: Record<FulfillmentType, keyof typeof Ionicons.glyphMap> = {
  delivery: 'bicycle-outline',
  pickup: 'bag-handle-outline',
  drive_thru: 'car-outline',
  dine_in: 'restaurant-outline',
};

const FulfillmentTypeSelector = memo(({
  availableTypes,
  selectedType,
  onSelect,
}: FulfillmentTypeSelectorProps) => {
  const enabledTypes = availableTypes.filter((t) => t.enabled);

  if (enabledTypes.length <= 1) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>How do you want your order?</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {enabledTypes.map((option) => {
          const isSelected = option.type === selectedType;
          const iconName = ICON_MAP[option.type] || 'help-circle-outline';

          return (
            <Pressable
              key={option.type}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => onSelect(option.type)}
             
            >
              <View style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}>
                <Ionicons
                  name={iconName}
                  size={22}
                  color={isSelected ? '#fff' : '#1a3a52'}
                />
              </View>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {option.label}
              </Text>
              {option.estimatedTime ? (
                <Text style={[styles.time, isSelected && styles.timeSelected]}>
                  {option.estimatedTime}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

FulfillmentTypeSelector.displayName = 'FulfillmentTypeSelector';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a3a52',
    marginBottom: 12,
  },
  scrollContent: {
    gap: 10,
  },
  card: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    minWidth: 100,
  },
  cardSelected: {
    borderColor: '#1a3a52',
    backgroundColor: '#f0f6fa',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f6fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconCircleSelected: {
    backgroundColor: '#1a3a52',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  labelSelected: {
    color: '#1a3a52',
  },
  time: {
    fontSize: 11,
    color: '#888',
    marginTop: 3,
    textAlign: 'center',
  },
  timeSelected: {
    color: '#1a3a52',
  },
});

export default FulfillmentTypeSelector;

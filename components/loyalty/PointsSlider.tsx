/**
 * Points Slider Component
 * Allow users to select how many points to use for checkout
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@/components/common/CrossPlatformSlider';
import { ThemedText } from '@/components/ThemedText';
import { useRegion } from '@/contexts/RegionContext';

interface PointsSliderProps {
  availablePoints: number;
  maxPointsForOrder: number;
  pointValue: number; // e.g., 1 point = ₹0.10
  onValueChange: (points: number, discount: number) => void;
}

function PointsSlider({
  availablePoints,
  maxPointsForOrder,
  pointValue,
  onValueChange,
}: PointsSliderProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const maxUsablePoints = Math.min(availablePoints, maxPointsForOrder);
  const [selectedPoints, setSelectedPoints] = useState(0);
  const discount = selectedPoints * pointValue;

  const handleValueChange = (value: number) => {
    const points = Math.round(value);
    setSelectedPoints(points);
    onValueChange(points, points * pointValue);
  };

  return (
    <View
      style={styles.container}
      accessible={false}
    >
      <View style={styles.header}>
        <ThemedText
          style={styles.title}
          accessible={true}
          accessibilityRole="header"
        >
          Use Points for Discount
        </ThemedText>
        <View
          style={styles.availablePoints}
          accessible={true}
          accessibilityLabel={`${availablePoints} points available`}
        >
          <Ionicons name="diamond" size={14} color="#F59E0B" />
          <ThemedText style={styles.availableText}>{availablePoints} available</ThemedText>
        </View>
      </View>

      <View
        style={styles.selectedContainer}
        accessible={true}
        accessibilityLabel={`${selectedPoints} points equals ${discount.toFixed(2)} rupees discount`}
        accessibilityRole="text"
      >
        <View style={styles.selectedPoints}>
          <Ionicons name="diamond" size={24} color="#8B5CF6" />
          <ThemedText style={styles.selectedValue}>{selectedPoints}</ThemedText>
          <ThemedText style={styles.selectedLabel}>points</ThemedText>
        </View>

        <View style={styles.equals}>
          <Ionicons name="arrow-forward" size={20} color="#6B7280" />
        </View>

        <View style={styles.selectedDiscount}>
          <ThemedText style={styles.discountValue}>{currencySymbol}{discount.toFixed(2)}</ThemedText>
          <ThemedText style={styles.discountLabel}>discount</ThemedText>
        </View>
      </View>

      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={maxUsablePoints}
          step={10}
          value={selectedPoints}
          onValueChange={handleValueChange}
          minimumTrackTintColor="#8B5CF6"
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor="#8B5CF6"
          accessible={true}
          accessibilityLabel="Points slider"
          accessibilityHint={`Adjust to use between 0 and ${maxUsablePoints} points. Currently using ${selectedPoints} points for ${discount.toFixed(2)} rupees discount.`}
          accessibilityValue={{
            min: 0,
            max: maxUsablePoints,
            now: selectedPoints,
            text: `${selectedPoints} points, ${discount.toFixed(2)} rupees discount`
          }}
          accessibilityRole="adjustable"
        />
      </View>

      <View style={styles.marks} accessible={false}>
        <ThemedText style={styles.markText}>0</ThemedText>
        <ThemedText style={styles.markText}>{maxUsablePoints}</ThemedText>
      </View>

      {selectedPoints > 0 && (
        <View
          style={styles.info}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel="Information: Points will be deducted after order confirmation"
        >
          <Ionicons name="information-circle" size={16} color="#6B7280" />
          <ThemedText style={styles.infoText}>
            Points will be deducted after order confirmation
          </ThemedText>
        </View>
      )}
    </View>
);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  availablePoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availableText: {
    fontSize: 13,
    color: '#6B7280',
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 16,
  },
  selectedPoints: {
    alignItems: 'center',
    flex: 1,
  },
  selectedValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8B5CF6',
    marginTop: 4,
  },
  selectedLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  equals: {
    width: 40,
    alignItems: 'center',
  },
  selectedDiscount: {
    alignItems: 'center',
    flex: 1,
  },
  discountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffcd57',
  },
  discountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  sliderContainer: {
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  marks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  markText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    padding: 10,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
  },
});

export default React.memo(PointsSlider);

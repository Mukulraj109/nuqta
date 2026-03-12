/**
 * Flight Amenities - Displays available amenities
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FlightAmenitiesProps {
  amenities: string[];
}

const amenityIcons: Record<string, string> = {
  'Wi-Fi': 'wifi-outline',
  'Entertainment': 'tv-outline',
  'Meals': 'restaurant-outline',
  'Extra Legroom': 'body-outline',
  'Power Outlets': 'flash-outline',
  'USB Charging': 'battery-charging-outline',
  'Blankets': 'bed-outline',
  'Pillows': 'bed-outline',
};

const FlightAmenities: React.FC<FlightAmenitiesProps> = ({ amenities }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Amenities</Text>
      <View style={styles.grid}>
        {amenities.map((amenity, index) => (
          <View key={index} style={styles.amenityItem}>
            <Ionicons
              name={amenityIcons[amenity] || 'checkmark-circle-outline'}
              size={24}
              color="#3B82F6"
            />
            <Text style={styles.amenityText}>{amenity}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    minWidth: '45%',
  },
  amenityText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});

export default FlightAmenities;

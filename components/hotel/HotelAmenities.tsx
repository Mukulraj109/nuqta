/**
 * Hotel Amenities - Displays hotel amenities with icons
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HotelAmenitiesProps {
  amenities: string[];
}

const amenityIcons: Record<string, string> = {
  'Wi-Fi': 'wifi',
  'Pool': 'water',
  'Gym': 'barbell',
  'Spa': 'sparkles',
  'Restaurant': 'restaurant',
  'Room Service': 'room-service',
  'Concierge': 'person',
  'Parking': 'car',
  'Business Center': 'briefcase',
  'Meeting Rooms': 'people',
  '24/7 Reception': 'time',
  'Laundry': 'shirt',
  'Bar': 'wine',
  'Airport Shuttle': 'airplane',
};

const HotelAmenities: React.FC<HotelAmenitiesProps> = ({ amenities }) => {
  const getIcon = (amenity: string): string => {
    return amenityIcons[amenity] || 'checkmark-circle';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={24} color="#EC4899" />
        <Text style={styles.title}>Amenities</Text>
      </View>
      <View style={styles.amenitiesGrid}>
        {amenities.map((amenity, index) => (
          <View key={index} style={styles.amenityItem}>
            <View style={styles.iconContainer}>
              <Ionicons name={getIcon(amenity) as any} size={20} color="#EC4899" />
            </View>
            <Text style={styles.amenityText}>{amenity}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '48%',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FCE7F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amenityText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});

export default HotelAmenities;

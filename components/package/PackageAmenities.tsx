/**
 * Package Amenities - Displays package inclusions and amenities
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PackageAmenitiesProps {
  amenities: string[];
  inclusions?: string[];
}

const amenityIcons: Record<string, string> = {
  'Hotel': 'bed',
  'Meals': 'restaurant',
  'Transport': 'car',
  'Sightseeing': 'camera',
  'Guide': 'person',
  'Wi-Fi': 'wifi',
  'AC': 'snow',
  'Breakfast': 'cafe',
  'Dinner': 'restaurant',
  'Lunch': 'fast-food',
  'Transfers': 'airplane',
  'Insurance': 'shield-checkmark',
  'Entry Tickets': 'ticket',
  'Parking': 'car-sport',
};

const PackageAmenities: React.FC<PackageAmenitiesProps> = ({ amenities, inclusions }) => {
  const getIcon = (amenity: string): string => {
    for (const [key, icon] of Object.entries(amenityIcons)) {
      if (amenity.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }
    return 'checkmark-circle';
  };

  const allItems = [...(inclusions || []), ...amenities];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={24} color="#8B5CF6" />
        <Text style={styles.title}>Inclusions & Amenities</Text>
      </View>
      <View style={styles.amenitiesGrid}>
        {allItems.map((item, index) => (
          <View key={index} style={styles.amenityItem}>
            <View style={styles.iconContainer}>
              <Ionicons name={getIcon(item) as any} size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.amenityText}>{item}</Text>
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
    backgroundColor: '#F3E8FF',
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

export default PackageAmenities;

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TransparencyItem {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  color: string;
}

const transparencyItems: TransparencyItem[] = [
  { icon: 'location', text: 'Where coins came from', color: '#F59E0B' },
  { icon: 'time', text: 'When they expire', color: '#3B82F6' },
  { icon: 'storefront', text: 'Where you can use them', color: '#10B981' },
];

const WalletTransparencySection: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Ionicons name="eye-outline" size={20} color="#6B7280" />
          <Text style={styles.title}>Wallet Transparency</Text>
        </View>

        <Text style={styles.subtitle}>You can always see:</Text>

        <View style={styles.itemsContainer}>
          {transparencyItems.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={[styles.bullet, { backgroundColor: item.color }]} />
              <Text style={[styles.itemText, { color: item.color }]}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 14,
  },
  itemsContainer: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default WalletTransparencySection;

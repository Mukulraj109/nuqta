import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EarnOption {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  iconBgColor: string;
  iconColor: string;
}

const earnOptions: EarnOption[] = [
  {
    icon: 'star',
    text: 'Posting reviews',
    iconBgColor: '#FEF3C7',
    iconColor: '#D97706',
  },
  {
    icon: 'camera',
    text: 'Uploading photos/videos',
    iconBgColor: '#FCE7F3',
    iconColor: '#EC4899',
  },
  {
    icon: 'people',
    text: 'Sharing deals with friends',
    iconBgColor: '#DBEAFE',
    iconColor: '#3B82F6',
  },
];

const EarnByShareSection: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="share-social" size={28} color="#EC4899" />
        </View>
        <Text style={styles.sectionTitle}>Earn more by sharing</Text>
        <Text style={styles.sectionSubtitle}>Share your experience</Text>
      </View>

      {/* Earn Options Card */}
      <View style={styles.optionsCard}>
        <Text style={styles.cardSubtitle}>You can earn extra coins by:</Text>

        <View style={styles.optionsContainer}>
          {earnOptions.map((option, index) => (
            <View key={index} style={styles.optionRow}>
              <View style={[styles.iconContainer, { backgroundColor: option.iconBgColor }]}>
                <Ionicons name={option.icon} size={18} color={option.iconColor} />
              </View>
              <Text style={styles.optionText}>{option.text}</Text>
            </View>
          ))}
        </View>

        {/* Quote */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>
            Merchants decide bonus rewards.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FCE7F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  optionsCard: {
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
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
    fontWeight: '500',
  },
  quoteContainer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 13,
    color: '#EC4899',
    fontStyle: 'italic',
  },
});

export default EarnByShareSection;

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Guarantee {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

const guarantees: Guarantee[] = [
  { icon: 'checkmark-circle', text: 'No hidden rules' },
  { icon: 'checkmark-circle', text: 'No forced ads' },
  { icon: 'checkmark-circle', text: 'Full wallet transparency' },
  { icon: 'checkmark-circle', text: 'You control your data' },
];

interface UserAction {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  color: string;
}

const userActions: UserAction[] = [
  { icon: 'download-outline', text: 'Export your data', color: '#3B82F6' },
  { icon: 'time-outline', text: 'See reward history', color: '#8B5CF6' },
  { icon: 'eye-off-outline', text: 'Disable sharing anytime', color: '#6B7280' },
];

const TrustPrivacySection: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="shield-checkmark" size={28} color="#1F2937" />
        </View>
        <Text style={styles.sectionTitle}>Trust, Privacy & Control</Text>
      </View>

      {/* Guarantees Card */}
      <View style={styles.guaranteesCard}>
        <Text style={styles.cardTitle}>What ReZ guarantees:</Text>

        <View style={styles.guaranteesContainer}>
          {guarantees.map((guarantee, index) => (
            <View key={index} style={styles.guaranteeRow}>
              <Ionicons name={guarantee.icon} size={18} color="#059669" />
              <Text style={styles.guaranteeText}>{guarantee.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* User Actions Card */}
      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>You can:</Text>

        <View style={styles.actionsContainer}>
          {userActions.map((action, index) => (
            <View key={index} style={styles.actionRow}>
              <View style={[styles.actionIconContainer, { backgroundColor: `${action.color}15` }]}>
                <Ionicons name={action.icon} size={18} color={action.color} />
              </View>
              <Text style={[styles.actionText, { color: action.color }]}>{action.text}</Text>
            </View>
          ))}
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
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  guaranteesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 14,
  },
  guaranteesContainer: {
    gap: 12,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guaranteeText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  actionsContainer: {
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
});

export default TrustPrivacySection;

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FlowStep {
  number: number;
  text: string;
}

const flowSteps: FlowStep[] = [
  { number: 1, text: 'Visit a ReZ partner store' },
  { number: 2, text: "Scan the store's ReZ QR code" },
  { number: 3, text: 'Enter bill amount' },
  { number: 4, text: 'Apply coins (optional)' },
  { number: 5, text: 'Pay via UPI / wallet' },
  { number: 6, text: 'Earn cashback + coins instantly' },
];

const OfflineStoresSection: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="qr-code" size={28} color="#3B82F6" />
        </View>
        <Text style={styles.sectionTitle}>Using ReZ at offline stores</Text>
      </View>

      {/* Flow Card */}
      <View style={styles.flowCard}>
        <View style={styles.flowHeader}>
          <Ionicons name="list-outline" size={18} color="#3B82F6" />
          <Text style={styles.flowTitle}>Simple Flow</Text>
        </View>

        <View style={styles.stepsContainer}>
          {flowSteps.map((step, index) => (
            <View key={step.number} style={styles.stepRow}>
              <View style={styles.stepNumberContainer}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.number}</Text>
                </View>
                {index < flowSteps.length - 1 && <View style={styles.connector} />}
              </View>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>

        {/* Quote */}
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>
            Just like UPI — but with rewards built in.
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
    backgroundColor: '#DBEAFE',
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
  flowCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  flowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  flowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  stepsContainer: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumberContainer: {
    alignItems: 'center',
    marginRight: 14,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  connector: {
    width: 2,
    height: 20,
    backgroundColor: '#BFDBFE',
    marginVertical: 4,
  },
  stepText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    paddingTop: 4,
    lineHeight: 20,
  },
  quoteContainer: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 13,
    color: '#3B82F6',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default OfflineStoresSection;

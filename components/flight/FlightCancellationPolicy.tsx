/**
 * Flight Cancellation Policy - Displays cancellation terms
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CancellationPolicy {
  freeCancellation: boolean;
  cancellationDeadline: string; // hours before departure
  refundPercentage: number;
}

interface FlightCancellationPolicyProps {
  policy: CancellationPolicy;
}

const FlightCancellationPolicy: React.FC<FlightCancellationPolicyProps> = ({
  policy,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark-outline" size={24} color="#22C55E" />
        <Text style={styles.title}>Cancellation Policy</Text>
      </View>

      <View style={styles.content}>
        {policy.freeCancellation ? (
          <View style={styles.policyItem}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            <Text style={styles.policyText}>
              Free cancellation available up to {policy.cancellationDeadline} hours before departure
            </Text>
          </View>
        ) : (
          <View style={styles.policyItem}>
            <Ionicons name="information-circle" size={20} color="#F59E0B" />
            <Text style={styles.policyText}>
              Cancellation charges apply. Refund: {policy.refundPercentage}% if cancelled before {policy.cancellationDeadline} hours
            </Text>
          </View>
        )}

        <View style={styles.policyItem}>
          <Ionicons name="time-outline" size={20} color="#6B7280" />
          <Text style={styles.policyText}>
            No refund for no-shows or cancellations within {policy.cancellationDeadline} hours of departure
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    gap: 12,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  policyText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});

export default FlightCancellationPolicy;

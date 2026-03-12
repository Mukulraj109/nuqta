/**
 * Cab Cancellation Policy - Displays cancellation terms
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CancellationPolicy {
  freeCancellation: boolean;
  cancellationDeadline: string;
  refundPercentage: number;
}

interface CabCancellationPolicyProps {
  policy: CancellationPolicy;
}

const CabCancellationPolicy: React.FC<CabCancellationPolicyProps> = ({ policy }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={24} color="#EAB308" />
        <Text style={styles.title}>Cancellation Policy</Text>
      </View>
      
      <View style={styles.policyCard}>
        <View style={styles.policyHeader}>
          <Ionicons 
            name={policy.freeCancellation ? 'checkmark-circle' : 'close-circle'} 
            size={24} 
            color={policy.freeCancellation ? '#22C55E' : '#EF4444'} 
          />
          <Text style={styles.policyTitle}>
            {policy.freeCancellation ? 'Free Cancellation' : 'Cancellation Policy'}
          </Text>
        </View>
        
        <Text style={styles.policyText}>
          Cancel {policy.cancellationDeadline} hours before pickup for a {policy.refundPercentage}% refund.
        </Text>
        
        {policy.freeCancellation && (
          <View style={styles.badge}>
            <Ionicons name="gift" size={16} color="#22C55E" />
            <Text style={styles.badgeText}>No cancellation fees</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  policyCard: {
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  policyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  policyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
  },
});

export default CabCancellationPolicy;

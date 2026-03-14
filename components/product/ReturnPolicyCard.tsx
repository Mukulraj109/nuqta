import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

/**
 * ReturnPolicyCard Component
 *
 * Displays return and exchange policy information
 * Features:
 * - Collapsible policy details
 * - Return window information
 * - Conditions and requirements
 * - Contact information
 * - Visual indicators for policy status
 */

interface ReturnPolicy {
  isReturnable: boolean;
  returnWindow: number; // Days
  isExchangeable: boolean;
  exchangeWindow: number; // Days
  conditions: string[];
  nonReturnableReasons?: string[];
  contactInfo?: string;
}

interface ReturnPolicyCardProps {
  productId: string;
  categoryId?: string;
  storeId?: string;
  customPolicy?: ReturnPolicy;
}

export const ReturnPolicyCard: React.FC<ReturnPolicyCardProps> = ({
  productId,
  categoryId,
  storeId,
  customPolicy,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Default policy if not provided
  const defaultPolicy: ReturnPolicy = {
    isReturnable: true,
    returnWindow: 7,
    isExchangeable: true,
    exchangeWindow: 7,
    conditions: [
      'Product must be unused and in original packaging',
      'Tags and labels should be intact',
      'Return initiated within the return window',
      'Original invoice/receipt required',
    ],
    nonReturnableReasons: [
      'Product is damaged or used',
      'Return window has expired',
      'Missing original packaging or tags',
    ],
    contactInfo: 'Contact customer support for assistance',
  };

  // Use custom policy or default
  const policy = customPolicy || defaultPolicy;

  /**
   * Get policy status icon and color
   */
  const getPolicyStatus = () => {
    if (policy.isReturnable && policy.isExchangeable) {
      return {
        icon: 'checkmark-circle' as const,
        color: '#10B981',
        text: 'Returns & Exchanges Available',
      };
    } else if (policy.isReturnable) {
      return {
        icon: 'checkmark-circle' as const,
        color: '#10B981',
        text: 'Returns Available',
      };
    } else if (policy.isExchangeable) {
      return {
        icon: 'swap-horizontal' as const,
        color: '#F59E0B',
        text: 'Exchanges Only',
      };
    } else {
      return {
        icon: 'close-circle' as const,
        color: '#EF4444',
        text: 'No Returns or Exchanges',
      };
    }
  };

  const policyStatus = getPolicyStatus();

  return (
    <View style={styles.container}>
      {/* Header - Always Visible */}
      <Pressable
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
       
      >
        <View style={styles.headerLeft}>
          <Ionicons name="refresh" size={20} color="#8B5CF6" />
          <ThemedText style={styles.title}>Return & Exchange Policy</ThemedText>
        </View>

        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#6B7280"
        />
      </Pressable>

      {/* Quick Status - Always Visible */}
      <View style={styles.statusRow}>
        <Ionicons name={policyStatus.icon} size={18} color={policyStatus.color} />
        <ThemedText style={[styles.statusText, { color: policyStatus.color }]}>
          {policyStatus.text}
        </ThemedText>
      </View>

      {/* Time Windows - Always Visible */}
      <View style={styles.quickInfo}>
        {policy.isReturnable && (
          <View style={styles.quickInfoItem}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <ThemedText style={styles.quickInfoText}>
              {policy.returnWindow}-day returns
            </ThemedText>
          </View>
        )}
        {policy.isExchangeable && (
          <View style={styles.quickInfoItem}>
            <Ionicons name="swap-horizontal-outline" size={16} color="#6B7280" />
            <ThemedText style={styles.quickInfoText}>
              {policy.exchangeWindow}-day exchange
            </ThemedText>
          </View>
        )}
      </View>

      {/* Detailed Policy - Expandable */}
      {isExpanded && (
        <View style={styles.detailsContainer}>
          {/* Divider */}
          <View style={styles.divider} />

          {/* Return Policy Details */}
          {policy.isReturnable && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="arrow-undo" size={18} color="#8B5CF6" />
                <ThemedText style={styles.sectionTitle}>Return Policy</ThemedText>
              </View>
              <ThemedText style={styles.sectionDescription}>
                Items can be returned within {policy.returnWindow} days of delivery for a full
                refund.
              </ThemedText>
            </View>
          )}

          {/* Exchange Policy Details */}
          {policy.isExchangeable && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="swap-horizontal" size={18} color="#8B5CF6" />
                <ThemedText style={styles.sectionTitle}>Exchange Policy</ThemedText>
              </View>
              <ThemedText style={styles.sectionDescription}>
                Items can be exchanged within {policy.exchangeWindow} days for a different size,
                color, or variant.
              </ThemedText>
            </View>
          )}

          {/* Conditions */}
          {policy.conditions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="list" size={18} color="#8B5CF6" />
                <ThemedText style={styles.sectionTitle}>Conditions</ThemedText>
              </View>
              <View style={styles.conditionsList}>
                {policy.conditions.map((condition, index) => (
                  <View key={index} style={styles.conditionItem}>
                    <View style={styles.bullet} />
                    <ThemedText style={styles.conditionText}>{condition}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Non-Returnable Reasons */}
          {policy.nonReturnableReasons && policy.nonReturnableReasons.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="alert-circle" size={18} color="#F59E0B" />
                <ThemedText style={styles.sectionTitle}>Non-Returnable If</ThemedText>
              </View>
              <View style={styles.conditionsList}>
                {policy.nonReturnableReasons.map((reason, index) => (
                  <View key={index} style={styles.conditionItem}>
                    <Ionicons name="close-circle" size={12} color="#EF4444" />
                    <ThemedText style={styles.conditionText}>{reason}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Contact Info */}
          {policy.contactInfo && (
            <View style={styles.contactContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color="#8B5CF6" />
              <ThemedText style={styles.contactText}>{policy.contactInfo}</ThemedText>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable style={styles.actionButton}>
              <Ionicons name="document-text-outline" size={18} color="#8B5CF6" />
              <ThemedText style={styles.actionButtonText}>View Full Policy</ThemedText>
            </Pressable>

            {(policy.isReturnable || policy.isExchangeable) && (
              <Pressable style={styles.actionButton}>
                <Ionicons name="arrow-undo-outline" size={18} color="#8B5CF6" />
                <ThemedText style={styles.actionButtonText}>Initiate Return</ThemedText>
              </Pressable>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  // Status Row
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Quick Info
  quickInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickInfoText: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Details Container
  detailsContainer: {
    marginTop: 16,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // Conditions List
  conditionsList: {
    gap: 8,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8B5CF6',
    marginTop: 6,
  },
  conditionText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
    lineHeight: 18,
  },

  // Contact
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  contactText: {
    fontSize: 13,
    color: '#7C3AED',
    flex: 1,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B5CF6',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
});

export default React.memo(ReturnPolicyCard);

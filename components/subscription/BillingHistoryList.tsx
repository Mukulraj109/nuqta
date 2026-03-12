// Billing History List Component
// Displays list of billing transactions with download invoice functionality

import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { BillingTransaction } from '@/services/subscriptionApi';
import { useRegion } from '@/contexts/RegionContext';

interface Props {
  transactions: BillingTransaction[];
  onDownloadInvoice: (invoiceId: string) => void;
  onViewInvoice?: (transactionId: string) => void;
  loading?: boolean;
}

export default function BillingHistoryList({
  transactions,
  onDownloadInvoice,
  onViewInvoice,
  loading = false,
}: Props) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#ffcd57';
      case 'failed':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return 'checkmark-circle';
      case 'failed':
        return 'close-circle';
      case 'pending':
        return 'time';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  const renderTransaction = (transaction: BillingTransaction) => {
    const statusColor = getStatusColor(transaction.status);
    const statusIcon = getStatusIcon(transaction.status);

    return (
      <View key={transaction.id} style={styles.transactionCard}>
        {/* Header Row */}
        <View style={styles.transactionHeader}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <ThemedText style={styles.dateText}>
              {formatDate(transaction.date)}
            </ThemedText>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Ionicons name={statusIcon as any} size={14} color={statusColor} />
            <ThemedText style={[styles.statusText, { color: statusColor }]}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </ThemedText>
          </View>
        </View>

        {/* Description */}
        <ThemedText style={styles.description}>
          {transaction.description}
        </ThemedText>

        {/* Amount and Details */}
        <View style={styles.detailsRow}>
          <View style={styles.detailsLeft}>
            <ThemedText style={styles.amountLabel}>Amount</ThemedText>
            <ThemedText style={styles.amountValue}>
              {formatAmount(transaction.amount)}
            </ThemedText>
          </View>

          <View style={styles.detailsRight}>
            {transaction.paymentMethod && (
              <View style={styles.paymentMethod}>
                <Ionicons name="card-outline" size={14} color="#6B7280" />
                <ThemedText style={styles.paymentMethodText}>
                  {transaction.paymentMethod}
                </ThemedText>
              </View>
            )}

            <View style={styles.billingCycle}>
              <Ionicons name="repeat-outline" size={14} color="#6B7280" />
              <ThemedText style={styles.billingCycleText}>
                {transaction.billingCycle.charAt(0).toUpperCase() + transaction.billingCycle.slice(1)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {transaction.status === 'paid' && transaction.invoiceUrl && (
          <View style={styles.actionsRow}>
            {onViewInvoice && (
              <Pressable
                style={styles.actionButton}
                onPress={() => onViewInvoice(transaction.id)}
              >
                <Ionicons name="eye-outline" size={18} color="#8B5CF6" />
                <ThemedText style={styles.actionButtonText}>View Invoice</ThemedText>
              </Pressable>
            )}

            <Pressable
              style={[styles.actionButton, styles.downloadButton]}
              onPress={() => onDownloadInvoice(transaction.id)}
            >
              <Ionicons name="download-outline" size={18} color="#FFFFFF" />
              <ThemedText style={styles.downloadButtonText}>Download</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Transaction ID */}
        {transaction.transactionId && (
          <View style={styles.transactionIdRow}>
            <ThemedText style={styles.transactionIdLabel}>Transaction ID:</ThemedText>
            <ThemedText style={styles.transactionIdValue}>
              {transaction.transactionId}
            </ThemedText>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {transactions.map(renderTransaction)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailsLeft: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  detailsRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentMethodText: {
    fontSize: 12,
    color: '#6B7280',
  },
  billingCycle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  billingCycleText: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  downloadButton: {
    backgroundColor: '#8B5CF6',
  },
  downloadButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  transactionIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 6,
  },
  transactionIdLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  transactionIdValue: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
});

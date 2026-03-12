/**
 * Bill Upload Queue Demo Component
 *
 * Demonstrates all features of the offline queue system.
 * Use this as a reference for implementing queue functionality.
 *
 * @module BillUploadQueueDemo
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl} from 'react-native';
import { platformAlertSimple, platformAlertConfirm, platformAlertDestructive } from '@/utils/platformAlert';
import { useOfflineQueue, useBillMonitor } from '../../hooks/useOfflineQueue';
import type { BillUploadData } from '../../types/billVerification.types';

// ============================================================================
// Main Demo Component
// ============================================================================

export const BillUploadQueueDemo: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  const {
    queue,
    status,
    isSyncing,
    isOnline,
    lastSyncResult,
    error,
    addToQueue,
    syncQueue,
    retryFailed,
    clearCompleted,
    clearAll,
    refreshQueue,
    pendingCount,
    failedCount,
    successCount,
    syncProgress,
    getSuccessRate,
    getEstimatedSyncTime,
  } = useOfflineQueue();

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleAddDemoBill = async () => {
    try {
      const mockFormData: BillUploadData = {
        storeId: `store_${Date.now()}`,
        amount: Math.random() * 1000,
        date: new Date(),
        categoryId: 'demo_category',
      };

      const mockImageUri = `file:///demo/bill_${Date.now()}.jpg`;

      const billId = await addToQueue(mockFormData, mockImageUri);

      platformAlertSimple(
        'Bill Added',
        `Bill ID: ${billId}\nStatus: ${isOnline ? 'Queued for upload' : 'Saved offline'}`
      );
    } catch (error: any) {
      platformAlertSimple('Error', error.message);
    }
  };

  const handleSync = async () => {
    try {
      const result = await syncQueue();

      platformAlertSimple(
        'Sync Complete',
        `Successful: ${result.successful}\nFailed: ${result.failed}\nSkipped: ${result.skipped}`
      );
    } catch (error: any) {
      platformAlertSimple('Sync Error', error.message);
    }
  };

  const handleRetryFailed = async () => {
    try {
      await retryFailed();
      platformAlertSimple('Success', 'Retrying failed uploads...');
    } catch (error: any) {
      platformAlertSimple('Error', error.message);
    }
  };

  const handleClearCompleted = async () => {
    platformAlertConfirm(
      'Clear Completed',
      `Remove ${successCount} successful uploads?`,
      async () => {
        await clearCompleted();
        platformAlertSimple('Success', 'Completed bills cleared');
      },
      'Clear'
    );
  };

  const handleClearAll = async () => {
    platformAlertDestructive(
      'Clear All',
      `Remove all ${queue.length} bills from queue?`,
      async () => {
        await clearAll();
        platformAlertSimple('Success', 'Queue cleared');
      },
      'Clear'
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshQueue();
    setRefreshing(false);
  };

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Network Status */}
      <NetworkStatusBanner isOnline={isOnline} pendingCount={pendingCount} />

      {/* Error Display */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}

      {/* Queue Statistics */}
      <QueueStatistics
        status={status}
        syncProgress={syncProgress}
        successRate={getSuccessRate()}
        estimatedTime={getEstimatedSyncTime()}
        lastSyncResult={lastSyncResult}
      />

      {/* Action Buttons */}
      <View style={styles.actions}>
        <ActionButton
          title="Add Demo Bill"
          onPress={handleAddDemoBill}
          icon="add"
          color="#4CAF50"
        />

        <ActionButton
          title={`Sync Now (${pendingCount})`}
          onPress={handleSync}
          icon="sync"
          color="#2196F3"
          disabled={!isOnline || pendingCount === 0 || isSyncing}
          loading={isSyncing}
        />

        {failedCount > 0 && (
          <ActionButton
            title={`Retry Failed (${failedCount})`}
            onPress={handleRetryFailed}
            icon="refresh"
            color="#FF9800"
          />
        )}

        {successCount > 0 && (
          <ActionButton
            title={`Clear Completed (${successCount})`}
            onPress={handleClearCompleted}
            icon="check"
            color="#4CAF50"
          />
        )}

        {queue.length > 0 && (
          <ActionButton
            title="Clear All"
            onPress={handleClearAll}
            icon="delete"
            color="#F44336"
          />
        )}
      </View>

      {/* Queue List */}
      <View style={styles.queueSection}>
        <Text style={styles.sectionTitle}>
          Queue ({queue.length} bills)
        </Text>

        {queue.length === 0 ? (
          <EmptyState />
        ) : (
          queue.map(bill => (
            <BillCard key={bill.id} billId={bill.id} />
          ))
        )}
      </View>
    </ScrollView>
  );
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Network Status Banner
 */
const NetworkStatusBanner: React.FC<{
  isOnline: boolean;
  pendingCount: number;
}> = ({ isOnline, pendingCount }) => {
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.statusBanner,
        isOnline ? styles.statusOnline : styles.statusOffline,
      ]}
    >
      <Text style={styles.statusIcon}>{isOnline ? '☁️' : '📴'}</Text>
      <Text style={styles.statusText}>
        {isOnline
          ? `${pendingCount} bills pending upload`
          : 'Offline - Bills will sync when connection is restored'}
      </Text>
    </View>
  );
};

/**
 * Queue Statistics Display
 */
const QueueStatistics: React.FC<{
  status: any;
  syncProgress: number;
  successRate: number;
  estimatedTime: number;
  lastSyncResult: any;
}> = ({ status, syncProgress, successRate, estimatedTime, lastSyncResult }) => {
  if (!status || status.total === 0) {
    return null;
  }

  return (
    <View style={styles.statistics}>
      <Text style={styles.statisticsTitle}>Queue Statistics</Text>

      <View style={styles.statsGrid}>
        <StatCard label="Total" value={status.total} color="#9E9E9E" />
        <StatCard label="Pending" value={status.pending} color="#FFC107" />
        <StatCard label="Uploading" value={status.uploading} color="#2196F3" />
        <StatCard label="Failed" value={status.failed} color="#F44336" />
        <StatCard label="Success" value={status.success} color="#4CAF50" />
      </View>

      {status.pending > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Upload Progress</Text>
            <Text style={styles.progressValue}>{syncProgress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${syncProgress}%` },
              ]}
            />
          </View>
          {estimatedTime > 0 && (
            <Text style={styles.estimatedTime}>
              Estimated time: {Math.ceil(estimatedTime / 60)} min
            </Text>
          )}
        </View>
      )}

      {status.total > 0 && (
        <View style={styles.additionalStats}>
          <Text style={styles.additionalStatText}>
            Success Rate: {successRate}%
          </Text>
          {lastSyncResult && (
            <Text style={styles.additionalStatText}>
              Last Sync: {lastSyncResult.successful} successful,{' '}
              {lastSyncResult.failed} failed
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

/**
 * Stat Card Component
 */
const StatCard: React.FC<{
  label: string;
  value: number;
  color: string;
}> = ({ label, value, color }) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/**
 * Action Button Component
 */
const ActionButton: React.FC<{
  title: string;
  onPress: () => void;
  icon: string;
  color: string;
  disabled?: boolean;
  loading?: boolean;
}> = ({ title, onPress, icon, color, disabled, loading }) => (
  <Pressable
    style={[
      styles.actionButton,
      { backgroundColor: color },
      disabled && styles.actionButtonDisabled,
    ]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    {loading ? (
      <ActivityIndicator color="#fff" size="small" />
    ) : (
      <Text style={styles.actionButtonText}>{title}</Text>
    )}
  </Pressable>
);

/**
 * Bill Card Component
 */
const BillCard: React.FC<{ billId: string }> = ({ billId }) => {
  const bill = useBillMonitor(billId);

  if (!bill) {
    return null;
  }

  const getStatusColor = () => {
    switch (bill.status) {
      case 'success':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      case 'uploading':
        return '#2196F3';
      default:
        return '#FFC107';
    }
  };

  const getStatusIcon = () => {
    switch (bill.status) {
      case 'success':
        return '✓';
      case 'failed':
        return '✗';
      case 'uploading':
        return '↑';
      default:
        return '⋯';
    }
  };

  return (
    <View style={styles.billCard}>
      <View
        style={[styles.billStatus, { backgroundColor: getStatusColor() }]}
      >
        <Text style={styles.billStatusIcon}>{getStatusIcon()}</Text>
      </View>

      <View style={styles.billInfo}>
        <Text style={styles.billStore}>{bill.formData.storeId}</Text>
        <Text style={styles.billAmount}>
          ${bill.formData.amount.toFixed(2)}
        </Text>
        <Text style={styles.billTimestamp}>
          {new Date(bill.timestamp).toLocaleString()}
        </Text>

        {bill.error && (
          <Text style={styles.billError}>{bill.error}</Text>
        )}

        {bill.attempt > 0 && (
          <Text style={styles.billAttempts}>
            Attempt {bill.attempt} of 3
          </Text>
        )}
      </View>

      {bill.status === 'uploading' && (
        <ActivityIndicator color={getStatusColor()} />
      )}
    </View>
  );
};

/**
 * Empty State Component
 */
const EmptyState: React.FC = () => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>📭</Text>
    <Text style={styles.emptyText}>Queue is empty</Text>
    <Text style={styles.emptySubtext}>
      Add bills to see them here
    </Text>
  </View>
);

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  statusOnline: {
    backgroundColor: '#E3F2FD',
  },
  statusOffline: {
    backgroundColor: '#FFEBEE',
  },
  statusIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
  },
  statistics: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  statisticsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statCard: {
    width: '33.33%',
    padding: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  estimatedTime: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  additionalStats: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  additionalStatText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  actions: {
    padding: 16,
    gap: 8,
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  queueSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  billCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  billStatus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  billStatusIcon: {
    fontSize: 20,
    color: '#fff',
  },
  billInfo: {
    flex: 1,
  },
  billStore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  billAmount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  billTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  billError: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  billAttempts: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
});

export default BillUploadQueueDemo;

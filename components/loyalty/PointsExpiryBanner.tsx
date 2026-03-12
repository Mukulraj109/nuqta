/**
 * Points Expiry Banner Component
 * Warns users about expiring points
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { PointExpiryNotification, RewardItem } from '@/types/loyaltyRedemption.types';

interface PointsExpiryBannerProps {
  notification: PointExpiryNotification;
  onViewRecommendations?: () => void;
  onDismiss?: () => void;
}

export default function PointsExpiryBanner({
  notification,
  onViewRecommendations,
  onDismiss,
}: PointsExpiryBannerProps) {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const urgencyColor = getUrgencyColor(notification.urgency);

  return (
    <View style={[styles.container, { borderColor: urgencyColor }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${urgencyColor}15` }]}>
        <Ionicons name="warning" size={24} color={urgencyColor} />
      </View>

      <View style={styles.content}>
        <ThemedText style={styles.title}>Points Expiring Soon!</ThemedText>
        <ThemedText style={styles.message}>
          <ThemedText style={[styles.pointsText, { color: urgencyColor }]}>
            {notification.points} points
          </ThemedText>
          {' '}will expire in{' '}
          <ThemedText style={styles.daysText}>
            {notification.daysRemaining} day{notification.daysRemaining !== 1 ? 's' : ''}
          </ThemedText>
        </ThemedText>
        <ThemedText style={styles.date}>
          Expiry Date: {new Date(notification.expiryDate).toLocaleDateString()}
        </ThemedText>

        {notification.suggestedRewards.length > 0 && (
          <Pressable
            style={[styles.actionButton, { backgroundColor: urgencyColor }]}
            onPress={onViewRecommendations}
          >
            <Ionicons name="gift" size={16} color="#FFFFFF" />
            <ThemedText style={styles.actionText}>
              View {notification.suggestedRewards.length} Recommended Rewards
            </ThemedText>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>
        )}
      </View>

      {onDismiss && (
        <Pressable style={styles.dismissButton} onPress={onDismiss}>
          <Ionicons name="close" size={20} color="#9CA3AF" />
        </Pressable>
      )}
    </View>
);
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 20,
  },
  pointsText: {
    fontWeight: '700',
  },
  daysText: {
    fontWeight: '600',
    color: '#111827',
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  dismissButton: {
    padding: 4,
    alignSelf: 'flex-start',
  },
});

// Retention Offer Card Component
// Display personalized offers to retain canceling users

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

export type RetentionOfferType = 'discount' | 'usage_tips' | 'benefits_reminder';

interface RetentionOffer {
  type: RetentionOfferType;
  title: string;
  description: string;
  ctaText: string;
  icon: string;
  value?: string;
}

interface RetentionOfferCardProps {
  offer: RetentionOffer;
  onAccept: () => void;
  onDecline: () => void;
}

function RetentionOfferCard({
  offer,
  onAccept,
  onDecline,
}: RetentionOfferCardProps) {
  const getGradient = () => {
    switch (offer.type) {
      case 'discount':
        return ['#8B5CF6', '#A78BFA'];
      case 'usage_tips':
        return ['#3B82F6', '#60A5FA'];
      case 'benefits_reminder':
        return ['#F59E0B', '#FBBF24'];
      default:
        return ['#8B5CF6', '#A78BFA'];
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={getGradient() as any} style={styles.header}>
        <Ionicons name={offer.icon as any} size={48} color="#FFFFFF" />
        <ThemedText style={styles.headerTitle}>{offer.title}</ThemedText>
      </LinearGradient>

      <View style={styles.body}>
        <ThemedText style={styles.description}>{offer.description}</ThemedText>

        {offer.value && (
          <View style={styles.valueContainer}>
            <ThemedText style={styles.valueText}>{offer.value}</ThemedText>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable style={styles.acceptButton} onPress={onAccept}>
            <ThemedText style={styles.acceptButtonText}>{offer.ctaText}</ThemedText>
          </Pressable>

          <Pressable style={styles.declineButton} onPress={onDecline}>
            <ThemedText style={styles.declineButtonText}>No, Continue to Cancel</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    padding: 32,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  body: {
    padding: 24,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  valueContainer: {
    backgroundColor: '#8B5CF610',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  valueText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  actions: {
    gap: 12,
  },
  acceptButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  declineButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default React.memo(RetentionOfferCard);

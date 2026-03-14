// Challenge Card Component
// Display challenge progress with claim reward button

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import type { Challenge } from '@/types/gamification.types';

interface ChallengeCardProps {
  challenge: Challenge;
  onClaim?: (challengeId: string) => void;
}

const DIFFICULTY_COLORS = {
  easy: '#10B981',
  medium: '#F59E0B',
  hard: '#EF4444',
};

function ChallengeCard({ challenge, onClaim }: ChallengeCardProps) {
  const difficultyColor = DIFFICULTY_COLORS[challenge.difficulty];
  const isCompleted = challenge.status === 'completed';
  const isClaimed = challenge.status === 'claimed';
  const progressPercentage = challenge.progress.percentage;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[challenge.color, `${challenge.color}CC`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconContainer}
      >
        <Ionicons name={challenge.icon as any} size={32} color="#FFFFFF" />
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>{challenge.title}</ThemedText>
          <View style={[styles.difficultyBadge, { backgroundColor: `${difficultyColor}20` }]}>
            <ThemedText style={[styles.difficultyText, { color: difficultyColor }]}>
              {challenge.difficulty.toUpperCase()}
            </ThemedText>
          </View>
        </View>

        <ThemedText style={styles.description}>{challenge.description}</ThemedText>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                  backgroundColor: challenge.color,
                },
              ]}
            />
          </View>
          <ThemedText style={styles.progressText}>
            {challenge.progress.current}/{challenge.progress.target}
          </ThemedText>
        </View>

        {/* Rewards */}
        <View style={styles.rewardsSection}>
          <View style={styles.rewardItem}>
            <Ionicons name="diamond" size={16} color="#F59E0B" />
            <ThemedText style={styles.rewardText}>{challenge.rewards.coins} Coins</ThemedText>
          </View>
          {challenge.rewards.badges && challenge.rewards.badges.length > 0 && (
            <View style={styles.rewardItem}>
              <Ionicons name="trophy" size={16} color="#8B5CF6" />
              <ThemedText style={styles.rewardText}>
                {challenge.rewards.badges.length} Badge{challenge.rewards.badges.length > 1 ? 's' : ''}
              </ThemedText>
            </View>
          )}
          {challenge.rewards.vouchers && challenge.rewards.vouchers.length > 0 && (
            <View style={styles.rewardItem}>
              <Ionicons name="gift" size={16} color="#EF4444" />
              <ThemedText style={styles.rewardText}>Voucher</ThemedText>
            </View>
          )}
        </View>

        {/* Action Button */}
        {isClaimed ? (
          <View style={styles.claimedButton}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <ThemedText style={styles.claimedText}>Claimed</ThemedText>
          </View>
        ) : isCompleted ? (
          <Pressable
            style={styles.claimButton}
            onPress={() => onClaim?.(challenge.id)}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.claimButtonGradient}
            >
              <ThemedText style={styles.claimButtonText}>Claim Reward</ThemedText>
              <Ionicons name="arrow-forward-circle" size={20} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        ) : (
          <View style={styles.inProgressButton}>
            <ThemedText style={styles.inProgressText}>In Progress</ThemedText>
          </View>
        )}
      </View>
    </View>
);
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 50,
  },
  rewardsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 12,
    color: '#6B7280',
  },
  claimButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  claimButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  inProgressButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  inProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  claimedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B98120',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  claimedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
});

export default React.memo(ChallengeCard);

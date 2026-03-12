import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

interface ChallengeCardProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  progress: number;
  maxProgress: number;
  onPress?: () => void;
  isCompleted?: boolean;
}

export default function ChallengeCard({ 
  title, 
  description, 
  icon, 
  iconColor, 
  progress, 
  maxProgress, 
  onPress,
  isCompleted = false
}: ChallengeCardProps) {
  const progressPercentage = Math.min((progress / maxProgress) * 100, 100);

  return (
    <Pressable
      style={[styles.challengeCard, isCompleted && styles.completedCard]}
      onPress={onPress}
      disabled={isCompleted}
      accessibilityLabel={`${title} challenge. ${description}. Progress: ${progress} out of ${maxProgress}${isCompleted ? '. Complete!' : ''}`}
      accessibilityRole="button"
      accessibilityHint={isCompleted ? 'Challenge completed' : 'Double tap to view challenge details and continue progress'}
      accessibilityState={{ disabled: isCompleted }}
    >
      <View style={styles.challengeInfo}>
        <View style={[styles.iconContainer, isCompleted && styles.completedIcon]}>
          <Ionicons 
            name={isCompleted ? "checkmark-circle" : icon} 
            size={24} 
            color={isCompleted ? "#10B981" : iconColor} 
          />
        </View>
        <View style={styles.challengeDetails}>
          <ThemedText style={[styles.challengeTitle, isCompleted && styles.completedText]}>
            {title}
          </ThemedText>
          <ThemedText style={[styles.challengeDescription, isCompleted && styles.completedDescription]}>
            {description}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.challengeProgress}>
        <ThemedText style={[styles.progressText, isCompleted && styles.completedProgressText]}>
          {isCompleted ? "Complete!" : `${progress}/${maxProgress}`}
        </ThemedText>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill, 
            { width: `${progressPercentage}%` },
            isCompleted && styles.completedFill
          ]} />
        </View>
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name="trophy" size={12} color="#FFD700" />
          </View>
        )}
      </View>
    </Pressable>
);
}

const styles = StyleSheet.create({
  challengeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  completedCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
    borderWidth: 1,
  },
  challengeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  completedIcon: {
    transform: [{ scale: 1.1 }],
  },
  challengeDetails: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  challengeDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  completedText: {
    color: '#10B981',
  },
  completedDescription: {
    color: '#059669',
  },
  challengeProgress: {
    alignItems: 'flex-end',
    minWidth: 60,
    position: 'relative',
  },
  progressText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
    marginBottom: 4,
  },
  completedProgressText: {
    color: '#10B981',
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
    minWidth: 2,
  },
  completedFill: {
    backgroundColor: '#10B981',
  },
  completedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
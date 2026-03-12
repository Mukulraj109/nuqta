import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { platformAlertSimple, platformAlertConfirm } from '@/utils/platformAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { OrderMilestone } from '@/types/partner.types';

interface MilestoneTrackerProps {
  milestones: OrderMilestone[];
  currentOrders: number;
  onClaimReward?: (milestoneId: string) => void;
}

export default function MilestoneTracker({ 
  milestones, 
  currentOrders = 0, // Fixed: Don't hardcode to 12, use actual value from props
  onClaimReward 
}: MilestoneTrackerProps) {
  const sortedMilestones = milestones.sort((a, b) => 
    (a.orderNumber || a.orderCount || 0) - (b.orderNumber || b.orderCount || 0)
  );
  
  const handleClaimPress = (milestone: OrderMilestone) => {
    if (milestone.reward?.isClaimed) {
      platformAlertSimple('Already Claimed', 'This reward has already been claimed.');
      return;
    }

    if (!milestone.isCompleted) {
      platformAlertSimple('Not Available', 'Complete more orders to unlock this reward.');
      return;
    }

    platformAlertConfirm('Claim Reward', `Claim ${milestone.reward?.title}?`, () => onClaimReward?.(milestone.id), 'Claim');
  };

  const renderMilestone = (milestone: OrderMilestone) => {
    const isCompleted = milestone.isCompleted;
    const isClaimed = milestone.reward?.isClaimed || false;
    const milestoneOrderCount = milestone.orderNumber || milestone.orderCount || 0;
    const isNext = !isCompleted && currentOrders < milestoneOrderCount;
    const canClaim = isCompleted && !isClaimed;

    return (
      <Pressable
        key={milestone.id}
        style={[
          styles.milestoneCard,
          isCompleted && styles.completedMilestoneCard,
          isNext && styles.nextMilestoneCard,
          milestone.isLocked && styles.lockedMilestoneCard
        ]}
        onPress={() => handleClaimPress(milestone)}
       
        disabled={milestone.isLocked}
      >
        {/* Order Number Badge */}
        <View style={[
          styles.orderBadge,
          isCompleted && styles.completedOrderBadge,
          isNext && styles.nextOrderBadge
        ]}>
          <Text style={[
            styles.orderBadgeText,
            isCompleted && styles.completedOrderBadgeText,
            isNext && styles.nextOrderBadgeText
          ]}>
            {milestoneOrderCount}
          </Text>
          <Text style={[
            styles.orderBadgeLabel,
            isCompleted && styles.completedOrderBadgeLabel,
            isNext && styles.nextOrderBadgeLabel
          ]}>
            Orders
          </Text>
        </View>

        {/* Status Indicator */}
        <View style={styles.statusContainer}>
          {milestone.isLocked ? (
            <View style={styles.lockedContainer}>
              <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
              <Text style={styles.lockedText}>Locked</Text>
            </View>
          ) : isCompleted ? (
            <View style={styles.completedContainer}>
              <LinearGradient
                colors={['#10B981', '#059669'] as const}
                style={styles.completedIcon}
              >
                <Ionicons name="checkmark" size={16} color="white" />
              </LinearGradient>
              <Text style={styles.completedText}>Completed</Text>
            </View>
          ) : (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {currentOrders}/{milestoneOrderCount}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${Math.min((currentOrders / milestoneOrderCount) * 100, 100)}%` }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>

        {/* Reward Info */}
        {milestone.reward && (
          <View style={styles.rewardContainer}>
            {milestone.reward.image && (
              <CachedImage
                source={milestone.reward.image}
                style={styles.rewardImage}
              />
            )}
            <View style={styles.rewardDetails}>
              <Text style={[
                styles.rewardTitle,
                isCompleted && styles.completedRewardTitle
              ]}>
                {milestone.reward.title}
              </Text>
              <Text style={styles.rewardDescription}>
                {milestone.reward.description}
              </Text>
              {milestone.reward.validUntil && (
                <Text style={styles.rewardValidity}>
                  Valid until: {new Date(milestone.reward.validUntil).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.actionContainer}>
          {milestone.isLocked ? (
            <View style={styles.lockedButton}>
              <Text style={styles.lockedButtonText}>Complete previous milestones</Text>
            </View>
          ) : isClaimed ? (
            <View style={styles.claimedButton}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.claimedButtonText}>Claimed</Text>
            </View>
          ) : canClaim ? (
            <Pressable
              style={styles.claimButton}
              onPress={() => handleClaimPress(milestone)}
            >
              <LinearGradient
                colors={['#00C06A', '#00796B'] as const}
                style={styles.claimButtonGradient}
              >
                <Text style={styles.claimButtonText}>Claim Now</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </LinearGradient>
            </Pressable>
          ) : (
            <View style={styles.pendingButton}>
              <Text style={styles.pendingButtonText}>
                {Math.max(0, milestoneOrderCount - currentOrders)} more orders to unlock
              </Text>
            </View>
          )}
        </View>

        {/* Connection Line */}
        {sortedMilestones.indexOf(milestone) < sortedMilestones.length - 1 && (
          <View style={styles.connectionLine} />
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <LinearGradient
            colors={['#00C06A', '#00796B'] as const}
            style={styles.headerIconGradient}
          >
            <Ionicons name="ribbon" size={20} color="white" />
          </LinearGradient>
        </View>
        <Text style={styles.headerTitle}>More Rewards</Text>
      </View>

      {/* Progress Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          You have placed <Text style={styles.summaryHighlight}>{currentOrders} orders</Text> for:
        </Text>
        <View style={styles.completedMilestonesContainer}>
          {sortedMilestones.filter(m => m.isCompleted).map((milestone) => (
            <View key={milestone.id} style={styles.completedMilestoneChip}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.completedMilestoneChipText}>
                {milestone.orderNumber}th order reward
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Milestones List */}
      <View style={styles.milestonesContainer}>
        {sortedMilestones.map(renderMilestone)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  summaryHighlight: {
    fontWeight: '700',
    color: '#00C06A',
  },
  completedMilestonesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  completedMilestoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  completedMilestoneChipText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
    marginLeft: 4,
  },
  milestonesContainer: {
    gap: 16,
  },
  milestoneCard: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 16,
    position: 'relative',
    backgroundColor: '#FAFAFA',
  },
  completedMilestoneCard: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  nextMilestoneCard: {
    borderColor: '#00C06A',
    backgroundColor: '#F0FDF4',
  },
  lockedMilestoneCard: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  orderBadge: {
    position: 'absolute',
    top: -12,
    left: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 60,
  },
  completedOrderBadge: {
    backgroundColor: '#10B981',
  },
  nextOrderBadge: {
    backgroundColor: '#00C06A',
  },
  orderBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  completedOrderBadgeText: {
    color: 'white',
  },
  nextOrderBadgeText: {
    color: 'white',
  },
  orderBadgeLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  completedOrderBadgeLabel: {
    color: 'white',
  },
  nextOrderBadgeLabel: {
    color: 'white',
  },
  statusContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  lockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
    fontWeight: '500',
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    fontSize: 14,
    color: '#10B981',
    marginLeft: 8,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'flex-start',
  },
  progressText: {
    fontSize: 14,
    color: '#00C06A',
    fontWeight: '600',
    marginBottom: 6,
  },
  progressBar: {
    width: 100,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00C06A',
    borderRadius: 2,
  },
  rewardContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  rewardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  rewardDetails: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  completedRewardTitle: {
    color: '#059669',
  },
  rewardDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 18,
  },
  rewardValidity: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  actionContainer: {
    alignItems: 'flex-start',
  },
  lockedButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  lockedButtonText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  claimedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  claimedButtonText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 6,
  },
  claimButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  claimButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  claimButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginRight: 8,
  },
  pendingButton: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pendingButtonText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
  },
  connectionLine: {
    position: 'absolute',
    bottom: -16,
    left: '50%',
    width: 2,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginLeft: -1,
  },
});
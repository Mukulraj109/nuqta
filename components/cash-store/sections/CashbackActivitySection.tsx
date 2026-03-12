/**
 * CashbackActivitySection Component
 *
 * Premium section showing user's recent cashback activity/transactions
 * Features: Timeline design, animated status dots, color-coded indicators, expandable details
 */

import React, { memo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CashbackActivity, formatCurrency } from '../../../types/cash-store.types';

interface CashbackActivitySectionProps {
  activities: CashbackActivity[];
  isLoading?: boolean;
  onActivityPress: (activity: CashbackActivity) => void;
  onViewAllPress: () => void;
  onStartShopping?: () => void;
}

const getStatusColor = (status: CashbackActivity['status']): string => {
  switch (status) {
    case 'pending':
      return '#E8B896';
    case 'confirmed':
      return '#1a3a52';
    case 'available':
      return '#ffcd57';
    case 'expired':
    case 'cancelled':
      return '#D4A07A';
    default:
      return '#6B7280';
  }
};

const getStatusGradient = (status: CashbackActivity['status']): string[] => {
  switch (status) {
    case 'pending':
      return ['#E8B896', '#D4A07A'];
    case 'confirmed':
      return ['#1a3a52', '#243f55'];
    case 'available':
      return ['#D4A07A', '#1a3a52'];
    case 'expired':
    case 'cancelled':
      return ['#D4A07A', '#c99077'];
    default:
      return ['#6B7280', '#4B5563'];
  }
};

const getStatusIcon = (status: CashbackActivity['status']): string => {
  switch (status) {
    case 'pending':
      return 'time';
    case 'confirmed':
      return 'checkmark-circle';
    case 'available':
      return 'wallet';
    case 'expired':
      return 'alert-circle';
    case 'cancelled':
      return 'close-circle';
    default:
      return 'help-circle';
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
};

const ActivityItem: React.FC<{
  activity: CashbackActivity;
  index: number;
  isLast: boolean;
  onPress: () => void;
}> = memo(({ activity, index, isLast, onPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Staggered entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for pending status
    let pulseLoop: Animated.CompositeAnimation | null = null;
    if (activity.status === 'pending') {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    }
    return () => {
      if (pulseLoop) pulseLoop.stop();
    };
  }, [index, activity.status]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const statusColor = getStatusColor(activity.status);
  const statusGradient = getStatusGradient(activity.status);
  const statusIcon = getStatusIcon(activity.status);

  return (
    <Animated.View
      style={[
        styles.activityItemWrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      {/* Timeline Line */}
      {!isLast && <View style={styles.timelineLine} />}

      {/* Timeline Dot */}
      <Animated.View
        style={[
          styles.timelineDotContainer,
          activity.status === 'pending' && { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <LinearGradient colors={statusGradient} style={styles.timelineDot}>
          <Ionicons name={statusIcon as any} size={12} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>

      {/* Activity Card */}
      <Pressable
        style={styles.activityItem}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
       
      >
        {/* Brand Logo */}
        <View style={styles.logoContainer}>
          {activity.brand.logo?.startsWith('http') ? (
            <CachedImage
              source={activity.brand.logo}
              style={styles.brandLogo}
              contentFit="contain"
            />
          ) : activity.brand.logo ? (
            <Text style={{ fontSize: 28 }}>{activity.brand.logo}</Text>
          ) : (
            <LinearGradient colors={['#ffd7b5', '#E8B896']} style={styles.logoPlaceholder}>
              <Text style={styles.logoInitial}>{activity.brand.name.charAt(0)}</Text>
            </LinearGradient>
          )}
        </View>

        {/* Content */}
        <View style={styles.activityContent}>
          <Text style={styles.brandName}>{activity.brand.name}</Text>
          <Text style={styles.purchaseAmount}>
            Purchase: {formatCurrency(activity.purchaseAmount)}
          </Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={10} color="#9CA3AF" />
            <Text style={styles.dateText}>{formatDate(activity.date)}</Text>
          </View>
        </View>

        {/* Cashback Amount & Status */}
        <View style={styles.activityRight}>
          <Text style={[styles.cashbackAmount, { color: statusColor }]}>
            +{formatCurrency(activity.cashbackAmount)}
          </Text>
          <LinearGradient
            colors={[`${statusColor}20`, `${statusColor}10`]}
            style={styles.statusBadge}
          >
            <Ionicons name={statusIcon as any} size={10} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
            </Text>
          </LinearGradient>
        </View>

        {/* Arrow Indicator */}
        <View style={styles.arrowIndicator}>
          <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
        </View>
      </Pressable>
    </Animated.View>
  );
});

const SkeletonItem: React.FC<{ index: number }> = memo(({ index }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          delay: index * 100,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [index]);

  return (
    <Animated.View
      style={[
        styles.activityItemWrapper,
        {
          opacity: shimmerAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
          }),
        },
      ]}
    >
      <View style={styles.timelineDotContainer}>
        <View style={[styles.timelineDot, styles.skeleton]} />
      </View>
      <View style={styles.activityItem}>
        <View style={[styles.logoContainer, styles.skeleton]} />
        <View style={styles.activityContent}>
          <View style={[styles.skeletonText, { width: 100 }]} />
          <View style={[styles.skeletonText, { width: 80 }]} />
          <View style={[styles.skeletonText, { width: 60 }]} />
        </View>
        <View style={styles.activityRight}>
          <View style={[styles.skeletonText, { width: 60 }]} />
          <View style={[styles.skeletonBadge]} />
        </View>
      </View>
    </Animated.View>
  );
});

const CashbackActivitySection: React.FC<CashbackActivitySectionProps> = ({
  activities,
  isLoading = false,
  onActivityPress,
  onViewAllPress,
  onStartShopping,
}) => {
  const headerFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  if (activities.length === 0 && !isLoading) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerFadeAnim }]}>
          <View style={styles.titleRow}>
            <LinearGradient
              colors={['#ffd7b5', '#E8B896']}
              style={styles.headerIconContainer}
            >
              <Ionicons name="receipt" size={16} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.title}>Your Cashback Activity</Text>
          </View>
        </Animated.View>

        {/* Empty State */}
        <View style={styles.emptyState}>
          <LinearGradient
            colors={['#F9FAFB', '#F3F4F6']}
            style={styles.emptyIconContainer}
          >
            <Ionicons name="wallet-outline" size={40} color="#D1D5DB" />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptySubtitle}>
            Start shopping to earn cashback rewards
          </Text>
          <Pressable style={styles.emptyButton} onPress={onStartShopping || onViewAllPress}>
            <LinearGradient
              colors={['#ffd7b5', '#E8B896']}
              style={styles.emptyButtonGradient}
            >
              <Text style={styles.emptyButtonText}>Start Shopping</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerFadeAnim }]}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <LinearGradient
              colors={['#ffd7b5', '#E8B896']}
              style={styles.headerIconContainer}
            >
              <Ionicons name="receipt" size={16} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.title}>Your Cashback Activity</Text>
          </View>
          <Text style={styles.subtitle}>Track your earnings</Text>
        </View>
        <Pressable
          onPress={onViewAllPress}
          style={styles.viewAllButton}
         
        >
          <Text style={styles.viewAllText}>View All</Text>
          <View style={styles.viewAllArrow}>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </View>
        </Pressable>
      </Animated.View>

      {/* Activity List with Timeline */}
      <View style={styles.activityList}>
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => <SkeletonItem key={`skeleton-${index}`} index={index} />)
          : activities.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                index={index}
                isLast={index === activities.length - 1}
                onPress={() => onActivityPress(activity)}
              />
            ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  headerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a3a52',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 42,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a3a52',
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewAllArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityList: {
    paddingHorizontal: 16,
    paddingLeft: 24,
  },
  activityItemWrapper: {
    flexDirection: 'row',
    position: 'relative',
    marginBottom: 4,
  },
  timelineLine: {
    position: 'absolute',
    left: 12,
    top: 36,
    bottom: -4,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  timelineDotContainer: {
    position: 'absolute',
    left: 0,
    top: 16,
    zIndex: 1,
  },
  timelineDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  activityItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 36,
    paddingVertical: 14,
    paddingRight: 10,
    paddingLeft: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  brandLogo: {
    width: 30,
    height: 30,
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activityContent: {
    flex: 1,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a3a52',
    marginBottom: 3,
  },
  purchaseAmount: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 3,
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  activityRight: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  cashbackAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  arrowIndicator: {
    marginLeft: 4,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a3a52',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Skeleton
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  skeletonText: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonBadge: {
    width: 70,
    height: 22,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
  },
});

export default memo(CashbackActivitySection);

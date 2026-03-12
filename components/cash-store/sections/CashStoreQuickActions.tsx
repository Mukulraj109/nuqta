/**
 * CashStoreQuickActions Component
 *
 * Premium 2x2 grid of quick action cards for Cash Store
 * Features: Animated icons, notification badges, gradient backgrounds
 */

import React, { memo, useRef, useEffect } from 'react';
import { BRAND } from '@/constants/brand';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CashStoreQuickAction } from '../../../types/cash-store.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - (HORIZONTAL_PADDING * 2) - CARD_GAP) / 2;

// Nuqta Color Palette - Cash Store Peach Theme
const NUQTA_COLORS = {
  nileBlue: '#1a3a52',
  nileBlueLight: '#2A5577',
  linen: '#faf1e0',
  lightPeach: '#ffd7b5',
  peachDark: '#E8B896',
  peachDarker: '#D4A07A',
};

// Default 4 quick actions - strategic use of all Nuqta palette colors
const DEFAULT_QUICK_ACTIONS: CashStoreQuickAction[] = [
  {
    id: 'buy-coupons',
    title: 'Buy Coupons',
    subtitle: 'Get extra cashback',
    icon: 'pricetag',
    backgroundColor: '#E8B896',
    gradientColors: ['#E8B896', '#D4A07A'],
    action: 'buy-coupons',
  },
  {
    id: 'extra-coins',
    title: `Extra ${BRAND.COIN_NAME}`,
    subtitle: 'Double rewards',
    icon: 'wallet',
    backgroundColor: NUQTA_COLORS.nileBlue,
    gradientColors: ['#1a3a52', '#234b68'],
    action: 'extra-coins',
    badge: '2X',
  },
  {
    id: 'track-cashback',
    title: 'Track Cashback',
    subtitle: 'View your earnings',
    icon: 'trending-up',
    backgroundColor: '#ffd7b5',
    gradientColors: ['#ffd7b5', '#E8B896'],
    action: 'track-cashback',
  },
  {
    id: 'trending',
    title: 'Trending Offers',
    subtitle: 'Hot deals today',
    icon: 'flame',
    backgroundColor: '#1a3a52',
    gradientColors: ['#234b68', '#1a3a52'],
    action: 'trending',
    badge: 'NEW',
  },
];

interface CashStoreQuickActionsProps {
  actions?: CashStoreQuickAction[];
  onActionPress: (actionId: string) => void;
}

const ActionCard: React.FC<{
  action: CashStoreQuickAction;
  index: number;
  onPress: () => void;
}> = memo(({ action, index, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const iconBounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Staggered entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(iconBounceAnim, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(iconBounceAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const isLight = action.id === 'track-cashback';

  return (
    <Animated.View
      style={[
        styles.actionCardWrapper,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Pressable
        style={styles.actionCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
       
      >
        <LinearGradient
          colors={action.gradientColors || [action.backgroundColor, action.backgroundColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Decorative circle */}
          <View style={styles.decorativeCircle1} />

          {/* Badge */}
          {action.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{action.badge}</Text>
            </View>
          )}

          {/* Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ scale: iconBounceAnim }] },
              isLight && { backgroundColor: 'rgba(26,58,82,0.12)', borderColor: 'rgba(26,58,82,0.08)' },
            ]}
          >
            <Ionicons
              name={action.icon as any}
              size={20}
              color={isLight ? '#1a3a52' : '#FFFFFF'}
            />
          </Animated.View>

          {/* Text Content — full width below icon */}
          <View style={styles.textContainer}>
            <Text style={[styles.title, isLight && { color: '#1a3a52' }]}>
              {action.title}
            </Text>
            <Text style={[styles.subtitle, isLight && { color: 'rgba(26,58,82,0.6)' }]}>
              {action.subtitle}
            </Text>
          </View>

          {/* Arrow — bottom right */}
          <View style={styles.arrowContainer}>
            <Ionicons
              name="chevron-forward"
              size={13}
              color={isLight ? 'rgba(26,58,82,0.4)' : 'rgba(255,255,255,0.6)'}
            />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
});

const CashStoreQuickActions: React.FC<CashStoreQuickActionsProps> = ({
  actions = DEFAULT_QUICK_ACTIONS,
  onActionPress,
}) => {
  // Use default actions if less than 4 provided
  const displayActions = actions.length >= 4 ? actions.slice(0, 4) : DEFAULT_QUICK_ACTIONS;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {displayActions.map((action, index) => (
          <ActionCard
            key={action.id}
            action={action}
            index={index}
            onPress={() => onActionPress(action.id)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  actionCardWrapper: {
    width: CARD_WIDTH,
    minWidth: 150,
  },
  actionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#8B7355',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardGradient: {
    padding: 14,
    minHeight: 120,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -25,
    right: -25,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  textContainer: {
    marginTop: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  arrowContainer: {
    alignSelf: 'flex-end',
    marginTop: 6,
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ffcd57',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1a3a52',
    letterSpacing: 0.3,
  },
});

export default memo(CashStoreQuickActions);

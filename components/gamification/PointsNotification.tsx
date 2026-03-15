/**
 * Points Notification Component
 * Animated toast notification for points earned/spent
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

export interface PointsNotificationData {
  amount: number;
  type: 'earned' | 'spent';
  reason: string;
  icon?: string;
  duration?: number;
}

interface PointsNotificationProps {
  data: PointsNotificationData;
  onDismiss: () => void;
}

function PointsNotification({ data, onDismiss }: PointsNotificationProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  const { amount, type, reason, icon, duration = 3000 } = data;

  useEffect(() => {
    // Entrance animation
    const _anim0 = Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]);
    _anim0.start();

    // Auto dismiss after duration
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => {
      _anim0.stop();
      clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const isEarned = type === 'earned';
  const iconName = icon || (isEarned ? 'add-circle' : 'remove-circle');
  const color = isEarned ? colors.successScale[400] : colors.error;
  const backgroundColor = isEarned ? colors.tint.greenLight : colors.errorScale[50];
  const borderColor = isEarned ? colors.successScale[400] : colors.error;
  const prefix = isEarned ? '+' : '-';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }, { scale }],
          opacity,
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <Pressable
        style={styles.content}
        onPress={handleDismiss}
       
      >
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name={iconName as any} size={24} color={colors.background.primary} />
        </View>

        <View style={styles.textContainer}>
          <View style={styles.pointsRow}>
            <Ionicons name="diamond" size={16} color={color} />
            <Text style={[styles.pointsText, { color }]}>
              {prefix}{amount} Coins
            </Text>
          </View>
          <Text style={styles.reasonText} numberOfLines={1}>
            {reason}
          </Text>
        </View>

        <Pressable onPress={handleDismiss} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={colors.neutral[500]} />
        </Pressable>
      </Pressable>

      {/* Animated bar showing time left */}
      <Animated.View
        style={[
          styles.progressBar,
          {
            backgroundColor: color,
            width: translateY.interpolate({
              inputRange: [-100, 0],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 6,
  },
  reasonText: {
    fontSize: 13,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  progressBar: {
    height: 4,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
});

export default React.memo(PointsNotification);

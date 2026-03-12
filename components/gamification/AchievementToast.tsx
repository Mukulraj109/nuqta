import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Achievement } from '@/services/achievementApi';

const { width } = Dimensions.get('window');

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
  onPress?: () => void;
  autoHideDuration?: number;
}

export default function AchievementToast({
  achievement,
  onDismiss,
  onPress,
  autoHideDuration = 5000,
}: AchievementToastProps) {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();

    // Auto-hide timer
    const timer = setTimeout(() => {
      handleDismiss();
    }, autoHideDuration);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onDismiss();
    });
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    }
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <Pressable
       
        onPress={handlePress}
        style={styles.touchable}
      >
        <LinearGradient
          colors={[achievement.color || '#8B5CF6', '#7C3AED']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.content}>
            {/* Achievement Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconBg}>
                <Ionicons
                  name={achievement.icon as any || 'trophy'}
                  size={32}
                  color="#FFD700"
                />
              </View>
              {/* Sparkle effect */}
              <View style={styles.sparkle}>
                <Ionicons name="sparkles" size={16} color="#FFD700" />
              </View>
            </View>

            {/* Achievement Details */}
            <View style={styles.details}>
              <Text style={styles.badge}>Achievement Unlocked!</Text>
              <Text style={styles.title} numberOfLines={1}>
                {achievement.title}
              </Text>
              <Text style={styles.description} numberOfLines={2}>
                {achievement.description}
              </Text>
            </View>

            {/* Close Button */}
            <Pressable
              style={styles.closeButton}
              onPress={handleDismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="rgba(255, 255, 255, 0.8)" />
            </Pressable>
          </View>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
  },
  touchable: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradient: {
    borderRadius: 16,
    padding: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  iconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  sparkle: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  details: {
    flex: 1,
    marginRight: 8,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 1.5,
  },
});

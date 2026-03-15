// Achievement Unlock Modal
// Full-screen celebration modal shown when an achievement is unlocked

import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// TYPES
// ============================================

interface AchievementUnlockModalProps {
  visible: boolean;
  onClose: () => void;
  achievement: {
    title: string;
    description?: string;
    icon: string;
    coinReward: number;
  } | null;
  onClaim?: () => void;
}

// ============================================
// CONFETTI PARTICLE CONFIG
// ============================================

const PARTICLE_COUNT = 18;
const PARTICLE_COLORS = [
  colors.brand.goldBright, '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#F7DC6F', '#BB8FCE', '#85C1E9', '#82E0AA',
  '#F8C471', '#E74C3C', '#3498DB', colors.success,
];

interface ParticleConfig {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size: number;
  color: string;
  delay: number;
}

const generateParticles = (): ParticleConfig[] => {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    startX: SCREEN_WIDTH / 2 + (Math.random() - 0.5) * 40,
    startY: SCREEN_HEIGHT / 2 - 60,
    endX: Math.random() * SCREEN_WIDTH,
    endY: Math.random() * SCREEN_HEIGHT * 0.4 + 50,
    size: Math.random() * 8 + 4,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    delay: Math.random() * 400,
  }));
};

// ============================================
// COMPONENT
// ============================================

const AchievementUnlockModal: React.FC<AchievementUnlockModalProps> = ({
  visible,
  onClose,
  achievement,
  onClaim,
}) => {
  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.3)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const rewardScale = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Particle animation values
  const particleAnims = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      progress: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  const particles = useRef(generateParticles()).current;
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start entrance animations
  useEffect(() => {
    if (visible && achievement) {
      // Reset all animations
      overlayOpacity.setValue(0);
      cardScale.setValue(0.3);
      cardOpacity.setValue(0);
      iconScale.setValue(0);
      titleOpacity.setValue(0);
      rewardScale.setValue(0);
      buttonOpacity.setValue(0);
      shimmerAnim.setValue(0);
      particleAnims.forEach((p) => {
        p.progress.setValue(0);
        p.opacity.setValue(0);
      });

      // Staggered entrance sequence
      Animated.sequence([
        // 1. Overlay fade in
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // 2. Card scale + fade in
        Animated.parallel([
          Animated.spring(cardScale, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        // 3. Icon spring in
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 60,
          friction: 5,
          useNativeDriver: true,
        }),
        // 4. Title + reward + button fade in
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.spring(rewardScale, {
            toValue: 1,
            tension: 50,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(buttonOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Start particle animations (confetti effect)
      particleAnims.forEach((particleAnim, index) => {
        const delay = particles[index].delay;
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(particleAnim.progress, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(particleAnim.opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(particleAnim.opacity, {
                toValue: 0,
                duration: 800,
                delay: 200,
                useNativeDriver: true,
              }),
            ]),
          ]).start();
        }, delay + 500); // Delayed start after card shows
      });

      // Shimmer loop on the icon
      const shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      shimmerLoop.start();

      // Auto-dismiss after 5 seconds
      autoDismissTimer.current = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => {
        shimmerLoop.stop();
        if (autoDismissTimer.current) {
          clearTimeout(autoDismissTimer.current);
        }
      };
    }
  }, [visible, achievement]);

  const handleClose = useCallback(() => {
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
    }

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [onClose, overlayOpacity, cardScale, cardOpacity]);

  const handleClaim = useCallback(() => {
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
    }
    onClaim?.();
    handleClose();
  }, [onClaim, handleClose]);

  if (!achievement) return null;

  // Map icon string to Ionicons name
  const getIconName = (icon: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      trophy: 'trophy',
      star: 'star',
      flame: 'flame',
      heart: 'heart',
      diamond: 'diamond',
      ribbon: 'ribbon',
      medal: 'medal',
      rocket: 'rocket',
      flash: 'flash',
      sparkles: 'sparkles',
      crown: 'diamond',
      shield: 'shield-checkmark',
    };
    return iconMap[icon] || 'trophy';
  };

  const iconScaleValue = iconScale.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 1],
  });

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 0.3],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable
          style={styles.overlayTouch}
         
          onPress={handleClose}
        >
          {/* Confetti Particles */}
          {particleAnims.map((particleAnim, index) => {
            const particle = particles[index];
            const translateX = particleAnim.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [particle.startX, particle.endX],
            });
            const translateY = particleAnim.progress.interpolate({
              inputRange: [0, 0.4, 1],
              outputRange: [particle.startY, particle.endY - 80, particle.endY + 100],
            });
            const rotate = particleAnim.progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', `${Math.random() * 720}deg`],
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.particle,
                  {
                    width: particle.size,
                    height: particle.size,
                    borderRadius: particle.size / 2,
                    backgroundColor: particle.color,
                    opacity: particleAnim.opacity,
                    transform: [
                      { translateX },
                      { translateY },
                      { rotate },
                    ],
                  },
                ]}
              />
            );
          })}

          {/* Card */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardOpacity,
                transform: [{ scale: cardScale }],
              },
            ]}
          >
            <Pressable>
              {/* Icon Container */}
              <View style={styles.iconSection}>
                <Animated.View
                  style={[
                    styles.iconGlow,
                    { opacity: shimmerOpacity },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.iconCircle,
                    { transform: [{ scale: iconScaleValue }] },
                  ]}
                >
                  <Ionicons
                    name={getIconName(achievement.icon)}
                    size={48}
                    color={colors.brand.goldBright}
                  />
                </Animated.View>
              </View>

              {/* Title */}
              <Animated.View style={{ opacity: titleOpacity }}>
                <Text style={styles.unlockLabel}>Achievement Unlocked!</Text>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                {achievement.description && (
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>
                )}
              </Animated.View>

              {/* Coin Reward */}
              <Animated.View
                style={[
                  styles.rewardContainer,
                  { transform: [{ scale: rewardScale }] },
                ]}
              >
                <View style={styles.rewardBadge}>
                  <Ionicons name="diamond" size={20} color={colors.brand.greenDark} />
                  <Text style={styles.rewardAmount}>
                    +{achievement.coinReward}
                  </Text>
                  <Text style={styles.rewardLabel}>coins</Text>
                </View>
              </Animated.View>

              {/* Claim Button */}
              <Animated.View style={{ opacity: buttonOpacity }}>
                <Pressable
                  style={styles.claimButton}
                  onPress={handleClaim}
                 
                  accessibilityLabel={`Claim ${achievement.coinReward} coins reward`}
                  accessibilityRole="button"
                >
                  <Text style={styles.claimButtonText}>Claim Reward</Text>
                </Pressable>
              </Animated.View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  overlayTouch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  particle: {
    position: 'absolute',
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: colors.brand.goldBright,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },

  // Icon
  iconSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.brand.goldBright,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.nileBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.brand.goldBright,
    shadowColor: colors.brand.goldBright,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },

  // Text
  unlockLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brand.amberDeep,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  achievementDescription: {
    fontSize: 14,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },

  // Reward
  rewardContainer: {
    marginVertical: 20,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.successScale[50],
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.successScale[200],
  },
  rewardAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.brand.greenDark,
  },
  rewardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brand.greenDark,
  },

  // Button
  claimButton: {
    backgroundColor: colors.nileBlue,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    shadowColor: colors.nileBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  claimButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.background.primary,
  },
});

export default React.memo(AchievementUnlockModal);

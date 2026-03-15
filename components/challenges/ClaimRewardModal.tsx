import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface ClaimRewardModalProps {
  visible: boolean;
  onClose: () => void;
  reward: {
    coins: number;
    badges?: string[];
    multiplier?: number;
  };
  beforeStats?: {
    coins: number;
    level?: number;
  };
  afterStats?: {
    coins: number;
    level?: number;
  };
  onShare?: () => void;
}

function ClaimRewardModal({
  visible,
  onClose,
  reward,
  beforeStats,
  afterStats,
  onShare,
}: ClaimRewardModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const coinCountAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 20 }).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.3);
      coinCountAnim.setValue(0);
      confettiAnims.forEach((anim) => {
        anim.x.setValue(0);
        anim.y.setValue(0);
        anim.rotate.setValue(0);
        anim.opacity.setValue(1);
      });

      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate coin counter
      Animated.timing(coinCountAnim, {
        toValue: reward.coins,
        duration: 1500,
        useNativeDriver: false,
      }).start();

      // Animate confetti
      confettiAnims.forEach((anim, index) => {
        const delay = index * 50;
        const randomX = (Math.random() - 0.5) * width * 0.8;
        const randomY = Math.random() * -300 - 100;
        const randomRotate = Math.random() * 720;

        Animated.parallel([
          Animated.timing(anim.x, {
            toValue: randomX,
            duration: 2000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim.y, {
            toValue: randomY,
            duration: 2000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: randomRotate,
            duration: 2000,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 2000,
            delay: delay + 1000,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [visible]);

  const confettiColors = [colors.brand.purpleLight, colors.successScale[400], colors.warningScale[400], colors.error, colors.infoScale[400], colors.brand.pink];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Confetti particles */}
          {confettiAnims.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.confetti,
                {
                  backgroundColor: confettiColors[index % confettiColors.length],
                  transform: [
                    { translateX: anim.x },
                    { translateY: anim.y },
                    {
                      rotate: anim.rotate.interpolate({
                        inputRange: [0, 720],
                        outputRange: ['0deg', '720deg'],
                      }),
                    },
                  ],
                  opacity: anim.opacity,
                },
              ]}
            />
          ))}

          <LinearGradient colors={[colors.brand.purpleLight, colors.brand.purple, colors.brand.purpleDeep]} style={styles.modalContent}>
            {/* Trophy Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="trophy" size={80} color={colors.brand.goldBright} />
            </View>

            {/* Title */}
            <Text style={styles.title}>Congratulations! 🎉</Text>
            <Text style={styles.subtitle}>Challenge Completed</Text>

            {/* Rewards Section */}
            <View style={styles.rewardsSection}>
              <Text style={styles.rewardsSectionTitle}>YOU EARNED:</Text>

              {/* Coins */}
              <View style={styles.rewardItem}>
                <Ionicons name="diamond" size={40} color={colors.brand.goldBright} />
                <Animated.Text style={styles.rewardAmount}>
                  +
                  {coinCountAnim.interpolate({
                    inputRange: [0, reward.coins],
                    outputRange: ['0', reward.coins.toString()],
                    extrapolate: 'clamp',
                  })}
                </Animated.Text>
                <Text style={styles.rewardLabel}>Coins</Text>
              </View>

              {/* Badges */}
              {reward.badges && reward.badges.length > 0 && (
                <View style={styles.badgesContainer}>
                  {reward.badges.map((badge, index) => (
                    <View key={index} style={styles.badgeItem}>
                      <Ionicons name="ribbon" size={32} color={colors.brand.goldBright} />
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Multiplier */}
              {reward.multiplier && (
                <View style={styles.multiplierContainer}>
                  <Ionicons name="flash" size={32} color={colors.brand.goldBright} />
                  <Text style={styles.multiplierText}>{reward.multiplier}x Multiplier</Text>
                </View>
              )}
            </View>

            {/* Stats Comparison */}
            {beforeStats && afterStats && (
              <View style={styles.statsContainer}>
                <Text style={styles.statsTitle}>YOUR NEW STATS</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Coins</Text>
                    <View style={styles.statChange}>
                      <Text style={styles.statValue}>{beforeStats.coins}</Text>
                      <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.6)" />
                      <Text style={[styles.statValue, styles.statValueAfter]}>{afterStats.coins}</Text>
                      <Ionicons name="trending-up" size={16} color={colors.successScale[400]} />
                    </View>
                  </View>
                  {beforeStats.level && afterStats.level && (
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Level</Text>
                      <View style={styles.statChange}>
                        <Text style={styles.statValue}>{beforeStats.level}</Text>
                        <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.6)" />
                        <Text style={[styles.statValue, styles.statValueAfter]}>{afterStats.level}</Text>
                        {afterStats.level > beforeStats.level && (
                          <Ionicons name="trending-up" size={16} color={colors.successScale[400]} />
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {onShare && (
                <Pressable style={styles.shareButton} onPress={onShare}>
                  <Ionicons name="share-social" size={20} color={colors.brand.purpleLight} />
                  <Text style={styles.shareButtonText}>Share Success</Text>
                </Pressable>
              )}
              <Pressable style={styles.continueButton} onPress={onClose}>
                <Text style={styles.continueButtonText}>Awesome!</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  confetti: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 1000,
  },
  modalContent: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.background.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
  },
  rewardsSection: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  rewardsSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
    marginBottom: 16,
  },
  rewardItem: {
    alignItems: 'center',
    gap: 8,
  },
  rewardAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  rewardLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    justifyContent: 'center',
  },
  badgeItem: {
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  multiplierContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  multiplierText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  statsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statValueAfter: {
    color: colors.background.primary,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.background.primary,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brand.purpleLight,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.background.primary,
    textAlign: 'center',
  },
});

export default React.memo(ClaimRewardModal);

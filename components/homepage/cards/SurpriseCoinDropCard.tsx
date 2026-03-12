import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  white: '#FFFFFF',
  textDark: '#1a3a52',
};

interface SurpriseCoinDropCardProps {
  available: boolean;
  coins: number;
  message: string | null;
  onPress: () => void;
}

const SurpriseCoinDropCard: React.FC<SurpriseCoinDropCardProps> = ({
  available,
  coins,
  message,
  onPress,
}) => {
  const gradientColors: readonly [string, string, string] = available
    ? ['#ffd7b5', '#E8B896', '#D4A07A']
    : ['#dfebf7', '#b8d4ed', '#9cc5e0'];

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (available) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
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
      pulse.start();
      return () => pulse.stop();
    }
  }, [available, pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        available && { transform: [{ scale: pulseAnim }] },
      ]}
    >
      <Pressable
       
        onPress={available ? onPress : undefined}
        style={styles.touchable}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.glassOverlay}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons
                name={available ? 'gift' : 'gift-outline'}
                size={24}
                color={COLORS.textDark}
              />
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
              <Text style={styles.cardTitle}>Surprise Drop</Text>
              <Text style={styles.cardSubtitle}>
                {available ? 'Lucky you!' : 'Check back later'}
              </Text>
            </View>

            {/* Coins Badge (if available) */}
            {available && coins > 0 && (
              <View style={styles.badgeContainer}>
                <View style={styles.coinBadge}>
                  <Ionicons name="sparkles" size={12} color="#ffcd57" />
                  <Text style={styles.coinText}>+{coins}</Text>
                </View>
              </View>
            )}

            {/* Action */}
            {available ? (
              <View style={styles.actionIndicator}>
                <Ionicons name="sparkles" size={14} color={COLORS.textDark} />
                <Text style={styles.actionText}>Claim Now!</Text>
              </View>
            ) : (
              <View style={styles.waitingContainer}>
                <Ionicons name="time-outline" size={14} color="rgba(26, 58, 82, 0.7)" />
                <Text style={styles.waitingText}>Coming soon...</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#ffd7b5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 8px rgba(255, 215, 181, 0.3)',
      },
    }),
  },
  touchable: {
    flex: 1,
  },
  cardGradient: {
    borderRadius: 16,
    overflow: 'hidden',
    flex: 1,
  },
  glassOverlay: {
    backgroundColor: 'rgba(26, 58, 82, 0.05)',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 82, 0.1)',
    borderRadius: 16,
    minHeight: 160,
    flex: 1,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 58, 82, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 82, 0.15)',
  },
  contentContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(26, 58, 82, 0.7)',
    marginTop: 2,
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  coinText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  actionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    backgroundColor: 'rgba(26, 58, 82, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  waitingText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(26, 58, 82, 0.7)',
  },
});

export default SurpriseCoinDropCard;

// Spin Wheel Component
// Interactive spinning wheel game with prizes

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { platformAlert } from '@/utils/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import gamificationAPI from '@/services/gamificationApi';
import type { SpinWheelSegment, SpinWheelResult } from '@/types/gamification.types';
import { useRegion } from '@/contexts/RegionContext';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = width * 0.85;

// Default wheel segments (8 segments) - Note: labels with currency will be dynamic
const DEFAULT_SEGMENTS: SpinWheelSegment[] = [
  { id: '1', label: '10 Coins', value: 10, color: '#EF4444', type: 'coins' },
  { id: '2', label: '5% Off', value: 5, color: '#F59E0B', type: 'discount' },
  { id: '3', label: '50 Coins', value: 50, color: '#ffcd57', type: 'coins' },
  { id: '4', label: '10 Cashback', value: 10, color: '#3B82F6', type: 'cashback' },
  { id: '5', label: '100 Coins', value: 100, color: '#8B5CF6', type: 'coins' },
  { id: '6', label: '25 Voucher', value: 25, color: '#EC4899', type: 'voucher' },
  { id: '7', label: '25 Coins', value: 25, color: '#14B8A6', type: 'coins' },
  { id: '8', label: 'Better Luck', value: 0, color: '#6B7280', type: 'nothing' },
];

interface SpinWheelProps {
  segments?: SpinWheelSegment[];
  onSpinComplete?: (result: SpinWheelResult) => void;
}

function SpinWheel({ segments = DEFAULT_SEGMENTS, onSpinComplete }: SpinWheelProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const [isSpinning, setIsSpinning] = useState(false);
  const [canSpin, setCanSpin] = useState(true);
  const [nextSpinTime, setNextSpinTime] = useState<string | null>(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkEligibility();
  }, []);

  // Check if user can spin
  const checkEligibility = async () => {
    try {
      const response = await gamificationAPI.canSpinWheel();
      if (response.success && response.data) {
        setCanSpin(response.data.canSpin);
        if (!response.data.canSpin && response.data.nextSpinAt) {
          setNextSpinTime(response.data.nextSpinAt);
        }
      }
    } catch (error) {
      // silently handle
    }
  };

  // Handle spin
  const handleSpin = async () => {
    if (!canSpin || isSpinning) return;

    try {
      setIsSpinning(true);

      // Call API to get result
      const response = await gamificationAPI.spinWheel();

      if (response.success && response.data) {
        const { result, coinsAdded, newBalance } = response.data;

        // Calculate rotation (8 segments = 45 degrees each)
        const segmentIndex = segments.findIndex((s) => s.id === result.segment.id);
        const segmentAngle = 360 / segments.length;
        const targetRotation = 360 * 5 + segmentIndex * segmentAngle; // 5 full rotations + target segment

        // Animate spin
        Animated.timing(rotateAnim, {
          toValue: targetRotation,
          duration: 4000,
          useNativeDriver: true,
        }).start(() => {
          setIsSpinning(false);
          setCanSpin(false);

          // Show prize alert
          platformAlert(
            'Congratulations! 🎉',
            `You won: ${result.prize.description}\n\nNew balance: ${newBalance} coins`,
            [
              {
                text: 'Awesome!',
                onPress: () => {
                  onSpinComplete?.(result);
                  checkEligibility(); // Refresh eligibility
                },
              },
            ]
          );
        });
      } else {
        throw new Error(response.error || 'Failed to spin wheel');
      }
    } catch (error: any) {
      setIsSpinning(false);
      platformAlert('Error', error.message || 'Failed to spin wheel. Please try again.');
    }
  };

  // Render wheel segments
  const renderWheelSegments = () => {
    const segmentAngle = 360 / segments.length;

    return segments.map((segment, index) => {
      const rotation = index * segmentAngle;
      // Format label with currency symbol for cashback and voucher types
      let displayLabel = segment.label;
      if (segment.type === 'cashback') {
        displayLabel = `${currencySymbol}${segment.value} Cashback`;
      } else if (segment.type === 'voucher') {
        displayLabel = `${currencySymbol}${segment.value} Voucher`;
      }

      return (
        <View
          key={segment.id}
          style={[
            styles.segment,
            {
              transform: [{ rotate: `${rotation}deg` }],
            },
          ]}
        >
          <LinearGradient
            colors={[segment.color, `${segment.color}CC`]}
            style={styles.segmentGradient}
          >
            <View style={styles.segmentContent}>
              <ThemedText style={styles.segmentText}>{displayLabel}</ThemedText>
            </View>
          </LinearGradient>
        </View>
      );
    });
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Wheel Container */}
      <View style={styles.wheelContainer}>
        {/* Pointer */}
        <View style={styles.pointerContainer}>
          <View style={styles.pointer} />
        </View>

        {/* Wheel */}
        <Animated.View
          style={[
            styles.wheel,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          {renderWheelSegments()}

          {/* Center Circle */}
          <View style={styles.centerCircle}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.centerGradient}
            >
              <Ionicons name="diamond" size={32} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </Animated.View>
      </View>

      {/* Spin Button */}
      <Pressable
        style={[
          styles.spinButton,
          (!canSpin || isSpinning) && styles.spinButtonDisabled,
        ]}
        onPress={handleSpin}
        disabled={!canSpin || isSpinning}
      >
        <LinearGradient
          colors={canSpin && !isSpinning ? ['#8B5CF6', '#7C3AED'] : ['#9CA3AF', '#6B7280']}
          style={styles.spinButtonGradient}
        >
          <ThemedText style={styles.spinButtonText}>
            {isSpinning ? 'Spinning...' : canSpin ? 'SPIN' : 'Come Back Later'}
          </ThemedText>
          {!isSpinning && canSpin && (
            <Ionicons name="arrow-forward-circle" size={24} color="#FFFFFF" />
          )}
        </LinearGradient>
      </Pressable>

      {/* Next spin timer */}
      {!canSpin && nextSpinTime && (
        <ThemedText style={styles.timerText}>
          Next spin available: {new Date(nextSpinTime).toLocaleTimeString()}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  wheelContainer: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    position: 'relative',
    marginBottom: 40,
  },
  pointerContainer: {
    position: 'absolute',
    top: -20,
    left: '50%',
    marginLeft: -15,
    zIndex: 10,
  },
  pointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#EF4444',
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  segment: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    transformOrigin: 'center',
  },
  segmentGradient: {
    width: '50%',
    height: '50%',
    position: 'absolute',
    top: 0,
    left: '50%',
    transformOrigin: 'left center',
    overflow: 'hidden',
  },
  segmentContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 20,
  },
  segmentText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    transform: [{ rotate: '-90deg' }],
  },
  centerCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 80,
    height: 80,
    marginTop: -40,
    marginLeft: -40,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    zIndex: 5,
  },
  centerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinButton: {
    width: 200,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  spinButtonDisabled: {
    opacity: 0.6,
  },
  spinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 12,
  },
  spinButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
  },
});

export default React.memo(SpinWheel);

/**
 * ConfettiOverlay - Lightweight confetti celebration effect
 * Uses React Native Animated API (no extra dependencies)
 *
 * Renders ~20 falling colored shapes that auto-dismiss after 3 seconds.
 */
import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

const CONFETTI_COLORS = [colors.brand.purple, colors.warningScale[400], colors.successScale[400], colors.brand.pink, colors.infoScale[400], colors.error];
const PIECE_COUNT = 20;
const DURATION = 3000;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPiece {
  x: number;
  width: number;
  height: number;
  color: string;
  delay: number;
  wobbleAmplitude: number;
  rotation: number;
}

interface ConfettiOverlayProps {
  visible: boolean;
  onComplete?: () => void;
}

function ConfettiOverlay({ visible, onComplete }: ConfettiOverlayProps) {
  const fallAnims = useRef<Animated.Value[]>([]).current;
  const wobbleAnims = useRef<Animated.Value[]>([]).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Generate piece configs once (stable across re-renders while visible)
  const pieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: PIECE_COUNT }, () => ({
      x: Math.random() * SCREEN_WIDTH,
      width: 6 + Math.random() * 6,   // 6-12
      height: 6 + Math.random() * 8,   // 6-14
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 400,
      wobbleAmplitude: 20 + Math.random() * 40,
      rotation: Math.random() * 360,
    }));
  }, [visible]);

  // Ensure we have enough Animated.Values
  if (fallAnims.length === 0) {
    for (let i = 0; i < PIECE_COUNT; i++) {
      fallAnims.push(new Animated.Value(0));
      wobbleAnims.push(new Animated.Value(0));
    }
  }

  useEffect(() => {
    if (!visible) return;

    // Reset all values
    opacityAnim.setValue(1);
    fallAnims.forEach(a => a.setValue(0));
    wobbleAnims.forEach(a => a.setValue(0));

    // Start fall + wobble animations per piece
    const animations = pieces.map((piece, i) => {
      const fall = Animated.timing(fallAnims[i], {
        toValue: 1,
        duration: DURATION - piece.delay,
        delay: piece.delay,
        useNativeDriver: true,
      });

      const wobble = Animated.loop(
        Animated.sequence([
          Animated.timing(wobbleAnims[i], {
            toValue: 1,
            duration: 300 + Math.random() * 200,
            useNativeDriver: true,
          }),
          Animated.timing(wobbleAnims[i], {
            toValue: -1,
            duration: 300 + Math.random() * 200,
            useNativeDriver: true,
          }),
        ])
      );

      return Animated.parallel([fall, wobble]);
    });

    // Fade out at the end
    const fadeOut = Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 500,
      delay: DURATION - 500,
      useNativeDriver: true,
    });

    const masterAnim = Animated.parallel([...animations, fadeOut]);
    masterAnim.start(() => {
      onComplete?.();
    });
    return () => masterAnim.stop();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, { opacity: opacityAnim }]}
    >
      {pieces.map((piece, i) => {
        const translateY = fallAnims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [-20, SCREEN_HEIGHT + 20],
        });

        const translateX = wobbleAnims[i].interpolate({
          inputRange: [-1, 1],
          outputRange: [-piece.wobbleAmplitude, piece.wobbleAmplitude],
        });

        const rotate = fallAnims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [`${piece.rotation}deg`, `${piece.rotation + 360}deg`],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.piece,
              {
                left: piece.x,
                width: piece.width,
                height: piece.height,
                backgroundColor: piece.color,
                borderRadius: piece.width < 9 ? 2 : 3,
                transform: [
                  { translateY },
                  { translateX },
                  { rotate },
                ],
              },
            ]}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  piece: {
    position: 'absolute',
    top: 0,
  },
});

export default React.memo(ConfettiOverlay);

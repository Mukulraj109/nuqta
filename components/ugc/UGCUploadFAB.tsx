// UGC Upload FAB (Floating Action Button)
// Floating action button for triggering UGC content upload

import React, { useEffect, useRef } from 'react';
import {
  Pressable,
  StyleSheet,
  Animated,
  Platform,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface UGCUploadFABProps {
  onPress: () => void;
  visible?: boolean;
  bottom?: number;
  right?: number;
  style?: ViewStyle;
}

function UGCUploadFAB({
  onPress,
  visible = true,
  bottom = 80,
  right = 20,
  style,
}: UGCUploadFABProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Fade in animation on mount
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handlePress = () => {
    // Haptic feedback
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); } catch (e) {}
    }

    // Scale animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom,
          right,
          transform: [{ scale: scaleAnim }, { rotate }],
        },
        style,
      ]}
    >
      <Pressable
        style={styles.fab}
        onPress={handlePress}
       
        accessibilityLabel="Upload UGC Content"
        accessibilityHint="Opens upload modal to create and share content"
        accessibilityRole="button"
      >
        <Ionicons name="camera" size={28} color="#FFFFFF" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 999,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default React.memo(UGCUploadFAB);

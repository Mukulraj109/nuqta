import React, { useRef, useEffect } from 'react';
import { Pressable, View, StyleSheet, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ProjectStatusCardProps } from '@/types/earnPage.types';
import { PROJECT_STATUS_COLORS } from '@/constants/EarnPageColors';

function ProjectStatusCard({ 
  label, 
  count, 
  color, 
  gradient,
  onPress,
  delay = 0,
}: ProjectStatusCardProps & { gradient?: string[]; delay?: number }) {
  const statusKey = label.toLowerCase().replace(' ', '-') as keyof typeof PROJECT_STATUS_COLORS;
  const statusColors = PROJECT_STATUS_COLORS[statusKey] || {
    background: color || '#8B5CF6',
    text: '#FFFFFF',
    count: '#FFFFFF',
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: delay,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const defaultColor = statusColors.background || color || '#8B5CF6';
  const gradientColors = (gradient && Array.isArray(gradient) && gradient.length > 0) 
    ? gradient 
    : [defaultColor, `${defaultColor}AA`];

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Animated.View
        style={[
          {
            transform: [{ scale: pressAnim }],
          },
        ]}
      >
        <Pressable
          style={styles.container}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
         
          accessibilityLabel={`${label}: ${count} project${count !== 1 ? 's' : ''}`}
          accessibilityRole="button"
          accessibilityHint={`Double tap to view ${label.toLowerCase()} projects`}
        >
          <LinearGradient
            colors={Array.isArray(gradientColors) ? gradientColors : ['#8B5CF6', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.content}
          >
            {/* Decorative background element */}
            <View style={styles.decorativeCircle} />
            
            <View style={styles.contentWrapper}>
              <ThemedText style={[styles.count, { color: statusColors.count }]}>
                {count.toString().padStart(2, '0')}
              </ThemedText>
              
              <ThemedText style={[styles.label, { color: statusColors.text }]}>
                {label}
              </ThemedText>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    minWidth: 0, // Prevent overflow
    maxWidth: '100%', // Ensure it doesn't overflow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 3px 6px rgba(0, 0, 0, 0.12)',
      },
    }),
  },
  content: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 5,
    minHeight: 110,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    top: -25,
    right: -25,
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    width: '100%',
  },
  count: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      },
      android: {
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      },
      web: {
        textShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    opacity: 0.95,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
      android: {
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
      web: {
        textShadow: '0px 1px 2px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
});

export default React.memo(ProjectStatusCard);

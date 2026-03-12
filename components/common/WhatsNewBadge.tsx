import React from 'react';
import {
  Pressable,
  StyleSheet,
  ViewStyle,
  View,
  Text,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';

interface WhatsNewBadgeProps {
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'green' | 'blue' | 'gold';
}

const WhatsNewBadge: React.FC<WhatsNewBadgeProps> = ({ onPress, style, variant = 'green' }) => {
  const badgeColors = {
    green: { bg: '#064E3B', border: '#059669' },
    blue: { bg: '#0C4A6E', border: '#0284C7' },
    gold: { bg: '#78350F', border: '#F59E0B' },
  };

  const colors = badgeColors[variant];

  return (
    <Pressable
      onPress={onPress}
     
      style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }, style]}
      accessibilityRole="button"
      accessibilityLabel="What's New"
    >
      <View style={styles.content}>
        <Text style={styles.star}>✦</Text>
        <ThemedText style={styles.text}>What's New</ThemedText>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 0,
    borderRadius: 999,
    borderWidth: 1,
  },
  content: {
    position: 'relative',
  },
  star: {
    position: 'absolute',
    top: 7,
    right: 0,
    fontSize: 4,
    color: '#FFFFFF',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 6,
    fontWeight: '600',
  },
});

export default WhatsNewBadge;

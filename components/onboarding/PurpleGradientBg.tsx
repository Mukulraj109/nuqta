import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface PurpleGradientBgProps {
  children: React.ReactNode;
  style?: any;
}

export default function PurpleGradientBg({ children, style }: PurpleGradientBgProps) {
  return (
    <LinearGradient
      colors={['#ffcd57', '#1a3a52', '#1a3a52']}  // Nuqta: Mustard to Nile Blue
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, style]}
    >
      {children}
    </LinearGradient>
);
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
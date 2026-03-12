/**
 * Privé Home Screen
 *
 * Main landing page for Privé tab - displays the full Privé dashboard
 * using the existing PriveSectionContainer component.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PriveSectionContainer } from '@/components/prive/PriveSectionContainer';

export default function PriveHomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PriveSectionContainer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
});

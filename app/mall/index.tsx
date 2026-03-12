/**
 * Mall Index Page
 *
 * Redirects to home page with mall tab active.
 * The mall content is rendered on the homepage when the "mall" tab is selected.
 */

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useHomeTab } from '@/contexts/HomeTabContext';

export default function MallIndex() {
  const router = useRouter();
  const { setActiveTab } = useHomeTab();

  useEffect(() => {
    // Set the mall tab as active and redirect to home
    setActiveTab('mall');
    router.replace('/');
  }, [router, setActiveTab]);

  // Show loading while redirecting
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0284C7" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
  },
});

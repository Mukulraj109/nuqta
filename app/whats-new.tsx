import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import WhatsNewStoriesFlow from '@/components/whats-new/WhatsNewStoriesFlow';

const WhatsNewPage: React.FC = () => {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: 'fade',
          presentation: 'fullScreenModal',
        }}
      />
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />
      <WhatsNewStoriesFlow onClose={handleClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});

export default WhatsNewPage;

import React from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function VouchersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
        contentStyle: { backgroundColor: '#F9FAFB' },
      }}
    >
      <Stack.Screen name="brand/[id]" />
    </Stack>
  );
}

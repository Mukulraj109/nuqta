/**
 * Trackable Button Component
 *
 * Button with built-in analytics tracking
 */

import React from 'react';
import { Pressable, PressableProps, StyleSheet } from 'react-native';
import { useComprehensiveAnalytics } from '@/hooks/useComprehensiveAnalytics';

interface TrackableButtonProps extends PressableProps {
  eventName: string;
  eventProperties?: Record<string, any>;
  onPress?: () => void;
  trackOnPress?: boolean;
}

export const TrackableButton: React.FC<TrackableButtonProps> = ({
  eventName,
  eventProperties = {},
  onPress,
  trackOnPress = true,
  children,
  ...touchableProps
}) => {
  const { trackEvent } = useComprehensiveAnalytics();

  const handlePress = () => {
    if (trackOnPress) {
      trackEvent(eventName, {
        ...eventProperties,
        timestamp: Date.now(),
      });
    }

    if (onPress) {
      onPress();
    }
  };

  return (
    <Pressable {...touchableProps} onPress={handlePress}>
      {children}
    </Pressable>
  );
};

export default TrackableButton;

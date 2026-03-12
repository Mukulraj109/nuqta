/**
 * Trackable Touchable Component
 *
 * Generic pressable with analytics tracking
 */

import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { useComprehensiveAnalytics } from '@/hooks/useComprehensiveAnalytics';

interface TrackableTouchableProps extends PressableProps {
  eventName: string;
  eventProperties?: Record<string, any>;
  trackOnPress?: boolean;
  trackOnLongPress?: boolean;
}

export const TrackableTouchable: React.FC<TrackableTouchableProps> = ({
  eventName,
  eventProperties = {},
  onPress,
  onLongPress,
  trackOnPress = true,
  trackOnLongPress = false,
  children,
  ...pressableProps
}) => {
  const { trackEvent } = useComprehensiveAnalytics();

  const handlePress = (event: any) => {
    if (trackOnPress) {
      trackEvent(eventName, {
        ...eventProperties,
        action: 'press',
        timestamp: Date.now(),
      });
    }

    if (onPress) {
      onPress(event);
    }
  };

  const handleLongPress = (event: any) => {
    if (trackOnLongPress) {
      trackEvent(eventName, {
        ...eventProperties,
        action: 'long_press',
        timestamp: Date.now(),
      });
    }

    if (onLongPress) {
      onLongPress(event);
    }
  };

  return (
    <Pressable {...pressableProps} onPress={handlePress} onLongPress={handleLongPress}>
      {children}
    </Pressable>
  );
};

export default TrackableTouchable;

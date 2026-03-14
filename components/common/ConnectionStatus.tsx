import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSocket } from '@/contexts/SocketContext';

function ConnectionStatus() {
  const { state, connect } = useSocket();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Pulse animation for reconnecting state
  React.useEffect(() => {
    if (state.reconnecting) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state.reconnecting]);

  // Don't show anything if connected
  if (state.connected) {
    return null;
  }

  const getStatusInfo = () => {
    if (state.reconnecting) {
      return {
        icon: 'sync',
        color: '#F59E0B',
        text: `Reconnecting... (${state.reconnectAttempts})`,
        actionText: null,
      };
    }
    if (state.error) {
      return {
        icon: 'cloud-offline',
        color: '#EF4444',
        text: 'Connection failed',
        actionText: 'Retry',
      };
    }
    return {
      icon: 'cloud-offline',
      color: '#6B7280',
      text: 'Disconnected',
      actionText: 'Connect',
    };
  };

  const info = getStatusInfo();

  return (
    <View
      style={[styles.container, { backgroundColor: info.color }]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`Connection status: ${info.text}`}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.content}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Ionicons
            name={info.icon as any}
            size={16}
            color="white"
            accessible={false}
          />
        </Animated.View>
        <Text
          style={styles.text}
          accessible={true}
          accessibilityRole="text"
        >
          {info.text}
        </Text>
      </View>
      {info.actionText && (
        <Pressable
          style={styles.button}
          onPress={connect}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={info.actionText}
          accessibilityHint={`Double tap to ${info.actionText.toLowerCase()} to server`}
        >
          <Text style={styles.buttonText}>{info.actionText}</Text>
        </Pressable>
      )}
    </View>
);
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default React.memo(ConnectionStatus);

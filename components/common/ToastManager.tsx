import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Toast from './Toast';

export interface ToastConfig {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  actions?: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel';
  }>;
}

let showToastGlobal: ((config: Omit<ToastConfig, 'id'>) => void) | null = null;

export function showToast(config: Omit<ToastConfig, 'id'>) {
  if (showToastGlobal) {
    showToastGlobal(config);
  } else {
  }
}

export default function ToastManager() {
  const [toasts, setToasts] = useState<ToastConfig[]>([]);
  const toastIdCounter = React.useRef(0);

  const addToast = useCallback((config: Omit<ToastConfig, 'id'>) => {
    // Generate unique ID using timestamp + counter to avoid duplicate keys
    const id = `${Date.now()}_${++toastIdCounter.current}_${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { ...config, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Set global reference
  React.useEffect(() => {
    showToastGlobal = addToast;
    return () => {
      showToastGlobal = null;
    };
  }, [addToast]);

  return (
    <View
      style={styles.container}
      pointerEvents="box-none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          actions={toast.actions}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </View>
);
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
});

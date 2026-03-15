import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message: string;
  buttons?: AlertButton[];
  type?: 'success' | 'error' | 'warning' | 'info';
}

let alertCallback: ((options: AlertOptions) => void) | null = null;

export const showAlert = (
  title: string,
  message: string,
  buttons?: AlertButton[],
  type: 'success' | 'error' | 'warning' | 'info' = 'info'
) => {
  if (alertCallback) {
    alertCallback({ title, message, buttons, type });
  }
};

export const CrossPlatformAlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [alertData, setAlertData] = useState<AlertOptions | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  useEffect(() => {
    alertCallback = (options: AlertOptions) => {
      setAlertData(options);
      setVisible(true);
    };

    return () => {
      alertCallback = null;
    };
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = (button?: AlertButton) => {
    setVisible(false);
    setTimeout(() => {
      if (button?.onPress) {
        button.onPress();
      }
      setAlertData(null);
    }, 200);
  };

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (alertData?.type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (alertData?.type) {
      case 'success':
        return colors.nileBlue;  // Nile Blue
      case 'error':
        return colors.error;
      case 'warning':
        return colors.lightMustard;  // Light Mustard
      case 'info':
      default:
        return colors.nileBlue;  // Nile Blue
    }
  };

  if (!alertData) {
    return <>{children}</>;
  }

  const buttons = alertData.buttons || [{ text: 'OK', style: 'default' }];

  return (
    <>
      {children}
      <Modal
        transparent
        visible={visible}
        animationType="none"
        onRequestClose={() => handleClose()}
      >
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Pressable
            style={styles.backdrop}
           
            onPress={() => handleClose()}
          />
          <Animated.View
            style={[
              styles.alertContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              },
            ]}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name={getIconName()} size={48} color={getIconColor()} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{alertData.title}</Text>

            {/* Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.message}>{alertData.message}</Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              {buttons.map((button, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'cancel' && styles.cancelButton,
                    button.style === 'destructive' && styles.destructiveButton,
                    buttons.length === 1 && styles.singleButton,
                  ]}
                  onPress={() => handleClose(button)}
                 
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === 'cancel' && styles.cancelButtonText,
                      button.style === 'destructive' && styles.destructiveButtonText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  alertContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 20,
    padding: 24,
    width: Platform.OS === 'web' ? 400 : '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[800],
    marginBottom: 12,
    textAlign: 'center',
  },
  messageContainer: {
    width: '100%',
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    backgroundColor: colors.lightMustard,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.lightMustard,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  singleButton: {
    flex: 0,
    minWidth: 120,
  },
  cancelButton: {
    backgroundColor: colors.gray[100],
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  destructiveButton: {
    backgroundColor: colors.error,
    shadowColor: colors.error,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  cancelButtonText: {
    color: colors.neutral[500],
  },
  destructiveButtonText: {
    color: colors.background.primary,
  },
});

import React, { useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

interface InfoModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  autoCloseDelay?: number; // Auto-close after this many milliseconds (0 = no auto-close)
  icon?: 'information-circle' | 'call' | 'location' | 'cube' | 'alert-circle';
  iconColor?: string;
  buttonText?: string;
  buttonColor?: string;
}

function InfoModal({
  visible,
  title,
  message,
  onClose,
  autoCloseDelay = 0,
  icon = 'information-circle',
  iconColor = '#3B82F6',
  buttonText = 'OK',
  buttonColor = '#3B82F6',
}: InfoModalProps) {
  useEffect(() => {
    if (visible && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [visible, autoCloseDelay, onClose]);

  if (!visible) return null;

  // Get background color for icon circle based on icon color
  const getIconBgColor = () => {
    switch (iconColor) {
      case '#3B82F6': return '#DBEAFE'; // Blue
      case '#F59E0B': return '#FEF3C7'; // Amber
      case '#EF4444': return '#FEE2E2'; // Red
      case '#10B981': return '#D1FAE5'; // Green
      default: return '#DBEAFE';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContainer}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <View style={[styles.iconCircle, { backgroundColor: getIconBgColor() }]}>
                  <Ionicons name={icon} size={48} color={iconColor} />
                </View>
              </View>

              {/* Title */}
              <ThemedText style={styles.title}>{title}</ThemedText>

              {/* Message */}
              <ThemedText style={styles.message}>{message}</ThemedText>

              {/* OK Button */}
              <Pressable
                style={[styles.button, { backgroundColor: buttonColor }]}
                onPress={onClose}
               
              >
                <ThemedText style={styles.buttonText}>{buttonText}</ThemedText>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default React.memo(InfoModal);

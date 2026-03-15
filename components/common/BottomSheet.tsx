/**
 * BottomSheet Component
 *
 * Mobile-optimized modal that slides up from the bottom of the screen.
 * Provides smooth animations and backdrop interaction.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import { colors, spacing, typography, borderRadius, zIndex, timing } from '@/constants/theme';

type SnapPoint = '25%' | '50%' | '75%' | '90%';

interface BottomSheetProps {
  /**
   * Controls visibility of the bottom sheet
   */
  visible: boolean;

  /**
   * Callback when sheet should close
   */
  onClose: () => void;

  /**
   * Optional title for the sheet header
   */
  title?: string;

  /**
   * Content to display in the sheet
   */
  children: React.ReactNode;

  /**
   * Height presets (defaults to ['50%'])
   */
  snapPoints?: SnapPoint[];

  /**
   * Enable scrolling for long content (default: true)
   */
  scrollable?: boolean;
}

/**
 * BottomSheet provides a mobile-friendly modal experience
 *
 * @example
 * <BottomSheet
 *   visible={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Filter Options"
 *   snapPoints={['75%']}
 * >
 *   <FilterContent />
 * </BottomSheet>
 */
function BottomSheet({
  visible,
  onClose,
  title,
  children,
  snapPoints = ['50%'],
  scrollable = true,
}: BottomSheetProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const screenHeight = Dimensions.get('window').height;
  const sheetHeight = screenHeight * (parseInt(snapPoints[0]) / 100);

  useEffect(() => {
    let anim: Animated.CompositeAnimation;
    if (visible) {
      anim = Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: timing.duration.normal,
          useNativeDriver: true,
        }),
      ]);
    } else {
      anim = Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: timing.duration.fast,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: timing.duration.fast,
          useNativeDriver: true,
        }),
      ]);
    }
    anim.start();
    return () => anim.stop();
  }, [visible, slideAnim, backdropAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight, 0],
  });

  const ContentWrapper = scrollable ? ScrollView : View;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View
          style={[styles.backdrop, { opacity: backdropAnim }]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close bottom sheet"
            accessibilityHint="Tap to dismiss the bottom sheet"
          />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              transform: [{ translateY }],
            },
          ]}
          accessible={true}
          accessibilityRole="dialog"
          accessibilityLabel={title || 'Bottom sheet'}
          accessibilityViewIsModal={true}
        >
          {/* Handle */}
          <View
            style={styles.handleContainer}
            accessible={false}
          >
            <View style={styles.handle} />
          </View>

          {/* Header */}
          {title && (
            <View style={styles.header}>
              <Text
                style={styles.title}
                accessible={true}
                accessibilityRole="header"
              >
                {title}
              </Text>
            </View>
          )}

          {/* Content */}
          <ContentWrapper
            style={styles.content}
            contentContainerStyle={scrollable ? styles.scrollContent : undefined}
            showsVerticalScrollIndicator={scrollable}
          >
            {children}
          </ContentWrapper>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: zIndex.modalBackdrop,
  },
  sheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    zIndex: zIndex.modal,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  handleContainer: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.neutral[300],
    borderRadius: borderRadius.sm,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});

export default React.memo(BottomSheet);

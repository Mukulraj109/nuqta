/**
 * ModeSwitcher Component
 *
 * 4-mode intent selector for Nuqta app:
 * - Near U: Rewards near you (local, everyday)
 * - Mall: Nuqta Mall (curated brands)
 * - Cash: Cash Store (cashback focus)
 * - Privé: Exclusive (reputation-based)
 *
 * Features:
 * - Animated sliding pill (200-250ms)
 * - Mode-specific colors
 * - Privé lock state for non-eligible users
 * - Gold glow animation for eligible Privé users
 * - Haptic feedback on tap
 *
 * Design Reference: rezprive-main/src/components/ModeSwitcher.tsx
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  LayoutChangeEvent,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ModeId,
  ModeConfig,
  PriveEligibility,
  TabLayout,
} from '@/types/mode.types';
import { triggerImpact } from '@/utils/haptics';
import { Timing } from '@/constants/DesignSystem';

// Mode configurations
const MODES: ModeConfig[] = [
  {
    id: 'near-u',
    label: 'Near U',
    icon: '📍',
    activeColor: '#ffcd57', // Nuqta Gold
    microcopy: 'Save around you',
  },
  {
    id: 'mall',
    label: 'Mall',
    icon: '🛍',
    activeColor: '#1a3a52', // Nile Blue
    microcopy: 'Curated brands',
  },
  {
    id: 'cash',
    label: 'Cash',
    icon: '💰',
    activeColor: '#F59E0B', // Orange/Gold
    microcopy: 'Cashback deals',
  },
  {
    id: 'prive',
    label: 'Privé',
    icon: '✦',
    activeColor: '#C9A962', // Gold
    microcopy: 'Exclusive access',
  },
];

// Privé gradient colors
const PRIVE_GRADIENT: [string, string] = ['#1F2937', '#C9A962'];

interface ModeSwitcherProps {
  activeMode: ModeId;
  onModeChange: (mode: ModeId) => void;
  priveEligibility: PriveEligibility;
  onPriveLockedPress?: () => void;
  isPriveMode?: boolean;
}

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({
  activeMode,
  onModeChange,
  priveEligibility,
  onPriveLockedPress,
  isPriveMode = false,
}) => {
  const router = useRouter();

  // Animation values
  const pillPosition = useRef(new Animated.Value(0)).current;
  const priveGlowOpacity = useRef(new Animated.Value(0)).current;

  // Tab layouts for animation
  const [tabLayouts, setTabLayouts] = useState<Record<ModeId, TabLayout>>({
    'near-u': { x: 0, width: 0 },
    'mall': { x: 0, width: 0 },
    'cash': { x: 0, width: 0 },
    'prive': { x: 0, width: 0 },
  });

  // Track if layouts are ready
  const [layoutsReady, setLayoutsReady] = useState(false);

  // Handle tab layout measurement
  const handleTabLayout = useCallback((mode: ModeId, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts((prev) => {
      const updated = { ...prev, [mode]: { x, width } };

      // Check if all layouts are ready
      const allReady = Object.values(updated).every((l) => l.width > 0);
      if (allReady && !layoutsReady) {
        setLayoutsReady(true);
      }

      return updated;
    });
  }, [layoutsReady]);

  // Animate pill to active mode
  useEffect(() => {
    if (!layoutsReady) return;

    const targetLayout = tabLayouts[activeMode];
    if (!targetLayout.width) return;

    Animated.timing(pillPosition, {
      toValue: targetLayout.x,
      duration: Timing.normal, // 250ms
      useNativeDriver: true,
    }).start();
  }, [activeMode, tabLayouts, layoutsReady, pillPosition]);

  // Privé glow animation (once per session for eligible users)
  useEffect(() => {
    if (
      priveEligibility.isEligible &&
      !priveEligibility.hasSeenGlowThisSession
    ) {
      // Pulse glow animation
      Animated.sequence([
        Animated.timing(priveGlowOpacity, {
          toValue: 0.8,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(priveGlowOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [priveEligibility.isEligible, priveEligibility.hasSeenGlowThisSession, priveGlowOpacity]);

  // Handle mode press
  const handleModePress = useCallback(
    async (mode: ModeId) => {
      // Haptic feedback
      await triggerImpact('Light');

      // Handle locked Privé
      if (mode === 'prive' && !priveEligibility.isEligible) {
        if (onPriveLockedPress) {
          onPriveLockedPress();
        } else {
          // Default: navigate to subscription/eligibility screen
          router.push('/subscription');
        }
        return;
      }

      // Announce mode change for screen readers
      if (Platform.OS === 'ios') {
        const modeConfig = MODES.find((m) => m.id === mode);
        AccessibilityInfo.announceForAccessibility(
          `Switched to ${modeConfig?.label} mode. ${modeConfig?.microcopy}`
        );
      }

      onModeChange(mode);
    },
    [priveEligibility.isEligible, onPriveLockedPress, onModeChange, router]
  );

  // Get active mode config
  const activeModeConfig = MODES.find((m) => m.id === activeMode);
  const activeLayout = tabLayouts[activeMode];

  // Determine container background based on mode
  const containerBg = isPriveMode || activeMode === 'prive' ? '#0A0A0A' : '#F3F4F6';
  const borderColor = isPriveMode || activeMode === 'prive' ? '#2A2A2A' : '#E5E7EB';

  return (
    <View style={[styles.container, { backgroundColor: containerBg, borderColor }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={false} // All tabs visible, no scroll needed
      >
        {/* Animated sliding pill background */}
        {layoutsReady && activeLayout.width > 0 && (
          <Animated.View
            style={[
              styles.slidingPill,
              {
                width: activeLayout.width,
                transform: [{ translateX: pillPosition }],
                backgroundColor:
                  activeMode === 'prive'
                    ? activeModeConfig?.activeColor
                    : activeModeConfig?.activeColor,
              },
            ]}
          >
            {/* Gradient for Privé mode */}
            {activeMode === 'prive' && (
              <LinearGradient
                colors={PRIVE_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            )}
          </Animated.View>
        )}

        {/* Mode tabs */}
        {MODES.map((mode) => {
          const isActive = activeMode === mode.id;
          const isPrive = mode.id === 'prive';
          const isLocked = isPrive && !priveEligibility.isEligible;

          return (
            <Pressable
              key={mode.id}
              style={[
                styles.modeTab,
                isActive && styles.modeTabActive,
                isLocked && styles.modeTabLocked,
              ]}
              onPress={() => handleModePress(mode.id)}
              onLayout={(e) => handleTabLayout(mode.id, e)}
             
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel={`${mode.label} mode`}
              accessibilityHint={
                isLocked
                  ? 'Requires eligibility. Tap to learn more.'
                  : `Switch to ${mode.microcopy}`
              }
              accessibilityState={{
                selected: isActive,
                disabled: isLocked,
              }}
            >
              {/* Privé glow effect for eligible users */}
              {isPrive && priveEligibility.isEligible && (
                <Animated.View
                  style={[
                    styles.priveGlow,
                    { opacity: priveGlowOpacity },
                  ]}
                />
              )}

              {/* Lock icon for non-eligible Privé */}
              {isLocked && (
                <Ionicons
                  name="lock-closed"
                  size={12}
                  color={isPriveMode || activeMode === 'prive' ? '#6B7280' : '#9CA3AF'}
                  style={styles.lockIcon}
                />
              )}

              {/* Mode icon */}
              <Text
                style={[
                  styles.modeIcon,
                  isActive && styles.modeIconActive,
                  isLocked && styles.modeIconLocked,
                ]}
              >
                {mode.icon}
              </Text>

              {/* Mode label */}
              <Text
                style={[
                  styles.modeLabel,
                  isActive && styles.modeLabelActive,
                  isPrive && isActive && styles.modeLabelPrive,
                  isLocked && styles.modeLabelLocked,
                  // Dark mode text
                  (isPriveMode || activeMode === 'prive') &&
                    !isActive &&
                    styles.modeLabelDarkMode,
                ]}
              >
                {mode.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    marginHorizontal: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
  },
  slidingPill: {
    position: 'absolute',
    top: 12,
    bottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    zIndex: 0,
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 1,
    minHeight: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  modeTabActive: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  modeTabLocked: {
    opacity: 0.6,
  },
  modeIcon: {
    fontSize: 14,
  },
  modeIconActive: {
    opacity: 1,
  },
  modeIconLocked: {
    opacity: 0.5,
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280', // Muted gray
  },
  modeLabelActive: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modeLabelPrive: {
    color: '#0A0A0A', // Dark text on gold
  },
  modeLabelLocked: {
    color: '#9CA3AF',
  },
  modeLabelDarkMode: {
    color: '#A0A0A0',
  },
  lockIcon: {
    marginRight: 2,
  },
  priveGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 24,
    backgroundColor: 'rgba(201, 169, 98, 0.4)', // Gold glow
  },
});

export default React.memo(ModeSwitcher);

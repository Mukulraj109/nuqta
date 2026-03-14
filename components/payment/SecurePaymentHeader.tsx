/**
 * Secure Payment Header
 *
 * Premium header component showing security badge and trust indicators
 * Updated with Nuqta design palette
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/constants/DesignTokens';
import { BRAND } from '@/constants/brand';

interface SecurePaymentHeaderProps {
  storeName?: string;
  onBack?: () => void;
}

export const SecurePaymentHeader: React.FC<SecurePaymentHeaderProps> = ({
  storeName,
  onBack,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <Pressable style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={24} color={COLORS.nuqta.nileBlue} />
      </Pressable>

      <View style={styles.headerContent}>
        {/* Title Row with Lock Icon */}
        <View style={styles.titleRow}>
          <View style={styles.lockIconWrapper}>
            <Ionicons name="lock-closed" size={16} color={COLORS.nuqta.mustard} />
          </View>
          <Text style={styles.title}>Secure Payment</Text>
        </View>

        {/* Store Name */}
        {storeName && (
          <Text style={styles.storeName}>{storeName}</Text>
        )}

        {/* Trust Badge with Gradient */}
        <LinearGradient
          colors={[COLORS.nuqta.mustard, COLORS.nuqta.peach]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.trustBadge}
        >
          <Ionicons name="shield-checkmark" size={12} color={COLORS.nuqta.nileBlue} />
          <Text style={styles.trustText}>{`Powered by ${BRAND.APP_NAME} Wallet • Encrypted & Safe`}</Text>
        </LinearGradient>
      </View>

      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.nuqta.nileBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.nuqta.lavender,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  lockIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.nuqta.linen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.h4,
    color: COLORS.nuqta.nileBlue,
    fontWeight: '700',
  },
  storeName: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  trustText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.nuqta.nileBlue,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
});

export default React.memo(SecurePaymentHeader);

// CashbackHeroCard.tsx - Green gradient cashback display card
import React from "react";
import { View, StyleSheet } from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import {
  Spacing,
  BorderRadius,
} from "@/constants/DesignSystem";
import { BRAND } from '@/constants/brand';
import { colors } from '@/constants/theme';

export interface CashbackHeroCardProps {
  cashbackPercentage?: number;
  coinsToEarn?: number;
}

export default function CashbackHeroCard({
  cashbackPercentage = 20,
  coinsToEarn = 50,
}: CashbackHeroCardProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.lightMustard, colors.brand.goldRich]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Cashback Info */}
          <View style={styles.textContent}>
            <ThemedText style={styles.label}>Earn up to</ThemedText>
            <ThemedText style={styles.percentage}>{cashbackPercentage}% Cashback</ThemedText>
            <View style={styles.coinsRow}>
              <View style={styles.divider} />
              <ThemedText style={styles.plus}>+</ThemedText>
              <View style={styles.divider} />
            </View>
            <View style={styles.coinsContainer}>
              <CachedImage
                source={BRAND.COIN_IMAGE}
                style={styles.coinIcon}
                contentFit="contain"
              />
              <ThemedText style={styles.coinsText}>
                Get {coinsToEarn} {BRAND.COIN_NAME} today
              </ThemedText>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  gradient: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  content: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  textContent: {
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
    marginBottom: 4,
  },
  percentage: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.background.primary,
    letterSpacing: -0.5,
  },
  coinsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  plus: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
  },
  coinsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 8,
  },
  coinIcon: {
    width: 24,
    height: 24,
  },
  coinsText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.background.primary,
  },
});

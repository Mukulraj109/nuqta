// StoreActionButtons.tsx - Scan & Pay, Upload Bill, View Offers buttons
import React, { useRef } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { triggerImpact } from "@/utils/haptics";
import { ThemedText } from "@/components/ThemedText";
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/DesignSystem";

export interface StoreActionButtonsProps {
  storeId?: string;
  onScanPay?: () => void;
  onUploadBill?: () => void;
  onViewOffers?: () => void;
}

export default function StoreActionButtons({
  storeId,
  onScanPay,
  onUploadBill,
  onViewOffers,
}: StoreActionButtonsProps) {
  const router = useRouter();

  // Animation refs
  const scanPayScale = useRef(new Animated.Value(1)).current;
  const uploadBillScale = useRef(new Animated.Value(1)).current;
  const viewOffersScale = useRef(new Animated.Value(1)).current;

  const animateScale = (animValue: Animated.Value, toValue: number) => {
    Animated.spring(animValue, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleScanPay = () => {
    triggerImpact('Medium');
    if (onScanPay) {
      onScanPay();
    } else {
      router.push('/pay-in-store');
    }
  };

  const handleUploadBill = () => {
    triggerImpact('Light');
    if (onUploadBill) {
      onUploadBill();
    }
    // TODO: Navigate to upload bill screen
  };

  const handleViewOffers = () => {
    triggerImpact('Light');
    if (onViewOffers) {
      onViewOffers();
    }
    // TODO: Scroll to offers section or open modal
  };

  return (
    <View style={styles.container}>
      {/* Primary Scan & Pay Button */}
      <Animated.View style={{ transform: [{ scale: scanPayScale }] }}>
        <Pressable
          style={styles.primaryButton}
         
          onPress={handleScanPay}
          onPressIn={() => animateScale(scanPayScale, 0.97)}
          onPressOut={() => animateScale(scanPayScale, 1)}
          accessibilityRole="button"
          accessibilityLabel="Scan and Pay"
        >
          <Ionicons name="qr-code-outline" size={20} color="#FFFFFF" />
          <ThemedText style={styles.primaryButtonText}>Scan & Pay</ThemedText>
        </Pressable>
      </Animated.View>

      {/* Secondary Buttons Row */}
      <View style={styles.secondaryRow}>
        {/* Upload Bill Button */}
        <Animated.View style={[styles.secondaryButtonWrapper, { transform: [{ scale: uploadBillScale }] }]}>
          <Pressable
            style={styles.secondaryButton}
           
            onPress={handleUploadBill}
            onPressIn={() => animateScale(uploadBillScale, 0.97)}
            onPressOut={() => animateScale(uploadBillScale, 1)}
            accessibilityRole="button"
            accessibilityLabel="Upload Bill"
          >
            <Ionicons name="camera-outline" size={18} color={Colors.text.primary} />
            <ThemedText style={styles.secondaryButtonText}>Upload Bill</ThemedText>
          </Pressable>
        </Animated.View>

        {/* View Offers Button */}
        <Animated.View style={[styles.secondaryButtonWrapper, { transform: [{ scale: viewOffersScale }] }]}>
          <Pressable
            style={styles.secondaryButton}
           
            onPress={handleViewOffers}
            onPressIn={() => animateScale(viewOffersScale, 0.97)}
            onPressOut={() => animateScale(viewOffersScale, 1)}
            accessibilityRole="button"
            accessibilityLabel="View Offers"
          >
            <Ionicons name="pricetag-outline" size={18} color={Colors.text.primary} />
            <ThemedText style={styles.secondaryButtonText}>View Offers</ThemedText>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffcd57",
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    gap: 8,
    ...Shadows.medium,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  secondaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  secondaryButtonWrapper: {
    flex: 1,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
  },
});

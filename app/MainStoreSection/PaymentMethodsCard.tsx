// PaymentMethodsCard.tsx - Shows accepted payment methods at store
import React from "react";
import {
  View,
  StyleSheet,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { BRAND } from '@/constants/brand';

interface PaymentMethodsCardProps {
  acceptPromoCoins?: boolean;
  acceptBrandedCoins?: boolean;
  acceptRezCoins?: boolean;
  acceptUPI?: boolean;
  acceptCards?: boolean;
  acceptPayLater?: boolean;
}

export default function PaymentMethodsCard({
  acceptPromoCoins = true,
  acceptBrandedCoins = true,
  acceptRezCoins = true,
  acceptUPI = true,
  acceptCards = true,
  acceptPayLater = false,
}: PaymentMethodsCardProps) {
  const paymentMethods = [
    {
      id: 'promo',
      name: 'Promo Coins',
      accepted: acceptPromoCoins,
      icon: 'ticket-percent-outline',
      iconType: 'material',
      color: '#ffd7b5',
    },
    {
      id: 'branded',
      name: 'Branded Coins',
      accepted: acceptBrandedCoins,
      icon: 'star',
      iconType: 'ionicon',
      color: '#1a3a52',
    },
    {
      id: 'rez',
      name: BRAND.COIN_NAME,
      accepted: acceptRezCoins,
      icon: 'server',
      iconType: 'ionicon',
      color: '#ffcd57',
    },
    {
      id: 'upi',
      name: 'UPI / Card',
      accepted: acceptUPI || acceptCards,
      icon: 'card-outline',
      iconType: 'ionicon',
      color: '#dfebf7',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <ThemedText style={styles.headerTitle}>How you can pay here</ThemedText>

      {/* Payment Methods Grid */}
      <View style={styles.card}>
        <View style={styles.grid}>
          {paymentMethods.map((method) => (
            <View key={method.id} style={styles.methodItem}>
              <View style={[styles.iconCircle, { backgroundColor: `${method.color}15` }]}>
                {method.iconType === 'material' ? (
                  <MaterialCommunityIcons
                    name={method.icon as any}
                    size={22}
                    color={method.color}
                  />
                ) : (
                  <Ionicons
                    name={method.icon as any}
                    size={22}
                    color={method.color}
                  />
                )}
              </View>
              <View style={styles.methodInfo}>
                <ThemedText style={styles.methodName}>{method.name}</ThemedText>
                <View style={styles.statusRow}>
                  <Ionicons
                    name={method.accepted ? "checkmark" : "close"}
                    size={14}
                    color={method.accepted ? "#ffcd57" : "#DC2626"}
                  />
                  <ThemedText
                    style={[
                      styles.statusText,
                      { color: method.accepted ? "#ffcd57" : "#DC2626" }
                    ]}
                  >
                    {method.accepted ? "Accepted" : "Not accepted"}
                  </ThemedText>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle" size={18} color="#1a3a52" />
          <ThemedText style={styles.infoText}>
            Coins are auto-applied for maximum savings
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a3a52",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  methodItem: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a3a52",
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#dfebf7",
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  infoText: {
    fontSize: 13,
    color: "#1a3a52",
    flex: 1,
  },
});

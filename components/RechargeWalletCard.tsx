import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Pressable, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RechargeWalletCardProps } from "@/types/profile";
import { useRegion } from "@/contexts/RegionContext";
import paymentService from "@/services/paymentService";

const RechargeWalletCard: React.FC<RechargeWalletCardProps> = ({
  cashbackText = "Upto 10% cashback on wallet recharge",
  amountOptions = [120, 5000, 10000],
  onAmountSelect,
  onSubmit,
  isLoading = false,
  currency: currencyProp,
}) => {
  const { getCurrencySymbol } = useRegion();
  const currency = currencyProp || getCurrencySymbol();
  const [selectedAmount, setSelectedAmount] = useState<"other" | number>(amountOptions[0] ?? "other");
  const [customAmount, setCustomAmount] = useState(amountOptions[0]?.toString() ?? "");
  const [cashbackPreview, setCashbackPreview] = useState<{ cashback: number; percentage: number; payableAmount?: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finalAmount = selectedAmount === "other" ? Number(customAmount) : selectedAmount;
  const isValid = !isNaN(finalAmount) && finalAmount > 0;

  // Fetch cashback preview when amount changes
  const fetchCashback = useCallback(async (amount: number) => {
    if (!amount || amount <= 0) {
      setCashbackPreview(null);
      return;
    }
    try {
      const res = await paymentService.previewCashback(amount);
      if (res.success && res.data) {
        setCashbackPreview({
          cashback: res.data.cashback || res.data.discountAmount || 0,
          percentage: res.data.cashbackPercentage || res.data.discountPercentage || 0,
          payableAmount: res.data.payableAmount
        });
      } else {
        setCashbackPreview(null);
      }
    } catch {
      setCashbackPreview(null);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (isValid) {
      debounceRef.current = setTimeout(() => fetchCashback(finalAmount), 400);
    } else {
      setCashbackPreview(null);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [finalAmount, isValid, fetchCashback]);

  const handleAmountPress = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(amount.toString());
    onAmountSelect?.(amount);
  };

  const handleCustomPress = () => {
    setSelectedAmount("other");
    setCustomAmount("");
    onAmountSelect?.("other");
  };

  const handleRecharge = () => {
    if (isLoading) return;
    const amount = selectedAmount === "other" ? Number(customAmount) : selectedAmount;
    if (!isNaN(amount) && amount > 0) {
      onSubmit?.(amount);
    }
  };

  // Dynamic discount text
  const displayCashback = cashbackPreview
    ? `Save ${cashbackPreview.percentage}% — Pay ${cashbackPreview.payableAmount ?? (finalAmount - cashbackPreview.cashback)} ${currency}`
    : cashbackText;

  return (
    <View style={styles.card}>
      {/* Cashback Banner */}
      <Pressable style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="gift-outline" size={16} color="#1a3a52" />
          <Text style={styles.cashback}>{displayCashback}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#1a3a52" />
      </Pressable>

      {/* Amount Chips */}
      <View style={styles.amountContainer}>
        {amountOptions.map((amount) => (
          <Pressable
            key={amount}
            style={[
              styles.amountButton,
              selectedAmount === amount && styles.selectedButton,
            ]}
            onPress={() => handleAmountPress(amount)}
          >
            <Text
              style={[
                styles.amountText,
                selectedAmount === amount && styles.selectedText,
              ]}
            >
              {currency}{amount.toLocaleString()}
            </Text>
          </Pressable>
        ))}

        <Pressable
          style={[
            styles.amountButton,
            selectedAmount === "other" && styles.selectedButton,
          ]}
          onPress={handleCustomPress}
        >
          <Text
            style={[
              styles.amountText,
              selectedAmount === "other" && styles.selectedText,
            ]}
          >
            Other
          </Text>
        </Pressable>
      </View>

      {/* Custom Amount Input */}
      <View style={styles.inputWrapper}>
        <Text style={styles.inputPrefix}>{currency}</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          value={customAmount}
          onChangeText={(text) => {
            setCustomAmount(text);
            const num = Number(text);
            if (!isNaN(num) && num > 0) {
              setSelectedAmount("other");
            }
          }}
        />
      </View>

      {/* Payment Methods Info */}
      <View style={styles.paymentInfoRow}>
        <Ionicons name="shield-checkmark-outline" size={14} color="#6B7280" />
        <Text style={styles.paymentText}>
          Recharge using UPI, Debit/Credit, Wallet, Netbanking
        </Text>
      </View>

      {/* Add Money Button */}
      <Pressable
        style={[styles.rechargeButton, (!isValid || isLoading) && styles.disabledButton]}
        onPress={handleRecharge}
        disabled={!isValid || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <View style={styles.buttonContent}>
            <Ionicons name="wallet-outline" size={18} color="#fff" />
            <Text style={styles.rechargeButtonText}>Add Money</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F0F4F8",
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  header: {
    backgroundColor: "#E8EEF4",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  cashback: {
    fontSize: 13,
    color: "#1a3a52",
    fontWeight: "600",
    flex: 1,
  },
  amountContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  amountButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
  },
  selectedButton: {
    backgroundColor: "#1a3a52",
    borderColor: "#1a3a52",
  },
  amountText: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "600",
  },
  selectedText: {
    color: "#FFFFFF",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  inputPrefix: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a3a52",
    marginRight: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    color: "#1F2937",
    fontSize: 15,
    fontWeight: "600",
  },
  paymentInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  paymentText: {
    fontSize: 11,
    color: "#6B7280",
  },
  rechargeButton: {
    backgroundColor: "#1a3a52",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rechargeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default RechargeWalletCard;

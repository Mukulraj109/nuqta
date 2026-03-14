import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRegion } from '@/contexts/RegionContext';

interface PaymentMethod {
  type: 'cod' | 'card' | 'upi' | 'netbanking' | 'wallet' | 'emi';
  name: string;
  icon?: string;
  enabled: boolean;
  details?: string;
}

interface PaymentMethodsProps {
  methods: PaymentMethod[];
  acceptsCOD?: boolean;
  acceptsCards?: boolean;
  acceptsUPI?: boolean;
  acceptsNetBanking?: boolean;
  acceptsWallets?: boolean;
  acceptsEMI?: boolean;
  emiPartners?: string[];
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  methods,
  acceptsCOD = true,
  acceptsCards = true,
  acceptsUPI = true,
  acceptsNetBanking = true,
  acceptsWallets = true,
  acceptsEMI = false,
  emiPartners = [],
}) => {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const [showEMICalculator, setShowEMICalculator] = useState(false);

  // Group methods by type
  const groupedMethods = methods.reduce((acc, method) => {
    if (!acc[method.type]) {
      acc[method.type] = [];
    }
    acc[method.type].push(method);
    return acc;
  }, {} as Record<string, PaymentMethod[]>);

  const getTypeTitle = (type: string): string => {
    const titles: Record<string, string> = {
      cod: 'Cash on Delivery',
      card: 'Credit/Debit Cards',
      upi: 'UPI Payments',
      netbanking: 'Net Banking',
      wallet: 'Digital Wallets',
      emi: 'EMI Options',
    };
    return titles[type] || type;
  };

  const getTypeIcon = (type: string): string => {
    const icons: Record<string, any> = {
      cod: 'cash-outline',
      card: 'card-outline',
      upi: 'phone-portrait-outline',
      netbanking: 'business-outline',
      wallet: 'wallet-outline',
      emi: 'calculator-outline',
    };
    return icons[type] || 'checkmark-circle-outline';
  };

  const renderPaymentIcon = (method: PaymentMethod) => {
    const iconMap: Record<string, string> = {
      // Cards
      'Visa': '💳',
      'Mastercard': '💳',
      'Amex': '💳',
      'Rupay': '💳',
      // UPI
      'Google Pay': '🔵',
      'PhonePe': '🟣',
      'Paytm': '🔵',
      'BHIM': '🟢',
      'Amazon Pay UPI': '🟠',
      // Wallets
      'Paytm Wallet': '🔵',
      'Amazon Pay': '🟠',
      'PhonePe Wallet': '🟣',
      'Mobikwik': '🔴',
      'Freecharge': '🟡',
      // Others
      'COD': '💵',
    };

    return (
      <View
        style={[
          styles.paymentIconContainer,
          !method.enabled && styles.disabledIcon,
        ]}
        key={method.name}
      >
        <Text style={styles.paymentEmoji}>{iconMap[method.name] || '✓'}</Text>
        <Text
          style={[
            styles.paymentName,
            !method.enabled && styles.disabledText,
          ]}
          numberOfLines={2}
        >
          {method.name}
        </Text>
        {!method.enabled && (
          <View style={styles.disabledOverlay}>
            <Text style={styles.disabledLabel}>Not Available</Text>
          </View>
        )}
      </View>
    );
  };

  const renderPaymentSection = (type: string, methods: PaymentMethod[]) => {
    return (
      <View style={styles.section} key={type}>
        <View style={styles.sectionHeader}>
          <Ionicons name={getTypeIcon(type) as any} size={20} color="#7C3AED" />
          <Text style={styles.sectionTitle}>{getTypeTitle(type)}</Text>
        </View>
        <View style={styles.paymentGrid}>
          {methods.map((method) => renderPaymentIcon(method))}
        </View>
        {type === 'emi' && emiPartners.length > 0 && (
          <View style={styles.emiPartnersContainer}>
            <Text style={styles.emiPartnersLabel}>EMI Partners:</Text>
            <Text style={styles.emiPartners}>{emiPartners.join(', ')}</Text>
            <Pressable
              style={styles.emiCalculatorButton}
              onPress={() => setShowEMICalculator(!showEMICalculator)}
            >
              <Ionicons name="calculator-outline" size={16} color="#7C3AED" />
              <Text style={styles.emiCalculatorText}>
                {showEMICalculator ? 'Hide' : 'Show'} EMI Calculator
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={styles.securePaymentBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#10B981" />
          <Text style={styles.securePaymentText}>Secure Payments</Text>
        </View>
      </View>

      {/* Payment Sections */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Object.entries(groupedMethods).map(([type, methods]) =>
          renderPaymentSection(type, methods)
        )}

        {/* EMI Calculator */}
        {showEMICalculator && acceptsEMI && (
          <View style={styles.emiCalculator}>
            <Text style={styles.emiCalculatorTitle}>EMI Calculator</Text>
            <View style={styles.emiCalculatorContent}>
              <View style={styles.emiRow}>
                <Text style={styles.emiLabel}>Purchase Amount:</Text>
                <Text style={styles.emiValue}>{currencySymbol}10,000</Text>
              </View>
              <View style={styles.emiRow}>
                <Text style={styles.emiLabel}>3 Months:</Text>
                <Text style={styles.emiValue}>{currencySymbol}3,400/month</Text>
              </View>
              <View style={styles.emiRow}>
                <Text style={styles.emiLabel}>6 Months:</Text>
                <Text style={styles.emiValue}>{currencySymbol}1,750/month</Text>
              </View>
              <View style={styles.emiRow}>
                <Text style={styles.emiLabel}>12 Months:</Text>
                <Text style={styles.emiValue}>{currencySymbol}900/month</Text>
              </View>
              <Text style={styles.emiNote}>
                *EMI rates may vary based on bank and card type
              </Text>
            </View>
          </View>
        )}

        {/* Trust Badges */}
        <View style={styles.trustBadgesContainer}>
          <Text style={styles.trustBadgesTitle}>Secured By</Text>
          <View style={styles.trustBadges}>
            <View style={styles.trustBadge}>
              <Ionicons name="lock-closed" size={20} color="#059669" />
              <Text style={styles.trustBadgeText}>SSL Encrypted</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark" size={20} color="#059669" />
              <Text style={styles.trustBadgeText}>PCI Compliant</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text style={styles.trustBadgeText}>100% Safe</Text>
            </View>
          </View>
        </View>

        {/* Payment Partners */}
        <View style={styles.partnersContainer}>
          <Text style={styles.partnersTitle}>Payment Partners</Text>
          <View style={styles.partnersLogos}>
            <Text style={styles.partnerLogo}>Razorpay</Text>
            <Text style={styles.partnerLogo}>Paytm</Text>
            <Text style={styles.partnerLogo}>Stripe</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  securePaymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  securePaymentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  scrollContent: {
    paddingBottom: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  paymentIconContainer: {
    width: '30%',
    aspectRatio: 1.2,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  disabledIcon: {
    opacity: 0.4,
  },
  paymentEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  paymentName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#EF4444',
    textAlign: 'center',
  },
  emiPartnersContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  emiPartnersLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  emiPartners: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 8,
  },
  emiCalculatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EDE9FE',
    borderRadius: 6,
    marginTop: 4,
  },
  emiCalculatorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
  },
  emiCalculator: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emiCalculatorTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  emiCalculatorContent: {
    gap: 8,
  },
  emiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  emiLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  emiValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  emiNote: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
  },
  trustBadgesContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  trustBadgesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  trustBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  trustBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  partnersContainer: {
    marginTop: 8,
  },
  partnersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  partnersLogos: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  partnerLogo: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#7C3AED',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});

// Mock Data
export const mockPaymentMethods: PaymentMethod[] = [
  // COD
  { type: 'cod', name: 'COD', enabled: true },

  // Cards
  { type: 'card', name: 'Visa', enabled: true },
  { type: 'card', name: 'Mastercard', enabled: true },
  { type: 'card', name: 'Amex', enabled: true },
  { type: 'card', name: 'Rupay', enabled: true },

  // UPI
  { type: 'upi', name: 'Google Pay', enabled: true },
  { type: 'upi', name: 'PhonePe', enabled: true },
  { type: 'upi', name: 'Paytm', enabled: true },
  { type: 'upi', name: 'BHIM', enabled: true },
  { type: 'upi', name: 'Amazon Pay UPI', enabled: true },

  // Net Banking
  { type: 'netbanking', name: 'HDFC Bank', enabled: true },
  { type: 'netbanking', name: 'ICICI Bank', enabled: true },
  { type: 'netbanking', name: 'SBI', enabled: true },
  { type: 'netbanking', name: 'Axis Bank', enabled: true },

  // Wallets
  { type: 'wallet', name: 'Paytm Wallet', enabled: true },
  { type: 'wallet', name: 'Amazon Pay', enabled: true },
  { type: 'wallet', name: 'PhonePe Wallet', enabled: true },
  { type: 'wallet', name: 'Mobikwik', enabled: false },
  { type: 'wallet', name: 'Freecharge', enabled: false },

  // EMI
  { type: 'emi', name: 'Credit Card EMI', enabled: true },
  { type: 'emi', name: 'Cardless EMI', enabled: true },
];

export const mockEMIPartners = [
  'HDFC Bank',
  'ICICI Bank',
  'SBI',
  'Axis Bank',
  'Bajaj Finserv',
  'ZestMoney',
];

export default React.memo(PaymentMethods);

// Payment Success Modal Component
// Displays success animation and subscription details after successful payment

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { useRegion } from '@/contexts/RegionContext';

interface PaymentSuccessModalProps {
  visible: boolean;
  tier: 'premium' | 'vip';
  price: number;
  billingCycle: 'monthly' | 'yearly';
  onClose: () => void;
}

function PaymentSuccessModal({
  visible,
  tier,
  price,
  billingCycle,
  onClose,
}: PaymentSuccessModalProps) {
  const router = useRouter();
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate success icon
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const handleViewSubscription = () => {
    onClose();
    router.push('/subscription/manage');
  };

  const handleContinueShopping = () => {
    onClose();
    router.push('/');
  };

  if (!visible) return null;

  const tierName = tier === 'vip' ? 'VIP' : 'Premium';
  const tierColor = tier === 'vip' ? '#F59E0B' : '#8B5CF6';
  const tierGradient = tier === 'vip'
    ? ['#F59E0B', '#FBBF24']
    : ['#8B5CF6', '#A855F7', '#EC4899'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Success Animation */}
          <View style={styles.animationContainer}>
            <Animated.View
              style={[
                styles.successCircle,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={tierGradient}
                style={styles.successGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="checkmark" size={60} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Success Message */}
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <ThemedText style={styles.successTitle}>Payment Successful!</ThemedText>
            <ThemedText style={styles.successSubtitle}>
              Welcome to {tierName}
            </ThemedText>

            {/* Subscription Details Card */}
            <View style={styles.detailsCard}>
              <LinearGradient
                colors={[`${tierColor}15`, `${tierColor}08`]}
                style={styles.detailsGradient}
              >
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons
                      name={tier === 'vip' ? 'diamond' : 'star'}
                      size={24}
                      color={tierColor}
                    />
                  </View>
                  <View style={styles.detailContent}>
                    <ThemedText style={styles.detailLabel}>
                      {tierName} Subscription
                    </ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {currencySymbol}{price}/{billingCycle === 'monthly' ? 'month' : 'year'}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.benefitsContainer}>
                  <ThemedText style={styles.benefitsTitle}>Your Benefits:</ThemedText>

                  {tier === 'premium' ? (
                    <>
                      <BenefitItem
                        icon="flash"
                        text="2x cashback on all orders"
                        color={tierColor}
                      />
                      <BenefitItem
                        icon="car"
                        text={`Free delivery on orders above ${currencySymbol}500`}
                        color={tierColor}
                      />
                      <BenefitItem
                        icon="headset"
                        text="Priority customer support"
                        color={tierColor}
                      />
                      <BenefitItem
                        icon="gift"
                        text="Exclusive deals & early access"
                        color={tierColor}
                      />
                    </>
                  ) : (
                    <>
                      <BenefitItem
                        icon="flash"
                        text="3x cashback on all orders"
                        color={tierColor}
                      />
                      <BenefitItem
                        icon="car"
                        text="Free delivery on all orders"
                        color={tierColor}
                      />
                      <BenefitItem
                        icon="person"
                        text="Personal shopper assistance"
                        color={tierColor}
                      />
                      <BenefitItem
                        icon="trophy"
                        text="Premium events access"
                        color={tierColor}
                      />
                    </>
                  )}
                </View>
              </LinearGradient>
            </View>

            {/* Action Buttons */}
            <Pressable
              style={styles.primaryButton}
              onPress={handleViewSubscription}
            >
              <LinearGradient
                colors={tierGradient}
                style={styles.primaryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <ThemedText style={styles.primaryButtonText}>
                  View My Subscription
                </ThemedText>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={handleContinueShopping}
            >
              <ThemedText style={styles.secondaryButtonText}>
                Continue Shopping
              </ThemedText>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

// Benefit Item Component
function BenefitItem({ icon, text, color }: { icon: string; text: string; color: string }) {
  return (
    <View style={styles.benefitItem}>
      <Ionicons name={icon as any} size={16} color={color} />
      <ThemedText style={styles.benefitText}>{text}</ThemedText>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  successGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  detailsCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsGradient: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  benefitsContainer: {
    gap: 8,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  benefitText: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default React.memo(PaymentSuccessModal);

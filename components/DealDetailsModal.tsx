// DealDetailsModal.tsx - Premium Glassmorphism Design
// Deal Details Modal - Green & Gold Theme

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { Deal } from '@/types/deals';
import { calculateDealDiscount } from '@/utils/deal-validation';
import { useRegion } from '@/contexts/RegionContext';

// Premium Glass Design Tokens - Green & Gold Theme
const GLASS = {
  lightBg: 'rgba(255, 255, 255, 0.85)',
  lightBorder: 'rgba(255, 255, 255, 0.5)',
  lightHighlight: 'rgba(255, 255, 255, 0.9)',
  frostedBg: 'rgba(255, 255, 255, 0.92)',
  tintedGreenBg: 'rgba(0, 192, 106, 0.08)',
  tintedGreenBorder: 'rgba(0, 192, 106, 0.2)',
  tintedGoldBg: 'rgba(255, 200, 87, 0.12)',
  tintedGoldBorder: 'rgba(255, 200, 87, 0.35)',
};

const COLORS = {
  primary: '#ffcd57',
  primaryDark: '#00796B',
  gold: '#FFC857',
  goldDark: '#E5A500',
  navy: '#0B2240',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  white: '#FFFFFF',
  surface: '#F7FAFC',
  success: '#10B981',
};

interface DealDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  deal: Deal | null;
}

function DealDetailsModal({ visible, onClose, deal }: DealDetailsModalProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const slideAnim = useRef(new Animated.Value(screenData.height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
      slideAnim.setValue(window.height);
    });

    return () => subscription?.remove();
  }, [slideAnim]);

  const styles = createStyles(screenData);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenData.height,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleBackdropPress = () => {
    onClose();
  };

  const handleModalPress = (event: any) => {
    event.stopPropagation();
  };

  if (!deal) return null;

  // Calculate savings examples
  const exampleBills = [deal.minimumBill, deal.minimumBill * 1.5, deal.minimumBill * 2];
  const savingsExamples = exampleBills.map(amount => ({
    billAmount: amount,
    ...calculateDealDiscount(deal, amount)
  }));

  // Format expiry date
  const formatExpiryDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Get time until expiry
  const getTimeUntilExpiry = () => {
    const now = new Date().getTime();
    const expiry = deal.validUntil.getTime();
    const difference = expiry - now;

    if (difference <= 0) return 'Expired';

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} days, ${hours} hours remaining`;
    } else if (hours > 0) {
      return `${hours} hours remaining`;
    } else {
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      return `${minutes} minutes remaining`;
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
      accessibilityLabel="Deal details dialog"
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <Animated.View style={[styles.blurContainer, { opacity: fadeAnim }]}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={60} tint="dark" style={styles.blur} />
            ) : (
              <View style={[styles.blur, styles.androidBlur]} />
            )}
          </Animated.View>

          <TouchableWithoutFeedback onPress={handleModalPress}>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {Platform.OS === 'ios' ? (
                <BlurView intensity={80} tint="light" style={styles.modal}>
                  {renderContent()}
                </BlurView>
              ) : (
                <View style={[styles.modal, styles.modalAndroid]}>
                  {renderContent()}
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  function renderContent() {
    return (
      <>
        {/* Glass Highlight */}
        <View style={styles.glassHighlight} />

        {/* Handle Bar */}
        <View style={styles.handleBar} />

        {/* Close button */}
        <Pressable
          style={styles.closeButton}
          onPress={onClose}
          accessibilityLabel="Close deal details"
          accessibilityRole="button"
          accessibilityHint="Double tap to close this dialog"
        >
          <View style={styles.closeButtonInner}>
            <Ionicons name="close" size={18} color={COLORS.textPrimary} />
          </View>
        </Pressable>

        {/* Deal Image (if available) */}
        {(deal as any).image && (
          <View style={styles.imageContainer}>
            <CachedImage
              source={(deal as any).image}
              style={styles.dealImage}
              contentFit="cover"
            />
            {/* Featured Badge */}
            {(deal as any).featured && (
              <View style={styles.featuredBadgeContainer}>
                <LinearGradient
                  colors={[COLORS.gold, COLORS.goldDark]}
                  style={styles.featuredBadge}
                >
                  <Ionicons name="star" size={12} color={COLORS.navy} />
                  <ThemedText style={styles.featuredBadgeText}>Featured</ThemedText>
                </LinearGradient>
              </View>
            )}
            {/* Discount Badge */}
            <View style={styles.discountBadgeContainer}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.discountBadge}
              >
                <ThemedText style={styles.discountBadgeText}>
                  {deal.discountValue}% OFF
                </ThemedText>
              </LinearGradient>
            </View>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          {!(deal as any).image && (
            <View style={styles.badgeContainer}>
              <LinearGradient
                colors={[COLORS.gold, COLORS.goldDark]}
                style={styles.badge}
              >
                <ThemedText style={styles.badgeText}>
                  {deal.badge?.text || `Save ${deal.discountValue}%`}
                </ThemedText>
              </LinearGradient>
            </View>
          )}
          <ThemedText style={styles.title}>{deal.title}</ThemedText>
          {deal.description && (
            <ThemedText style={styles.description}>{deal.description}</ThemedText>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* Key Details - Glass Card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.sectionIconContainer}
              >
                <Ionicons name="information-circle" size={18} color={COLORS.white} />
              </LinearGradient>
              <ThemedText style={styles.sectionTitle}>Deal Details</ThemedText>
            </View>

            <View style={styles.glassCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="wallet-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={styles.detailLabel}>Minimum Bill</ThemedText>
                  <ThemedText style={styles.detailValue}>{currencySymbol}{deal.minimumBill.toLocaleString()}</ThemedText>
                </View>
              </View>

              {deal.maxDiscount && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons name="trending-up-outline" size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <ThemedText style={styles.detailLabel}>Maximum Discount</ThemedText>
                    <ThemedText style={styles.detailValue}>{currencySymbol}{deal.maxDiscount.toLocaleString()}</ThemedText>
                  </View>
                </View>
              )}

              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name={deal.isOfflineOnly ? "storefront-outline" : "globe-outline"} size={18} color={COLORS.primary} />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={styles.detailLabel}>Available</ThemedText>
                  <View style={styles.availabilityBadge}>
                    <ThemedText style={styles.availabilityText}>
                      {deal.isOfflineOnly ? 'In-store only' : 'Online & In-store'}
                    </ThemedText>
                  </View>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={styles.detailLabel}>Valid Until</ThemedText>
                  <ThemedText style={styles.detailValue}>{formatExpiryDate(deal.validUntil)}</ThemedText>
                  <View style={styles.timeRemainingBadge}>
                    <Ionicons name="hourglass-outline" size={12} color={COLORS.primary} />
                    <ThemedText style={styles.timeRemaining}>{getTimeUntilExpiry()}</ThemedText>
                  </View>
                </View>
              </View>

              {deal.usageLimit && (
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons name="repeat-outline" size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <ThemedText style={styles.detailLabel}>Usage Limit</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {deal.usageLimit - (deal.usageCount || 0)} uses remaining
                    </ThemedText>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Savings Examples - Glass Card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={[COLORS.gold, COLORS.goldDark]}
                style={styles.sectionIconContainer}
              >
                <Ionicons name="calculator" size={18} color={COLORS.navy} />
              </LinearGradient>
              <ThemedText style={styles.sectionTitle}>Savings Calculator</ThemedText>
            </View>

            {savingsExamples.map((example, index) => (
              <View key={index} style={styles.savingsExample}>
                <View style={styles.savingsRow}>
                  <ThemedText style={styles.savingsLabel}>Bill Amount:</ThemedText>
                  <ThemedText style={styles.savingsValue}>{currencySymbol}{example.billAmount.toLocaleString()}</ThemedText>
                </View>
                <View style={styles.savingsRow}>
                  <ThemedText style={styles.savingsLabel}>You Save:</ThemedText>
                  <View style={styles.savingsDiscountBadge}>
                    <ThemedText style={styles.savingsDiscount}>{currencySymbol}{example.discountAmount.toLocaleString()}</ThemedText>
                  </View>
                </View>
                <View style={[styles.savingsRow, styles.savingsFinal]}>
                  <ThemedText style={styles.savingsLabel}>Pay Only:</ThemedText>
                  <ThemedText style={styles.savingsFinalAmount}>{currencySymbol}{example.finalAmount.toLocaleString()}</ThemedText>
                </View>
              </View>
            ))}
          </View>

          {/* Applicable Products */}
          {deal.applicableProducts && deal.applicableProducts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  style={styles.sectionIconContainer}
                >
                  <Ionicons name="grid-outline" size={18} color={COLORS.white} />
                </LinearGradient>
                <ThemedText style={styles.sectionTitle}>Applicable Categories</ThemedText>
              </View>
              <View style={styles.categoriesContainer}>
                {deal.applicableProducts.map((category, index) => (
                  <View key={index} style={styles.categoryTag}>
                    <ThemedText style={styles.categoryTagText}>{category}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Terms and Conditions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.sectionIconContainer}
              >
                <Ionicons name="document-text-outline" size={18} color={COLORS.white} />
              </LinearGradient>
              <ThemedText style={styles.sectionTitle}>Terms & Conditions</ThemedText>
            </View>
            <View style={styles.glassCard}>
              {deal.terms.map((term, index) => (
                <View key={index} style={styles.termRow}>
                  <View style={styles.termBullet}>
                    <Ionicons name="checkmark" size={12} color={COLORS.primary} />
                  </View>
                  <ThemedText style={styles.termText}>{term}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* How to Use */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={[COLORS.gold, COLORS.goldDark]}
                style={styles.sectionIconContainer}
              >
                <Ionicons name="help-circle-outline" size={18} color={COLORS.navy} />
              </LinearGradient>
              <ThemedText style={styles.sectionTitle}>How to Use</ThemedText>
            </View>
            <View style={styles.stepsContainer}>
              <View style={styles.stepRow}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  style={styles.stepNumber}
                >
                  <ThemedText style={styles.stepNumberText}>1</ThemedText>
                </LinearGradient>
                <ThemedText style={styles.stepText}>Add this deal to your selected offers</ThemedText>
              </View>
              <View style={styles.stepConnector} />
              <View style={styles.stepRow}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  style={styles.stepNumber}
                >
                  <ThemedText style={styles.stepNumberText}>2</ThemedText>
                </LinearGradient>
                <ThemedText style={styles.stepText}>Shop for items worth {currencySymbol}{deal.minimumBill.toLocaleString()} or more</ThemedText>
              </View>
              <View style={styles.stepConnector} />
              <View style={styles.stepRow}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  style={styles.stepNumber}
                >
                  <ThemedText style={styles.stepNumberText}>3</ThemedText>
                </LinearGradient>
                <ThemedText style={styles.stepText}>Apply the deal at checkout to get your discount</ThemedText>
              </View>
            </View>
          </View>

          {/* Add Deal Button */}
          <Pressable style={styles.addDealButton}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.addDealGradient}
            >
              <Ionicons name="add-circle-outline" size={22} color={COLORS.white} />
              <ThemedText style={styles.addDealText}>Add Deal</ThemedText>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </>
    );
  }
}

const createStyles = (screenData: { width: number; height: number }) => {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    blurContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    blur: {
      flex: 1,
    },
    androidBlur: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    modal: {
      borderRadius: 24,
      width: '100%',
      maxHeight: '95%',
      borderWidth: 1,
      borderColor: GLASS.lightBorder,
      overflow: 'hidden',
    },
    modalAndroid: {
      backgroundColor: GLASS.frostedBg,
    },
    glassHighlight: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: GLASS.lightHighlight,
      zIndex: 1,
    },
    handleBar: {
      width: 40,
      height: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
      borderRadius: 2,
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 8,
    },
    closeButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      zIndex: 10,
    },
    closeButtonInner: {
      backgroundColor: GLASS.lightBg,
      borderRadius: 20,
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: GLASS.lightBorder,
      ...Platform.select({
        ios: {
          shadowColor: COLORS.navy,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    imageContainer: {
      width: '100%',
      height: 180,
      position: 'relative',
    },
    dealImage: {
      width: '100%',
      height: '100%',
    },
    featuredBadgeContainer: {
      position: 'absolute',
      top: 16,
      left: 16,
    },
    featuredBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      gap: 4,
    },
    featuredBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: COLORS.navy,
    },
    discountBadgeContainer: {
      position: 'absolute',
      top: 16,
      right: 16,
    },
    discountBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    discountBadgeText: {
      fontSize: 13,
      fontWeight: '800',
      color: COLORS.white,
    },
    header: {
      alignItems: 'center',
      padding: 20,
      paddingTop: 12,
    },
    badgeContainer: {
      marginBottom: 12,
    },
    badge: {
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    badgeText: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.navy,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: COLORS.textPrimary,
      textAlign: 'center',
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    description: {
      fontSize: 15,
      color: COLORS.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 10,
    },
    sectionIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: COLORS.textPrimary,
    },
    glassCard: {
      backgroundColor: GLASS.lightBg,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: GLASS.lightBorder,
      ...Platform.select({
        ios: {
          shadowColor: COLORS.navy,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    detailIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: GLASS.tintedGreenBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    detailContent: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 13,
      color: COLORS.textSecondary,
      marginBottom: 4,
      fontWeight: '500',
    },
    detailValue: {
      fontSize: 15,
      fontWeight: '600',
      color: COLORS.textPrimary,
    },
    availabilityBadge: {
      backgroundColor: GLASS.tintedGreenBg,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: GLASS.tintedGreenBorder,
    },
    availabilityText: {
      fontSize: 13,
      fontWeight: '600',
      color: COLORS.primary,
    },
    timeRemainingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    timeRemaining: {
      fontSize: 12,
      color: COLORS.primary,
      fontWeight: '600',
    },
    savingsExample: {
      backgroundColor: GLASS.tintedGreenBg,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: GLASS.tintedGreenBorder,
    },
    savingsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    savingsFinal: {
      borderTopWidth: 1,
      borderTopColor: GLASS.tintedGreenBorder,
      paddingTop: 12,
      marginTop: 4,
      marginBottom: 0,
    },
    savingsLabel: {
      fontSize: 14,
      color: COLORS.textSecondary,
      fontWeight: '500',
    },
    savingsValue: {
      fontSize: 14,
      fontWeight: '600',
      color: COLORS.textPrimary,
    },
    savingsDiscountBadge: {
      backgroundColor: COLORS.success + '15',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    savingsDiscount: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.success,
    },
    savingsFinalAmount: {
      fontSize: 17,
      fontWeight: '800',
      color: COLORS.textPrimary,
    },
    categoriesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryTag: {
      backgroundColor: GLASS.tintedGreenBg,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: GLASS.tintedGreenBorder,
    },
    categoryTagText: {
      fontSize: 13,
      fontWeight: '600',
      color: COLORS.primary,
    },
    termRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    termBullet: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: GLASS.tintedGreenBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
      marginTop: 2,
    },
    termText: {
      fontSize: 14,
      color: COLORS.textSecondary,
      flex: 1,
      lineHeight: 20,
    },
    stepsContainer: {
      backgroundColor: GLASS.lightBg,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: GLASS.lightBorder,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    stepConnector: {
      width: 2,
      height: 20,
      backgroundColor: COLORS.primary + '30',
      marginLeft: 15,
      marginVertical: 4,
    },
    stepNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    stepNumberText: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.white,
    },
    stepText: {
      fontSize: 14,
      color: COLORS.textSecondary,
      flex: 1,
      lineHeight: 20,
    },
    addDealButton: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 24,
      ...Platform.select({
        ios: {
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    addDealGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 10,
    },
    addDealText: {
      fontSize: 17,
      fontWeight: '700',
      color: COLORS.white,
    },
  });
};

export default React.memo(DealDetailsModal);

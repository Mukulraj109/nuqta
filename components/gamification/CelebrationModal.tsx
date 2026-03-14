import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import type { SpinWheelResult } from '@/types/gamification.types';
import { useRegion } from '@/contexts/RegionContext';

interface CelebrationModalProps {
  visible: boolean;
  result: SpinWheelResult | null;
  coinsEarned: number;
  newBalance: number;
  onClose: () => void;
  tournamentUpdate?: { tournamentName: string; pointsAdded: number; newRank: number } | null;
}

const { width } = Dimensions.get('window');

function CelebrationModal({
  visible,
  result,
  coinsEarned,
  newBalance,
  onClose,
  tournamentUpdate,
}: CelebrationModalProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      fadeAnim.setValue(0);

      // Start animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!result) return null;

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getPrizeIcon = () => {
    switch (result.prize?.type) {
      case 'coins':
        return 'star';
      case 'cashback':
        return 'cash';
      case 'discount':
        return 'pricetag';
      case 'voucher':
        return 'ticket';
      default:
        return 'gift';
    }
  };

  const getPrizeColor = () => {
    switch (result.prize?.type) {
      case 'coins':
        return ['#FFD700', '#FFA500'];
      case 'cashback':
        return ['#ffcd57', '#1a3a52'];
      case 'discount':
        return ['#F59E0B', '#D97706'];
      case 'voucher':
        return ['#8B5CF6', '#7C3AED'];
      default:
        return ['#3B82F6', '#2563EB'];
    }
  };

  const getPrizeText = () => {
    if (result.prize?.type === 'coins') {
      return `${result.prize.value} Coins`;
    } else if (result.prize?.type === 'cashback') {
      return `${result.prize.value}% Cashback`;
    } else if (result.prize?.type === 'discount') {
      return `${result.prize.value}% Discount`;
    } else if (result.prize?.type === 'voucher') {
      return `${currencySymbol}${result.prize.value} Voucher`;
    }
    return result.segment.label;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
         
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          {/* Close Button */}
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
           
          >
            <Ionicons name="close-circle" size={32} color="#6B7280" />
          </Pressable>

          {/* Celebration Icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [{ rotate: rotation }],
              },
            ]}
          >
            <LinearGradient
              colors={getPrizeColor()}
              style={styles.iconGradient}
            >
              <Ionicons name={getPrizeIcon() as any} size={64} color="white" />
            </LinearGradient>
          </Animated.View>

          {/* Congratulations Text */}
          <ThemedText style={styles.congratsText}>🎉 Congratulations! 🎉</ThemedText>

          {/* Prize Won */}
          <View style={styles.prizeContainer}>
            <ThemedText style={styles.prizeLabel}>You Won</ThemedText>
            <ThemedText style={styles.prizeValue}>{getPrizeText()}</ThemedText>
          </View>

          {/* Coins Info (if coins were won) */}
          {result.prize?.type === 'coins' && coinsEarned > 0 && (
            <View style={styles.coinsInfo}>
              <View style={styles.coinsRow}>
                <ThemedText style={styles.coinsLabel}>Coins Earned:</ThemedText>
                <ThemedText style={styles.coinsEarned}>+{coinsEarned}</ThemedText>
              </View>
              <View style={styles.divider} />
              <View style={styles.coinsRow}>
                <ThemedText style={styles.coinsLabel}>New Balance:</ThemedText>
                <View style={styles.balanceContainer}>
                  <Ionicons name="star" size={20} color="#FFD700" />
                  <ThemedText style={styles.balanceValue}>{newBalance}</ThemedText>
                </View>
              </View>
            </View>
          )}

          {/* Tournament Score Update */}
          {tournamentUpdate && (
            <View style={styles.tournamentBanner}>
              <View style={styles.tournamentBannerRow}>
                <Ionicons name="trophy" size={18} color="#F59E0B" />
                <ThemedText style={styles.tournamentBannerTitle}>{tournamentUpdate.tournamentName}</ThemedText>
              </View>
              <View style={styles.tournamentBannerStats}>
                <View style={styles.tournamentBannerStat}>
                  <ThemedText style={styles.tournamentBannerValue}>+{tournamentUpdate.pointsAdded}</ThemedText>
                  <ThemedText style={styles.tournamentBannerLabel}>Points</ThemedText>
                </View>
                <View style={[styles.tournamentBannerStat, { borderLeftWidth: 1, borderLeftColor: '#E5E7EB' }]}>
                  <ThemedText style={styles.tournamentBannerValue}>#{tournamentUpdate.newRank}</ThemedText>
                  <ThemedText style={styles.tournamentBannerLabel}>Rank</ThemedText>
                </View>
              </View>
            </View>
          )}

          {/* Coupon Applicability Info */}
          {result.prize?.couponDetails && (
            <View style={styles.couponDetailsContainer}>
              <View style={styles.applicabilityHeader}>
                <Ionicons
                  name={result.prize.couponDetails.isProductSpecific ? "pricetag" : "storefront"}
                  size={20}
                  color="#8B5CF6"
                />
                <ThemedText style={styles.applicabilityTitle}>
                  {result.prize.couponDetails.isProductSpecific ? 'Product-Specific' : 'Store-Wide'}
                </ThemedText>
              </View>

              <View style={styles.applicabilityContent}>
                <ThemedText style={styles.applicabilityText}>
                  {result.prize.couponDetails.applicableOn}
                </ThemedText>

                <View style={styles.storeTag}>
                  <Ionicons name="storefront" size={14} color="#6B7280" />
                  <ThemedText style={styles.storeTagText}>
                    {result.prize.couponDetails.storeName}
                  </ThemedText>
                </View>

                {result.prize.couponDetails.isProductSpecific && result.prize.couponDetails.productName && (
                  <View style={styles.productTag}>
                    <Ionicons name="cube" size={14} color="#6B7280" />
                    <ThemedText style={styles.productTagText}>
                      {result.prize.couponDetails.productName}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Other Reward Types Info */}
          {result.prize?.type !== 'coins' && result.prize?.type !== 'nothing' && (
            <View style={styles.rewardInfo}>
              <Ionicons name="checkmark-circle" size={20} color="#ffcd57" />
              <ThemedText style={styles.rewardText}>
                {result.prize?.type === 'cashback' && 'Cashback added to your wallet!'}
                {result.prize?.type === 'discount' && 'Discount coupon added to your coupons!'}
                {result.prize?.type === 'voucher' && 'Voucher added to your account!'}
              </ThemedText>
            </View>
          )}

          {/* Awesome Button */}
          <Pressable
            style={styles.awesomeButton}
            onPress={onClose}
           
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.awesomeButtonGradient}
            >
              <ThemedText style={styles.awesomeButtonText}>Awesome!</ThemedText>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 28,
    width: Math.min(width - 40, 400),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  iconContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  prizeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  prizeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  prizeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  coinsInfo: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  coinsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coinsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  coinsEarned: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffcd57',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  couponDetailsContainer: {
    width: '100%',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  applicabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  applicabilityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  applicabilityContent: {
    gap: 10,
  },
  applicabilityText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  storeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  storeTagText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  productTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  productTagText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf1e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  rewardText: {
    fontSize: 13,
    color: '#1a3a52',
    fontWeight: '500',
    flex: 1,
  },
  tournamentBanner: {
    width: '100%',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tournamentBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  tournamentBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  tournamentBannerStats: {
    flexDirection: 'row',
  },
  tournamentBannerStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tournamentBannerValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a3a52',
  },
  tournamentBannerLabel: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '500',
    marginTop: 2,
  },
  awesomeButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  awesomeButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  awesomeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default React.memo(CelebrationModal);

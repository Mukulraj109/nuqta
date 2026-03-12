import React from 'react';
import { BRAND } from '@/constants/brand';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface CoinType {
  type: string;
  badge: string;
  badgeColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBgColor: string;
  iconColor: string;
  description: string;
  features: { icon: keyof typeof Ionicons.glyphMap; text: string; color: string }[];
  tip: string;
  tipIcon: keyof typeof Ionicons.glyphMap;
  cardBgColor: string;
  borderColor: string;
}

const coinTypes: CoinType[] = [
  {
    type: BRAND.COIN_NAME,
    badge: 'Universal',
    badgeColor: '#ffcd57',
    icon: 'layers-outline',
    iconBgColor: '#faf1e0',
    iconColor: '#1a3a52',
    description: 'Earned on most purchases',
    features: [
      { icon: 'checkmark', text: `Can be used at any ${BRAND.APP_NAME} store`, color: '#1a3a52' },
      { icon: 'time-outline', text: 'Short validity (to encourage usage)', color: '#1a3a52' },
    ],
    tip: 'Think of this as your everyday savings currency.',
    tipIcon: 'bulb-outline',
    cardBgColor: '#faf1e0',
    borderColor: '#ffcd57',
  },
  {
    type: 'Brand Coins',
    badge: 'Store-specific',
    badgeColor: '#1a3a52',
    icon: 'storefront-outline',
    iconBgColor: '#dfebf7',
    iconColor: '#1a3a52',
    description: 'Earned at specific brands',
    features: [
      { icon: 'checkmark', text: 'Can be used only at that brand', color: '#1a3a52' },
      { icon: 'infinite-outline', text: 'Never expire', color: '#1a3a52' },
    ],
    tip: 'Rewards loyalty to your favorite stores.',
    tipIcon: 'heart-outline',
    cardBgColor: '#dfebf7',
    borderColor: '#1a3a52',
  },
  {
    type: 'Promo Coins',
    badge: 'Limited-time',
    badgeColor: '#ffcd57',
    icon: 'flame-outline',
    iconBgColor: '#ffd7b5',
    iconColor: '#1a3a52',
    description: 'Earned during campaigns',
    features: [
      { icon: 'checkmark', text: 'Higher value', color: '#1a3a52' },
      { icon: 'hourglass-outline', text: 'Short expiry', color: '#EF4444' },
    ],
    tip: 'Use them fast to maximize savings.',
    tipIcon: 'flash-outline',
    cardBgColor: '#ffd7b5',
    borderColor: '#ffcd57',
  },
];

const WalletSection: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="wallet" size={28} color="#1a3a52" />
        </View>
        <Text style={styles.sectionTitle}>Your {BRAND.APP_NAME} Wallet</Text>
        <Text style={styles.sectionSubtitle}>
          Your wallet stores <Text style={styles.boldText}>all rewards transparently</Text>.
        </Text>
      </View>

      {/* Coin Type Cards */}
      {coinTypes.map((coin, index) => (
        <View
          key={index}
          style={[
            styles.coinCard,
            { backgroundColor: coin.cardBgColor, borderColor: coin.borderColor },
          ]}
        >
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={[styles.coinIconContainer, { backgroundColor: coin.iconBgColor }]}>
              <Ionicons name={coin.icon} size={22} color={coin.iconColor} />
            </View>
            <View style={styles.cardTitleContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.coinType}>{coin.type}</Text>
                <View style={[styles.badge, { backgroundColor: `${coin.badgeColor}20` }]}>
                  <Text style={[styles.badgeText, { color: coin.badgeColor }]}>
                    {coin.badge}
                  </Text>
                </View>
              </View>
              <Text style={styles.coinDescription}>{coin.description}</Text>
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {coin.features.map((feature, featureIndex) => (
              <View key={featureIndex} style={styles.featureRow}>
                <Ionicons name={feature.icon} size={16} color={feature.color} />
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>

          {/* Tip */}
          <View style={styles.tipContainer}>
            <Ionicons name={coin.tipIcon} size={14} color={coin.iconColor} />
            <Text style={[styles.tipText, { color: coin.iconColor }]}>{coin.tip}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#faf1e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  boldText: {
    fontWeight: '600',
    color: '#1F2937',
  },
  coinCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  coinIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  coinType: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  coinDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  featuresContainer: {
    gap: 10,
    marginBottom: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  tipText: {
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
  },
});

export default WalletSection;

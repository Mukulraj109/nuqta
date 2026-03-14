// Coin System Guide Page
// Educational/informational page about the ReZ coin system

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Platform,
  UIManager,
  LayoutAnimation,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useWalletContext } from '@/contexts/WalletContext';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';

const { width } = Dimensions.get('window');

// ============================================
// COIN TYPE DATA
// ============================================

interface CoinTypeInfo {
  name: string;
  color: string;
  backgroundColor: string;
  gradientColors: [string, string];
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  expiry: string;
  earnedFrom: string;
  usableAt: string;
}

const COIN_TYPES: CoinTypeInfo[] = [
  {
    name: 'ReZ Coins',
    color: '#16A34A',
    backgroundColor: '#F0FDF4',
    gradientColors: ['#16A34A', '#15803D'],
    icon: 'diamond',
    description: 'Universal coins that work everywhere on the platform. The backbone of your rewards.',
    expiry: 'Never expires',
    earnedFrom: 'Shopping, games, challenges, referrals',
    usableAt: 'Everywhere on ReZ',
  },
  {
    name: 'Priv\u00e9 Coins',
    color: '#B45309',
    backgroundColor: '#FFFBEB',
    gradientColors: ['#F59E0B', '#D97706'],
    icon: 'diamond-outline',
    description: 'Premium tier coins with higher value. Earned from Priv\u00e9-eligible purchases.',
    expiry: '12 months',
    earnedFrom: 'Priv\u00e9-eligible purchases',
    usableAt: 'All Priv\u00e9 partners',
  },
  {
    name: 'Branded Coins',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    gradientColors: ['#3B82F6', '#2563EB'],
    icon: 'storefront',
    description: 'Store-specific coins earned from participating merchants. Only usable at the issuing store.',
    expiry: '6 months',
    earnedFrom: 'Participating stores',
    usableAt: 'Issuing store only',
  },
  {
    name: 'Promo Coins',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    gradientColors: ['#FBBF24', '#D97706'],
    icon: 'gift',
    description: 'Campaign-based coins from special promotions and events. Limited time availability.',
    expiry: 'Per campaign',
    earnedFrom: 'Special promotions',
    usableAt: 'As per campaign rules',
  },
];

// ============================================
// EARNING METHODS DATA
// ============================================

interface EarningMethod {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  backgroundColor: string;
}

const EARNING_METHODS: EarningMethod[] = [
  {
    icon: 'cart',
    title: 'Shopping',
    description: 'Earn ReZ coins on every order you place',
    color: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  {
    icon: 'game-controller',
    title: 'Games',
    description: 'Play daily games for coins and prizes',
    color: Colors.nileBlue,
    backgroundColor: '#F5F3FF',
  },
  {
    icon: 'flag',
    title: 'Challenges',
    description: 'Complete challenges for bonus coin rewards',
    color: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  {
    icon: 'people',
    title: 'Referrals',
    description: 'Refer friends and earn coins when they join',
    color: '#0EA5E9',
    backgroundColor: '#F0F9FF',
  },
  {
    icon: 'receipt',
    title: 'Bill Upload',
    description: 'Upload receipts from partner stores for cashback',
    color: '#E11D48',
    backgroundColor: '#FFF1F2',
  },
  {
    icon: 'calendar',
    title: 'Daily Check-in',
    description: 'Maintain streaks for increasing bonus coins',
    color: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  {
    icon: 'star',
    title: 'Reviews',
    description: 'Write product and store reviews for coins',
    color: Colors.nileBlue,
    backgroundColor: '#EEF2FF',
  },
];

// ============================================
// FAQ DATA
// ============================================

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Do my coins expire?',
    answer: 'It depends on the coin type. ReZ Coins never expire. Priv\u00e9 Coins expire after 12 months of earning. Branded Coins expire 6 months after earning. Promo Coins expire based on the specific campaign end date. You can always check expiry dates in your Wallet.',
  },
  {
    question: 'How are coins spent?',
    answer: 'When you make a purchase, coins are automatically applied in priority order: Promo Coins first (since they expire soonest), then Branded Coins (if applicable to the store), then Priv\u00e9 Coins, and finally ReZ Coins. Within each type, the lowest-expiry coins are used first.',
  },
  {
    question: 'Can I transfer coins to someone else?',
    answer: 'No, coins are personal and tied to your account. They cannot be transferred to another user. However, you can gift coins through the Gift Coins feature in your wallet, which sends new coins from a special gifting pool.',
  },
  {
    question: 'Where can I see my balance?',
    answer: 'You can view your complete coin balance breakdown on the Wallet page. Each coin type is displayed separately with its current balance, expiry information, and recent transactions. You can also see a summary on the Play & Earn page.',
  },
  {
    question: 'What is the spending priority?',
    answer: 'The system automatically prioritizes spending in this order: Promo Coins (campaign-based, expire first) > Branded Coins (store-specific) > Priv\u00e9 Coins (premium tier) > ReZ Coins (universal, never expire). This ensures you use expiring coins before permanent ones.',
  },
  {
    question: 'How much is 1 coin worth?',
    answer: 'The value of 1 coin depends on the type. ReZ Coins and Promo Coins have a standard value set by the platform. Priv\u00e9 Coins typically have a higher redemption value. Branded Coins have values set by the issuing store. Check each coin\'s details in your Wallet for exact values.',
  },
];

// ============================================
// SPENDING PRIORITY DATA
// ============================================

const SPENDING_PRIORITY = [
  { name: 'Promo Coins', color: '#D97706', icon: 'gift' as keyof typeof Ionicons.glyphMap, priority: 1 },
  { name: 'Branded Coins', color: '#2563EB', icon: 'storefront' as keyof typeof Ionicons.glyphMap, priority: 2 },
  { name: 'Priv\u00e9 Coins', color: '#B45309', icon: 'diamond-outline' as keyof typeof Ionicons.glyphMap, priority: 3 },
  { name: 'ReZ Coins', color: '#16A34A', icon: 'diamond' as keyof typeof Ionicons.glyphMap, priority: 4 },
];

// ============================================
// COMPONENT
// ============================================

const CoinSystemPage = () => {
  const router = useRouter();
  const { totalBalance: walletBalance, isLoading: loadingWallet } = useWalletContext();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const faqAnimations = useRef<Animated.Value[]>(
    FAQ_ITEMS.map(() => new Animated.Value(0))
  ).current;

  const toggleFAQ = (index: number) => {
    const isExpanding = expandedFAQ !== index;

    // Animate chevron rotation with native driver
    Animated.timing(faqAnimations[index], {
      toValue: isExpanding ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();

    // Close previously expanded FAQ chevron
    if (expandedFAQ !== null && expandedFAQ !== index) {
      Animated.timing(faqAnimations[expandedFAQ], {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    // Use LayoutAnimation for the height expand/collapse
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFAQ(isExpanding ? index : null);
  };

  // ============================================
  // RENDER SECTIONS
  // ============================================

  const renderCoinTypeCard = (coin: CoinTypeInfo, index: number) => (
    <View key={index} style={[styles.coinCard, { borderLeftColor: coin.color }]}>
      <View style={styles.coinCardHeader}>
        <View style={[styles.coinIconContainer, { backgroundColor: coin.backgroundColor }]}>
          <Ionicons name={coin.icon} size={24} color={coin.color} />
        </View>
        <View style={styles.coinCardHeaderText}>
          <Text style={[styles.coinName, { color: coin.color }]}>{coin.name}</Text>
          <View style={[styles.expiryBadge, { backgroundColor: coin.backgroundColor }]}>
            <Ionicons name="time-outline" size={12} color={coin.color} />
            <Text style={[styles.expiryBadgeText, { color: coin.color }]}>{coin.expiry}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.coinDescription}>{coin.description}</Text>
      <View style={styles.coinDetails}>
        <View style={styles.coinDetailRow}>
          <Text style={styles.coinDetailLabel}>Earned from:</Text>
          <Text style={styles.coinDetailValue}>{coin.earnedFrom}</Text>
        </View>
        <View style={styles.coinDetailRow}>
          <Text style={styles.coinDetailLabel}>Usable at:</Text>
          <Text style={styles.coinDetailValue}>{coin.usableAt}</Text>
        </View>
      </View>
    </View>
  );

  const renderEarningMethod = (method: EarningMethod, index: number) => (
    <View key={index} style={styles.earningCard}>
      <View style={[styles.earningIconContainer, { backgroundColor: method.backgroundColor }]}>
        <Ionicons name={method.icon} size={22} color={method.color} />
      </View>
      <View style={styles.earningContent}>
        <Text style={styles.earningTitle}>{method.title}</Text>
        <Text style={styles.earningDescription}>{method.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.border.default} />
    </View>
  );

  const renderSpendingPriority = () => (
    <View style={styles.priorityContainer}>
      {SPENDING_PRIORITY.map((item, index) => (
        <React.Fragment key={index}>
          <View style={styles.priorityItem}>
            <View style={[styles.priorityNumber, { backgroundColor: item.color }]}>
              <Text style={styles.priorityNumberText}>{item.priority}</Text>
            </View>
            <View style={[styles.priorityIconBg, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <Text style={styles.priorityName}>{item.name}</Text>
          </View>
          {index < SPENDING_PRIORITY.length - 1 && (
            <View style={styles.priorityArrow}>
              <Ionicons name="arrow-down" size={18} color={Colors.border.default} />
            </View>
          )}
        </React.Fragment>
      ))}
      <View style={styles.priorityNote}>
        <Ionicons name="information-circle" size={16} color={Colors.text.tertiary} />
        <Text style={styles.priorityNoteText}>
          Coins with the nearest expiry are used first within each type
        </Text>
      </View>
    </View>
  );

  const renderExpiryTable = () => (
    <View style={styles.expiryTable}>
      <View style={styles.expiryTableHeader}>
        <Text style={[styles.expiryTableCell, styles.expiryTableHeaderText, { flex: 1.5 }]}>Coin Type</Text>
        <Text style={[styles.expiryTableCell, styles.expiryTableHeaderText, { flex: 1 }]}>Expiry</Text>
        <Text style={[styles.expiryTableCell, styles.expiryTableHeaderText, { flex: 1.2 }]}>Scope</Text>
      </View>
      {COIN_TYPES.map((coin, index) => (
        <View
          key={index}
          style={[
            styles.expiryTableRow,
            index % 2 === 0 ? styles.expiryTableRowEven : null,
          ]}
        >
          <View style={[styles.expiryTableCell, { flex: 1.5, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
            <View style={[styles.expiryDot, { backgroundColor: coin.color }]} />
            <Text style={styles.expiryTableText}>{coin.name}</Text>
          </View>
          <Text style={[styles.expiryTableCell, styles.expiryTableText, { flex: 1 }]}>{coin.expiry}</Text>
          <Text style={[styles.expiryTableCell, styles.expiryTableText, { flex: 1.2 }]}>{coin.usableAt}</Text>
        </View>
      ))}
    </View>
  );

  const renderFAQItem = (faq: FAQItem, index: number) => {
    const isExpanded = expandedFAQ === index;
    const rotateIcon = faqAnimations[index].interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    return (
      <View key={index} style={styles.faqItem}>
        <Pressable
          style={styles.faqQuestion}
          onPress={() => toggleFAQ(index)}

          accessibilityLabel={`FAQ: ${faq.question}`}
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
        >
          <Text style={styles.faqQuestionText}>{faq.question}</Text>
          <Animated.View style={{ transform: [{ rotate: rotateIcon }] }}>
            <Ionicons name="chevron-down" size={20} color={Colors.text.tertiary} />
          </Animated.View>
        </Pressable>
        {isExpanded && (
          <View style={styles.faqAnswerContainer}>
            <Text style={styles.faqAnswerText}>{faq.answer}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.nileBlue} />

      {/* Header */}
      <LinearGradient
        colors={[Colors.nileBlue, '#2d5a7b'] as const}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={Colors.text.inverse} />
          </Pressable>
          <Text style={styles.headerTitle}>ReZ Coin System</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        {walletBalance !== null && (
          <View style={styles.headerBalance}>
            <Ionicons name="diamond" size={16} color={Colors.gold} />
            <Text style={styles.headerBalanceText}>
              Your Balance: RC {walletBalance}
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Intro Section */}
        <View style={styles.introSection}>
          <View style={styles.introIconRow}>
            <Ionicons name="diamond" size={32} color="#16A34A" />
            <Ionicons name="diamond-outline" size={28} color="#F59E0B" />
            <Ionicons name="storefront" size={28} color="#3B82F6" />
            <Ionicons name="gift" size={28} color="#D97706" />
          </View>
          <Text style={styles.introTitle}>Understanding Your Coins</Text>
          <Text style={styles.introSubtitle}>
            ReZ uses a multi-coin system to reward you in different ways. Each coin type has unique properties and uses.
          </Text>
        </View>

        {/* Section: Coin Types */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="layers" size={22} color={Colors.nileBlue} />
            <Text style={styles.sectionTitle}>Coin Types</Text>
          </View>
          {COIN_TYPES.map(renderCoinTypeCard)}
        </View>

        {/* Section: How to Earn */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={22} color={Colors.nileBlue} />
            <Text style={styles.sectionTitle}>How to Earn</Text>
          </View>
          <View style={styles.earningList}>
            {EARNING_METHODS.map(renderEarningMethod)}
          </View>
        </View>

        {/* Section: Spending Priority */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="swap-vertical" size={22} color={Colors.nileBlue} />
            <Text style={styles.sectionTitle}>Spending Priority</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            When you spend coins, the system automatically uses them in this order:
          </Text>
          {renderSpendingPriority()}
        </View>

        {/* Section: Expiry Rules */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time" size={22} color={Colors.nileBlue} />
            <Text style={styles.sectionTitle}>Expiry Rules</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Quick reference for coin expiry policies
          </Text>
          {renderExpiryTable()}
        </View>

        {/* Section: FAQ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle" size={22} color={Colors.nileBlue} />
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          </View>
          <View style={styles.faqList}>
            {FAQ_ITEMS.map(renderFAQItem)}
          </View>
        </View>

        {/* CTA: View My Wallet */}
        <View style={styles.ctaSection}>
          <Pressable
            style={styles.ctaButton}
            onPress={() => router.push('/wallet')}
           
            accessibilityLabel="View My Wallet"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={[Colors.nileBlue, '#2d5a7b'] as const}
              style={styles.ctaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="wallet" size={22} color={Colors.gold} />
              <Text style={styles.ctaText}>View My Wallet</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.text.inverse} />
            </LinearGradient>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 40,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.inverse,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },
  headerBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignSelf: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 6,
    borderRadius: BorderRadius.xl,
  },
  headerBalanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Intro Section
  introSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 28,
    backgroundColor: Colors.background.primary,
    marginBottom: Spacing.sm,
  },
  introIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: Spacing.base,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 21,
  },

  // Section
  section: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background.primary,
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginBottom: Spacing.base,
    lineHeight: 20,
  },

  // Coin Type Cards
  coinCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderLeftWidth: 4,
    ...Shadows.subtle,
  },
  coinCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  coinIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  coinCardHeaderText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coinName: {
    fontSize: 16,
    fontWeight: '700',
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
  },
  expiryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  coinDescription: {
    fontSize: 13,
    color: Colors.text.tertiary,
    lineHeight: 19,
    marginBottom: Spacing.md,
  },
  coinDetails: {
    gap: 6,
  },
  coinDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  coinDetailLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontWeight: '600',
    width: 90,
  },
  coinDetailValue: {
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },

  // Earning Methods
  earningList: {
    gap: 8,
  },
  earningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  earningIconContainer: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  earningContent: {
    flex: 1,
  },
  earningTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  earningDescription: {
    fontSize: 12,
    color: Colors.text.tertiary,
    lineHeight: 17,
  },

  // Spending Priority
  priorityContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
    ...Shadows.subtle,
  },
  priorityNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  priorityIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  priorityArrow: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  priorityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.base,
    paddingHorizontal: Spacing.sm,
  },
  priorityNoteText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    flex: 1,
    lineHeight: 17,
  },

  // Expiry Table
  expiryTable: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  expiryTableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.nileBlue,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  expiryTableHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.inverse,
  },
  expiryTableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  expiryTableRowEven: {
    backgroundColor: Colors.background.secondary,
  },
  expiryTableCell: {
    fontSize: 13,
  },
  expiryTableText: {
    fontSize: 13,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  expiryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // FAQ Section
  faqList: {
    gap: 8,
  },
  faqItem: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.light,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
  },
  faqQuestionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
    marginRight: 12,
  },
  faqAnswerContainer: {
    overflow: 'hidden',
  },
  faqAnswerText: {
    fontSize: 14,
    color: Colors.text.tertiary,
    lineHeight: 22,
    paddingHorizontal: Spacing.base,
    paddingBottom: 14,
  },

  // CTA Section
  ctaSection: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xl,
  },
  ctaButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: Colors.nileBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xl,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text.inverse,
    flex: 1,
    textAlign: 'center',
  },
});

export default CoinSystemPage;

import React, { useRef, useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { EarningsCardProps } from '@/types/earnPage.types';
import { EARN_COLORS } from '@/constants/EarnPageColors';
import EarningsChart from './EarningsChart';

const earningSources = [
  {
    label: 'Projects',
    icon: 'briefcase-outline',
    gradient: ['#00C06A', '#00A85C', '#00796B'],
  },
  { 
    label: 'Referrals', 
    icon: 'people-outline',
    gradient: ['#10B981', '#059669', '#047857'],
  },
  { 
    label: 'Share & earn', 
    icon: 'share-social-outline',
    gradient: ['#F59E0B', '#D97706', '#B45309'],
  },
  { 
    label: 'Spin', 
    icon: 'trophy-outline',
    gradient: ['#EC4899', '#DB2777', '#BE185D'],
  },
];

export default function EarningsCard({ 
  earnings, 
  onSeeWallet 
}: EarningsCardProps) {
  const [showChart, setShowChart] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const toggleChart = () => {
    const toValue = showChart ? 0 : 1;
    setShowChart(!showChart);
    Animated.spring(chartAnim, {
      toValue,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const breakdownItems = [
    { label: 'Projects', value: earnings.breakdown.projects, ...earningSources[0] },
    { label: 'Referrals', value: earnings.breakdown.referrals, ...earningSources[1] },
    { label: 'Share & earn', value: earnings.breakdown.shareAndEarn, ...earningSources[2] },
    { label: 'Spin', value: earnings.breakdown.spin, ...earningSources[3] },
  ];

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      {/* Decorative background elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />

      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={styles.titleContainer}>
            <ThemedText style={styles.title}>Your earnings</ThemedText>
            <View style={styles.titleUnderline} />
          </View>
          <View style={styles.earningAmount}>
            <ThemedText style={styles.amount}>
              {earnings.currency}{earnings.totalEarned}
            </ThemedText>
            <ThemedText style={styles.earned}>Earned</ThemedText>
          </View>
        </View>

        {/* Wallet Button */}
        <Pressable
          style={styles.seeWalletButton}
          onPress={onSeeWallet}
         
          accessibilityLabel={`Total earnings: ${earnings.currency}${earnings.totalEarned}. Tap to see wallet`}
          accessibilityRole="button"
          accessibilityHint="Double tap to view your wallet details and transaction history"
        >
          <LinearGradient
            colors={['#00C06A', '#00A85C', '#00796B']}
            style={styles.walletButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ThemedText style={styles.seeWalletText}>See wallet</ThemedText>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Chart Toggle Button */}
      <Pressable
        style={styles.chartToggle}
        onPress={toggleChart}
       
        accessibilityLabel={showChart ? 'Hide earnings chart' : 'View earnings chart'}
        accessibilityRole="button"
        accessibilityHint={`Double tap to ${showChart ? 'hide' : 'show'} earnings visualization chart`}
        accessibilityState={{ selected: showChart }}
      >
        <LinearGradient
          colors={showChart
            ? ['rgba(255, 200, 87, 0.2)', 'rgba(0, 192, 106, 0.15)']
            : ['rgba(0, 192, 106, 0.1)', 'rgba(255, 200, 87, 0.1)']
          }
          style={styles.chartToggleGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons
            name={showChart ? 'stats-chart' : 'bar-chart-outline'}
            size={18}
            color={showChart ? '#D97706' : EARN_COLORS.primary}
          />
          <ThemedText style={[styles.chartToggleText, showChart && { color: '#D97706' }]}>
            {showChart ? 'Hide Chart' : 'View Chart'}
          </ThemedText>
        </LinearGradient>
      </Pressable>

      {/* Chart */}
      {showChart && (
        <Animated.View
          style={[
            styles.chartContainer,
            {
              opacity: chartAnim,
              transform: [
                {
                  translateY: chartAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
                {
                  scale: chartAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <EarningsChart breakdown={earnings.breakdown} currency={earnings.currency} />
        </Animated.View>
      )}

      {/* Separator */}
      {showChart && <View style={styles.separator} />}

      {/* Breakdown */}
      <View style={styles.breakdown}>
        {breakdownItems.map((item, idx) => (
          <Animated.View 
            key={idx}
            style={[
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [15, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.breakdownItem}>
              {/* Icon Container */}
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={item.gradient as any}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={item.icon as any} size={20} color="#FFFFFF" />
                </LinearGradient>
              </View>

              {/* Amount */}
              <ThemedText style={styles.breakdownAmount}>
                {earnings.currency}{item.value}
              </ThemedText>

              {/* Label */}
              <ThemedText style={styles.breakdownLabel} numberOfLines={2}>
                {item.label}
              </ThemedText>
            </View>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 200, 87, 0.2)',
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#FFC857',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 6px 16px rgba(255, 200, 87, 0.2)',
      },
    }),
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 200, 87, 0.12)',
    top: -50,
    right: -50,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 192, 106, 0.08)',
    bottom: -30,
    left: -30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    zIndex: 5,
  },
  headerLeft: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  titleUnderline: {
    width: 50,
    height: 4,
    backgroundColor: '#FFC857',
    borderRadius: 2,
  },
  earningAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  amount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#00796B',
    letterSpacing: -0.5,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(255, 200, 87, 0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
      android: {
        textShadowColor: 'rgba(255, 200, 87, 0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
      web: {
        textShadow: '0px 1px 3px rgba(255, 200, 87, 0.4)',
      },
    }),
  },
  earned: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  seeWalletButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#00C06A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 4px 8px rgba(0, 192, 106, 0.3)',
      },
    }),
  },
  walletButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
  },
  seeWalletText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginVertical: 20,
    marginHorizontal: -24,
    zIndex: 5,
  },
  chartToggle: {
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 200, 87, 0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#FFC857',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 6px rgba(255, 200, 87, 0.15)',
      },
    }),
  },
  chartToggleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  chartToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: EARN_COLORS.primary,
    letterSpacing: 0.2,
  },
  chartContainer: {
    marginBottom: 16,
  },
  breakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    gap: 8,
    zIndex: 5,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 8,
  },
  iconContainer: {
    marginBottom: 4,
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  breakdownAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 14,
  },
});

// Feature Highlights Component
// Displays prominent feature cards - Nuqta brand style

import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';

interface FeatureHighlight {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  route: string;
  cta: string;
  badge?: string;
  badgeColor?: string;
  iconBg: string;
  ctaBg: string;
  ctaTextColor: string;
}

const featureHighlights: FeatureHighlight[] = [
  {
    title: 'Go Premium',
    description: '2x Cashback + Free Delivery on every order',
    icon: 'star',
    gradient: ['#1a3a52', '#0f2a3d'],
    route: '/subscription/plans',
    cta: 'Upgrade',
    badge: 'POPULAR',
    badgeColor: '#F59E0B',
    iconBg: 'rgba(255, 205, 87, 0.15)',
    ctaBg: '#ffcd57',
    ctaTextColor: '#1a3a52',
  },
  {
    title: 'Upload Bills',
    description: 'Earn 5% cashback on your offline shopping',
    icon: 'receipt-outline',
    gradient: ['#F8FAFC', '#EFF6FF'],
    route: '/bill-upload',
    cta: 'Upload',
    badge: 'NEW',
    badgeColor: '#22C55E',
    iconBg: 'rgba(26, 58, 82, 0.08)',
    ctaBg: '#1a3a52',
    ctaTextColor: '#FFFFFF',
  },
  {
    title: 'Refer & Earn',
    description: 'Get 100 coins for every friend who joins',
    icon: 'gift-outline',
    gradient: ['#FEF3C7', '#FDE68A'],
    route: '/referral',
    cta: 'Share',
    badge: 'HOT',
    badgeColor: '#EF4444',
    iconBg: 'rgba(26, 58, 82, 0.08)',
    ctaBg: '#1a3a52',
    ctaTextColor: '#FFFFFF',
  },
];

function FeatureHighlights() {
  const router = useRouter();

  const handleFeaturePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="gift" size={14} color="#FFFFFF" />
          </View>
          <ThemedText style={styles.sectionTitle}>Featured</ThemedText>
        </View>
        <ThemedText style={styles.sectionSubtitle}>
          Exclusive rewards & benefits
        </ThemedText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {featureHighlights.map((feature, index) => {
          const isDark = feature.gradient[0] === '#1a3a52';
          const textColor = isDark ? '#FFFFFF' : '#1a3a52';
          const subtextColor = isDark ? 'rgba(255,255,255,0.75)' : '#64748B';

          return (
            <Pressable
              key={index}
              style={styles.card}
              onPress={() => handleFeaturePress(feature.route)}
             
            >
              <LinearGradient
                colors={feature.gradient as any}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Top Row: Icon + Badge */}
                <View style={styles.cardTop}>
                  <View style={[styles.iconContainer, { backgroundColor: feature.iconBg }]}>
                    <Ionicons
                      name={feature.icon as any}
                      size={22}
                      color={isDark ? '#ffcd57' : '#1a3a52'}
                    />
                  </View>
                  {feature.badge && (
                    <View style={[styles.badge, { backgroundColor: feature.badgeColor }]}>
                      <ThemedText style={styles.badgeText}>{feature.badge}</ThemedText>
                    </View>
                  )}
                </View>

                {/* Content */}
                <View style={styles.textContainer}>
                  <ThemedText style={[styles.title, { color: textColor }]}>
                    {feature.title}
                  </ThemedText>
                  <ThemedText style={[styles.description, { color: subtextColor }]}>
                    {feature.description}
                  </ThemedText>
                </View>

                {/* CTA */}
                <View style={[styles.ctaContainer, { backgroundColor: feature.ctaBg }]}>
                  <ThemedText style={[styles.ctaText, { color: feature.ctaTextColor }]}>
                    {feature.cta}
                  </ThemedText>
                  <Ionicons name="arrow-forward" size={14} color={feature.ctaTextColor} />
                </View>
              </LinearGradient>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  headerIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#1a3a52',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a3a52',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '400',
    marginTop: 1,
    paddingLeft: 36,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 240,
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1a3a52',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 16px rgba(26, 58, 82, 0.08)',
      },
    }),
  },
  cardGradient: {
    padding: 18,
    minHeight: 185,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  textContainer: {
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  ctaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default React.memo(FeatureHighlights);

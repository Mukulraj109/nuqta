// CoinPage.tsx
import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text, Dimensions, Platform } from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import CardImg1 from '@/assets/images/card1.png';
import CardImg2 from '@/assets/images/card2.png';
import CardImg3 from '@/assets/images/card3.png';
import CardImg4 from '@/assets/images/card4.png';

import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { BRAND } from '@/constants/brand';
const { width } = Dimensions.get('window');

const coinCardImages = [
  CardImg1,
  CardImg2,
  CardImg3,
  CardImg4,
];

export default function CoinPage() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.nileBlue, '#2A5577']}
        style={styles.headerBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
           
          >
            <Ionicons name="arrow-back" size={20} color={Colors.nileBlue} />
          </Pressable>
          <Text style={styles.headerTitle}>{BRAND.COIN_NAME}</Text>
        </View>
      </LinearGradient>

      {/* Cards */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {coinCardImages.map((img, i) => (
          <View key={i} style={styles.cardWrap}>
            <Pressable style={styles.cardBtn}>
              <CachedImage
                source={img}
                style={styles.cardImg}
                contentFit="cover"
                transition={200}
                accessibilityLabel={`coin card ${i + 1}`}
              />
            </Pressable>
          </View>
        ))}

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <Pressable
              style={styles.quickActionItem}
              onPress={() => router.push('/wallet/transfer')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="swap-horizontal" size={24} color="#0284C7" />
              </View>
              <Text style={styles.quickActionLabel}>Transfer</Text>
            </Pressable>

            <Pressable
              style={styles.quickActionItem}
              onPress={() => router.push('/wallet/gift')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FCE7F3' }]}>
                <Ionicons name="gift" size={24} color="#DB2777" />
              </View>
              <Text style={styles.quickActionLabel}>Gift Coins</Text>
            </Pressable>

            <Pressable
              style={styles.quickActionItem}
              onPress={() => router.push('/wallet/expiry-tracker')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.warningScale[50] }]}>
                <Ionicons name="time" size={24} color={Colors.warning} />
              </View>
              <Text style={styles.quickActionLabel}>Expiry</Text>
            </Pressable>

            <Pressable
              style={styles.quickActionItem}
              onPress={() => router.push('/wallet/gift-cards')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#faf1e0' }]}>
                <Ionicons name="card" size={24} color={Colors.nileBlue} />
              </View>
              <Text style={styles.quickActionLabel}>Gift Cards</Text>
            </Pressable>

            <Pressable
              style={styles.quickActionItem}
              onPress={() => router.push('/wallet/scheduled-drops')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="calendar" size={24} color={Colors.brand.purple} />
              </View>
              <Text style={styles.quickActionLabel}>Drops</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: '#f7f4fd' 
  },
  headerBg: {
    paddingTop: 55,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.base,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.background.primary,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  scroll: { 
    flex: 1, 
    paddingTop: Spacing.lg 
  },
  cardWrap: {
    marginHorizontal: 18,
    marginBottom: 18,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.background.primary,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardBtn: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  cardImg: {
    width: width - 36,
    height: 210, // increased height so "Get started" isn't cut off
    borderRadius: BorderRadius.xl,
  },
  quickActionsContainer: {
    marginHorizontal: 18,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 5,
  },
  quickActionsTitle: {
    fontSize: Typography.h4.fontSize,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: Spacing.base,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '18%',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
});

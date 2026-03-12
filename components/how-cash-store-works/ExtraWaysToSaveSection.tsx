/**
 * ExtraWaysToSaveSection Component
 *
 * Shows additional ways to maximize savings through Cash Store
 */

import React, { memo } from 'react';
import { BRAND } from '@/constants/brand';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const EXTRA_WAYS = [
  {
    id: 1,
    icon: 'gift',
    title: 'Buy Gift Cards',
    description: 'Get additional cashback when you purchase gift cards for popular brands',
    cashback: 'Up to 5% extra',
    color: '#EC4899',
    gradient: ['#EC4899', '#BE185D'],
  },
  {
    id: 2,
    icon: 'pricetag',
    title: 'Use Coupon Codes',
    description: 'Stack cashback with exclusive coupon codes for maximum savings',
    cashback: 'Extra discounts',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#6D28D9'],
  },
  {
    id: 3,
    icon: 'flash',
    title: 'Flash Deals',
    description: 'Grab time-limited offers with boosted cashback rates',
    cashback: 'Up to 50% cashback',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'],
  },
  {
    id: 4,
    icon: 'sparkles',
    title: `Earn ${BRAND.COIN_NAME}`,
    description: `Earn bonus ${BRAND.COIN_NAME} on select purchases for extra rewards`,
    cashback: 'Bonus coins',
    color: '#ffcd57',
    gradient: ['#ffcd57', '#1a3a52'],
  },
];

const ExtraWayCard: React.FC<{
  way: typeof EXTRA_WAYS[0];
}> = ({ way }) => (
  <View style={styles.cardWrapper}>
    <LinearGradient
      colors={way.gradient as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.cardIconContainer}>
        <Ionicons name={way.icon as any} size={28} color="#FFFFFF" />
      </View>
      <Text style={styles.cardTitle}>{way.title}</Text>
      <Text style={styles.cardDescription}>{way.description}</Text>
      <View style={styles.cashbackBadge}>
        <Text style={styles.cashbackText}>{way.cashback}</Text>
      </View>
    </LinearGradient>
  </View>
);

const ExtraWaysToSaveSection: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="bulb" size={24} color="#F59E0B" />
        </View>
        <Text style={styles.headerTitle}>Extra Ways to Save</Text>
        <Text style={styles.headerSubtitle}>
          Maximize your savings with these additional features
        </Text>
      </View>

      {/* Cards Grid */}
      <View style={styles.cardsGrid}>
        {EXTRA_WAYS.map((way) => (
          <ExtraWayCard key={way.id} way={way} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#F9FAFB',
  },
  header: {
    marginBottom: 20,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardWrapper: {
    width: '48%',
    minWidth: 150,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    minHeight: 180,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
    marginBottom: 12,
  },
  cashbackBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cashbackText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default memo(ExtraWaysToSaveSection);

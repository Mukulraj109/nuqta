/**
 * MallCategoryCard Component
 *
 * Glassmorphism card for displaying mall category
 * Features gradient backgrounds, decorative elements, and modern styling
 * Each category gets a unique, vibrant gradient for visual variety
 */

import React, { memo } from 'react';
import { BRAND } from '@/constants/brand';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ImageSourcePropType,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MallCategory } from '../../../types/mall.types';

// Category images from assets
const CATEGORY_IMAGES: Record<string, ImageSourcePropType> = {
  fashion: require('@/assets/category-icons/Shopping/Fashion.png'),
  'food & dining': require('@/assets/category-icons/FOOD-DINING/Family-restaurants.png'),
  food: require('@/assets/category-icons/FOOD-DINING/Cafes.png'),
  entertainment: require('@/assets/category-icons/ENTERTAINMENT/Gaming-cafes.png'),
  healthcare: require('@/assets/category-icons/HEALTHCARE/Clinics.png'),
  health: require('@/assets/category-icons/HEALTHCARE/Clinics.png'),
  travel: require('@/assets/category-icons/TRAVEL-EXPERIENCES/Hotels.png'),
  'travel & experiences': require('@/assets/category-icons/TRAVEL-EXPERIENCES/Tours.png'),
  education: require('@/assets/category-icons/EDUCATION-LEARNING/Coaching-center.png'),
  'education & learning': require('@/assets/category-icons/EDUCATION-LEARNING/Coaching-center.png'),
  electronics: require('@/assets/category-icons/Shopping/Mobile-accessories.png'),
  beauty: require('@/assets/category-icons/BEAUTY-WELLNESS/Beauty-services.png'),
  groceries: require('@/assets/category-icons/GROCERY-ESSENTIALS/Supermarkets.png'),
  sports: require('@/assets/category-icons/FITNESS-SPORTS/Gyms.png'),
  home: require('@/assets/category-icons/HOME-SERVICES/Cleaning.png'),
  lifestyle: require('@/assets/category-icons/FINANCIAL-LIFESTYLE/Gold-savings.png'),
};

interface MallCategoryCardProps {
  category: MallCategory;
  onPress: (category: MallCategory) => void;
  width?: number;
  index?: number;
}

// Blue-family gradients using Nuqta palette - cohesive but visually distinct
const CATEGORY_THEMES: Record<string, {
  gradient: [string, string];
  icon: keyof typeof Ionicons.glyphMap;
}> = {
  fashion: {
    gradient: ['#1a3a52', '#234b68'],
    icon: 'shirt-outline',
  },
  'food & dining': {
    gradient: ['#0284C7', '#0369A1'],
    icon: 'restaurant-outline',
  },
  food: {
    gradient: ['#0284C7', '#0369A1'],
    icon: 'restaurant-outline',
  },
  entertainment: {
    gradient: ['#234b68', '#0284C7'],
    icon: 'game-controller-outline',
  },
  healthcare: {
    gradient: ['#0369A1', '#1a3a52'],
    icon: 'medical-outline',
  },
  health: {
    gradient: ['#0369A1', '#1a3a52'],
    icon: 'medical-outline',
  },
  travel: {
    gradient: ['#0891B2', '#0369A1'],
    icon: 'airplane-outline',
  },
  'travel & experiences': {
    gradient: ['#0891B2', '#0369A1'],
    icon: 'airplane-outline',
  },
  education: {
    gradient: ['#1a3a52', '#0284C7'],
    icon: 'school-outline',
  },
  'education & learning': {
    gradient: ['#1a3a52', '#0284C7'],
    icon: 'school-outline',
  },
  electronics: {
    gradient: ['#334155', '#1a3a52'],
    icon: 'laptop-outline',
  },
  beauty: {
    gradient: ['#0284C7', '#234b68'],
    icon: 'sparkles-outline',
  },
  groceries: {
    gradient: ['#0E7490', '#1a3a52'],
    icon: 'cart-outline',
  },
  sports: {
    gradient: ['#2563EB', '#1a3a52'],
    icon: 'fitness-outline',
  },
  home: {
    gradient: ['#0369A1', '#0E7490'],
    icon: 'home-outline',
  },
  lifestyle: {
    gradient: ['#234b68', '#0369A1'],
    icon: 'heart-outline',
  },
  'beauty & wellness': {
    gradient: ['#0284C7', '#234b68'],
    icon: 'sparkles-outline',
  },
  'fitness & sports': {
    gradient: ['#2563EB', '#1a3a52'],
    icon: 'fitness-outline',
  },
  'home services': {
    gradient: ['#0369A1', '#0E7490'],
    icon: 'home-outline',
  },
};

// Fallback gradients - all blue-family
const FALLBACK_GRADIENTS: [string, string][] = [
  ['#1a3a52', '#234b68'],
  ['#0284C7', '#0369A1'],
  ['#234b68', '#0284C7'],
  ['#0369A1', '#1a3a52'],
  ['#0891B2', '#0369A1'],
  ['#1a3a52', '#0284C7'],
];

const MallCategoryCard: React.FC<MallCategoryCardProps> = ({
  category,
  onPress,
  width,
  index = 0,
}) => {
  const categoryKey = category.name.toLowerCase();
  const theme = CATEGORY_THEMES[categoryKey];

  const gradient = theme?.gradient || FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
  const iconName = theme?.icon || 'grid-outline';

  const rewardText = category.maxCashback > 0
    ? `Up to ${category.maxCashback}% coins`
    : `Earn ${BRAND.COIN_NAME}`;

  return (
    <Pressable
      style={[styles.container, width ? { width } : {}]}
      onPress={() => onPress(category)}
     
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        {/* Glassmorphism overlay */}
        <View style={styles.glassOverlay}>
          {/* Decorative circles */}
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          {/* Content */}
          <View style={styles.content}>
            {/* Icon Container */}
            <View style={styles.iconContainer}>
              {CATEGORY_IMAGES[categoryKey] ? (
                <CachedImage
                  source={CATEGORY_IMAGES[categoryKey]}
                  style={styles.categoryImage}
                  contentFit="contain"
                />
              ) : (
                <Ionicons
                  name={iconName}
                  size={22}
                  color="#FFFFFF"
                />
              )}
            </View>

            {/* Category Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.categoryName} numberOfLines={2}>
                {category.name}
              </Text>

              {/* Coins Info pill */}
              <View style={styles.coinsPill}>
                <Ionicons name="flash" size={10} color="#FFFFFF" />
                <Text style={styles.coinsText}>{rewardText}</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 5,
  },
  gradientCard: {
    borderRadius: 18,
    overflow: 'hidden',
    minHeight: 115,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  glassOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  decorCircle1: {
    position: 'absolute',
    top: -25,
    right: -25,
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -15,
    left: -15,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  content: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  categoryImage: {
    width: 28,
    height: 28,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.2,
    lineHeight: 20,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
      android: {
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
      },
      web: {
        textShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  coinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  coinsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

export default memo(MallCategoryCard);

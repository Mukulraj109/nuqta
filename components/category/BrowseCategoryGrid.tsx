/**
 * BrowseCategoryGrid Component
 * 4-column grid layout for category icons with names and cashback badges
 * Based on reference design from Rez_v-2-main
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ImageSourcePropType } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CategoryGridItem, BrowseCategoryGridProps } from '@/types/categoryTypes';

// Map category IDs to local asset images
const CATEGORY_IMAGES: Record<string, ImageSourcePropType> = {
  // Food & Dining
  'cafes': require('@/assets/category-icons/FOOD-DINING/Cafes.png'),
  'cafe': require('@/assets/category-icons/FOOD-DINING/Cafes.png'),
  'qsr-fast-food': require('@/assets/category-icons/FOOD-DINING/QSR-Fast-food.png'),
  'fast-food': require('@/assets/category-icons/FOOD-DINING/QSR-Fast-food.png'),
  'family-restaurants': require('@/assets/category-icons/FOOD-DINING/Family-restaurants.png'),
  'family-restaurant': require('@/assets/category-icons/FOOD-DINING/Family-restaurants.png'),
  'fine-dining': require('@/assets/category-icons/FOOD-DINING/Fine-dining.png'),
  'ice-cream-dessert': require('@/assets/category-icons/FOOD-DINING/Ice-cream-dessert.png'),
  'ice-cream': require('@/assets/category-icons/FOOD-DINING/Ice-cream-dessert.png'),
  'bakery-confectionery': require('@/assets/category-icons/FOOD-DINING/Bakery-confectionery.png'),
  'bakery': require('@/assets/category-icons/FOOD-DINING/Bakery-confectionery.png'),
  'cloud-kitchens': require('@/assets/category-icons/FOOD-DINING/Cloud-kitchens.png'),
  'cloud-kitchen': require('@/assets/category-icons/FOOD-DINING/Cloud-kitchens.png'),
  'street-food': require('@/assets/category-icons/FOOD-DINING/Street-food.png'),
  // Grocery & Essentials
  'dairy': require('@/assets/category-icons/GROCERY-ESSENTIALS/Dairy.png'),
  'dairy-eggs': require('@/assets/category-icons/GROCERY-ESSENTIALS/Dairy.png'),
  'fresh-vegetables': require('@/assets/category-icons/GROCERY-ESSENTIALS/Fresh-vegetables.png'),
  'fruits-veggies': require('@/assets/category-icons/GROCERY-ESSENTIALS/Fresh-vegetables.png'),
  'fruits': require('@/assets/category-icons/GROCERY-ESSENTIALS/Fresh-vegetables.png'),
  'veggies': require('@/assets/category-icons/GROCERY-ESSENTIALS/Fresh-vegetables.png'),
  'kirana-stores': require('@/assets/category-icons/GROCERY-ESSENTIALS/Kirana-Stores.png'),
  'kirana': require('@/assets/category-icons/GROCERY-ESSENTIALS/Kirana-Stores.png'),
  'supermarkets': require('@/assets/category-icons/GROCERY-ESSENTIALS/Supermarkets.png'),
  'supermarket': require('@/assets/category-icons/GROCERY-ESSENTIALS/Supermarkets.png'),
  'meat-fish': require('@/assets/category-icons/GROCERY-ESSENTIALS/Meat-fish.png'),
  'packaged-goods': require('@/assets/category-icons/GROCERY-ESSENTIALS/Packaged-goods.png'),
  'water-cans': require('@/assets/category-icons/GROCERY-ESSENTIALS/water-cans.png'),
  // Beauty & Wellness
  'salons': require('@/assets/category-icons/BEAUTY-WELLNESS/Salons.png'),
  'salon': require('@/assets/category-icons/BEAUTY-WELLNESS/Salons.png'),
  'spa-massage': require('@/assets/category-icons/BEAUTY-WELLNESS/Spa-massage.png'),
  'spa': require('@/assets/category-icons/BEAUTY-WELLNESS/Spa-massage.png'),
  'beauty-services': require('@/assets/category-icons/BEAUTY-WELLNESS/Beauty-services.png'),
  'cosmetology': require('@/assets/category-icons/BEAUTY-WELLNESS/Cosmetics.png'),
  'skincare-cosmetics': require('@/assets/category-icons/BEAUTY-WELLNESS/Skincare-cosmetics.png'),
  'dermatology': require('@/assets/category-icons/BEAUTY-WELLNESS/Dermatology.png'),
  'nail-studios': require('@/assets/category-icons/BEAUTY-WELLNESS/nail.png'),
  'nails': require('@/assets/category-icons/BEAUTY-WELLNESS/nail.png'),
  'grooming-men': require('@/assets/category-icons/BEAUTY-WELLNESS/Men-grooming.png'),
  'men-grooming': require('@/assets/category-icons/BEAUTY-WELLNESS/Men-grooming.png'),
  // Fitness & Sports
  'gyms': require('@/assets/category-icons/FITNESS-SPORTS/Gyms.png'),
  'crossfit': require('@/assets/category-icons/FITNESS-SPORTS/CrossFit.png'),
  'yoga': require('@/assets/category-icons/FITNESS-SPORTS/Yoga.png'),
  'zumba': require('@/assets/category-icons/FITNESS-SPORTS/Zumba.png'),
  'martial-arts': require('@/assets/category-icons/FITNESS-SPORTS/Martial-arts.png'),
  'sports-academies': require('@/assets/category-icons/FITNESS-SPORTS/Sports-academies.png'),
  'sportswear': require('@/assets/category-icons/FITNESS-SPORTS/Sportswear.png'),
  // Healthcare
  'clinics': require('@/assets/category-icons/HEALTHCARE/Clinics.png'),
  'dental': require('@/assets/category-icons/HEALTHCARE/Dental.png'),
  'diagnostics': require('@/assets/category-icons/HEALTHCARE/Diagnostics.png'),
  'home-nursing': require('@/assets/category-icons/HEALTHCARE/Home-nursing.png'),
  'pharmacy': require('@/assets/category-icons/HEALTHCARE/Pharmacy.png'),
  'physiotherapy': require('@/assets/category-icons/HEALTHCARE/Physiotherapy.png'),
  'vision-eyewear': require('@/assets/category-icons/HEALTHCARE/Vision-eyewear.png'),
  // Fashion (icons in Shopping/ directory)
  'footwear': require('@/assets/category-icons/Shopping/footwear.png'),
  'bags-accessories': require('@/assets/category-icons/Shopping/Bags.png'),
  'jewelry': require('@/assets/category-icons/Shopping/Jewelry.png'),
  'local-brands': require('@/assets/category-icons/Shopping/Local-brands.png'),
  'watches': require('@/assets/category-icons/Shopping/Watches.png'),
  'mobile-accessories': require('@/assets/category-icons/Shopping/Mobile-accessories.png'),
  'fashion-general': require('@/assets/category-icons/Shopping/Fashion.png'),
  'electronics-general': require('@/assets/category-icons/Shopping/Electronics.png'),
  // Education & Learning
  'coaching-centers': require('@/assets/category-icons/EDUCATION-LEARNING/Coaching-center.png'),
  'language-training': require('@/assets/category-icons/EDUCATION-LEARNING/Language-training.png'),
  'music-dance-classes': require('@/assets/category-icons/EDUCATION-LEARNING/Music-dance-classes.png'),
  'skill-development': require('@/assets/category-icons/EDUCATION-LEARNING/Skill-development.png'),
  'vocational': require('@/assets/category-icons/EDUCATION-LEARNING/Vocational.png'),
  // Home Services
  'ac-repair': require('@/assets/category-icons/HOME-SERVICES/AC-repair.png'),
  'cleaning': require('@/assets/category-icons/HOME-SERVICES/Cleaning.png'),
  'electrical': require('@/assets/category-icons/HOME-SERVICES/Electrical.png'),
  'home-tutors': require('@/assets/category-icons/HOME-SERVICES/Home-tutors.png'),
  'house-shifting': require('@/assets/category-icons/HOME-SERVICES/House-shifting.png'),
  'laundry-dry-cleaning': require('@/assets/category-icons/HOME-SERVICES/Laundry-dry-cleaning.png'),
  'pest-control': require('@/assets/category-icons/HOME-SERVICES/Pest-control.png'),
  'plumbing': require('@/assets/category-icons/HOME-SERVICES/Plumbing.png'),
  // Travel & Experiences
  'activities': require('@/assets/category-icons/TRAVEL-EXPERIENCES/Activities.png'),
  'airport-services': require('@/assets/category-icons/TRAVEL-EXPERIENCES/Airport-services.png'),
  'bike-rentals': require('@/assets/category-icons/TRAVEL-EXPERIENCES/Bike-rentals.png'),
  'hotels': require('@/assets/category-icons/TRAVEL-EXPERIENCES/Hotels.png'),
  'intercity-travel': require('@/assets/category-icons/TRAVEL-EXPERIENCES/Intercity-travel.png'),
  'taxis': require('@/assets/category-icons/TRAVEL-EXPERIENCES/taxis.png'),
  'tours': require('@/assets/category-icons/TRAVEL-EXPERIENCES/Tours.png'),
  'weekend-getaways': require('@/assets/category-icons/TRAVEL-EXPERIENCES/Weekend-getaways.png'),
  // Entertainment
  'amusement-parks': require('@/assets/category-icons/ENTERTAINMENT/Amusement-parks.png'),
  'festivals': require('@/assets/category-icons/ENTERTAINMENT/Festivals.png'),
  'gaming-cafes': require('@/assets/category-icons/ENTERTAINMENT/Gaming-cafes.png'),
  'live-events': require('@/assets/category-icons/ENTERTAINMENT/Live-events.png'),
  'movies': require('@/assets/category-icons/ENTERTAINMENT/Movies.png'),
  'vr-ar-experiences': require('@/assets/category-icons/ENTERTAINMENT/Virtual-reality.png'),
  'workshops': require('@/assets/category-icons/ENTERTAINMENT/Workshops.png'),
  // Financial & Lifestyle
  'bill-payments': require('@/assets/category-icons/FINANCIAL-LIFESTYLE/Bill-payments.png'),
  'broadband': require('@/assets/category-icons/FINANCIAL-LIFESTYLE/Broadband.png'),
  'cable-ott': require('@/assets/category-icons/FINANCIAL-LIFESTYLE/OTT.png'),
  'donations': require('@/assets/category-icons/FINANCIAL-LIFESTYLE/Donations.png'),
  'gold-savings': require('@/assets/category-icons/FINANCIAL-LIFESTYLE/Gold-savings.png'),
  'insurance': require('@/assets/category-icons/FINANCIAL-LIFESTYLE/Insurance.png'),
  'mobile-recharge': require('@/assets/category-icons/FINANCIAL-LIFESTYLE/Mobile-recharge.png'),
  // Electronics
  'accessories': require('@/assets/category-icons/ELECTRONICS/Accessories.png'),
  'audio-headphones': require('@/assets/category-icons/ELECTRONICS/Audio-headphones.png'),
  'cameras': require('@/assets/category-icons/ELECTRONICS/Cameras.png'),
  'gaming': require('@/assets/category-icons/ELECTRONICS/Gaming.png'),
  'laptops': require('@/assets/category-icons/ELECTRONICS/Laptops.png'),
  'mobile-phones': require('@/assets/category-icons/ELECTRONICS/Mobile-phones.png'),
  'smartwatches': require('@/assets/category-icons/ELECTRONICS/Smartwatches.png'),
  'televisions': require('@/assets/category-icons/ELECTRONICS/Televisions.png'),
};

// Fallback Ionicons for categories without PNG assets
const CATEGORY_ICON_FALLBACK: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  'meat-fish': { name: 'fish-outline', color: '#EF4444' },
  'packaged-goods': { name: 'cube-outline', color: '#F59E0B' },
  'organic': { name: 'leaf-outline', color: '#22C55E' },
  'beverages': { name: 'beer-outline', color: '#8B5CF6' },
  'snacks': { name: 'fast-food-outline', color: '#F97316' },
  'frozen': { name: 'snow-outline', color: '#3B82F6' },
  'baby-care': { name: 'happy-outline', color: '#EC4899' },
  'pet-supplies': { name: 'paw-outline', color: '#A855F7' },
  'cleaning': { name: 'sparkles-outline', color: '#14B8A6' },
  // Beauty & Wellness fallbacks
  'skincare': { name: 'sparkles-outline', color: '#F59E0B' },
  'skincare-cosmetics': { name: 'flask-outline', color: '#EC4899' },
  'makeup': { name: 'color-palette-outline', color: '#EF4444' },
  'haircare': { name: 'cut-outline', color: '#3B82F6' },
  'hair-care': { name: 'cut-outline', color: '#3B82F6' },
  'bridal': { name: 'heart-outline', color: '#F43F5E' },
  'bridal-services': { name: 'heart-outline', color: '#F43F5E' },
  'wellness': { name: 'leaf-outline', color: '#10B981' },
  'ayurveda': { name: 'leaf-outline', color: '#22C55E' },
  'perfumes': { name: 'flower-outline', color: '#A855F7' },
  // Fitness & Sports fallbacks
  'gyms': { name: 'barbell-outline', color: '#F97316' },
  'crossfit': { name: 'flame-outline', color: '#EF4444' },
  'yoga': { name: 'body-outline', color: '#8B5CF6' },
  'zumba': { name: 'musical-notes-outline', color: '#EC4899' },
  'martial-arts': { name: 'hand-right-outline', color: '#64748B' },
  'sports-academies': { name: 'trophy-outline', color: '#22C55E' },
  'sportswear': { name: 'shirt-outline', color: '#3B82F6' },
  // Healthcare fallbacks
  'pharmacy': { name: 'medkit-outline', color: '#0EA5E9' },
  'clinics': { name: 'fitness-outline', color: '#0284C7' },
  'diagnostics': { name: 'pulse-outline', color: '#0EA5E9' },
  'dental': { name: 'happy-outline', color: '#38BDF8' },
  'physiotherapy': { name: 'body-outline', color: '#0284C7' },
  'home-nursing': { name: 'home-outline', color: '#0EA5E9' },
  'vision-eyewear': { name: 'eye-outline', color: '#38BDF8' },
  // Fashion fallbacks
  'footwear': { name: 'footsteps-outline', color: '#A855F7' },
  'bags-accessories': { name: 'bag-outline', color: '#C084FC' },
  'mobile-accessories': { name: 'headset-outline', color: '#7C3AED' },
  'watches': { name: 'watch-outline', color: '#A855F7' },
  'jewelry': { name: 'diamond-outline', color: '#C084FC' },
  'local-brands': { name: 'storefront-outline', color: '#7C3AED' },
  // Education fallbacks
  'coaching-centers': { name: 'book-outline', color: '#6366F1' },
  'skill-development': { name: 'bulb-outline', color: '#818CF8' },
  'music-dance-classes': { name: 'musical-notes-outline', color: '#6366F1' },
  'art-craft': { name: 'color-palette-outline', color: '#818CF8' },
  'vocational': { name: 'construct-outline', color: '#4F46E5' },
  'language-training': { name: 'language-outline', color: '#6366F1' },
  // Home Services fallbacks
  'ac-repair': { name: 'snow-outline', color: '#F59E0B' },
  'plumbing': { name: 'water-outline', color: '#D97706' },
  'electrical': { name: 'flash-outline', color: '#F59E0B' },
  'house-shifting': { name: 'cube-outline', color: '#FBBF24' },
  'laundry-dry-cleaning': { name: 'shirt-outline', color: '#D97706' },
  'home-tutors': { name: 'school-outline', color: '#F59E0B' },
  'pest-control': { name: 'bug-outline', color: '#D97706' },
  // Travel fallbacks
  'hotels': { name: 'bed-outline', color: '#06B6D4' },
  'intercity-travel': { name: 'bus-outline', color: '#0891B2' },
  'taxis': { name: 'car-outline', color: '#06B6D4' },
  'bike-rentals': { name: 'bicycle-outline', color: '#22D3EE' },
  'weekend-getaways': { name: 'sunny-outline', color: '#06B6D4' },
  'tours': { name: 'map-outline', color: '#0891B2' },
  'activities': { name: 'rocket-outline', color: '#06B6D4' },
  'airport-services': { name: 'airplane-outline', color: '#0891B2' },
  // Entertainment fallbacks
  'movies': { name: 'film-outline', color: '#8B5CF6' },
  'live-events': { name: 'mic-outline', color: '#7C3AED' },
  'festivals': { name: 'balloon-outline', color: '#8B5CF6' },
  'amusement-parks': { name: 'happy-outline', color: '#A78BFA' },
  'gaming-cafes': { name: 'game-controller-outline', color: '#7C3AED' },
  'vr-ar-experiences': { name: 'glasses-outline', color: '#8B5CF6' },
  'workshops': { name: 'build-outline', color: '#7C3AED' },
  // Financial fallbacks
  'bill-payments': { name: 'receipt-outline', color: '#14B8A6' },
  'mobile-recharge': { name: 'phone-portrait-outline', color: '#0D9488' },
  'broadband': { name: 'wifi-outline', color: '#14B8A6' },
  'cable-ott': { name: 'tv-outline', color: '#2DD4BF' },
  'gold-savings': { name: 'diamond-outline', color: '#0D9488' },
  'donations': { name: 'heart-outline', color: '#14B8A6' },
  // Electronics fallbacks
  'mobile-phones': { name: 'phone-portrait-outline', color: '#3B82F6' },
  'laptops': { name: 'laptop-outline', color: '#2563EB' },
  'televisions': { name: 'tv-outline', color: '#3B82F6' },
  'cameras': { name: 'camera-outline', color: '#60A5FA' },
  'audio-headphones': { name: 'headset-outline', color: '#2563EB' },
  'gaming': { name: 'game-controller-outline', color: '#3B82F6' },
  'accessories': { name: 'hardware-chip-outline', color: '#60A5FA' },
  'smartwatches': { name: 'watch-outline', color: '#2563EB' },
};

// Rez Brand Colors
const COLORS = {
  primaryGold: '#F59E0B',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  background: '#FFFFFF',
  border: '#F3F4F6',
};

interface CategoryIconProps {
  category: CategoryGridItem;
  onPress: (category: CategoryGridItem) => void;
  countLabel?: string;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ category, onPress, countLabel = 'items' }) => {
  const icon = category.icon || '🍽️';
  const color = category.color || '#6B7280';
  // Priority: 1) Backend image URL (admin-uploaded), 2) Hardcoded local asset, 3) Emoji fallback
  const backendImage = category.image
    ? { uri: category.image }
    : null;
  const localImage = CATEGORY_IMAGES[category.slug] || CATEGORY_IMAGES[category.id] || null;
  const imageSource = backendImage || localImage;
  // Ionicons fallback for categories without images
  const iconFallback = !imageSource
    ? (CATEGORY_ICON_FALLBACK[category.id] || (category.slug ? CATEGORY_ICON_FALLBACK[category.slug] : undefined))
    : undefined;

  return (
    <Pressable
      style={styles.categoryItem}
      onPress={() => onPress(category)}
     
    >
      <View style={styles.itemCard}>
        {imageSource ? (
          <ExpoImage source={imageSource} style={styles.itemImage} contentFit="contain" cachePolicy="memory-disk" recyclingKey={category.id} />
        ) : iconFallback ? (
          <View style={[styles.emojiContainer, { backgroundColor: `${iconFallback.color}15` }]}>
            <Ionicons name={iconFallback.name} size={36} color={iconFallback.color} />
          </View>
        ) : (
          <View style={[styles.emojiContainer, { backgroundColor: `${color}20` }]}>
            <Text style={styles.iconEmoji}>{icon}</Text>
          </View>
        )}
      </View>
      <Text style={styles.categoryName} numberOfLines={2}>
        {category.name}
      </Text>
      {category.itemCount !== undefined && category.itemCount > 0 && (
        <Text style={styles.itemCount}>{category.itemCount}+ {countLabel}</Text>
      )}
    </Pressable>
  );
};

const BrowseCategoryGrid: React.FC<BrowseCategoryGridProps> = ({
  categories,
  title = 'Browse Categories',
  onCategoryPress,
  itemCountLabel = 'items',
}) => {
  const router = useRouter();

  const handleCategoryPress = (category: CategoryGridItem) => {
    if (onCategoryPress) {
      onCategoryPress(category);
    } else {
      // Default navigation
      router.push(`/category/${category.id}`);
    }
  };

  // Don't render if no categories
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <View style={styles.titleAccent} />
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
      </View>

      {/* 4-column Grid */}
      <View style={styles.grid}>
        {categories.map((category) => (
          <CategoryIcon
            key={category.id}
            category={category}
            onPress={handleCategoryPress}
            countLabel={itemCountLabel}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleAccent: {
    width: 4,
    height: 20,
    backgroundColor: COLORS.primaryGold,
    borderRadius: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  categoryItem: {
    width: '25%', // 4 columns
    alignItems: 'center',
    marginBottom: 16,
  },
  itemCard: {
    width: '85%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 6,
  },
  itemImage: {
    width: '85%',
    height: '85%',
  },
  emojiContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  iconEmoji: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 2,
  },
  itemCount: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default BrowseCategoryGrid;

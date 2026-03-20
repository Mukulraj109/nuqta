import { withErrorBoundary } from '@/utils/withErrorBoundary';
/**
 * All Categories Page - Browse all shopping categories
 * Connected to /api/categories
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import categoriesApi, { Category } from '@/services/categoriesApi';
import { CardGridSkeleton } from '@/components/skeletons';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  white: Colors.background.primary,
  navy: Colors.text.primary,
  gray50: Colors.background.secondary,
  gray100: Colors.background.secondary,
  gray200: Colors.border.default,
  gray600: Colors.text.tertiary,
  green500: Colors.success,
  cyan500: colors.brand.cyan,
  amber500: Colors.warning,
};

// Section configurations with icons and colors
const SECTION_CONFIG: Record<string, { icon: string; color: string }> = {
  electronics: { icon: '📱', color: colors.infoScale[400] },
  fashion: { icon: '👗', color: colors.brand.pink },
  home: { icon: '🏠', color: colors.brand.purpleLight },
  beauty: { icon: '💄', color: '#F472B6' },
  sports: { icon: '⚽', color: colors.success },
  toys: { icon: '🎮', color: colors.brand.amber },
  books: { icon: '📚', color: colors.brand.indigo },
  jewelry: { icon: '💎', color: colors.warningScale[400] },
  food: { icon: '🍕', color: colors.brand.orange },
  grocery: { icon: '🛒', color: colors.success },
  dineout: { icon: '🍽️', color: colors.error },
  cafe: { icon: '☕', color: '#78350F' },
  flights: { icon: '✈️', color: '#0EA5E9' },
  hotels: { icon: '🏨', color: colors.brand.purpleLight },
  movies: { icon: '🎬', color: colors.error },
  events: { icon: '🎭', color: colors.brand.pink },
  concerts: { icon: '🎵', color: colors.brand.purple },
  parks: { icon: '🎢', color: colors.success },
  repair: { icon: '🔧', color: colors.infoScale[400] },
  cleaning: { icon: '🧹', color: colors.success },
  salon: { icon: '💇', color: colors.brand.pink },
  fitness: { icon: '💪', color: colors.brand.orange },
  healthcare: { icon: '🏥', color: colors.error },
  plumbing: { icon: '🚿', color: colors.brand.cyan },
  bills: { icon: '📄', color: colors.infoScale[400] },
  recharge: { icon: '📱', color: colors.success },
  gold: { icon: '🪙', color: colors.warningScale[400] },
  insurance: { icon: '🛡️', color: colors.brand.purpleLight },
  loans: { icon: '💳', color: colors.brand.pink },
  ott: { icon: '📺', color: colors.error },
};

// Fallback categories - using /MainCategory/ routes for consistency
const FALLBACK_SECTIONS = [
  {
    section: 'Shopping',
    items: [
      { id: 'electronics', title: 'Electronics', icon: '📱', color: colors.infoScale[400], route: '/MainCategory/electronics' },
      { id: 'fashion', title: 'Fashion', icon: '👗', color: colors.brand.pink, route: '/MainCategory/fashion' },
      { id: 'grocery', title: 'Grocery', icon: '🛒', color: colors.successScale[400], route: '/MainCategory/grocery-essentials' },
      { id: 'beauty', title: 'Beauty', icon: '💄', color: '#F472B6', route: '/MainCategory/beauty-wellness' },
    ],
  },
  {
    section: 'Food & Dining',
    items: [
      { id: 'food-dining', title: 'Food & Dining', icon: '🍕', color: colors.brand.orange, route: '/MainCategory/food-dining' },
    ],
  },
  {
    section: 'Travel & Entertainment',
    items: [
      { id: 'travel', title: 'Travel', icon: '✈️', color: '#0EA5E9', route: '/MainCategory/travel-experiences' },
      { id: 'entertainment', title: 'Entertainment', icon: '🎭', color: colors.brand.pink, route: '/MainCategory/entertainment' },
    ],
  },
  {
    section: 'Services',
    items: [
      { id: 'home-services', title: 'Home Services', icon: '🏠', color: colors.warningScale[400], route: '/MainCategory/home-services' },
      { id: 'fitness', title: 'Fitness', icon: '💪', color: colors.brand.purpleLight, route: '/MainCategory/fitness-sports' },
      { id: 'healthcare', title: 'Healthcare', icon: '🏥', color: colors.error, route: '/MainCategory/healthcare' },
      { id: 'education', title: 'Education', icon: '🎓', color: colors.infoScale[400], route: '/MainCategory/education-learning' },
    ],
  },
  {
    section: 'Financial Services',
    items: [
      { id: 'financial', title: 'Financial', icon: '💳', color: colors.tealGreen, route: '/MainCategory/financial-lifestyle' },
    ],
  },
];

interface DisplayCategory {
  id: string;
  title: string;
  icon: string;
  color: string;
  route: string;
}

interface CategorySection {
  section: string;
  items: DisplayCategory[];
}

const CategoriesPage: React.FC = () => {
  const isMounted = useIsMounted();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sections, setSections] = useState<CategorySection[]>(FALLBACK_SECTIONS);
  const [totalCategories, setTotalCategories] = useState(0);

  const transformCategory = (cat: Category): DisplayCategory => {
    const config = SECTION_CONFIG[cat.slug] || { icon: '📦', color: colors.neutral[500] };
    return {
      id: cat._id,
      title: cat.name,
      icon: cat.icon || config.icon,
      color: cat.metadata?.color || config.color,
      route: `/MainCategory/${cat.slug}`,
    };
  };

  const groupCategoriesByType = (categories: Category[]): CategorySection[] => {
    const typeMap: Record<string, string> = {
      going_out: 'Food & Dining',
      home_delivery: 'Shopping',
      earn: 'Earn Rewards',
      play: 'Entertainment',
      general: 'Other',
    };

    const grouped: Record<string, DisplayCategory[]> = {};

    categories.forEach((cat) => {
      const sectionName = typeMap[cat.type] || 'Shopping';
      if (!grouped[sectionName]) {
        grouped[sectionName] = [];
      }
      grouped[sectionName].push(transformCategory(cat));
    });

    // Order sections
    const sectionOrder = ['Shopping', 'Food & Dining', 'Entertainment', 'Services', 'Financial Services', 'Earn Rewards', 'Other'];

    return sectionOrder
      .filter((section) => grouped[section] && grouped[section].length > 0)
      .map((section) => ({
        section,
        items: grouped[section],
      }));
  };

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoriesApi.getCategories({ isActive: true });

      if (response.success && response.data && response.data.length > 0) {
        const groupedSections = groupCategoriesByType(response.data);
        if (groupedSections.length > 0) {
          setSections(groupedSections);
        }
        if (!isMounted()) return;
        setTotalCategories(response.data.length);
      }
    } catch (error) {
      // Keep fallback data
    } finally {
      if (!isMounted()) return;
      setIsLoading(false);
      if (!isMounted()) return;
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((section) => section.items.length > 0);

  if (isLoading) {
    return <CardGridSkeleton />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.brand.cyan, colors.cyanDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>All Categories</Text>
            <Text style={styles.headerSubtitle}>
              {totalCategories > 0 ? `${totalCategories} categories` : 'Browse everything in one place'}
            </Text>
          </View>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray600} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor={COLORS.gray600}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray600} />
            </Pressable>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[COLORS.cyan500]} />
        }
      >
        {filteredCategories.length > 0 ? (
          filteredCategories.map((section) => (
            <View key={section.section} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.section}</Text>
              <View style={styles.categoriesGrid}>
                {section.items.map((cat) => (
                  <Pressable
                    key={cat.id}
                    style={styles.categoryCard}
                    onPress={() => router.push(cat.route as any)}
                   
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: `${cat.color}20` }]}>
                      <Text style={styles.categoryEmoji}>{cat.icon}</Text>
                    </View>
                    <Text style={styles.categoryTitle}>{cat.title}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No categories found</Text>
            <Text style={styles.emptySubtitle}>Try a different search term</Text>
          </View>
        )}

        <View style={styles.promoBanner}>
          <LinearGradient
            colors={[colors.success, colors.brand.greenDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.promoGradient}
          >
            <Text style={styles.promoEmoji}>🎉</Text>
            <Text style={styles.promoTitle}>Earn Rewards Everywhere</Text>
            <Text style={styles.promoSubtitle}>Get cashback on all categories</Text>
            <View style={styles.rewardBadges}>
              <View style={styles.rewardBadge}>
                <Text style={styles.rewardText}>Up to 30%</Text>
              </View>
              <View style={styles.rewardBadge}>
                <Text style={styles.rewardText}>2X Coins</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray600,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyLarge,
    color: COLORS.navy,
    marginLeft: Spacing.md,
  },
  section: {
    padding: Spacing.base,
  },
  sectionTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: Spacing.base,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  categoryCard: {
    width: (SCREEN_WIDTH - 56) / 3,
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BorderRadius.lg,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryEmoji: {
    ...Typography.h2,
  },
  categoryTitle: {
    ...Typography.caption,
    fontWeight: '600',
    color: COLORS.navy,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: COLORS.gray600,
  },
  promoBanner: {
    marginHorizontal: Spacing.base,
  },
  promoGradient: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  promoEmoji: {
    fontSize: 40,
    marginBottom: Spacing.md,
  },
  promoTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: Spacing.xs,
  },
  promoSubtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  rewardBadges: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  rewardBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
  },
  rewardText: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default withErrorBoundary(CategoriesPage, 'Categories');

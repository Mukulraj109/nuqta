import React, { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  Pressable,
  Platform,
  Dimensions,
  Share,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

// ============================================
// NUQTA DESIGN SYSTEM - Premium Color Palette
// ============================================
const NUQTA = {
  // Primary Colors
  nileBlue: Colors.nileBlue,
  lightMustard: Colors.gold,
  linen: '#faf1e0',
  lightPeach: '#ffd7b5',
  lavenderMist: '#dfebf7',

  // Derived Shades
  nileBlueLight: '#243f55',
  nileBlueDark: '#0f2637',
  mustardDark: '#e5b84d',
  mustardLight: '#ffe082',
  peachDark: '#E8B896',
  peachLight: '#ffe4d1',
  lavenderDark: '#c5d9ed',

  // Semantic Colors
  text: {
    primary: Colors.nileBlue,
    secondary: '#4a6580',
    muted: '#8aa3b8',
    inverse: Colors.background.primary,
  },

  // Glass Effects
  glass: {
    white: 'rgba(255, 255, 255, 0.85)',
    whiteBorder: 'rgba(255, 255, 255, 0.5)',
    mustard: 'rgba(255, 205, 87, 0.12)',
    mustardBorder: 'rgba(255, 205, 87, 0.3)',
    peach: 'rgba(255, 215, 181, 0.15)',
    peachBorder: 'rgba(255, 215, 181, 0.4)',
  },
};

// Legacy COLORS for compatibility
const COLORS = {
  primary: NUQTA.lightMustard,
  primaryDark: NUQTA.nileBlue,
  gold: NUQTA.lightMustard,
  navy: NUQTA.nileBlue,
  slate: NUQTA.nileBlue,
  muted: NUQTA.text.muted,
  surface: NUQTA.linen,
  error: NUQTA.nileBlue,
  warning: NUQTA.lightMustard,
  glassWhite: NUQTA.glass.white,
  glassBorder: NUQTA.glass.whiteBorder,
  glassHighlight: 'rgba(255, 255, 255, 0.6)',
};

import {
  SearchPageState,
  SearchSection,
  SearchCategory,
  SearchResult,
  SearchSuggestion,
  SearchViewMode,
} from '@/types/search.types';
import { LandingSkeleton, ResultsSkeleton } from '@/components/search/SearchSkeleton';
import FilterModal from '@/components/search/FilterModal';
import SellerComparisonCard from '@/components/search/SellerComparisonCard';
import ProductGroupHeader from '@/components/search/ProductGroupHeader';
import SearchResultsSummary from '@/components/search/SearchResultsSummary';
import FilterBar, { SortOption } from '@/components/search/FilterBar';
import RecentSearches from '@/components/search/RecentSearches';
import TrendingSearchesSection from '@/components/search/TrendingSearchesSection';
import PopularStoresSection from '@/components/search/PopularStoresSection';
import { useSearchPage } from '@/hooks/useSearchPage';
import useDebouncedSearch from '@/hooks/useDebouncedSearch';
import { useCurrentLocation } from '@/hooks/useLocation';
import type { FilterState } from '@/components/search/FilterModal';
import { useRegion } from '@/contexts/RegionContext';
import { searchHistoryService } from '@/services/searchHistoryService';
import { apiClient } from '@/utils/apiClient';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { BRAND } from '@/constants/brand';

const { width } = Dimensions.get('window');

export default function SearchPage() {
  const params = useLocalSearchParams();
  const initialQuery = (params.q as string) || '';

  // Use the new search page hook
  const { state: searchState, groupedProducts, matchingStores, searchSummary, trendingSearches, popularStores, popularProducts, didYouMeanSuggestions, actions } = useSearchPage();

  // Get user location for distance calculation
  const { currentLocation } = useCurrentLocation();

  // Get currency symbol for price display
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  // Use debounced search hook
  const { debouncedValue: debouncedQuery, setValue: setSearchQuery } = useDebouncedSearch(initialQuery, { delay: 350, minLength: 2 });

  const [viewMode, setViewMode] = useState<SearchViewMode>(initialQuery ? 'results' : 'categories');
  const [inputFocused, setInputFocused] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortOption>('best_value');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [currentFilters, setCurrentFilters] = useState<FilterState>({
    priceRange: { min: 0, max: 100000 },
    rating: null,
    categories: [],
    inStock: false,
    cashbackMin: 0,
  });
  const [recentSearches, setRecentSearches] = useState<any[]>([]);

  // Load recent searches
  useEffect(() => {
    searchHistoryService.getRecentSearches().then(setRecentSearches).catch(() => {});
  }, []);

  // Prepare user location for search (memoized to avoid recreation)
  const userLocation = useMemo(() => {
    if (currentLocation?.coordinates) {
      return {
        latitude: currentLocation.coordinates.latitude,
        longitude: currentLocation.coordinates.longitude,
      };
    }
    return undefined;
  }, [currentLocation?.coordinates?.latitude, currentLocation?.coordinates?.longitude]);

  // Extract location coordinates to avoid object recreation issues
  const userLat = currentLocation?.coordinates?.latitude;
  const userLon = currentLocation?.coordinates?.longitude;

  // Store function, location, and filters in refs to avoid dependency issues
  const performGroupedSearchRef = useRef(actions.performGroupedSearch);
  const userLocationRef = useRef<{ latitude: number; longitude: number } | undefined>(undefined);
  const currentFiltersRef = useRef<FilterState>(currentFilters);

  // Update refs (using useLayoutEffect to avoid render issues)
  useLayoutEffect(() => {
    performGroupedSearchRef.current = actions.performGroupedSearch;
    userLocationRef.current = userLat && userLon ? { latitude: userLat, longitude: userLon } : undefined;
    currentFiltersRef.current = currentFilters;
  }, [actions.performGroupedSearch, userLat, userLon, currentFilters]);

  // Track last search to prevent duplicate searches
  const lastSearchedQuery = useRef<string>('');

  // Perform grouped search if initial query exists (only once on mount)
  const hasSearchedInitial = useRef(false);
  useEffect(() => {
    if (initialQuery && initialQuery.trim().length >= 2 && !hasSearchedInitial.current) {
      hasSearchedInitial.current = true;
      lastSearchedQuery.current = initialQuery;
      // IMPORTANT: Sync the input field with the URL query parameter
      actions.handleSearchChange(initialQuery);
      performGroupedSearchRef.current(initialQuery, userLocationRef.current, currentFiltersRef.current);
      setViewMode('results');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]); // Only run once when initialQuery is set

  // Perform grouped search when debounced query changes
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.trim().length >= 2) {
      // Only search if query actually changed
      if (lastSearchedQuery.current !== debouncedQuery) {
        lastSearchedQuery.current = debouncedQuery;
        performGroupedSearchRef.current(debouncedQuery, userLocationRef.current, currentFiltersRef.current);
        setViewMode('results');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]); // Only depend on debouncedQuery - location is in ref

  const handleBack = () => {
    router.back();
  };

  const handleQueryChange = (text: string) => {
    actions.handleSearchChange(text);
    setSearchQuery(text); // Update debounced search

    if (text.length > 0) {
      setViewMode('suggestions');
    } else {
      setViewMode('categories');
    }
  };

  const handleSearch = useCallback(() => {
    if (searchState.query.trim()) {
      lastSearchedQuery.current = searchState.query;
      performGroupedSearchRef.current(searchState.query, userLocationRef.current, currentFiltersRef.current);
      setViewMode('results');
    }
  }, [searchState.query]);

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    actions.handleSearchChange(suggestion.text);
    setSearchQuery(suggestion.text);
    lastSearchedQuery.current = suggestion.text;
    performGroupedSearchRef.current(suggestion.text, userLocationRef.current, currentFiltersRef.current);
    setViewMode('results');
  };

  const handleCategoryPress = async (category: SearchCategory) => {
    await actions.handleCategoryPress(category);

    // Navigate to category page to show all products in this category
    router.push({
      pathname: '/category/[slug]' as any,
      params: {
        slug: category.slug,
        name: category.name,
        categoryId: category.id
      }
    });
  };

  const handleResultPress = async (result: SearchResult, position: number) => {
    await actions.handleResultPress(result, position);

    // Safely extract ID with fallback
    const resultId = result.id || result.productId || result.storeId || '';

    if (!resultId) {
      return;
    }

    if (result.category === 'Store') {
      // Navigate to MainStorePage with storeId to show store view
      router.push(`/MainStorePage?storeId=${resultId}`);
    } else {
      // Navigate to ProductPage with proper params
      router.push({
        pathname: '/product-page' as any,
        params: {
          cardId: resultId,
          cardType: 'product'
        }
      });
    }
  };

  const handleSellerPress = (seller: any) => {
    // Navigate to product page with store context
    if (seller.productId) {
      router.push({
        pathname: '/product-page' as any,
        params: {
          cardId: seller.productId,
          cardType: 'product',
          storeId: seller.storeId
        }
      });
    } else if (seller.storeId) {
      // Fallback to store page if no product ID
      router.push(`/MainStorePage?storeId=${seller.storeId}`);
    }
  };

  const handleFilterPress = (_filter: string) => {
    setShowFilterModal(true);
  };

  const handleSortChange = (sort: SortOption) => {
    setCurrentSort(sort);
  };

  // Apply sorting to grouped products based on current sort option
  const sortedGroupedProducts = useMemo(() => {
    if (!groupedProducts || groupedProducts.length === 0) return groupedProducts;

    return groupedProducts.map(productGroup => {
      const sortedSellers = [...productGroup.sellers].sort((a, b) => {
        switch (currentSort) {
          case 'price_low':
            return a.price.current - b.price.current;
          case 'price_high':
            return b.price.current - a.price.current;
          case 'cashback_high':
            return b.cashback.amount - a.cashback.amount;
          case 'distance':
            // Sort by distance (closer first)
            const distA = a.distance ?? 999;
            const distB = b.distance ?? 999;
            return distA - distB;
          case 'rating':
            // Sort by rating (higher first)
            if (b.rating !== a.rating) {
              return b.rating - a.rating;
            }
            // If ratings are equal, sort by review count
            return b.reviewCount - a.reviewCount;
          case 'best_value':
          default:
            // Best value: considers price, cashback, rating, and distance
            // Lower score = better value
            const scoreA =
              (a.price.current * 0.4) -
              (a.cashback.amount * 0.3) -
              (a.rating * 100 * 0.2) +
              ((a.distance || 999) * 0.1);
            const scoreB =
              (b.price.current * 0.4) -
              (b.cashback.amount * 0.3) -
              (b.rating * 100 * 0.2) +
              ((b.distance || 999) * 0.1);
            return scoreA - scoreB;
        }
      });

      return {
        ...productGroup,
        sellers: sortedSellers
      };
    });
  }, [groupedProducts, currentSort]);

  const handleViewAll = (sectionId: string) => {
    actions.handleViewAllSection(sectionId);

    // Navigate to the appropriate page based on section
    if (sectionId === 'going-out') {
      router.push('/going-out');
    } else if (sectionId === 'home-delivery') {
      router.push('/home-delivery');
    }
  };

  const handleOpenFilters = () => {
    setShowFilterModal(true);
  };

  const handleApplyFilters = (filters: FilterState) => {
    setCurrentFilters(filters);

    // Build active filter names for FilterBar visual state
    const filterNames: string[] = [];
    if (filters.priceRange.min > 0 || filters.priceRange.max < 100000) filterNames.push('price');
    if (filters.rating !== null) filterNames.push('rating');
    if (filters.cashbackMin > 0) filterNames.push('cashback');
    if (filters.categories.length > 0) filterNames.push('category');
    setActiveFilters(filterNames);
    setShowFilterModal(false);

    // Trigger filtered search (single grouped search only — no race condition)
    if (searchState.query.trim().length >= 2) {
      lastSearchedQuery.current = ''; // Force re-search
      performGroupedSearchRef.current(searchState.query, userLocationRef.current, filters);
      setViewMode('results');
    }
  };

  // Handler for recent search press
  const handleRecentSearchPress = (query: string) => {
    actions.handleSearchChange(query);
    setSearchQuery(query);
    lastSearchedQuery.current = query;
    performGroupedSearchRef.current(query, userLocationRef.current, currentFiltersRef.current);
    setViewMode('results');
  };

  // Handler for trending search press
  const handleTrendingSearchPress = (query: string) => {
    actions.handleSearchChange(query);
    setSearchQuery(query);
    lastSearchedQuery.current = query;
    performGroupedSearchRef.current(query, userLocationRef.current, currentFiltersRef.current);
    setViewMode('results');
  };

  // Handler for popular store press
  const handlePopularStorePress = (store: any) => {
    router.push(`/MainStorePage?storeId=${store._id}`);
  };

  // ============================================
  // PREMIUM HEADER - Nuqta Design
  // ============================================
  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      <LinearGradient
        colors={[NUQTA.nileBlue, NUQTA.nileBlueLight, NUQTA.nileBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Premium decorative elements */}
        <View style={styles.decorativeOrb1} />
        <View style={styles.decorativeOrb2} />
        <View style={styles.decorativeOrb3} />

        {/* Subtle pattern overlay */}
        <View style={styles.patternOverlay} />

        <View style={styles.headerContent}>
          {/* Back Button - Premium glass design */}
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
           
            accessibilityLabel="Go back"
            accessibilityRole="button"
            accessibilityHint="Returns to the previous screen"
          >
            <LinearGradient
              colors={['rgba(255, 205, 87, 0.25)', 'rgba(255, 205, 87, 0.15)']}
              style={styles.backButtonGradient}
            >
              <Ionicons name="arrow-back" size={22} color={NUQTA.lightMustard} />
            </LinearGradient>
          </Pressable>

          {/* Search Container - Premium glass design */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchInputContainer, inputFocused && styles.searchInputFocused]}>
              <LinearGradient
                colors={[NUQTA.lightMustard, NUQTA.mustardDark]}
                style={styles.searchIconWrapper}
              >
                <Ionicons name="search" size={16} color={NUQTA.nileBlue} />
              </LinearGradient>
              <TextInput
                style={[
                  styles.searchInput,
                  Platform.OS === 'web'
                    ? ({
                      outlineWidth: 0,
                      outlineColor: 'transparent',
                      outlineStyle: 'none',
                      WebkitTapHighlightColor: 'transparent',
                    } as any)
                    : undefined,
                ]}
                placeholder="Search for a service, store or category"
                placeholderTextColor={NUQTA.text.muted}
                value={searchState.query}
                onChangeText={handleQueryChange}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoFocus={!initialQuery}
                underlineColorAndroid="transparent"
                importantForAutofill="no"
                accessibilityLabel="Search input"
                accessibilityRole="search"
                accessibilityHint="Enter keywords to search for services, stores or categories"
                accessibilityValue={{ text: searchState.query }}
              />

              {searchState.query.length > 0 && (
                <Pressable
                  onPress={() => handleQueryChange('')}
                  style={styles.clearButton}
                 
                  accessibilityLabel="Clear search"
                  accessibilityRole="button"
                  accessibilityHint="Clears the current search text"
                >
                  <View style={styles.clearButtonInner}>
                    <Ionicons name="close" size={14} color={NUQTA.text.secondary} />
                  </View>
                </Pressable>
              )}
            </View>
          </View>

          {/* Filter Button - Premium design */}
          <Pressable
            style={[
              styles.filterButton,
              Object.keys(searchState.activeFilters).length > 0 && styles.filterButtonActive
            ]}
           
            onPress={handleOpenFilters}
            accessibilityLabel={`Filters${Object.keys(searchState.activeFilters).length > 0 ? `, ${Object.keys(searchState.activeFilters).length} active` : ''}`}
            accessibilityRole="button"
            accessibilityHint="Opens filter options to refine search results"
            accessibilityState={{ selected: Object.keys(searchState.activeFilters).length > 0 }}
          >
            <LinearGradient
              colors={Object.keys(searchState.activeFilters).length > 0
                ? [NUQTA.lightMustard, NUQTA.mustardDark]
                : ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
              style={styles.filterButtonGradient}
            >
              <Ionicons
                name="options-outline"
                size={18}
                color={Object.keys(searchState.activeFilters).length > 0 ? NUQTA.nileBlue : NUQTA.lightMustard}
              />
            </LinearGradient>
            {Object.keys(searchState.activeFilters).length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{Object.keys(searchState.activeFilters).length}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );

  // ============================================
  // PREMIUM CATEGORIES VIEW - Nuqta Design
  // ============================================
  const renderCategories = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Premium Quick Search Actions */}
      <View style={styles.quickSearchActions}>
        {/* AI Search Card - Nile Blue Theme */}
        <Pressable
          style={styles.quickSearchCard}
          onPress={() => router.push('/search/ai-search')}
         
        >
          <LinearGradient
            colors={[NUQTA.nileBlue, NUQTA.nileBlueLight]}
            style={styles.quickSearchGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Decorative accent */}
            <View style={styles.quickSearchAccent} />
            <View style={styles.quickSearchIconContainer}>
              <Ionicons name="sparkles" size={26} color={NUQTA.lightMustard} />
            </View>
            <Text style={styles.quickSearchText}>AI Search</Text>
            <Text style={styles.quickSearchSubtext}>Natural language</Text>
          </LinearGradient>
        </Pressable>

        {/* Hotspots Card - Mustard Theme */}
        <Pressable
          style={styles.quickSearchCard}
          onPress={() => router.push('/search/hotspots')}
         
        >
          <LinearGradient
            colors={[NUQTA.lightMustard, NUQTA.mustardDark]}
            style={styles.quickSearchGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Decorative accent */}
            <View style={[styles.quickSearchAccent, { backgroundColor: 'rgba(26, 58, 82, 0.1)' }]} />
            <View style={[styles.quickSearchIconContainer, { backgroundColor: 'rgba(26, 58, 82, 0.15)' }]}>
              <Ionicons name="location" size={26} color={NUQTA.nileBlue} />
            </View>
            <Text style={[styles.quickSearchText, { color: NUQTA.nileBlue }]}>Hotspots</Text>
            <Text style={[styles.quickSearchSubtext, { color: 'rgba(26, 58, 82, 0.7)' }]}>Nearby deals</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <RecentSearches
          searches={recentSearches}
          onSearchPress={handleRecentSearchPress}
          onRemoveSearch={(id) => {
            searchHistoryService.removeSearch(id).then(() => {
              setRecentSearches(prev => prev.filter(s => s.id !== id));
            }).catch(() => {});
          }}
          onClearAll={() => {
            actions.clearSearchHistory();
            setRecentSearches([]);
          }}
        />
      )}

      {/* Trending Searches */}
      <TrendingSearchesSection
        searches={trendingSearches}
        onPress={handleTrendingSearchPress}
      />

      {/* Popular Stores */}
      <PopularStoresSection
        stores={popularStores}
        onStorePress={handlePopularStorePress}
        onViewAll={() => router.push('/explore/stores' as any)}
      />

      {/* Category Sections */}
      {searchState.sections.map((section, index) => (
        <View key={section.id} style={styles.section}>
          {/* Premium Section Header */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionAccentBar} />
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              {section.subtitle && (
                <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
              )}
            </View>
            <Pressable
              style={styles.viewAllButton}
              onPress={() => handleViewAll(section.id)}
             
              accessibilityLabel={`View all ${section.title}`}
              accessibilityRole="button"
              accessibilityHint={`Opens full list of ${section.title} categories`}
            >
              <Text style={styles.viewAllText}>View all</Text>
              <Ionicons name="arrow-forward" size={16} color={NUQTA.nileBlue} style={{ marginLeft: Spacing.xs }} />
            </Pressable>
          </View>

          {/* Premium Categories Grid */}
          <View style={styles.categoriesGrid}>
            {section.categories.map((category) => (
              <Pressable
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category)}
               
                accessibilityLabel={`${category.name} category, up to ${category.cashbackPercentage}% cashback`}
                accessibilityRole="button"
                accessibilityHint={`Opens ${category.name} category page with products and offers`}
              >
                {/* Category Image */}
                <View style={styles.categoryImageContainer}>
                  {category.image ? (
                    <CachedImage
                      source={category.image}
                      style={styles.categoryImage}
                      contentFit="cover"
                      accessibilityLabel={`${category.name} category image`}
                      accessibilityRole="image"
                    />
                  ) : (
                    <LinearGradient
                      colors={[NUQTA.lavenderMist, NUQTA.lavenderDark]}
                      style={styles.categoryImagePlaceholder}
                      accessibilityLabel={`${category.name} category placeholder`}
                    >
                      <Ionicons name="image-outline" size={32} color={NUQTA.nileBlue} />
                    </LinearGradient>
                  )}
                  {/* Premium overlay gradient */}
                  <LinearGradient
                    colors={['transparent', 'rgba(26, 58, 82, 0.03)']}
                    style={styles.categoryImageOverlay}
                  />
                </View>

                {/* Category Info */}
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <View style={styles.cashbackRow}>
                    <LinearGradient
                      colors={[NUQTA.nileBlue, NUQTA.nileBlueLight]}
                      style={styles.cashbackBadge}
                    >
                      <Text style={styles.cashbackBadgeText}>Upto {category.cashbackPercentage}%</Text>
                    </LinearGradient>
                    <Text style={styles.categoryCashback}>cashback</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const filteredSuggestions = useMemo(() => {
    const filtered = searchState.suggestions
      .filter(s => s.text.toLowerCase().includes(searchState.query.toLowerCase()))
      .slice(0, 12);

    // Group suggestions by type
    const grouped: Record<string, typeof filtered> = {};
    for (const s of filtered) {
      const type = s.type || 'product';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(s);
    }
    return { filtered, grouped };
  }, [searchState.suggestions, searchState.query]);

  const renderSuggestions = () => {
    const { filtered, grouped } = filteredSuggestions;

    const typeLabels: Record<string, { label: string; icon: string }> = {
      product: { label: 'Products', icon: 'cube-outline' },
      store: { label: 'Stores', icon: 'storefront-outline' },
      category: { label: 'Categories', icon: 'grid-outline' },
      brand: { label: 'Brands', icon: 'pricetag-outline' },
    };

    const hasGroups = Object.keys(grouped).length > 1;

    return (
      <ScrollView
        style={styles.suggestionsContainer}
        accessibilityLabel="Search suggestions list"
        accessibilityRole="list"
      >
        <View style={styles.suggestionsHeader}>
          <View style={styles.suggestionsIconContainer}>
            <Ionicons name="bulb-outline" size={18} color={NUQTA.lightMustard} />
          </View>
          <Text style={styles.suggestionsTitle}>Suggestions</Text>
        </View>
        {hasGroups ? (
          Object.entries(grouped).map(([type, items]) => (
            <View key={type}>
              <View style={styles.suggestionGroupHeader}>
                <Ionicons
                  name={(typeLabels[type]?.icon || 'search-outline') as any}
                  size={14}
                  color={NUQTA.text.muted}
                />
                <Text style={styles.suggestionGroupTitle}>
                  {typeLabels[type]?.label || 'Results'}
                </Text>
              </View>
              {items.map((suggestion) => (
                <Pressable
                  key={suggestion.id}
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress(suggestion)}
                 
                  accessibilityLabel={`Search for ${suggestion.text}${suggestion.resultCount ? `, ${suggestion.resultCount} results available` : ''}`}
                  accessibilityRole="button"
                >
                  <View style={styles.suggestionIconWrapper}>
                    <Ionicons
                      name={(typeLabels[type]?.icon || 'search-outline') as any}
                      size={16}
                      color={NUQTA.nileBlue}
                    />
                  </View>
                  <Text style={styles.suggestionText}>{suggestion.text}</Text>
                  {suggestion.resultCount ? (
                    <View style={styles.suggestionCountBadge}>
                      <Text style={styles.suggestionCount}>{suggestion.resultCount}</Text>
                    </View>
                  ) : null}
                  <Ionicons name="arrow-forward" size={16} color={NUQTA.text.muted} />
                </Pressable>
              ))}
            </View>
          ))
        ) : (
          filtered.map((suggestion) => (
            <Pressable
              key={suggestion.id}
              style={styles.suggestionItem}
              onPress={() => handleSuggestionPress(suggestion)}
             
              accessibilityLabel={`Search for ${suggestion.text}${suggestion.resultCount ? `, ${suggestion.resultCount} results available` : ''}`}
              accessibilityRole="button"
            >
              <View style={styles.suggestionIconWrapper}>
                <Ionicons
                  name={suggestion.type === 'category' ? 'grid-outline' : 'search-outline'}
                  size={16}
                  color={NUQTA.nileBlue}
                />
              </View>
              <Text style={styles.suggestionText}>{suggestion.text}</Text>
              {suggestion.resultCount ? (
                <View style={styles.suggestionCountBadge}>
                  <Text style={styles.suggestionCount}>{suggestion.resultCount}</Text>
                </View>
              ) : null}
              <Ionicons name="arrow-forward" size={16} color={NUQTA.text.muted} />
            </Pressable>
          ))
        )}
      </ScrollView>
    );
  };

  const renderStoreCard = (store: any) => (
    <Pressable
      key={store.storeId}
      style={styles.storeResultCard}
      onPress={() => router.push(`/MainStorePage?storeId=${store.storeId}`)}
     
    >
      <View style={styles.storeResultContent}>
        {store.logo ? (
          <CachedImage source={store.logo} style={styles.storeResultLogo} />
        ) : (
          <LinearGradient
            colors={[NUQTA.lavenderMist, NUQTA.lavenderDark]}
            style={[styles.storeResultLogo, styles.storeResultLogoPlaceholder]}
          >
            <Ionicons name="storefront" size={24} color={NUQTA.nileBlue} />
          </LinearGradient>
        )}
        <View style={styles.storeResultInfo}>
          <View style={styles.storeResultNameRow}>
            <Text style={styles.storeResultName} numberOfLines={1}>{store.name}</Text>
            {store.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={NUQTA.lightMustard} />
              </View>
            )}
          </View>
          {store.description ? (
            <Text style={styles.storeResultDescription} numberOfLines={2}>{store.description}</Text>
          ) : null}
          <View style={styles.storeResultMeta}>
            {store.rating > 0 && (
              <View style={styles.storeResultRating}>
                <Ionicons name="star" size={12} color={NUQTA.lightMustard} />
                <Text style={styles.storeResultRatingText}>{store.rating.toFixed(1)}</Text>
                {store.reviewCount > 0 && (
                  <Text style={styles.storeResultReviewCount}>({store.reviewCount})</Text>
                )}
              </View>
            )}
            {store.location ? (
              <View style={styles.storeResultLocation}>
                <Ionicons name="location-outline" size={12} color={NUQTA.text.muted} />
                <Text style={styles.storeResultLocationText}>{store.location}</Text>
              </View>
            ) : null}
            {store.distance !== undefined && (
              <View style={styles.distanceBadge}>
                <Text style={styles.storeResultDistance}>{store.distance} km</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.storeArrowContainer}>
          <Ionicons name="chevron-forward" size={20} color={NUQTA.nileBlue} />
        </View>
      </View>
    </Pressable>
  );

  const renderResults = () => {
    // Use grouped products if available, otherwise fall back to regular results
    if (groupedProducts.length > 0 || matchingStores.length > 0) {
      return (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Search Results Summary */}
          {searchSummary && (
            <SearchResultsSummary query={searchState.query} summary={searchSummary} />
          )}

          {/* Filter Bar */}
          {groupedProducts.length > 0 && (
            <FilterBar
              onFilterPress={handleFilterPress}
              onSortChange={handleSortChange}
              currentSort={currentSort}
              activeFilters={activeFilters}
            />
          )}

          {/* Matching Stores Section */}
          {matchingStores.length > 0 && (
            <View style={styles.matchingStoresSection}>
              <View style={styles.matchingStoresHeader}>
                <View style={styles.matchingStoresIconContainer}>
                  <Ionicons name="storefront-outline" size={18} color={NUQTA.nileBlue} />
                </View>
                <Text style={styles.matchingStoresTitle}>Matching Stores</Text>
                <View style={styles.matchingStoresCountBadge}>
                  <Text style={styles.matchingStoresCount}>{matchingStores.length}</Text>
                </View>
              </View>
              {matchingStores.map(renderStoreCard)}
            </View>
          )}

          {/* Premium Promotional Banner */}
          {groupedProducts.length > 0 && (
            <LinearGradient
              colors={[NUQTA.linen, NUQTA.lightPeach + '40']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.promoBanner}
            >
              <View style={styles.promoIconContainer}>
                <Ionicons name="wallet-outline" size={20} color={NUQTA.nileBlue} />
              </View>
              <Text style={styles.promoText}>
                Cashback & coins auto-applied at checkout for maximum savings
              </Text>
              <View style={styles.promoSparkle}>
                <Ionicons name="sparkles" size={18} color={NUQTA.lightMustard} />
              </View>
            </LinearGradient>
          )}

          {/* Grouped Products */}
          {sortedGroupedProducts.map((productGroup) => (
            <View key={productGroup.productId} style={styles.productGroup}>
              <ProductGroupHeader product={productGroup} />
              <View style={styles.productGroupSectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <Text style={styles.productGroupSectionTitle}>Same product • Compare sellers</Text>
                  <Text style={styles.productGroupSectionSubtitle}>Find the best deal across sellers</Text>
                </View>
                <View style={styles.brandAccent} />
              </View>
              {productGroup.sellers.map((seller, index) => (
                <SellerComparisonCard
                  key={`${seller.storeId}-${index}`}
                  seller={seller}
                  productId={productGroup.productId}
                  onPress={handleSellerPress}
                  onCompare={(seller) => {
                    router.push(`/compare?productId=${productGroup.productId}`);
                  }}
                  onFavorite={(seller) => {
                    apiClient.post(`/wishlists/items`, { itemType: 'store', itemId: seller.storeId }).catch(() => {});
                  }}
                  onShare={(seller) => {
                    Share.share({ message: `Check out ${seller.storeName} on ${BRAND.APP_NAME}!`, url: `${BRAND.WEBSITE}/store/${seller.storeId}` }).catch(() => {});
                  }}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      );
    }

    // Fallback to regular results display
    return (
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Results Header */}
        <View style={styles.searchResultsHeader}>
          <View style={styles.searchResultsTitleContainer}>
            <View style={styles.searchResultsIconContainer}>
              <Ionicons name="search" size={20} color={NUQTA.nileBlue} />
            </View>
            <Text style={styles.searchResultsTitle}>
              Search Results
            </Text>
          </View>
          <Text style={styles.searchResultsCount}>
            {searchState.loading ? 'Searching...' : `${searchState.results.length} ${searchState.results.length === 1 ? 'result' : 'results'} found`}
          </Text>
          <Text style={styles.searchQueryText}>
            for "{searchState.query}"
          </Text>
        </View>

        {/* Results Grid */}
        <View style={styles.resultsGrid}>
          {searchState.results.map((result, index) => (
            <Pressable
              key={result.id}
              style={styles.resultCard}
              onPress={() => handleResultPress(result, index + 1)}
             
              accessibilityLabel={`${result.title}, ${result.category}, ${result.cashbackPercentage}% cashback`}
              accessibilityRole="button"
              accessibilityHint={`Opens details page for ${result.title}`}
            >
              <View style={styles.resultImageContainer}>
                {result.image ? (
                  <CachedImage
                    source={result.image}
                    style={styles.resultImage}
                    contentFit="cover"
                    accessibilityLabel={`${result.title} image`}
                    accessibilityRole="image"
                  />
                ) : (
                  <LinearGradient
                    colors={[NUQTA.lavenderMist, NUQTA.lavenderDark]}
                    style={styles.resultImagePlaceholder}
                    accessibilityLabel={`${result.title} placeholder image`}
                  >
                    <Text style={styles.resultImageText}>{result.title.charAt(0)}</Text>
                  </LinearGradient>
                )}
              </View>

              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle} numberOfLines={2}>{result.title}</Text>
                <Text style={styles.resultDescription} numberOfLines={2}>
                  {result.description}
                </Text>
                <View style={styles.resultMeta}>
                  <LinearGradient
                    colors={[NUQTA.nileBlue, NUQTA.nileBlueLight]}
                    style={styles.resultCashback}
                  >
                    <Ionicons name="wallet-outline" size={12} color={NUQTA.lightMustard} />
                    <Text style={styles.resultCashbackText}>{result.cashbackPercentage}%</Text>
                  </LinearGradient>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{result.category}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderErrorState = () => {
    const errorMsg = searchState.error || '';
    const isNetworkError = errorMsg.toLowerCase().includes('network') ||
      errorMsg.toLowerCase().includes('connection') ||
      errorMsg.toLowerCase().includes('fetch') ||
      errorMsg.toLowerCase().includes('timeout');

    return (
      <View
        style={styles.errorContainer}
        accessibilityLabel="Error occurred"
        accessibilityRole="alert"
      >
        <View style={styles.errorIconContainer}>
          <Ionicons
            name={isNetworkError ? 'cloud-offline-outline' : 'alert-circle-outline'}
            size={64}
            color={NUQTA.nileBlue}
            accessibilityLabel="Error icon"
          />
        </View>
        <Text style={styles.errorTitle}>
          {isNetworkError ? 'Check your connection' : 'Oops! Something went wrong'}
        </Text>
        <Text style={styles.errorMessage}>
          {isNetworkError
            ? 'Please check your internet connection and try again.'
            : errorMsg}
        </Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => {
            actions.handleClearError();
            if (viewMode === 'results' && searchState.query) {
              performGroupedSearchRef.current(searchState.query, userLocationRef.current, currentFiltersRef.current);
            } else {
              actions.loadCategories();
            }
          }}
          accessibilityLabel="Try again"
          accessibilityRole="button"
          accessibilityHint="Retries the failed operation"
        >
          <LinearGradient
            colors={[NUQTA.nileBlue, NUQTA.nileBlueLight]}
            style={styles.retryButtonGradient}
          >
            <Ionicons name="refresh" size={18} color={Colors.text.inverse} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  };

  const renderLoadingState = () => {
    // Use results skeleton when searching, landing skeleton for initial load
    if (searchState.isSearching || viewMode === 'results') {
      return <ResultsSkeleton />;
    }
    return <LandingSkeleton />;
  };

  const renderEmptyState = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View
        style={styles.emptyContainer}
        accessibilityLabel="No search results found"
        accessibilityRole="alert"
      >
        <View style={styles.emptyIconContainer}>
          <Ionicons name="search-outline" size={64} color={NUQTA.nileBlue} accessibilityLabel="Search icon" />
        </View>
        <Text style={styles.emptyTitle}>No results found</Text>
        <Text style={styles.emptyMessage}>
          We couldn't find anything for "{searchState.query}"
        </Text>
        <Text style={styles.emptySuggestion}>
          Try different keywords or browse our categories
        </Text>

        {/* Did you mean? */}
        {didYouMeanSuggestions.length > 0 && (
          <View style={styles.didYouMeanSection}>
            <Text style={styles.didYouMeanTitle}>Did you mean?</Text>
            <View style={styles.emptyTrendingChips}>
              {didYouMeanSuggestions.map((suggestion, idx) => (
                <Pressable
                  key={`dym-${idx}`}
                  style={styles.didYouMeanChip}
                  onPress={() => {
                    actions.handleSearchChange(suggestion);
                    setSearchQuery(suggestion);
                    performGroupedSearchRef.current(suggestion, userLocationRef.current, currentFiltersRef.current);
                    setViewMode('results');
                  }}
                >
                  <Ionicons name="bulb-outline" size={14} color={NUQTA.lightMustard} />
                  <Text style={styles.didYouMeanChipText}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {trendingSearches.length > 0 && (
          <View style={styles.emptyTrendingSection}>
            <Text style={styles.emptyTrendingTitle}>Try these popular searches</Text>
            <View style={styles.emptyTrendingChips}>
              {trendingSearches.slice(0, 5).map((t) => (
                <Pressable
                  key={t._id}
                  style={styles.emptyTrendingChip}
                  onPress={() => {
                    actions.handleSearchChange(t.query);
                    setSearchQuery(t.query);
                    performGroupedSearchRef.current(t.query, userLocationRef.current, currentFiltersRef.current);
                    setViewMode('results');
                  }}
                >
                  <Ionicons name="trending-up" size={14} color={NUQTA.nileBlue} />
                  <Text style={styles.emptyTrendingChipText}>{t.query}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <Pressable
          style={styles.emptyActionButton}
          onPress={() => {
            actions.handleClearSearch();
            setViewMode('categories');
          }}
          accessibilityLabel="Browse categories"
          accessibilityRole="button"
          accessibilityHint="Clears search and shows all available categories"
        >
          <LinearGradient
            colors={[NUQTA.nileBlue, NUQTA.nileBlueLight]}
            style={styles.emptyActionButtonGradient}
          >
            <Text style={styles.emptyActionText}>Browse Categories</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Popular Products Section */}
      {popularProducts.length > 0 && (
        <View style={styles.popularProductsSection}>
          <View style={styles.popularProductsHeader}>
            <View style={styles.sectionAccentBar} />
            <Text style={styles.popularProductsTitle}>Popular right now</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularProductsList}>
            {popularProducts.slice(0, 6).map((product: any) => {
              const price = product.pricing?.selling || (typeof product.price === 'number' ? product.price : product.price?.current) || 0;
              const image = product.images?.[0]?.url || product.images?.[0] || product.image || '';
              return (
                <Pressable
                  key={product._id}
                  style={styles.popularProductCard}
                  onPress={() => {
                    router.push({
                      pathname: '/product-page' as any,
                      params: { cardId: product._id, cardType: 'product' },
                    });
                  }}
                >
                  <CachedImage source={image} style={styles.popularProductImage} contentFit="cover" />
                  <View style={styles.popularProductInfo}>
                    <Text style={styles.popularProductName} numberOfLines={2}>{product.name}</Text>
                    <Text style={styles.popularProductPrice}>{currencySymbol}{price.toFixed(2)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );

  const renderSearchHint = () => (
    <View
      style={styles.searchHintContainer}
      accessibilityLabel="Search hint"
      accessibilityRole="alert"
    >
      <View style={styles.searchHintIconContainer}>
        <Ionicons name="information-circle-outline" size={48} color={NUQTA.nileBlue} accessibilityLabel="Information icon" />
      </View>
      <Text style={styles.searchHintTitle}>Keep typing...</Text>
      <Text style={styles.searchHintText}>
        Enter at least 2 characters to start searching
      </Text>
    </View>
  );

  const renderContent = () => {
    // Show error if there's an error
    if (searchState.error && !searchState.sections.length) {
      return renderErrorState();
    }

    // Show loading
    if (searchState.loading && !searchState.sections.length) {
      return renderLoadingState();
    }

    switch (viewMode) {
      case 'suggestions':
        return renderSuggestions();
      case 'results':
        if (searchState.loading) {
          return renderLoadingState();
        }
        if (searchState.query.trim().length < 2) {
          return renderSearchHint();
        }
        if ((groupedProducts.length === 0 && matchingStores.length === 0 && searchState.results.length === 0) && !searchState.loading) {
          return renderEmptyState();
        }
        return renderResults();
      default:
        return renderCategories();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={NUQTA.nileBlue} />
      {renderHeader()}
      {searchState.error && searchState.sections.length > 0 && (
        <View
          style={styles.errorBanner}
          accessibilityLabel={`Warning: ${searchState.error}`}
          accessibilityRole="alert"
        >
          <Ionicons name="warning-outline" size={16} color={NUQTA.lightMustard} accessibilityLabel="Warning icon" />
          <Text style={styles.errorBannerText}>{searchState.error}</Text>
        </View>
      )}
      {renderContent()}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={currentFilters}
        categories={searchState.sections.length > 0
          ? searchState.sections.flatMap(s => s.categories).map(c => ({ id: c.id, name: c.name }))
          : undefined
        }
      />
    </SafeAreaView>
  );
}

// ============================================
// PREMIUM STYLES - Nuqta Design System
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NUQTA.linen,
  },

  // ============================================
  // HEADER STYLES
  // ============================================
  headerWrapper: {
    ...Platform.select({
      ios: {
        shadowColor: NUQTA.nileBlue,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0px 8px 32px rgba(26, 58, 82, 0.2)',
      },
    }),
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 52 : (StatusBar.currentHeight || 0) + 14,
    paddingBottom: 18,
    paddingHorizontal: Spacing.base,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeOrb1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 205, 87, 0.08)',
  },
  decorativeOrb2: {
    position: 'absolute',
    top: 30,
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 205, 87, 0.06)',
  },
  decorativeOrb3: {
    position: 'absolute',
    bottom: -20,
    right: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    zIndex: 2,
  },
  backButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 205, 87, 0.3)',
  },
  searchContainer: {
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  searchInputFocused: {
    borderWidth: 2,
    borderColor: NUQTA.lightMustard,
    ...Platform.select({
      ios: {
        shadowColor: NUQTA.lightMustard,
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  searchIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: NUQTA.nileBlue,
    fontWeight: '500',
    borderWidth: 0,
    padding: 0,
    paddingVertical: Spacing.sm,
    letterSpacing: 0.1,
  },
  clearButton: {
    marginLeft: Spacing.xs,
    marginRight: 6,
  },
  clearButtonInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: NUQTA.lavenderMist,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  filterButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterButtonActive: {},
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: NUQTA.lightPeach,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: NUQTA.nileBlue,
  },
  filterBadgeText: {
    color: NUQTA.nileBlue,
    ...Typography.caption,
    fontWeight: '800',
  },

  // ============================================
  // CONTENT STYLES
  // ============================================
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },

  // ============================================
  // QUICK SEARCH CARDS
  // ============================================
  quickSearchActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  quickSearchCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: NUQTA.nileBlue,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 6px 24px rgba(26, 58, 82, 0.15)',
      },
    }),
  },
  quickSearchGradient: {
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    position: 'relative',
    overflow: 'hidden',
  },
  quickSearchAccent: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickSearchIconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickSearchText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text.inverse,
    letterSpacing: 0.2,
  },
  quickSearchSubtext: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 3,
    fontWeight: '500',
  },

  // ============================================
  // SECTION STYLES
  // ============================================
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  sectionHeaderLeft: {},
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionAccentBar: {
    width: 4,
    height: 24,
    backgroundColor: NUQTA.lightMustard,
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: NUQTA.nileBlue,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    ...Typography.body,
    color: NUQTA.text.secondary,
    fontWeight: '500',
    marginLeft: Spacing.base,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.base,
    backgroundColor: NUQTA.lavenderMist,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: NUQTA.lavenderDark,
  },
  viewAllText: {
    ...Typography.body,
    color: NUQTA.nileBlue,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ============================================
  // CATEGORY CARDS
  // ============================================
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 46) / 2,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 82, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: NUQTA.nileBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 4px 20px rgba(26, 58, 82, 0.08)',
      },
    }),
  },
  categoryImageContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: 110,
  },
  categoryImagePlaceholder: {
    width: '100%',
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryImageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryInfo: {
    padding: 14,
  },
  categoryName: {
    ...Typography.body,
    fontWeight: '700',
    color: NUQTA.nileBlue,
    marginBottom: 10,
  },
  cashbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cashbackBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  cashbackBadgeText: {
    color: Colors.text.inverse,
    ...Typography.bodySmall,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  categoryCashback: {
    ...Typography.bodySmall,
    color: NUQTA.lightMustard,
    fontWeight: '600',
  },

  // ============================================
  // SUGGESTIONS
  // ============================================
  suggestionsContainer: {
    backgroundColor: Colors.background.primary,
    margin: Spacing.base,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 82, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: NUQTA.nileBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 4px 20px rgba(26, 58, 82, 0.08)',
      },
    }),
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  suggestionsIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: NUQTA.nileBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: NUQTA.nileBlue,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: NUQTA.linen,
    gap: Spacing.md,
  },
  suggestionIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: NUQTA.lavenderMist,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionText: {
    flex: 1,
    ...Typography.body,
    color: NUQTA.nileBlue,
    fontWeight: '500',
  },
  suggestionCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: Spacing.xs,
    backgroundColor: NUQTA.lightMustard,
    borderRadius: BorderRadius.md,
  },
  suggestionCount: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: NUQTA.nileBlue,
  },
  suggestionGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: Spacing.xs,
  },
  suggestionGroupTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: NUQTA.text.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },

  // ============================================
  // SEARCH RESULTS
  // ============================================
  searchResultsHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.base,
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: Spacing.base,
    marginHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 82, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: NUQTA.nileBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchResultsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  searchResultsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: NUQTA.lavenderMist,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: NUQTA.nileBlue,
  },
  searchResultsCount: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: NUQTA.lightMustard,
    marginBottom: Spacing.xs,
  },
  searchQueryText: {
    ...Typography.body,
    color: NUQTA.text.secondary,
    fontStyle: 'italic',
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  resultCard: {
    width: (width - 48) / 2,
    backgroundColor: Colors.background.primary,
    marginBottom: 14,
    marginHorizontal: 2,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 82, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: NUQTA.nileBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  resultImageContainer: {
    overflow: 'hidden',
  },
  resultImage: {
    width: '100%',
    height: 120,
  },
  resultImagePlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultImageText: {
    ...Typography.h1,
    fontWeight: '800',
    color: NUQTA.nileBlue,
  },
  resultInfo: {
    padding: 14,
  },
  resultTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: NUQTA.nileBlue,
    marginBottom: 6,
    lineHeight: 20,
  },
  resultDescription: {
    ...Typography.bodySmall,
    color: NUQTA.text.secondary,
    marginBottom: Spacing.md,
    lineHeight: 17,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  resultCashback: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: Spacing.xs,
  },
  resultCashbackText: {
    ...Typography.bodySmall,
    color: Colors.text.inverse,
    fontWeight: '700',
  },
  categoryTag: {
    backgroundColor: NUQTA.linen,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: NUQTA.peachDark,
  },
  categoryTagText: {
    color: NUQTA.nileBlue,
    ...Typography.caption,
    fontWeight: '600',
  },

  // ============================================
  // STORE RESULTS
  // ============================================
  matchingStoresSection: {
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  matchingStoresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  matchingStoresIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: NUQTA.lavenderMist,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchingStoresTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: NUQTA.nileBlue,
    flex: 1,
  },
  matchingStoresCountBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: NUQTA.nileBlue,
    borderRadius: BorderRadius.md,
  },
  matchingStoresCount: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  storeResultCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 18,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 82, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: NUQTA.nileBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  storeResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 14,
  },
  storeResultLogo: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  storeResultLogoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeResultInfo: {
    flex: 1,
  },
  storeResultNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: 6,
  },
  storeResultName: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: NUQTA.nileBlue,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: NUQTA.nileBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeResultDescription: {
    ...Typography.bodySmall,
    color: NUQTA.text.secondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  storeResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  storeResultRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  storeResultRatingText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: NUQTA.nileBlue,
  },
  storeResultReviewCount: {
    ...Typography.bodySmall,
    color: NUQTA.text.muted,
  },
  storeResultLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  storeResultLocationText: {
    ...Typography.bodySmall,
    color: NUQTA.text.muted,
  },
  distanceBadge: {
    backgroundColor: NUQTA.lavenderMist,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  storeResultDistance: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: NUQTA.nileBlue,
  },
  storeArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: NUQTA.lavenderMist,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ============================================
  // PROMO BANNER
  // ============================================
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    marginHorizontal: Spacing.base,
    marginTop: 14,
    borderRadius: 18,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: NUQTA.peachDark + '40',
  },
  promoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: NUQTA.peachDark,
  },
  promoText: {
    flex: 1,
    ...Typography.bodySmall,
    color: NUQTA.nileBlue,
    fontWeight: '600',
    lineHeight: 19,
  },
  promoSparkle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: NUQTA.nileBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ============================================
  // PRODUCT GROUP
  // ============================================
  productGroup: {
    marginTop: Spacing.base,
  },
  productGroupSectionHeader: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    backgroundColor: Colors.background.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: NUQTA.lightMustard,
    marginHorizontal: Spacing.base,
    marginTop: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 82, 0.06)',
  },
  sectionHeaderContent: {
    flex: 1,
  },
  productGroupSectionTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: NUQTA.nileBlue,
    marginBottom: Spacing.xs,
  },
  productGroupSectionSubtitle: {
    ...Typography.bodySmall,
    color: NUQTA.text.secondary,
  },
  brandAccent: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: NUQTA.lightMustard,
    marginLeft: Spacing.md,
  },

  // ============================================
  // STATE SCREENS
  // ============================================
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingSpinnerContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: NUQTA.nileBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  loadingText: {
    ...Typography.bodyLarge,
    color: NUQTA.text.secondary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: NUQTA.lavenderMist,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  errorTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: NUQTA.nileBlue,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    ...Typography.body,
    color: NUQTA.text.secondary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  retryButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
    gap: 10,
  },
  retryButtonText: {
    color: Colors.text.inverse,
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NUQTA.linen,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: NUQTA.peachDark,
  },
  errorBannerText: {
    flex: 1,
    ...Typography.bodySmall,
    color: NUQTA.nileBlue,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius['2xl'],
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 82, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: NUQTA.nileBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: NUQTA.lavenderMist,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    fontWeight: '700',
    color: NUQTA.nileBlue,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyMessage: {
    ...Typography.body,
    color: NUQTA.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  emptySuggestion: {
    ...Typography.body,
    color: NUQTA.text.muted,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  emptyTrendingSection: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  emptyTrendingTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: NUQTA.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptyTrendingChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emptyTrendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: NUQTA.linen,
    gap: 6,
  },
  emptyTrendingChipText: {
    ...Typography.bodySmall,
    fontWeight: '500',
    color: NUQTA.nileBlue,
  },
  emptyActionButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  emptyActionButtonGradient: {
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing['2xl'],
  },
  emptyActionText: {
    color: Colors.text.inverse,
    ...Typography.bodyLarge,
    fontWeight: '600',
    textAlign: 'center',
  },
  didYouMeanSection: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  didYouMeanTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: NUQTA.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  didYouMeanChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255, 205, 87, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 205, 87, 0.3)',
    gap: 6,
  },
  didYouMeanChipText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: NUQTA.nileBlue,
  },
  popularProductsSection: {
    marginTop: Spacing.lg,
    paddingBottom: 120,
  },
  popularProductsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  popularProductsTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: NUQTA.nileBlue,
    marginLeft: Spacing.sm,
  },
  popularProductsList: {
    paddingHorizontal: Spacing.base,
    gap: 12,
  },
  popularProductCard: {
    width: 140,
    backgroundColor: Colors.background.primary,
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: NUQTA.nileBlue, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 3 },
      web: { boxShadow: '0 2px 8px rgba(26, 58, 82, 0.06)' } as any,
    }),
  },
  popularProductImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f3f4f6',
  },
  popularProductInfo: {
    padding: 10,
  },
  popularProductName: {
    fontSize: 13,
    fontWeight: '600',
    color: NUQTA.nileBlue,
    marginBottom: 4,
    minHeight: 34,
  },
  popularProductPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  searchHintContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius['2xl'],
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(26, 58, 82, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: NUQTA.nileBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchHintIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: NUQTA.lavenderMist,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  searchHintTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: NUQTA.nileBlue,
    marginBottom: Spacing.sm,
  },
  searchHintText: {
    ...Typography.body,
    color: NUQTA.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

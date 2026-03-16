// View All Offers Page
// Displays all offers in a grid layout with the same header as offers page

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  RefreshControl,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { useOffersPage } from '@/hooks/useOffersPage';
import { shareOffersPage } from '@/utils/shareUtils';
import { Offer } from '@/services/realOffersApi';
import { useAuthUser } from '@/stores/selectors';
import realOffersApi from '@/services/realOffersApi';
import { CardGridSkeleton } from '@/components/skeletons';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2; // 2 cards per row with padding

export default function ViewAllOffersScreen() {
  const router = useRouter();
  const { category, discount, title } = useLocalSearchParams<{
    category?: string;
    discount?: string;
    title?: string;
  }>();
  const user = useAuthUser();
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [userPoints, setUserPoints] = useState(0);

  // Get category display name
  const getCategoryTitle = () => {
    // Use custom title if provided
    if (title) return title;

    const categoryMap: { [key: string]: string } = {
      'mega': 'MEGA OFFERS',
      'student': 'Offer for the students',
      'new_arrival': 'New Arrivals',
      'trending': 'Trending Now',
      'discount': 'Discount Offers',
      'free-delivery': 'Free Delivery',
      'nearby': 'Nearby Offers',
      'bogo': 'Buy One Get One',
    };
    return categoryMap[category || ''] || 'All Offers';
  };

  // Fetch user points from API (same as offers page)
  const fetchUserPoints = async () => {
    try {
      const response = await realOffersApi.getOffersPageData();
      if (response.success && response.data) {
        const points = response.data.userEngagement?.userPoints || 
                       response.data.userPoints || 
                       user?.wallet?.balance || 0;
        setUserPoints(points);
      }
    } catch (error) {
      // Fallback to auth state
      setUserPoints(user?.wallet?.balance || 0);
    }
  };

  const loadAllOffers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch offers by category if specified, otherwise fetch all
      let allOffersData: Offer[] = [];

      // Handle discount filter
      if (discount) {
        // Fetch all offers and filter by discount
        let currentPage = 1;
        const pageLimit = 50;
        let hasMore = true;

        while (hasMore && currentPage <= 10) {
          const response = await realOffersApi.getOffers({
            page: currentPage,
            limit: pageLimit,
          });

          if (response.success && response.data) {
            const offers = response.data.data || response.data || [];

            if (Array.isArray(offers)) {
              // Filter by discount percentage
              const filteredOffers = offers.filter((offer: Offer) => {
                if (discount === 'free_delivery') {
                  return offer.isFreeDelivery === true;
                }
                const discountValue = parseInt(discount);
                if (discountValue === 25) {
                  return offer.discountPercentage >= 25 && offer.discountPercentage < 50;
                } else if (discountValue === 50) {
                  return offer.discountPercentage >= 50 && offer.discountPercentage < 80;
                } else if (discountValue === 80) {
                  return offer.discountPercentage >= 80;
                }
                return offer.discountPercentage >= discountValue;
              });

              allOffersData = [...allOffersData, ...filteredOffers];
              if (offers.length < pageLimit) {
                hasMore = false;
              } else {
                currentPage++;
              }
            } else {
              hasMore = false;
            }
          } else {
            hasMore = false;
            if (currentPage === 1) {
              setError(response.message || 'Failed to load offers');
            }
          }
        }
      } else if (category) {
        // Fetch offers by specific category
        let currentPage = 1;
        const pageLimit = 50;
        let hasMore = true;

        // Fetch all offers of this category in batches
        while (hasMore && currentPage <= 10) {
          const response = await realOffersApi.getOffers({
            category: category,
            page: currentPage,
            limit: pageLimit,
          });

          if (response.success && response.data) {
            const offers = response.data.data || response.data || [];

            if (Array.isArray(offers)) {
              allOffersData = [...allOffersData, ...offers];
              if (offers.length < pageLimit) {
                hasMore = false;
              } else {
                currentPage++;
              }
            } else {
              hasMore = false;
            }
          } else {
            hasMore = false;
            if (currentPage === 1) {
              setError(response.message || 'Failed to load offers');
            }
          }
        }
      } else {
        // Fetch all offers from API (max limit is 50, so we'll fetch in batches)
        let currentPage = 1;
        const pageLimit = 50; // API max limit
        let hasMore = true;

        // Fetch offers in batches until we get all
        while (hasMore && currentPage <= 10) { // Max 10 pages to avoid infinite loops
          const response = await realOffersApi.getOffers({
            page: currentPage,
            limit: pageLimit,
          });

          if (response.success && response.data) {
            const offers = response.data.data || response.data || [];
            
            if (Array.isArray(offers)) {
              allOffersData = [...allOffersData, ...offers];
              // If we got less than the limit, we've reached the end
              if (offers.length < pageLimit) {
                hasMore = false;
              } else {
                currentPage++;
              }
            } else {
              hasMore = false;
            }
          } else {
            hasMore = false;
            if (currentPage === 1) {
              setError(response.message || 'Failed to load offers');
            }
          }
        }
      }

      setAllOffers(allOffersData);
      
      if (allOffersData.length === 0 && !error) {
        setError('No offers found');
      }
    } catch (error) {
      setError('Failed to load offers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllOffers();
    fetchUserPoints();
  }, [category, discount]); // Reload when category or discount changes

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllOffers();
  };

  const handleBack = () => {
    router.back();
  };

  const handleShare = async () => {
    try {
      await shareOffersPage();
    } catch (error) {
      // silently handle
    }
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  const handleOfferPress = (offer: Offer) => {
    router.push(`/offers/${offer._id}` as any);
  };

  const ProductCard = ({ offer }: { offer: Offer }) => {
    const [imageError, setImageError] = React.useState(false);

    return (
      <Pressable 
        style={styles.productCard}
        onPress={() => handleOfferPress(offer)}
      >
        {imageError || !offer.image ? (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="image-outline" size={32} color="#ccc" />
          </View>
        ) : (
          <CachedImage 
            source={offer.image} 
            style={styles.productImage}
            contentFit="cover"
            onError={() => {
              setImageError(true);
            }}
            onLoad={() => {
              setImageError(false);
            }}
          />
        )}
        
        <View style={styles.productInfo}>
          <ThemedText style={styles.productTitle} numberOfLines={2}>
            {offer.title}
          </ThemedText>
          <ThemedText style={styles.cashBack}>
            Upto {offer.cashbackPercentage}% cash back
          </ThemedText>
          {offer.store?.name && (
            <ThemedText style={styles.storeName} numberOfLines={1}>
              {offer.store.name}
            </ThemedText>
          )}
          {offer.distance && (
            <View style={styles.distanceContainer}>
              <Ionicons name="location-outline" size={12} color={colors.midGray} />
              <ThemedText style={styles.distance}>{offer.distance} km away</ThemedText>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - Same as Offers Page */}
      <LinearGradient
        colors={[colors.brand.purpleLight, colors.brand.purpleMedium]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.text.inverse} />
          </Pressable>
          
          <View style={styles.headerCenter}>
            <Pressable 
              style={styles.pointsContainer}
              onPress={() => router.push('/coins')}
            >
              <Ionicons name="star" size={16} color={colors.brand.goldBright} />
              <ThemedText style={styles.pointsText}>{userPoints}</ThemedText>
            </Pressable>
          </View>
          
          <View style={styles.headerRight}>
            <Pressable onPress={handleShare} style={styles.headerButton}>
              <Ionicons name="share-outline" size={20} color={Colors.text.inverse} />
            </Pressable>
            <Pressable onPress={handleFavorite} style={styles.headerButton}>
              <Ionicons 
                name={isFavorited ? "heart" : "heart-outline"} 
                size={20} 
                color={isFavorited ? colors.error : "white"} 
              />
            </Pressable>
          </View>
        </View>

        {/* Mega Offers Banner */}
        <View style={styles.bannerContainer}>
          <View style={styles.megaOffersBanner}>
            <ThemedText style={styles.megaOffersText}>MEGA</ThemedText>
            <View style={styles.offersTextContainer}>
              <ThemedText style={styles.offersText}>OFFERS</ThemedText>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Scalloped Edge */}
      <View style={styles.scalloped}>
        <View style={styles.scallopedInner} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>{getCategoryTitle()}</ThemedText>
          <ThemedText style={styles.offersCount}>{allOffers.length} offers</ThemedText>
        </View>

        {/* Loading State */}
        {loading && (
          <CardGridSkeleton />
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <Pressable style={styles.retryButton} onPress={loadAllOffers}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </Pressable>
          </View>
        )}

        {/* Offers Grid */}
        {!loading && !error && (
          <View style={styles.productsGrid}>
            {allOffers.map((offer) => (
              <ProductCard key={offer._id} offer={offer} />
            ))}
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && allOffers.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={64} color="#ccc" />
            <ThemedText style={styles.emptyText}>No offers available</ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 120,
    paddingHorizontal: Spacing.base,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.xl,
    gap: Spacing.xs,
  },
  pointsText: {
    color: Colors.text.inverse,
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContainer: {
    alignItems: 'center',
  },
  megaOffersBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  megaOffersText: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.text.inverse,
    backgroundColor: colors.brand.indigo,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    transform: [{ rotate: '-5deg' }],
  },
  offersTextContainer: {
    backgroundColor: colors.brand.goldBright,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    transform: [{ rotate: '5deg' }],
  },
  offersText: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.text.primary,
  },
  scalloped: {
    height: 20,
    backgroundColor: Colors.brand.purple,
    position: 'relative',
  },
  scallopedInner: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: Colors.background.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  contentContainer: {
    padding: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  offersCount: {
    ...Typography.body,
    color: Colors.text.tertiary,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 10,
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  productTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  storeName: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
    marginBottom: 2,
  },
  cashBack: {
    ...Typography.bodySmall,
    color: Colors.brand.purple,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  distance: {
    ...Typography.bodySmall,
    color: Colors.text.tertiary,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodyLarge,
    color: Colors.text.tertiary,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: Spacing.md,
  },
  errorText: {
    ...Typography.bodyLarge,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.brand.purple,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    marginTop: 10,
  },
  retryButtonText: {
    color: Colors.text.inverse,
    ...Typography.body,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.bodyLarge,
    color: Colors.text.tertiary,
  },
});

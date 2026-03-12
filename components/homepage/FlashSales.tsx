import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import flashSaleApi, { FlashSaleItem } from '@/services/flashSaleApi';
import { useRegion } from '@/contexts/RegionContext';

interface FlashSaleProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  stock: number;
  discount: number;
  endTime: Date;
}

interface FlashSalesProps {
  onViewAllPress?: () => void;
  onProductPress?: (productId: string) => void;
}

// Transform backend data to frontend format
// Handles both FlashSale model and Offer model with metadata.flashSale
const transformFlashSaleData = (item: any): FlashSaleProduct => {
  // Handle Offer format (from /api/offers/flash-sales)
  const flashSaleData = item.metadata?.flashSale || {};

  // Get prices - try multiple sources
  let originalPrice = item.originalPrice ||
    flashSaleData.originalPrice ||
    item.metadata?.flashSale?.originalPrice ||
    0;

  let salePrice = item.flashSalePrice ||
    flashSaleData.salePrice ||
    item.discountedPrice ||
    item.metadata?.flashSale?.salePrice ||
    0;

  // If still no prices, try product pricing
  const product = item.products?.[0];
  if (!originalPrice && product?.pricing) {
    originalPrice = product.pricing.original || product.pricing.selling || 0;
  }
  if (!salePrice && originalPrice && item.discountPercentage) {
    salePrice = originalPrice - (originalPrice * item.discountPercentage / 100);
  }

  // Get image - try multiple sources
  let image = item.image || flashSaleData.image || '';
  if (product?.images && product.images.length > 0) {
    image = product.images[0].url || image;
  }

  // Calculate stock
  const stock = item.stock ||
    flashSaleData.stock ||
    (item.maxQuantity ? Math.max(0, item.maxQuantity - (item.soldQuantity || 0)) : 10);

  // Get discount percentage
  const discount = item.discountPercentage ||
    item.cashbackPercentage ||
    (originalPrice && salePrice ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0);

  // Get end time
  const endTime = item.endTime ||
    flashSaleData.endTime ||
    item.metadata?.flashSale?.endTime ||
    item.validity?.endDate ||
    new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24h from now

  return {
    id: item._id || item.id,
    name: item.title || product?.name || 'Flash Sale Item',
    image,
    price: Math.round(salePrice),
    originalPrice: Math.round(originalPrice),
    stock,
    discount: Math.round(discount),
    endTime: new Date(endTime),
  };
};

// Calculate time remaining
const calculateTimeLeft = (endTime: Date): { hours: number; minutes: number; seconds: number } => {
  const now = new Date().getTime();
  const end = endTime.getTime();
  const diff = Math.max(0, end - now);

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
};

// Skeleton card component
const SkeletonCard: React.FC = () => {
  const [shimmerAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.productCard}>
      <Animated.View style={[styles.skeletonImage, { opacity }]} />
      <View style={styles.productInfo}>
        <Animated.View style={[styles.skeletonName, { opacity }]} />
        <View style={styles.priceRow}>
          <Animated.View style={[styles.skeletonPrice, { opacity }]} />
          <Animated.View style={[styles.skeletonOriginalPrice, { opacity }]} />
        </View>
        <View style={styles.footerRow}>
          <Animated.View style={[styles.skeletonSavings, { opacity }]} />
          <Animated.View style={[styles.skeletonCoins, { opacity }]} />
        </View>
      </View>
    </View>
  );
};

const FlashSales: React.FC<FlashSalesProps> = ({
  onViewAllPress,
  onProductPress,
}) => {
  const router = useRouter();
  const { getCurrencySymbol, getLocale } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const locale = getLocale();
  const [products, setProducts] = useState<FlashSaleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const earliestEndTime = useRef<Date | null>(null);

  // Fetch flash sales from API
  const fetchFlashSales = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await flashSaleApi.getActiveFlashSales();

      if (response.success && response.data && response.data.length > 0) {
        const transformedProducts = response.data
          .filter((item: any) => item && (item._id || item.id)) // Filter out undefined/null items
          .map(transformFlashSaleData)
          .filter(product => product && product.stock > 0 && product.price > 0); // Only show items with stock and valid price

        setProducts(transformedProducts);

        // Find earliest end time for countdown
        if (transformedProducts.length > 0) {
          const earliest = transformedProducts.reduce((min, product) =>
            product.endTime < min ? product.endTime : min,
            transformedProducts[0].endTime
          );
          earliestEndTime.current = earliest;
          setTimeLeft(calculateTimeLeft(earliest));
        }
      } else {
        // No active flash sales
        setProducts([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFlashSales();
  }, [fetchFlashSales]);

  // Countdown timer - updates every second
  useEffect(() => {
    if (!earliestEndTime.current) return;

    timerRef.current = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(earliestEndTime.current!);
      setTimeLeft(newTimeLeft);

      // If timer expired, refetch to get new flash sales
      if (newTimeLeft.hours === 0 && newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        // Refetch after a short delay
        setTimeout(() => fetchFlashSales(), 2000);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [products, fetchFlashSales]);

  const handleProductPress = (offerId: string) => {
    // Track click
    flashSaleApi.trackClick(offerId);

    if (onProductPress) {
      onProductPress(offerId);
    } else {
      // Navigate to offer detail page
      router.push(`/offers/${offerId}`);
    }
  };

  const handleViewAll = () => {
    if (onViewAllPress) {
      onViewAllPress();
    } else {
      // Navigate to offers page with flash sale filter or dedicated flash sales page
      router.push('/offers');
    }
  };

  const handleRetry = () => {
    fetchFlashSales();
  };

  const calculateSavings = (original: number, current: number): number => {
    return original - current;
  };

  const calculateCoins = (price: number): number => {
    return Math.round(price * 0.1);
  };

  // Format time display
  const formatTime = () => {
    if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m left`;
    }
    if (timeLeft.minutes > 0) {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s left`;
    }
    return `${timeLeft.seconds}s left`;
  };

  // Render loading skeleton
  const renderLoading = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      nestedScrollEnabled={true}
      contentContainerStyle={styles.productsContainer}
    >
      {[1, 2, 3].map((key) => (
        <SkeletonCard key={key} />
      ))}
    </ScrollView>
  );

  // Render error state
  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
      <Text style={styles.errorText}>{error}</Text>
      <Pressable
        onPress={handleRetry}
       
        style={styles.retryButton}
      >
        <Ionicons name="refresh" size={16} color="#FFFFFF" />
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );

  // Render empty state - don't show the section if no flash sales
  if (!loading && !error && products.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="flash" size={20} color="#ffcd57" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Flash Sales</Text>
            <Text style={styles.subtitle}>Ending soon - Limited stock</Text>
          </View>
        </View>
        {/* Countdown Timer */}
        {!loading && !error && products.length > 0 && (
          <View style={styles.countdownContainer}>
            <View style={styles.countdownDot} />
            <Text style={styles.countdownText}>{formatTime()}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      {loading && renderLoading()}
      {!loading && error && renderError()}
      {!loading && !error && products.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled={true}
          contentContainerStyle={styles.productsContainer}
        >
          {products.map((product) => {
            const savings = calculateSavings(product.originalPrice, product.price);
            const coins = calculateCoins(product.price);

            return (
              <Pressable
                key={product.id}
                onPress={() => handleProductPress(product.id)}
               
                style={styles.productCard}
              >
                {/* Image Container */}
                <View style={styles.imageContainer}>
                  <CachedImage
                    source={product.image || 'https://via.placeholder.com/150?text=Flash+Sale'}
                    style={styles.productImage}
                    contentFit="cover"
                  />
                  {/* Discount Badge */}
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                      {product.discount}% OFF
                    </Text>
                  </View>
                  {/* Stock Badge */}
                  <View style={[
                    styles.stockBadge,
                    product.stock <= 3 && styles.stockBadgeLow
                  ]}>
                    <Text style={styles.stockText}>{product.stock} left</Text>
                  </View>
                </View>

                {/* Product Info */}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.currentPrice}>
                      {currencySymbol}{product.price.toLocaleString(locale)}
                    </Text>
                    {product.originalPrice > product.price && (
                      <Text style={styles.originalPrice}>
                        {currencySymbol}{product.originalPrice.toLocaleString(locale)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.footerRow}>
                    {savings > 0 && (
                      <Text style={styles.savingsText}>
                        Save {currencySymbol}{savings.toLocaleString(locale)}
                      </Text>
                    )}
                    <View style={styles.coinsContainer}>
                      <Ionicons name="star" size={12} color="#FBBF24" />
                      <Text style={styles.coinsText}>{coins} coins</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a3a52',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 181, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 181, 0.5)',
  },
  countdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffcd57',
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a3a52',
  },
  productsContainer: {
    gap: 12,
    paddingRight: 8,
  },
  productCard: {
    width: 176,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 205, 87, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#ffcd57',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  imageContainer: {
    width: '100%',
    height: 128,
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffd7b5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a3a52',
  },
  stockBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockBadgeLow: {
    backgroundColor: 'rgba(255, 205, 87, 0.9)',
  },
  stockText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a3a52',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a3a52',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffcd57',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FBBF24',
  },
  // Skeleton styles
  skeletonImage: {
    width: '100%',
    height: 128,
    backgroundColor: '#E5E7EB',
  },
  skeletonName: {
    width: '80%',
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonPrice: {
    width: 70,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonOriginalPrice: {
    width: 50,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonSavings: {
    width: 60,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonCoins: {
    width: 50,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  // Error styles
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FlashSales;

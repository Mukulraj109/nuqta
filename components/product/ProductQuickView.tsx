import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { ProductItem } from '@/types/homepage.types';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/hooks/useToast';
import productsApi from '@/services/productsApi';
import { VariantSelection } from '@/components/cart/ProductVariantModal';
import { useRegion } from '@/contexts/RegionContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProductQuickViewProps {
  visible: boolean;
  productId: string;
  onClose: () => void;
  onViewFullDetails?: () => void;
  onAddToCart?: (product: ProductItem, variant?: VariantSelection) => void;
}

interface ProductDetails extends ProductItem {
  images?: Array<{ url: string; alt?: string }>;
  fullDescription?: string;
  variants?: Array<{
    id: string;
    size?: string;
    color?: string;
    colorHex?: string;
    sku: string;
    price: number;
    stock: number;
    available: boolean;
  }>;
}

function ProductQuickView({
  visible,
  productId,
  onClose,
  onViewFullDetails,
  onAddToCart,
}: ProductQuickViewProps) {
  const { getCurrencySymbol, getLocale } = useRegion();
  const locale = getLocale();
  const currencySymbol = getCurrencySymbol();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<VariantSelection | undefined>();
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const { actions: cartActions } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { showSuccess, showError } = useToast();

  // Load product details
  useEffect(() => {
    if (visible && productId) {
      loadProductDetails();
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset state when modal closes
      setProduct(null);
      setCurrentImageIndex(0);
      setQuantity(1);
      setSelectedVariant(undefined);
      setExpandedDescription(false);
      setError(null);
    }
  }, [visible, productId]);

  const loadProductDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await productsApi.getProductById(productId);

      if (response.success && response.data) {
        setProduct(response.data as ProductDetails);
      } else {
        setError('Failed to load product details');
      }
    } catch (err) {
      setError('Failed to load product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;

    setAddingToCart(true);
    try {
      const mainImage = product.images?.[0]?.url || product.image;
      const basePrice = product.price.current || (product.price as any);

      const cartItem = {
        id: product.id,
        productId: product.id,
        name: product.name,
        brand: product.brand,
        image: mainImage,
        originalPrice: product.price.original || basePrice,
        discountedPrice: basePrice,
        quantity: quantity,
        selected: true,
        addedAt: new Date().toISOString(),
        category: product.category,
        ...(selectedVariant && { variant: selectedVariant }),
      };

      if (onAddToCart) {
        onAddToCart(product, selectedVariant);
      } else {
        await cartActions.addItem(cartItem);
      }

      showSuccess(`Added ${quantity} ${quantity > 1 ? 'items' : 'item'} to cart!`);
      handleClose();
    } catch (error) {
      showError('Failed to add to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;

    try {
      const inWishlist = isInWishlist(product.id);

      if (inWishlist) {
        await removeFromWishlist(product.id);
        showSuccess('Removed from wishlist');
      } else {
        const mainImage = product.images?.[0]?.url || product.image;
        await addToWishlist({
          productId: product.id,
          productName: product.name,
          productImage: mainImage,
          price: product.price.current,
          originalPrice: product.price.original,
          discount: product.price.discount,
          rating: typeof product.rating?.value === 'string'
            ? parseFloat(product.rating.value)
            : product.rating?.value || 0,
          reviewCount: product.rating?.count || 0,
          brand: product.brand,
          category: product.category,
          availability: product.availabilityStatus || 'IN_STOCK',
        });
        showSuccess('Added to wishlist');
      }
    } catch (error) {
      showError('Failed to update wishlist');
    }
  };

  const handleShare = async () => {
    if (!product) return;

    try {
      const message = `Check out ${product.name} from ${product.brand}!\nPrice: ${currencySymbol}${product.price.current.toLocaleString(locale)}`;

      await Share.share({
        message,
        title: product.name,
      });
    } catch (error) {
      // silently handle
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const handleVariantSelect = (type: 'size' | 'color', value: string) => {
    setSelectedVariant(prev => ({
      ...prev,
      [type]: value,
    }));
  };

  const renderImageCarousel = () => {
    if (!product) return null;

    const images = product.images?.map(img => img.url) || [product.image];

    return (
      <View style={styles.imageCarousel}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentImageIndex(index);
          }}
          scrollEventThrottle={16}
        >
          {images.map((imageUrl, index) => (
            <CachedImage
              key={index}
              source={imageUrl}
              style={styles.productImage}
              contentFit="cover"
            />
          ))}
        </ScrollView>

        {/* Image indicators */}
        {images.length > 1 && (
          <View style={styles.imageIndicators}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.activeIndicator,
                ]}
              />
            ))}
          </View>
        )}

        {/* Wishlist and Share buttons */}
        <View style={styles.imageActions}>
          <Pressable
            style={styles.iconButton}
            onPress={handleWishlistToggle}
           
          >
            <Ionicons
              name={isInWishlist(product.id) ? 'heart' : 'heart-outline'}
              size={24}
              color={isInWishlist(product.id) ? '#EF4444' : '#1F2937'}
            />
          </Pressable>

          <Pressable
            style={styles.iconButton}
            onPress={handleShare}
           
          >
            <Ionicons name="share-social-outline" size={24} color="#1F2937" />
          </Pressable>
        </View>
      </View>
    );
  };

  const renderVariantSelector = () => {
    if (!product?.variants || product.variants.length === 0) return null;

    const sizes = Array.from(new Set(product.variants.filter(v => v.size).map(v => v.size)));
    const colors = Array.from(new Set(product.variants.filter(v => v.color).map(v => v.color)));

    return (
      <View style={styles.variantSection}>
        {sizes.length > 0 && (
          <View style={styles.variantGroup}>
            <Text style={styles.variantLabel}>Size</Text>
            <View style={styles.variantOptions}>
              {sizes.map((size) => (
                <Pressable
                  key={size}
                  style={[
                    styles.sizeOption,
                    selectedVariant?.size === size && styles.selectedSizeOption,
                  ]}
                  onPress={() => handleVariantSelect('size', size!)}
                 
                >
                  <Text
                    style={[
                      styles.sizeText,
                      selectedVariant?.size === size && styles.selectedSizeText,
                    ]}
                  >
                    {size}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {colors.length > 0 && (
          <View style={styles.variantGroup}>
            <Text style={styles.variantLabel}>Color</Text>
            <View style={styles.variantOptions}>
              {colors.map((color) => {
                const variant = product.variants?.find(v => v.color === color);
                return (
                  <Pressable
                    key={color}
                    style={[
                      styles.colorOption,
                      selectedVariant?.color === color && styles.selectedColorOption,
                    ]}
                    onPress={() => handleVariantSelect('color', color!)}
                   
                  >
                    {variant?.colorHex ? (
                      <View
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: variant.colorHex },
                        ]}
                      />
                    ) : (
                      <Text style={styles.colorText}>{color}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderStockBadge = () => {
    if (!product) return null;

    const status = product.availabilityStatus;
    const stock = product.inventory?.stock;

    if (status === 'out_of_stock') {
      return (
        <View style={[styles.stockBadge, styles.outOfStock]}>
          <Text style={styles.stockBadgeText}>Out of Stock</Text>
        </View>
      );
    }

    if (status === 'low_stock' && stock) {
      return (
        <View style={[styles.stockBadge, styles.lowStock]}>
          <Text style={styles.stockBadgeText}>Only {stock} left!</Text>
        </View>
      );
    }

    return (
      <View style={[styles.stockBadge, styles.inStock]}>
        <Text style={styles.stockBadgeText}>In Stock</Text>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      );
    }

    if (error || !product) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Product not found'}</Text>
          <Pressable style={styles.retryButton} onPress={loadProductDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    const description = product.fullDescription || product.description || '';
    const truncatedDescription = expandedDescription
      ? description
      : description.split('\n').slice(0, 3).join('\n');
    const shouldShowReadMore = description.split('\n').length > 3;

    return (
      <>
        {renderImageCarousel()}

        <ScrollView
          ref={scrollViewRef}
          style={styles.contentScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Product Info */}
          <View style={styles.infoSection}>
            <Text style={styles.brandName}>{product.brand}</Text>
            <Text style={styles.productName}>{product.name}</Text>

            {/* Rating */}
            {product.rating && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FBBF24" />
                <Text style={styles.ratingText}>
                  {typeof product.rating.value === 'string'
                    ? product.rating.value
                    : product.rating.value.toFixed(1)}
                </Text>
                <Text style={styles.ratingCount}>({product.rating.count})</Text>
              </View>
            )}

            {/* Price */}
            <View style={styles.priceSection}>
              <Text style={styles.currentPrice}>
                {currencySymbol}{product.price.current.toLocaleString(locale)}
              </Text>
              {product.price.original && product.price.original > product.price.current && (
                <>
                  <Text style={styles.originalPrice}>
                    {currencySymbol}{product.price.original.toLocaleString(locale)}
                  </Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                      {Math.round(
                        ((product.price.original - product.price.current) /
                          product.price.original) *
                          100
                      )}% OFF
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Stock Badge */}
            {renderStockBadge()}

            {/* Variant Selector */}
            {renderVariantSelector()}

            {/* Quantity Selector */}
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity</Text>
              <View style={styles.quantityControls}>
                <Pressable
                  style={styles.quantityButton}
                  onPress={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Ionicons
                    name="remove"
                    size={20}
                    color={quantity <= 1 ? '#D1D5DB' : '#1F2937'}
                  />
                </Pressable>
                <Text style={styles.quantityText}>{quantity}</Text>
                <Pressable
                  style={styles.quantityButton}
                  onPress={() => handleQuantityChange(1)}
                  disabled={quantity >= 10}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={quantity >= 10 ? '#D1D5DB' : '#1F2937'}
                  />
                </Pressable>
              </View>
            </View>

            {/* Description */}
            {description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.descriptionLabel}>Description</Text>
                <Text style={styles.descriptionText} numberOfLines={expandedDescription ? undefined : 3}>
                  {truncatedDescription}
                </Text>
                {shouldShowReadMore && (
                  <Pressable
                    onPress={() => setExpandedDescription(!expandedDescription)}
                   
                  >
                    <Text style={styles.readMoreText}>
                      {expandedDescription ? 'Read Less' : 'Read More'}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* View Full Details Link */}
            {onViewFullDetails && (
              <Pressable
                style={styles.viewDetailsButton}
                onPress={() => {
                  onViewFullDetails();
                  handleClose();
                }}
               
              >
                <Text style={styles.viewDetailsText}>View Full Details</Text>
                <Ionicons name="arrow-forward" size={16} color="#7C3AED" />
              </Pressable>
            )}
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={styles.bottomBar}>
          <Pressable
            style={[
              styles.addToCartButton,
              (addingToCart || product.availabilityStatus === 'out_of_stock') &&
                styles.addToCartButtonDisabled,
            ]}
            onPress={handleAddToCart}
            disabled={addingToCart || product.availabilityStatus === 'out_of_stock'}
           
          >
            {addingToCart ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
                <Text style={styles.addToCartText}>
                  {product.availabilityStatus === 'out_of_stock'
                    ? 'Out of Stock'
                    : 'Add to Cart'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: fadeAnim },
          ]}
        >
          <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark">
            <Pressable
              style={StyleSheet.absoluteFill}
             
              onPress={handleClose}
            />
          </BlurView>
        </Animated.View>

        {/* Content */}
        <Animated.View
          style={[
            styles.contentContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.closeButton}
              onPress={handleClose}
             
            >
              <Ionicons name="close" size={28} color="#1F2937" />
            </Pressable>
          </View>

          {renderContent()}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  contentContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imageCarousel: {
    height: 300,
    backgroundColor: '#F9FAFB',
  },
  productImage: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 3,
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
    width: 20,
  },
  imageActions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'column',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  contentScroll: {
    flex: 1,
  },
  infoSection: {
    padding: 20,
  },
  brandName: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 28,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#7C3AED',
    marginRight: 12,
  },
  originalPrice: {
    fontSize: 18,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stockBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 20,
  },
  inStock: {
    backgroundColor: '#D1FAE5',
  },
  lowStock: {
    backgroundColor: '#FEF3C7',
  },
  outOfStock: {
    backgroundColor: '#FEE2E2',
  },
  stockBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  variantSection: {
    marginBottom: 20,
  },
  variantGroup: {
    marginBottom: 16,
  },
  variantLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  variantOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minWidth: 50,
    alignItems: 'center',
  },
  selectedSizeOption: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3E8FF',
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedSizeText: {
    color: '#7C3AED',
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorOption: {
    borderColor: '#7C3AED',
    borderWidth: 3,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  quantityLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  descriptionSection: {
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6B7280',
  },
  readMoreText: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '600',
    marginTop: 8,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
    marginTop: 12,
    marginBottom: 100,
  },
  viewDetailsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7C3AED',
    marginRight: 6,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  addToCartButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default React.memo(ProductQuickView);

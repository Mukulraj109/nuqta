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
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProductItem } from '@/types/homepage.types';
import { useRegion } from '@/contexts/RegionContext';

export interface VariantSelection {
  variantId?: string;
  size?: string;
  color?: string;
  sku?: string;
  price?: number;
  stock?: number;
  [key: string]: any;
}

export interface ProductVariant {
  id: string;
  size?: string;
  color?: string;
  colorHex?: string;
  sku: string;
  price: number;
  stock: number;
  available: boolean;
  images?: string[];
  attributes?: Record<string, any>;
}

interface ProductVariantModalProps {
  visible: boolean;
  product: ProductItem;
  onConfirm: (variant: VariantSelection) => void;
  onCancel: () => void;
  loading?: boolean;
  variants?: ProductVariant[];
}

function ProductVariantModal({
  visible,
  product,
  onConfirm,
  onCancel,
  loading = false,
  variants = [],
}: ProductVariantModalProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Extract unique sizes and colors from variants
  const availableSizes = Array.from(
    new Set(variants.filter(v => v.size).map(v => v.size))
  );
  const availableColors = Array.from(
    new Set(variants.filter(v => v.color).map(v => v.color))
  );

  // Safely get product price with fallback
  // Backend can send: price.current/original OR pricing.selling/original OR pricing.basePrice/salePrice
  const pricing = (product as any).pricing;
  const priceObj = product.price;

  const productPrice =
    priceObj?.current ||
    pricing?.selling ||
    pricing?.salePrice ||
    pricing?.base ||
    (priceObj as any) ||
    (product as any).price ||
    0;

  const productOriginalPrice =
    priceObj?.original ||
    pricing?.original ||
    pricing?.basePrice ||
    pricing?.mrp ||
    productPrice;

  // Generate mock variants if none provided
  const mockVariants: ProductVariant[] = variants.length > 0 ? variants : [
    {
      id: '1',
      size: 'S',
      color: 'Black',
      colorHex: '#000000',
      sku: `${product.id}-S-BLK`,
      price: productPrice,
      stock: 10,
      available: true,
    },
    {
      id: '2',
      size: 'M',
      color: 'Black',
      colorHex: '#000000',
      sku: `${product.id}-M-BLK`,
      price: productPrice,
      stock: 15,
      available: true,
    },
    {
      id: '3',
      size: 'L',
      color: 'Black',
      colorHex: '#000000',
      sku: `${product.id}-L-BLK`,
      price: productPrice,
      stock: 5,
      available: true,
    },
    {
      id: '4',
      size: 'XL',
      color: 'Black',
      colorHex: '#000000',
      sku: `${product.id}-XL-BLK`,
      price: productPrice,
      stock: 0,
      available: false,
    },
    {
      id: '5',
      size: 'M',
      color: 'White',
      colorHex: '#FFFFFF',
      sku: `${product.id}-M-WHT`,
      price: productPrice,
      stock: 20,
      available: true,
    },
    {
      id: '6',
      size: 'L',
      color: 'Blue',
      colorHex: '#3B82F6',
      sku: `${product.id}-L-BLU`,
      price: productPrice + 100,
      stock: 8,
      available: true,
    },
  ];

  const displayVariants = variants.length > 0 ? variants : mockVariants;
  const displaySizes = availableSizes.length > 0 ? availableSizes : ['S', 'M', 'L', 'XL'];
  const displayColors = availableColors.length > 0 ? availableColors : ['Black', 'White', 'Blue'];

  // Animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Reset selections when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedSize(undefined);
      setSelectedColor(undefined);
      setSelectedVariant(null);
    }
  }, [visible]);

  // Update selected variant based on size and color
  useEffect(() => {
    if (selectedSize || selectedColor) {
      const matchedVariant = displayVariants.find(v => {
        const sizeMatch = selectedSize ? v.size === selectedSize : true;
        const colorMatch = selectedColor ? v.color === selectedColor : true;
        return sizeMatch && colorMatch;
      });

      setSelectedVariant(matchedVariant || null);
    }
  }, [selectedSize, selectedColor, displayVariants]);

  // Check if size is available for selected color
  const isSizeAvailable = (size: string) => {
    const matchingVariants = displayVariants.filter(v => {
      const sizeMatch = v.size === size;
      const colorMatch = selectedColor ? v.color === selectedColor : true;
      return sizeMatch && colorMatch;
    });
    return matchingVariants.some(v => v.available && v.stock > 0);
  };

  // Check if color is available for selected size
  const isColorAvailable = (color: string) => {
    const matchingVariants = displayVariants.filter(v => {
      const colorMatch = v.color === color;
      const sizeMatch = selectedSize ? v.size === selectedSize : true;
      return colorMatch && sizeMatch;
    });
    return matchingVariants.some(v => v.available && v.stock > 0);
  };

  // Get color hex value
  const getColorHex = (color: string): string => {
    const variant = displayVariants.find(v => v.color === color);
    return variant?.colorHex || '#CBD5E1';
  };

  const handleConfirm = () => {
    if (!selectedVariant) {
      return;
    }

    const selection: VariantSelection = {
      variantId: selectedVariant.id,
      size: selectedVariant.size,
      color: selectedVariant.color,
      sku: selectedVariant.sku,
      price: selectedVariant.price,
      stock: selectedVariant.stock,
      ...selectedVariant.attributes,
    };

    onConfirm(selection);
  };

  const canConfirm = selectedVariant && selectedVariant.available && selectedVariant.stock > 0 && !loading;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
      accessibilityViewIsModal={true}
      accessibilityLabel="Product variant selection dialog"
    >
      <Pressable
        style={styles.overlay}
       
        onPress={onCancel}
        accessibilityLabel="Close variant selector"
        accessibilityRole="button"
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerDragIndicator} />
            <View style={styles.headerContent}>
              <View style={styles.productImageContainer}>
                <CachedImage
                  source={product.image}
                  style={styles.productImage}
                  contentFit="cover"
                />
                {product.availabilityStatus === 'low_stock' && (
                  <View style={styles.lowStockBadge}>
                    <Text style={styles.lowStockText}>Low Stock</Text>
                  </View>
                )}
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={styles.productBrand}>{product.brand}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.currentPrice}>
                    {currencySymbol}{selectedVariant?.price || productPrice}
                  </Text>
                  {productOriginalPrice && productOriginalPrice > productPrice && (
                    <>
                      <Text style={styles.originalPrice}>{currencySymbol}{productOriginalPrice}</Text>
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>
                          {priceObj?.discount || Math.round(((productOriginalPrice - productPrice) / productOriginalPrice) * 100)}% OFF
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={onCancel}
             
              accessibilityLabel="Close dialog"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          {/* Body - Scrollable Variant Options */}
          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Size Selection */}
            {displaySizes.length > 0 && (
              <View style={styles.variantSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Select Size</Text>
                  {selectedSize && (
                    <Text style={styles.selectedLabel}>Selected: {selectedSize}</Text>
                  )}
                </View>
                <View style={styles.optionsGrid}>
                  {displaySizes.map((size) => {
                    const available = isSizeAvailable(size);
                    const isSelected = selectedSize === size;

                    return (
                      <Pressable
                        key={size}
                        style={[
                          styles.sizeOption,
                          isSelected && styles.sizeOptionSelected,
                          !available && styles.sizeOptionDisabled,
                        ]}
                        onPress={() => available && setSelectedSize(size)}
                        disabled={!available}
                       
                        accessibilityLabel={`Size ${size}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected, disabled: !available }}
                      >
                        <Text
                          style={[
                            styles.sizeText,
                            isSelected && styles.sizeTextSelected,
                            !available && styles.sizeTextDisabled,
                          ]}
                        >
                          {size}
                        </Text>
                        {!available && (
                          <View style={styles.unavailableLine} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Color Selection */}
            {displayColors.length > 0 && (
              <View style={styles.variantSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Select Color</Text>
                  {selectedColor && (
                    <Text style={styles.selectedLabel}>Selected: {selectedColor}</Text>
                  )}
                </View>
                <View style={styles.optionsGrid}>
                  {displayColors.map((color) => {
                    const available = isColorAvailable(color);
                    const isSelected = selectedColor === color;
                    const colorHex = getColorHex(color);

                    return (
                      <Pressable
                        key={color}
                        style={[
                          styles.colorOption,
                          isSelected && styles.colorOptionSelected,
                          !available && styles.colorOptionDisabled,
                        ]}
                        onPress={() => available && setSelectedColor(color)}
                        disabled={!available}
                       
                        accessibilityLabel={`Color ${color}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected, disabled: !available }}
                      >
                        <View
                          style={[
                            styles.colorSwatch,
                            { backgroundColor: colorHex },
                            !available && styles.colorSwatchDisabled,
                          ]}
                        >
                          {isSelected && (
                            <Ionicons
                              name="checkmark"
                              size={18}
                              color={colorHex === '#FFFFFF' || colorHex === '#F9FAFB' ? '#7C3AED' : '#FFFFFF'}
                            />
                          )}
                          {!available && (
                            <View style={styles.unavailableColorLine} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.colorText,
                            isSelected && styles.colorTextSelected,
                            !available && styles.colorTextDisabled,
                          ]}
                          numberOfLines={1}
                        >
                          {color}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Stock Information */}
            {selectedVariant && (
              <View style={styles.stockInfoContainer}>
                <View style={styles.stockInfoRow}>
                  <Ionicons
                    name={selectedVariant.stock > 10 ? 'checkmark-circle' : 'alert-circle'}
                    size={20}
                    color={selectedVariant.stock > 10 ? '#10B981' : '#F59E0B'}
                  />
                  <Text style={styles.stockInfoText}>
                    {selectedVariant.stock > 10
                      ? `In Stock (${selectedVariant.stock} available)`
                      : selectedVariant.stock > 0
                      ? `Only ${selectedVariant.stock} left!`
                      : 'Out of Stock'}
                  </Text>
                </View>
                {selectedVariant.sku && (
                  <Text style={styles.skuText}>SKU: {selectedVariant.sku}</Text>
                )}
              </View>
            )}

            {/* Selection Prompt */}
            {!selectedSize && !selectedColor && (
              <View style={styles.promptContainer}>
                <Ionicons name="information-circle-outline" size={20} color="#8B5CF6" />
                <Text style={styles.promptText}>
                  Please select {displaySizes.length > 0 ? 'size' : ''}
                  {displaySizes.length > 0 && displayColors.length > 0 ? ' and ' : ''}
                  {displayColors.length > 0 ? 'color' : ''} to continue
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer - Action Buttons */}
          <View style={styles.footer}>
            <Pressable
              style={styles.cancelButton}
              onPress={onCancel}
             
              disabled={loading}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[
                styles.confirmButton,
                !canConfirm && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!canConfirm}
             
              accessibilityLabel="Add to cart"
              accessibilityRole="button"
              accessibilityState={{ disabled: !canConfirm }}
            >
              {!canConfirm ? (
                <View style={styles.confirmGradient}>
                  <Text style={[styles.confirmText, styles.confirmTextDisabled]}>
                    Select Options
                  </Text>
                </View>
              ) : (
                <LinearGradient
                  colors={loading ? ['#9CA3AF', '#6B7280'] : ['#8B5CF6', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmGradient}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.confirmText}>Adding...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="cart" size={20} color="#FFFFFF" />
                      <Text style={styles.confirmText}>Add to Cart</Text>
                    </>
                  )}
                </LinearGradient>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerDragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  lowStockBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  lowStockText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 20,
  },
  productBrand: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#7C3AED',
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  discountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    maxHeight: height * 0.5,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  variantSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  selectedLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sizeOption: {
    minWidth: 70,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sizeOptionSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  sizeOptionDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  sizeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  sizeTextSelected: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  sizeTextDisabled: {
    color: '#9CA3AF',
  },
  unavailableLine: {
    position: 'absolute',
    width: '120%',
    height: 2,
    backgroundColor: '#EF4444',
    transform: [{ rotate: '-45deg' }],
  },
  colorOption: {
    minWidth: 90,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 6,
  },
  colorOptionSelected: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  colorOptionDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  colorSwatchDisabled: {
    opacity: 0.5,
  },
  unavailableColorLine: {
    position: 'absolute',
    width: '140%',
    height: 2,
    backgroundColor: '#EF4444',
    transform: [{ rotate: '-45deg' }],
  },
  colorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
  },
  colorTextSelected: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  colorTextDisabled: {
    color: '#9CA3AF',
  },
  stockInfoContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  stockInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  stockInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  skuText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  promptContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    marginBottom: 16,
  },
  promptText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.2,
  },
  confirmButton: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.6,
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    backgroundColor: '#E5E7EB',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  confirmTextDisabled: {
    color: '#9CA3AF',
  },
});

export default React.memo(ProductVariantModal);

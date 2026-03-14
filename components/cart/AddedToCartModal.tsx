import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { formatPrice } from '@/utils/priceFormatter';
import { useRegion } from '@/contexts/RegionContext';
import { triggerImpact } from '@/utils/haptics';

interface AddedToCartModalProps {
  visible: boolean;
  onClose: () => void;
  onViewCart: () => void;
  product: {
    id: string;
    name: string;
    image: string;
    price: number;
    quantity?: number;
  };
  cartItemCount?: number;
  cartTotal?: number;
}

function AddedToCartModal({
  visible,
  onClose,
  onViewCart,
  product,
  cartItemCount = 1,
  cartTotal,
}: AddedToCartModalProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const slideAnim = React.useRef(new Animated.Value(300)).current;

  React.useEffect(() => {
    if (visible) {
      triggerImpact('Light');
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const safePrice = typeof product.price === 'number' ? product.price : 0;
  const safeQuantity = typeof product.quantity === 'number' ? product.quantity : 1;
  const calculatedTotal = safePrice * safeQuantity;
  const displayTotal = typeof cartTotal === 'number' ? cartTotal : calculatedTotal;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      accessibilityViewIsModal={true}
      accessibilityLabel="Added to cart confirmation dialog"
    >
      <Pressable
        style={styles.overlay}
       
        onPress={onClose}
        accessibilityLabel="Close added to cart"
        accessibilityRole="button"
        accessibilityHint="Double tap to close this dialog"
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Success Header */}
          <View style={styles.header}>
            <View style={styles.successIconContainer}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.successIconGradient}
              >
                <Ionicons name="checkmark-circle" size={28} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Added to Cart</Text>
              <Text style={styles.headerSubtitle}>
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in cart
              </Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
             
              accessibilityLabel="Close dialog"
              accessibilityRole="button"
              accessibilityHint="Double tap to close this dialog"
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          {/* Product Info */}
          <View style={styles.productContainer}>
            <View style={styles.productImageContainer}>
              <CachedImage
                source={product.image}
                style={styles.productImage}
                contentFit="cover"
              />
            </View>
            <View style={styles.productDetails}>
              <Text style={styles.productName} numberOfLines={2}>
                {product.name || 'Product'}
              </Text>
              <Text style={styles.productPrice}>
                {formatPrice(safePrice, 'INR') || `${currencySymbol}0.00`}
              </Text>
              {safeQuantity > 1 && (
                <Text style={styles.productQuantity}>Qty: {safeQuantity}</Text>
              )}
            </View>
          </View>

          {/* Cart Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(displayTotal, 'INR') || `${currencySymbol}0.00`}
              </Text>
            </View>
            <View style={styles.deliveryInfo}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.deliveryText}>
                Eligible for FREE delivery
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <Pressable
              style={styles.viewCartButton}
              onPress={() => {
                onClose();
                onViewCart();
              }}
             
              accessibilityLabel="View cart"
              accessibilityRole="button"
              accessibilityHint="Double tap to view your shopping cart"
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.viewCartGradient}
              >
                <Ionicons name="cart" size={20} color="#FFFFFF" />
                <Text style={styles.viewCartText}>View Cart</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={styles.continueButton}
              onPress={onClose}
             
              accessibilityLabel="Continue shopping"
              accessibilityRole="button"
              accessibilityHint="Double tap to continue shopping and close this dialog"
            >
              <Text style={styles.continueText}>Continue Shopping</Text>
            </Pressable>
          </View>

          {/* Related Products Suggestion */}
          <View style={styles.suggestionContainer}>
            <Ionicons name="gift-outline" size={18} color="#8B5CF6" />
            <Text style={styles.suggestionText}>
              Frequently bought together items available
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
);
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  successIconContainer: {
    marginRight: 12,
  },
  successIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
    marginRight: 16,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  productQuantity: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  viewCartButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  viewCartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  viewCartText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  continueButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
    letterSpacing: 0.2,
  },
  suggestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  suggestionText: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '500',
  },
});

export default React.memo(AddedToCartModal);

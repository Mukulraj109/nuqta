import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { DealCardProps } from '@/types/deals';
import { calculateDealDiscount } from '@/utils/deal-validation';
import FastImage from '@/components/common/FastImage';
import { useRegion } from '@/contexts/RegionContext';

function DealCard({
  deal,
  onAdd,
  onRemove,
  isAdded,
  onMoreDetails
}: DealCardProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [billPreview] = useState<number>(deal.minimumBill);
  const [showPreview, setShowPreview] = useState(false);
  
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const previewAnim = useRef(new Animated.Value(0)).current;

  // Calculate screen dimensions for responsive design with state updates
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const styles = useMemo(() => createStyles(screenWidth), [screenWidth]);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update screen width on orientation change with debouncing
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      // Clear any existing timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      
      // Debounce the screen width update to prevent blur during resize
      resizeTimeoutRef.current = setTimeout(() => {
        setScreenWidth(window.width);
      }, 100); // 100ms debounce
    });

    return () => {
      subscription?.remove();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // Initialize card animation
  useEffect(() => {
    Animated.spring(cardAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = deal.validUntil.getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h left`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h left`);
        } else {
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${minutes}m left`);
        }
      } else {
        setTimeLeft('Expired');
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [deal.validUntil]);

  // Handle card press with animation
  const handleCardPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setShowPreview(!showPreview);
  };

  // Handle add/remove with animation
  const handleAddPress = () => {
    if (isAdded) {
      onRemove(deal.id);
    } else {
      onAdd(deal.id);
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Toggle preview panel
  useEffect(() => {
    Animated.timing(previewAnim, {
      toValue: showPreview ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [showPreview]);

  // Calculate preview discount
  const previewResult = calculateDealDiscount(deal, billPreview);
  const savingsAmount = previewResult.discountAmount;
  const finalAmount = previewResult.finalAmount;

  // Determine badge style and content
  const badgeStyle = deal.badge ? {
    backgroundColor: deal.badge.backgroundColor,
  } : styles.defaultBadge;
  
  const badgeTextStyle = deal.badge ? {
    color: deal.badge.textColor,
  } : styles.defaultBadgeText;

  // Check if deal is expiring soon (within 24 hours)
  const isExpiringSoon = () => {
    const now = new Date().getTime();
    const expiry = deal.validUntil.getTime();
    const hoursLeft = (expiry - now) / (1000 * 60 * 60);
    return hoursLeft <= 24 && hoursLeft > 0;
  };

  return (
    <Animated.View
      style={[
        styles.card,
        isAdded && styles.cardSelected,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: cardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            })},
          ],
          opacity: cardAnim,
        },
      ]}
    >
      <Pressable
        onPress={handleCardPress}
       
        style={styles.cardContent}
      >
        {/* Deal Image */}
        {deal.image && (
          <View style={styles.dealImageContainer}>
            <FastImage
              source={deal.image}
              style={styles.dealImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              {/* Deal Priority Indicator */}
              {deal.priority <= 2 && (
                <View style={styles.priorityBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <ThemedText style={styles.priorityText}>Featured</ThemedText>
                </View>
              )}

              {/* Discount Badge */}
              <View style={[styles.discountBadge, badgeStyle]}>
                <ThemedText style={[styles.discountText, badgeTextStyle]}>
                  {deal.badge?.text || `Save ${deal.discountValue}%`}
                </ThemedText>
              </View>

              {/* Expiry Warning */}
              {isExpiringSoon() && (
                <View style={styles.expiryWarning}>
                  <Ionicons name="time-outline" size={12} color="#EF4444" />
                  <ThemedText style={styles.expiryText}>{timeLeft}</ThemedText>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Badges without image */}
        {!deal.image && (
          <>
            {/* Deal Priority Indicator */}
            {deal.priority <= 2 && (
              <View style={styles.priorityBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <ThemedText style={styles.priorityText}>Featured</ThemedText>
              </View>
            )}

            {/* Discount Badge */}
            <View style={[styles.discountBadge, badgeStyle]}>
              <ThemedText style={[styles.discountText, badgeTextStyle]}>
                {deal.badge?.text || `Save ${deal.discountValue}%`}
              </ThemedText>
            </View>

            {/* Expiry Warning */}
            {isExpiringSoon() && (
              <View style={styles.expiryWarning}>
                <Ionicons name="time-outline" size={12} color="#EF4444" />
                <ThemedText style={styles.expiryText}>{timeLeft}</ThemedText>
              </View>
            )}
          </>
        )}

        {/* Main Content */}
        <View style={[styles.dealContent, deal.image && styles.dealContentWithImage]}>
          <ThemedText style={styles.dealTitle}>{deal.title}</ThemedText>
          
          {deal.description && (
            <ThemedText style={styles.dealDescription}>{deal.description}</ThemedText>
          )}

          <ThemedText style={styles.minimumBill}>
            Minimum bill {currencySymbol}{deal.minimumBill.toLocaleString()}
          </ThemedText>

          {/* Deal Category Badge */}
          <View style={styles.categoryContainer}>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(deal.category) }]}>
              <ThemedText style={styles.categoryText}>
                {getCategoryDisplayName(deal.category)}
              </ThemedText>
            </View>
          </View>

          {/* Availability Indicator */}
          <View style={styles.availabilityContainer}>
            <Ionicons 
              name={deal.isOfflineOnly ? "storefront-outline" : "globe-outline"} 
              size={14} 
              color="#6B7280" 
            />
            <ThemedText style={styles.availabilityText}>
              {deal.isOfflineOnly ? 'In-store only' : 'Online & In-store'}
            </ThemedText>
            <Pressable onPress={() => onMoreDetails(deal.id)} style={styles.moreDetailsButton}>
              <ThemedText style={styles.moreDetailsText}>Details</ThemedText>
            </Pressable>
          </View>

          {/* Usage Limit */}
          {deal.usageLimit && (
            <View style={styles.usageContainer}>
              <Ionicons name="repeat-outline" size={14} color="#ffcd57" />
              <ThemedText style={styles.usageText}>
                {deal.usageLimit - (deal.usageCount || 0)} uses remaining
              </ThemedText>
            </View>
          )}

          {/* Quick Preview Toggle */}
          <Pressable 
            style={styles.previewToggle}
            onPress={() => setShowPreview(!showPreview)}
          >
            <ThemedText style={styles.previewToggleText}>
              {showPreview ? 'Hide' : 'Preview'} savings
            </ThemedText>
            <Ionicons
              name={showPreview ? "chevron-up-outline" : "chevron-down-outline"}
              size={16}
              color="#ffcd57"
            />
          </Pressable>
        </View>

        {/* Animated Preview Panel */}
        <Animated.View 
          style={[
            styles.previewPanel,
            {
              maxHeight: previewAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 160], // Increased height for better visibility
              }),
              opacity: previewAnim,
            }
          ]}
        >
          <View style={styles.previewContent}>
            <ThemedText style={styles.previewTitle}>Savings Preview</ThemedText>
            <View style={styles.previewRow}>
              <ThemedText style={styles.previewLabel}>Bill Amount:</ThemedText>
              <ThemedText style={styles.previewValue}>{currencySymbol}{billPreview.toLocaleString()}</ThemedText>
            </View>
            <View style={styles.previewRow}>
              <ThemedText style={styles.previewLabel}>You Save:</ThemedText>
              <ThemedText style={styles.previewSavings}>{currencySymbol}{savingsAmount.toLocaleString()}</ThemedText>
            </View>
            <View style={[styles.previewRow, styles.previewFinal]}>
              <ThemedText style={styles.previewLabel}>Final Amount:</ThemedText>
              <ThemedText style={styles.previewFinalAmount}>{currencySymbol}{finalAmount.toLocaleString()}</ThemedText>
            </View>
          </View>
        </Animated.View>

        {/* Terms (first 2 only) */}
        <View style={styles.termsContainer}>
          {deal.terms.slice(0, 2).map((term, index) => (
            <View key={index} style={styles.termRow}>
              <View style={styles.termBullet} />
              <ThemedText style={styles.termText}>{term}</ThemedText>
            </View>
          ))}
        </View>

        {/* Action Button */}
        <Pressable
          style={[
            styles.actionButton,
            isAdded && styles.actionButtonSelected
          ]}
          onPress={handleAddPress}
         
        >
          <Ionicons 
            name={isAdded ? "checkmark-circle" : "add-circle-outline"} 
            size={20} 
            color="#fff" 
            style={styles.actionButtonIcon}
          />
          <ThemedText style={styles.actionButtonText}>
            {isAdded ? 'Added' : 'Add Deal'}
          </ThemedText>
        </Pressable>
      </Pressable>
    </Animated.View>  
  );
}

export default React.memo(DealCard);

// Helper functions
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'instant-discount': '#ffcd57',
    'cashback': '#10B981',
    'buy-one-get-one': '#FFC857',
    'seasonal': '#EF4444',
    'first-time': '#3B82F6',
    'loyalty': '#00796B',
    'clearance': '#DC2626',
  };
  return colors[category] || '#6B7280';
};

const getCategoryDisplayName = (category: string): string => {
  const names: Record<string, string> = {
    'instant-discount': 'Instant',
    'cashback': 'Cashback',
    'buy-one-get-one': 'BOGO',
    'seasonal': 'Seasonal',
    'first-time': 'New User',
    'loyalty': 'VIP',
    'clearance': 'Clearance',
  };
  return names[category] || category;
};

const createStyles = (screenWidth: number) => {
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
  
  // Responsive padding based on screen size
  const rightPadding = isSmallScreen ? 60 : isMediumScreen ? 70 : 80;
  const cardPadding = isSmallScreen ? 20 : 24; // Increased padding for less compact feel
  
  return StyleSheet.create({
    card: {
      backgroundColor: '#fff',
      borderRadius: isSmallScreen ? 16 : 20,
      marginBottom: 16,
      marginHorizontal: 0, // Full width - no horizontal margin
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
        web: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      }),
      borderWidth: 1,
      borderColor: '#E5E7EB',
      overflow: 'hidden',
    },
    cardSelected: {
      borderColor: '#10B981',
      borderWidth: 2,
      ...Platform.select({
        ios: {
          shadowColor: '#10B981',
          shadowOpacity: 0.15,
        },
        android: {
          elevation: 6,
        },
        web: {
          boxShadow: '0 2px 8px rgba(16,185,129,0.15)',
        },
      }),
    },
    cardContent: {
      padding: 0, // Remove padding from cardContent, add to specific sections
      position: 'relative',
    },
    dealImageContainer: {
      width: '100%',
      height: isSmallScreen ? 180 : 200,
      position: 'relative',
      backgroundColor: '#F3F4F6',
    },
    dealImage: {
      width: '100%',
      height: '100%',
    },
    imageOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      padding: isSmallScreen ? 12 : 16,
    },
    priorityBadge: {
      position: 'absolute',
      top: isSmallScreen ? 12 : 16,
      left: isSmallScreen ? 12 : 16,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF3C7',
      paddingHorizontal: isSmallScreen ? 8 : 10,
      paddingVertical: 4,
      borderRadius: 12,
      zIndex: 5,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        android: {
          elevation: 2,
        },
        web: {
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        },
      }),
    },
    priorityText: {
      fontSize: isSmallScreen ? 9 : 10,
      fontWeight: '600',
      color: '#92400E',
      marginLeft: 3,
    },
    discountBadge: {
      position: 'absolute',
      top: isSmallScreen ? 12 : 16,
      right: isSmallScreen ? 12 : 16,
      borderRadius: 12,
      paddingHorizontal: isSmallScreen ? 10 : 14,
      paddingVertical: isSmallScreen ? 5 : 7,
      zIndex: 3,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.15,
          shadowRadius: 3,
        },
        android: {
          elevation: 3,
        },
        web: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        },
      }),
    },
    defaultBadge: {
      backgroundColor: '#E5E7EB',
    },
    discountText: {
      fontSize: isSmallScreen ? 11 : 12,
      fontWeight: '700',
    },
    defaultBadgeText: {
      color: '#374151',
    },
    expiryWarning: {
      position: 'absolute',
      top: isSmallScreen ? 50 : 58, // Position below discount badge to avoid overlap
      right: isSmallScreen ? 12 : 16,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEE2E2',
      paddingHorizontal: isSmallScreen ? 8 : 10,
      paddingVertical: 4,
      borderRadius: 12,
      zIndex: 4,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        android: {
          elevation: 2,
        },
        web: {
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        },
      }),
    },
    expiryText: {
      fontSize: isSmallScreen ? 9 : 10,
      fontWeight: '600',
      color: '#EF4444',
      marginLeft: 3,
    },
    dealContent: {
      paddingTop: isSmallScreen ? 20 : 24,
      paddingBottom: 16,
      paddingHorizontal: isSmallScreen ? 16 : 20,
    },
    dealContentWithImage: {
      paddingTop: 16, // Less padding when image is present
    },
    dealTitle: {
      fontSize: isSmallScreen ? 16 : 18,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 8,
      lineHeight: isSmallScreen ? 20 : 24,
    },
    dealDescription: {
      fontSize: isSmallScreen ? 12 : 13,
      color: '#6B7280',
      lineHeight: isSmallScreen ? 16 : 18,
      marginBottom: 12,
    },
    minimumBill: {
      fontSize: isSmallScreen ? 13 : 14,
      color: '#4B5563',
      marginBottom: 16,
      fontWeight: '500',
    },
    categoryContainer: {
      marginBottom: 14,
      alignItems: 'flex-start',
    },
    categoryBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: isSmallScreen ? 8 : 10,
      paddingVertical: isSmallScreen ? 3 : 4,
      borderRadius: 10,
      maxWidth: '80%',
    },
    categoryText: {
      fontSize: isSmallScreen ? 10 : 11,
      fontWeight: '600',
      color: '#fff',
    },
    availabilityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      flexWrap: 'wrap',
    },
    availabilityText: {
      fontSize: 12,
      color: '#6B7280',
      marginLeft: 6,
      flex: 1,
    },
    moreDetailsButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    moreDetailsText: {
      fontSize: 12,
      color: '#ffcd57',
      fontWeight: '600',
    },
    usageContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    usageText: {
      fontSize: 12,
      color: '#ffcd57',
      marginLeft: 6,
      fontWeight: '500',
    },
    previewToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      marginBottom: 8,
    },
    previewToggleText: {
      fontSize: 13,
      color: '#ffcd57',
      fontWeight: '600',
      marginRight: 4,
    },
    previewPanel: {
      backgroundColor: '#F8FAFC',
      borderRadius: 12,
      marginHorizontal: isSmallScreen ? 16 : 20,
      marginBottom: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    previewContent: {
      padding: isSmallScreen ? 14 : 16,
    },
    previewTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 8,
    },
    previewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    previewFinal: {
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      paddingTop: 6,
      marginTop: 4,
    },
    previewLabel: {
      fontSize: 12,
      color: '#6B7280',
    },
    previewValue: {
      fontSize: 12,
      color: '#374151',
      fontWeight: '500',
    },
    previewSavings: {
      fontSize: 12,
      color: '#10B981',
      fontWeight: '700',
    },
    previewFinalAmount: {
      fontSize: 13,
      color: '#111827',
      fontWeight: '700',
    },
    termsContainer: {
      marginBottom: 16,
      marginHorizontal: isSmallScreen ? 16 : 20,
    },
    termRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    termBullet: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#ffcd57',
      marginTop: 6,
      marginRight: 8,
    },
    termText: {
      fontSize: 11,
      color: '#6B7280',
      flex: 1,
      lineHeight: 16,
    },
    actionButton: {
      backgroundColor: '#ffcd57',
      borderRadius: 0, // Full width button
      paddingVertical: isSmallScreen ? 16 : 18,
      paddingHorizontal: isSmallScreen ? 16 : 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#ffcd57',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
        },
        android: {
          elevation: 3,
        },
        web: {
          boxShadow: '0 -2px 6px rgba(0,192,106,0.15)',
        },
      }),
      marginTop: 0,
      minHeight: 56, // Larger touch target
    },
    actionButtonSelected: {
      backgroundColor: '#10B981',
      ...Platform.select({
        ios: {
          shadowColor: '#10B981',
        },
        web: {
          boxShadow: '0 -2px 6px rgba(16,185,129,0.15)',
        },
      }),
    },
    actionButtonIcon: {
      marginRight: 6,
    },
    actionButtonText: {
      color: '#fff',
      fontSize: isSmallScreen ? 14 : 16,
      fontWeight: '700',
      textAlign: 'center',
    },
  });
};
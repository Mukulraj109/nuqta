/**
 * CashStoreHeroBanner Component
 *
 * Premium hero banner section for Cash Store with promotional content
 * Features: Auto-scroll, animated badges, shine effects, and better typography
 */

import React, { memo, useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CashStoreHeroBanner as HeroBannerType } from '../../../types/cash-store.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 32;
const AUTO_SCROLL_INTERVAL = 5000; // 5 seconds

interface CashStoreHeroBannerProps {
  banners: HeroBannerType[];
  isLoading?: boolean;
  onBannerPress?: (banner: HeroBannerType) => void;
}

const CashStoreHeroBanner: React.FC<CashStoreHeroBannerProps> = ({
  banners,
  isLoading = false,
  onBannerPress,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const activeIndexRef = useRef(0); // Ref to track current index without re-running effects
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;
  const badgePulseAnim = useRef(new Animated.Value(1)).current;

  // Entry animation
  useEffect(() => {
    const entryAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]);
    entryAnimation.start();

    // Start shine animation
    const shineLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    shineLoop.start();

    // Badge pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(badgePulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(badgePulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Cleanup animations on unmount
    return () => {
      entryAnimation.stop();
      shineLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Auto-scroll functionality
  useEffect(() => {
    if (banners.length <= 1) return;

    const startAutoScroll = () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
      autoScrollRef.current = setInterval(() => {
        const nextIndex = (activeIndexRef.current + 1) % banners.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        activeIndexRef.current = nextIndex;
        setActiveIndex(nextIndex);
      }, AUTO_SCROLL_INTERVAL);
    };

    startAutoScroll();

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [banners.length]); // Only re-run when banners length changes

  const handleScroll = useCallback((event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (BANNER_WIDTH + 8));
    if (index !== activeIndex && index >= 0 && index < banners.length) {
      setActiveIndex(index);
      // Reset auto-scroll timer on manual scroll
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    }
  }, [activeIndex, banners.length]);

  const handleMomentumScrollEnd = useCallback(() => {
    // Restart auto-scroll after manual interaction
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
    }
    autoScrollRef.current = setInterval(() => {
      const nextIndex = (activeIndexRef.current + 1) % banners.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    }, AUTO_SCROLL_INTERVAL);
  }, [banners.length]);

  const renderBanner = useCallback(
    ({ item, index }: { item: HeroBannerType; index: number }) => (
      <Pressable
       
        onPress={() => onBannerPress?.(item)}
        style={styles.bannerWrapper}
      >
        <Animated.View
          style={[
            styles.bannerAnimatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={item.gradientColors || ['#faf1e0', '#FFFFFF', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerCard}
          >
            {/* Shine overlay */}
            <Animated.View
              style={[
                styles.shineOverlay,
                {
                  transform: [
                    {
                      translateX: shineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-BANNER_WIDTH, BANNER_WIDTH],
                      }),
                    },
                  ],
                },
              ]}
            />

            {/* Decorative circles */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <View style={styles.decorativeCircle3} />

            {/* Badge */}
            {item.badge && (
              <Animated.View
                style={[
                  styles.badge,
                  {
                    transform: [{ scale: badgePulseAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.2)']}
                  style={styles.badgeGradient}
                >
                  <Ionicons name="flame" size={12} color="#FFFFFF" />
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </LinearGradient>
              </Animated.View>
            )}

            {/* Content */}
            <View style={styles.bannerContent}>
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: item.textColor || '#1a3a52' }]}>
                  {item.title}
                </Text>
                {item.subtitle && (
                  <Text style={[styles.subtitle, { color: item.textColor || '#1a3a52' }]}>
                    {item.subtitle}
                  </Text>
                )}

                {/* CTA Button */}
                <Pressable style={styles.ctaButton}>
                  <LinearGradient
                    colors={['#FFFFFF', '#F9FAFB']}
                    style={styles.ctaGradient}
                  >
                    <Text style={styles.ctaText}>{item.ctaText}</Text>
                    <View style={styles.ctaArrowContainer}>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </View>
                  </LinearGradient>
                </Pressable>
              </View>

              {/* Icon/Image */}
              <View style={styles.iconContainer}>
                <View style={styles.iconBackground}>
                  <Ionicons name="cart" size={44} color="#E8B896" />
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    ),
    [onBannerPress, fadeAnim, scaleAnim, shineAnim, badgePulseAnim]
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.bannerWrapper, styles.skeletonBanner]}>
          <Animated.View
            style={[
              styles.skeletonShimmer,
              {
                transform: [
                  {
                    translateX: shineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-BANNER_WIDTH, BANNER_WIDTH],
                    }),
                  },
                ],
              },
            ]}
          />
          <LinearGradient
            colors={['#E5E7EB', '#F3F4F6', '#E5E7EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bannerCard}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderBanner}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        snapToInterval={BANNER_WIDTH + 8}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        getItemLayout={(_, index) => ({
          length: BANNER_WIDTH + 8,
          offset: (BANNER_WIDTH + 8) * index,
          index,
        })}
      />

      {/* Pagination Dots */}
      {banners.length > 1 && (
        <View style={styles.pagination}>
          {banners.map((_, index) => (
            <Pressable
              key={index}
              onPress={() => {
                flatListRef.current?.scrollToIndex({ index, animated: true });
                setActiveIndex(index);
              }}
              style={styles.paginationTouchable}
            >
              <Animated.View
                style={[
                  styles.paginationDot,
                  index === activeIndex && styles.paginationDotActive,
                ]}
              />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  bannerWrapper: {
    width: BANNER_WIDTH,
    marginRight: 8,
  },
  bannerAnimatedContainer: {
    width: '100%',
  },
  bannerCard: {
    borderRadius: 20,
    padding: 24,
    minHeight: 180,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8B896',
    ...Platform.select({
      ios: {
        shadowColor: '#E8B896',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  shineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ skewX: '-20deg' }],
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,245,230,0.6)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,245,230,0.5)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: 60,
    right: 80,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,245,230,0.7)',
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 20,
    lineHeight: 20,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 24,
    gap: 10,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E8B896',
  },
  ctaArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8B896',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8B896',
    ...Platform.select({
      ios: {
        shadowColor: '#E8B896',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  paginationTouchable: {
    padding: 4,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#E8B896',
  },
  skeletonBanner: {
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    zIndex: 1,
  },
});

export default memo(CashStoreHeroBanner);

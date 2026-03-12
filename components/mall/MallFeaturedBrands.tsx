/**
 * MallFeaturedBrands Component
 *
 * Horizontal scrolling section for featured stores
 * Wrapped in gradient container matching other Mall sections
 */

import React, { memo, useCallback } from 'react';
import { BRAND } from '@/constants/brand';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MallBrand } from '../../types/mall.types';
import MallBrandCard from './cards/MallBrandCard';

interface MallFeaturedBrandsProps {
  brands: MallBrand[];
  isLoading?: boolean;
  onBrandPress: (brand: MallBrand) => void;
  onViewAllPress?: () => void;
}

const MallFeaturedBrands: React.FC<MallFeaturedBrandsProps> = ({
  brands,
  isLoading = false,
  onBrandPress,
  onViewAllPress,
}) => {
  const renderBrand = useCallback(
    ({ item }: { item: MallBrand }) => (
      <MallBrandCard brand={item} onPress={onBrandPress} width={170} />
    ),
    [onBrandPress]
  );

  const keyExtractor = useCallback((item: MallBrand) => item.id || item._id, []);

  // Loading skeleton
  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#dfebf7', '#EFF6FF', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradientBackground}
        >
          <View style={styles.headerRow}>
            <LinearGradient
              colors={['#1a3a52', '#234b68']}
              style={styles.iconWrapper}
            >
              <Ionicons name="star" size={18} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.title}>Featured Stores</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1a3a52" />
            <Text style={styles.loadingText}>Loading stores...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Empty state
  if (!brands || brands.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#dfebf7', '#EFF6FF', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradientBackground}
        >
          {/* Section Header */}
          <View style={styles.headerRow}>
            <LinearGradient
              colors={['#1a3a52', '#234b68']}
              style={styles.iconWrapper}
            >
              <Ionicons name="star" size={18} color="#FFFFFF" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Featured Stores</Text>
              <Text style={styles.subtitle}>
                {`Earn ${BRAND.COIN_NAME} on every purchase`}
              </Text>
            </View>
          </View>

          {/* Empty State Placeholder */}
          <View style={styles.emptyStateContainer}>
            <Ionicons name="star-outline" size={24} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>Featured stores coming soon</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#dfebf7', '#EFF6FF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      >
        {/* Decorative Elements */}
        <View style={styles.decorativeElements}>
          <View style={[styles.decorCircle, styles.decorCircle1]} />
          <View style={[styles.decorCircle, styles.decorCircle2]} />
        </View>

        {/* Section Header */}
        <View style={styles.headerRow}>
          <LinearGradient
            colors={['#1a3a52', '#234b68']}
            style={styles.iconWrapper}
          >
            <Ionicons name="star" size={18} color="#FFFFFF" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Featured Stores</Text>
            <Text style={styles.subtitle}>
              Earn Nuqta Coins on every purchase
            </Text>
          </View>
          {onViewAllPress && (
            <Pressable
              style={styles.viewAllButton}
              onPress={onViewAllPress}
             
            >
              <Text style={styles.viewAllText}>View All</Text>
              <View style={styles.viewAllArrow}>
                <Ionicons name="arrow-forward" size={14} color="#1a3a52" />
              </View>
            </Pressable>
          )}
        </View>

        {/* Brands List */}
        <FlatList
          data={brands}
          renderItem={renderBrand}
          keyExtractor={keyExtractor}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={Platform.OS !== 'web'}
          maxToRenderPerBatch={4}
          windowSize={4}
          initialNumToRender={2}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  gradientBackground: {
    paddingVertical: 20,
    borderRadius: 24,
    marginHorizontal: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeElements: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(26, 58, 82, 0.05)',
  },
  decorCircle1: {
    width: 140,
    height: 140,
    top: -40,
    right: -20,
  },
  decorCircle2: {
    width: 100,
    height: 100,
    bottom: -30,
    left: -20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1a3a52',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a3a52',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a3a52',
  },
  viewAllArrow: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#dfebf7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingLeft: 16,
    paddingRight: 28,
    paddingBottom: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyStateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default memo(MallFeaturedBrands);

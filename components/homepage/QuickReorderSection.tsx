/**
 * QuickReorderSection
 *
 * Compact horizontal scroll of previously ordered products shown near the top
 * of the Near-U tab.  Fetches the user's frequently ordered items and renders
 * them as small product cards with a quick "Add" action.
 *
 * Hides itself when:
 *  - User is not authenticated
 *  - Auth is still loading
 *  - No frequently ordered items are returned
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import CachedImage from '@/components/ui/CachedImage';
import { useAuth } from '@/contexts/AuthContext';
import { useFrequentlyOrdered } from '@/hooks/useReorder';
import { useRegion } from '@/contexts/RegionContext';
import type { FrequentlyOrderedItem } from '@/services/reorderApi';

interface QuickReorderSectionProps {
  /** Max number of items to fetch (default 5) */
  limit?: number;
}

const QuickReorderSection: React.FC<QuickReorderSectionProps> = ({ limit = 5 }) => {
  const { state: authState } = useAuth();
  const { isAuthenticated, isLoading: authLoading } = authState;
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const router = useRouter();

  const { items, loading, error, refresh } = useFrequentlyOrdered(limit);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      refresh();
    }
  }, [isAuthenticated, authLoading]);

  const handleItemPress = useCallback((item: FrequentlyOrderedItem) => {
    router.push(`/product-page?cardId=${item.productId}&cardType=product` as any);
  }, [router]);

  // ---- Guards ----
  if (!isAuthenticated || authLoading) return null;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="bag-handle-outline" size={18} color="#7C3AED" />
          <ThemedText style={styles.title}>Order Again</ThemedText>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color="#7C3AED" />
        </View>
      </View>
    );
  }

  if (error || !items || items.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.header}>
        <Ionicons name="bag-handle-outline" size={18} color="#7C3AED" />
        <ThemedText style={styles.title}>Order Again</ThemedText>
      </View>

      {/* Horizontal product list — fixed-height wrapper prevents vertical expansion */}
      <View style={styles.scrollWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {items.map((item) => (
            <Pressable
              key={item.productId}
              style={styles.card}
              onPress={() => handleItemPress(item)}
            >
              <CachedImage
                source={item.productImage}
                style={styles.image}
                contentFit="cover"
                borderRadius={10}
              />

              <ThemedText style={styles.productName} numberOfLines={1}>
                {item.productName}
              </ThemedText>

              <ThemedText style={styles.price}>
                {currencySymbol}{item.currentPrice?.toFixed(2)}
              </ThemedText>

              {item.isAvailable ? (
                <Pressable
                  style={styles.addButton}
                  onPress={() => handleItemPress(item)}
                >
                  <ThemedText style={styles.addButtonText}>Add</ThemedText>
                </Pressable>
              ) : (
                <View style={styles.outOfStockBadge}>
                  <ThemedText style={styles.outOfStockText}>Out</ThemedText>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default React.memo(QuickReorderSection);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 8,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },

  loadingWrap: {
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Fixed-height wrapper keeps the horizontal ScrollView from stretching */
  scrollWrap: {
    height: 150,
  },

  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },

  card: {
    width: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    marginRight: 10,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      },
    }),
  },

  image: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },

  productName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    marginTop: 6,
    textAlign: 'center',
    width: '100%',
  },

  price: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },

  addButton: {
    marginTop: 4,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },

  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  outOfStockBadge: {
    marginTop: 4,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },

  outOfStockText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
});

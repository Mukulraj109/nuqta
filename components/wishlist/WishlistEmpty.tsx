// WishlistEmpty Component
// Empty state for wishlist page

import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { WishlistEmptyProps } from '@/types/wishlist.types';

function WishlistEmpty({ onShopPress }: WishlistEmptyProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="heart-outline" size={80} color="#D1D5DB" />
      </View>

      <ThemedText style={styles.title}>Your wishlist is empty</ThemedText>

      <ThemedText style={styles.subtitle}>
        Save items you love by tapping the heart icon
      </ThemedText>

      <Pressable style={styles.shopButton} onPress={onShopPress}>
        <Ionicons name="storefront-outline" size={20} color="white" />
        <ThemedText style={styles.shopButtonText}>Start Shopping</ThemedText>
      </Pressable>

      <View style={styles.tipsContainer}>
        <ThemedText style={styles.tipsTitle}>Why use a wishlist?</ThemedText>

        <View style={styles.tipItem}>
          <Ionicons name="bookmark-outline" size={18} color="#8B5CF6" />
          <ThemedText style={styles.tipText}>
            Save items for later purchase
          </ThemedText>
        </View>

        <View style={styles.tipItem}>
          <Ionicons name="notifications-outline" size={18} color="#8B5CF6" />
          <ThemedText style={styles.tipText}>
            Get notified on price drops
          </ThemedText>
        </View>

        <View style={styles.tipItem}>
          <Ionicons name="share-social-outline" size={18} color="#8B5CF6" />
          <ThemedText style={styles.tipText}>
            Share your wishlist with friends
          </ThemedText>
        </View>
      </View>
    </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  shopButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  tipsContainer: {
    marginTop: 48,
    width: '100%',
    backgroundColor: '#F8F9FF',
    padding: 20,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
});

export default React.memo(WishlistEmpty);

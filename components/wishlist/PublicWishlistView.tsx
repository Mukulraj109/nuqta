// Public Wishlist View Component
// Displays a shared wishlist with social features

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { platformAlertSimple } from '@/utils/platformAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import wishlistSharingService, {
  PublicWishlist,
  GiftReservation,
} from '@/services/wishlistSharingApi';
import { useRegion } from '@/contexts/RegionContext';

const { width } = Dimensions.get('window');

interface PublicWishlistViewProps {
  shareCode: string;
  onBack?: () => void;
}

function PublicWishlistView({
  shareCode,
  onBack,
}: PublicWishlistViewProps) {
  const router = useRouter();
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const [wishlist, setWishlist] = useState<PublicWishlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [comment, setComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [reservations, setReservations] = useState<GiftReservation[]>([]);

  useEffect(() => {
    loadWishlist();
    loadReservations();
  }, [shareCode]);

  const loadWishlist = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await wishlistSharingService.getPublicWishlist(shareCode);

      if (!response.success || !response.data) {
        throw new Error('Wishlist not found');
      }

      setWishlist(response.data);
    } catch (err) {
      setError('Failed to load wishlist');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [shareCode]);

  const loadReservations = useCallback(async () => {
    try {
      const response = await wishlistSharingService.getGiftReservations(shareCode);
      if (response.success && response.data) {
        setReservations(response.data);
      }
    } catch (err) {
      // silently handle
    }
  }, [shareCode]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadWishlist();
    loadReservations();
  }, [loadWishlist, loadReservations]);

  const handleLike = useCallback(async () => {
    try {
      const response = isLiked
        ? await wishlistSharingService.unlikeWishlist(shareCode)
        : await wishlistSharingService.likeWishlist(shareCode);

      if (response.success && response.data) {
        setIsLiked(response.data.liked);
        if (wishlist) {
          setWishlist({
            ...wishlist,
            likes: response.data.likes,
          });
        }
      }
    } catch (err) {
      platformAlertSimple('Error', 'Failed to like wishlist');
    }
  }, [shareCode, isLiked, wishlist]);

  const handleComment = useCallback(async () => {
    if (!comment.trim()) return;

    try {
      setIsPosting(true);
      const response = await wishlistSharingService.addComment(shareCode, comment);

      if (response.success && response.data) {
        if (wishlist) {
          setWishlist({
            ...wishlist,
            comments: [...wishlist.comments, response.data],
          });
        }
        setComment('');
        platformAlertSimple('Success', 'Comment posted!');
      }
    } catch (err) {
      platformAlertSimple('Error', 'Failed to post comment');
    } finally {
      setIsPosting(false);
    }
  }, [shareCode, comment, wishlist]);

  const handleReserveGift = useCallback(
    async (itemId: string) => {
      try {
        const response = await wishlistSharingService.reserveGift(shareCode, itemId, {
          anonymous: false,
        });

        if (response.success && response.data) {
          setReservations([...reservations, response.data]);
          platformAlertSimple('Success', 'Gift reserved! The owner will be notified.');
        }
      } catch (err) {
        platformAlertSimple('Error', 'Failed to reserve gift');
      }
    },
    [shareCode, reservations]
  );

  const handleAddToMyWishlist = useCallback(
    async (itemId: string) => {
      try {
        const response = await wishlistSharingService.addToMyWishlist(shareCode, itemId);

        if (response.success) {
          platformAlertSimple('Success', 'Item added to your wishlist!');
        }
      } catch (err) {
        platformAlertSimple('Error', 'Failed to add to your wishlist');
      }
    },
    [shareCode]
  );

  const isItemReserved = useCallback(
    (itemId: string) => {
      return reservations.some(
        (r) => r.itemId === itemId && r.status === 'reserved'
      );
    },
    [reservations]
  );

  const renderWishlistHeader = () => {
    if (!wishlist) return null;

    return (
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {onBack && (
          <Pressable style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
        )}

        <View style={styles.ownerInfo}>
          {wishlist.owner.avatar ? (
            <CachedImage source={wishlist.owner.avatar} style={styles.ownerAvatar} />
          ) : (
            <View style={[styles.ownerAvatar, styles.ownerAvatarPlaceholder]}>
              <ThemedText style={styles.ownerInitial}>
                {wishlist.owner.name.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
          )}
          <View style={styles.ownerDetails}>
            <View style={styles.ownerNameRow}>
              <ThemedText style={styles.ownerName}>{wishlist.owner.name}</ThemedText>
              {wishlist.owner.verified && (
                <Ionicons name="checkmark-circle" size={16} color="#ffcd57" />
              )}
            </View>
            <ThemedText style={styles.wishlistName}>{wishlist.name}</ThemedText>
            {wishlist.description && (
              <ThemedText style={styles.wishlistDescription}>
                {wishlist.description}
              </ThemedText>
            )}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{wishlist.itemCount}</ThemedText>
            <ThemedText style={styles.statLabel}>Items</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{wishlist.likes}</ThemedText>
            <ThemedText style={styles.statLabel}>Likes</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{wishlist.views}</ThemedText>
            <ThemedText style={styles.statLabel}>Views</ThemedText>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.actionButton, isLiked && styles.actionButtonLiked]}
            onPress={handleLike}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={isLiked ? '#EF4444' : '#FFFFFF'}
            />
            <ThemedText style={[styles.actionButtonText, isLiked && styles.actionButtonTextLiked]}>
              {isLiked ? 'Liked' : 'Like'}
            </ThemedText>
          </Pressable>

          <Pressable style={styles.actionButton}>
            <Ionicons name="share-outline" size={20} color="#FFFFFF" />
            <ThemedText style={styles.actionButtonText}>Share</ThemedText>
          </Pressable>
        </View>
      </LinearGradient>
    );
  };

  const renderItem = ({ item }: { item: PublicWishlist['items'][0] }) => {
    const reserved = isItemReserved(item.id);

    return (
      <View style={styles.itemCard}>
        <CachedImage source={item.image} style={styles.itemImage} />

        {reserved && (
          <View style={styles.reservedBadge}>
            <Ionicons name="gift" size={16} color="#FFFFFF" />
            <ThemedText style={styles.reservedText}>Reserved</ThemedText>
          </View>
        )}

        <View style={styles.itemDetails}>
          <ThemedText style={styles.itemName} numberOfLines={2}>
            {item.name}
          </ThemedText>

          {wishlist?.isPublic && (
            <View style={styles.itemPriceRow}>
              <ThemedText style={styles.itemPrice}>
                {currencySymbol}{item.price.toLocaleString()}
              </ThemedText>
              {item.originalPrice && (
                <ThemedText style={styles.itemOriginalPrice}>
                  {currencySymbol}{item.originalPrice.toLocaleString()}
                </ThemedText>
              )}
              {item.discount && (
                <View style={styles.discountBadge}>
                  <ThemedText style={styles.discountText}>{item.discount}% OFF</ThemedText>
                </View>
              )}
            </View>
          )}

          <View style={styles.itemFooter}>
            <View
              style={[
                styles.stockBadge,
                { backgroundColor: item.inStock ? '#ffcd57' : '#EF4444' },
              ]}
            >
              <ThemedText style={styles.stockText}>
                {item.inStock ? 'In Stock' : 'Out of Stock'}
              </ThemedText>
            </View>

            {item.rating && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <ThemedText style={styles.ratingText}>{item.rating.toFixed(1)}</ThemedText>
              </View>
            )}
          </View>

          <View style={styles.itemActions}>
            {!reserved && (
              <Pressable
                style={styles.itemActionButton}
                onPress={() => handleReserveGift(item.id)}
              >
                <Ionicons name="gift-outline" size={18} color="#8B5CF6" />
                <ThemedText style={styles.itemActionText}>Buy as Gift</ThemedText>
              </Pressable>
            )}

            <Pressable
              style={styles.itemActionButton}
              onPress={() => handleAddToMyWishlist(item.id)}
            >
              <Ionicons name="heart-outline" size={18} color="#8B5CF6" />
              <ThemedText style={styles.itemActionText}>Add to Mine</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderComments = () => {
    if (!wishlist?.comments || wishlist.comments.length === 0) return null;

    return (
      <View style={styles.commentsSection}>
        <ThemedText style={styles.commentsTitle}>Comments</ThemedText>
        {wishlist.comments.map((c) => (
          <View key={c.id} style={styles.commentCard}>
            <View style={styles.commentHeader}>
              {c.user.avatar ? (
                <CachedImage source={c.user.avatar} style={styles.commentAvatar} />
              ) : (
                <View style={[styles.commentAvatar, styles.commentAvatarPlaceholder]}>
                  <ThemedText style={styles.commentInitial}>
                    {c.user.name.charAt(0).toUpperCase()}
                  </ThemedText>
                </View>
              )}
              <View style={styles.commentInfo}>
                <ThemedText style={styles.commentAuthor}>{c.user.name}</ThemedText>
                <ThemedText style={styles.commentTime}>
                  {new Date(c.createdAt).toLocaleDateString()}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={styles.commentText}>{c.text}</ThemedText>
          </View>
        ))}
      </View>
    );
  };

  const renderCommentInput = () => {
    if (!wishlist?.isPublic) return null;

    return (
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          placeholderTextColor="#9CA3AF"
          value={comment}
          onChangeText={setComment}
          multiline
        />
        <Pressable
          style={[styles.commentPostButton, !comment.trim() && styles.commentPostButtonDisabled]}
          onPress={handleComment}
          disabled={!comment.trim() || isPosting}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <ThemedText style={styles.loadingText}>Loading wishlist...</ThemedText>
      </View>
    );
  }

  if (error || !wishlist) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <ThemedText style={styles.errorTitle}>Wishlist Not Found</ThemedText>
        <ThemedText style={styles.errorText}>
          {error || 'This wishlist might have been removed or is no longer available.'}
        </ThemedText>
        {onBack && (
          <Pressable style={styles.errorButton} onPress={onBack}>
            <ThemedText style={styles.errorButtonText}>Go Back</ThemedText>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderWishlistHeader()}

      <FlatList
        data={wishlist.items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.itemsList}
        removeClippedSubviews={Platform.OS !== 'web'}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={8}
        ListFooterComponent={
          <>
            {renderComments()}
            {renderCommentInput()}
            <View style={styles.bottomSpace} />
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#8B5CF6"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  ownerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  ownerAvatarPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ownerDetails: {
    flex: 1,
  },
  ownerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  wishlistName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  wishlistDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonLiked: {
    backgroundColor: '#FFFFFF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtonTextLiked: {
    color: '#EF4444',
  },
  itemsList: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  itemImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E7EB',
  },
  reservedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  reservedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  itemDetails: {
    padding: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  itemOriginalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#ffcd57',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  itemActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F3E8FF',
    paddingVertical: 10,
    borderRadius: 8,
  },
  itemActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  commentsSection: {
    marginTop: 24,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  commentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentAvatarPlaceholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInitial: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  commentInfo: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  commentTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  commentText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 8,
    marginTop: 16,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    maxHeight: 100,
  },
  commentPostButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentPostButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F9FAFB',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomSpace: {
    height: 40,
  },
});

export default React.memo(PublicWishlistView);

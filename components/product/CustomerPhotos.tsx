import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { platformAlertSimple } from '@/utils/platformAlert';
import { SPACING, TYPOGRAPHY, COLORS, BORDER_RADIUS, SHADOWS } from '@/constants/DesignTokens';
import { Button } from '@/components/ui';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

/**
 * Customer Photo Interface
 */
interface CustomerPhoto {
  id: string;
  userId: string;
  userName: string;
  imageUrl: string;
  caption?: string;
  helpful: number;
  createdAt: Date;
  isVerifiedPurchase?: boolean;
}

/**
 * CustomerPhotos Component Props
 */
interface CustomerPhotosProps {
  productId: string;
  photos?: CustomerPhoto[];
  onUploadPhoto?: (photo: { uri: string; caption?: string }) => Promise<void>;
  onMarkHelpful?: (photoId: string) => void;
  maxPhotos?: number;
  enableUpload?: boolean;
}

/**
 * CustomerPhotos Component
 *
 * Displays customer-uploaded photos for a product with the ability to:
 * - View photos in a horizontal scrollable grid
 * - Upload new photos using device camera roll
 * - Mark photos as helpful
 * - View full-size photo modal with user details
 * - Display verified purchase badges
 *
 * @example
 * ```tsx
 * <CustomerPhotos
 *   productId="123"
 *   photos={customerPhotos}
 *   onUploadPhoto={handleUpload}
 *   onMarkHelpful={handleMarkHelpful}
 * />
 * ```
 */
function CustomerPhotos({
  productId,
  photos = [],
  onUploadPhoto,
  onMarkHelpful,
  maxPhotos = 50,
  enableUpload = true,
}: CustomerPhotosProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<CustomerPhoto | null>(null);
  const [uploading, setUploading] = useState(false);

  /**
   * Request media library permissions
   */
  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        platformAlertSimple('Permission Required', 'Please grant access to your photo library to upload images.');
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  /**
   * Pick image from device library
   */
  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        await handleUpload(result.assets[0].uri);
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to pick image. Please try again.');
    }
  };

  /**
   * Upload photo to server
   */
  const handleUpload = async (uri: string) => {
    if (!onUploadPhoto) {
      platformAlertSimple('Error', 'Upload functionality not available');
      return;
    }

    setUploading(true);
    try {
      await onUploadPhoto({ uri });
      platformAlertSimple('Success', 'Photo uploaded successfully!');
    } catch (error) {
      platformAlertSimple('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  /**
   * Format relative date
   */
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const visiblePhotos = photos.slice(0, maxPhotos);
  const hasMore = photos.length > maxPhotos;

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Customer Photos</Text>
          <Text style={styles.count}>
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
          </Text>
        </View>

        {enableUpload && onUploadPhoto && (
          <Button
            title={uploading ? 'Uploading...' : 'Add Photo'}
            onPress={pickImage}
            variant="outline"
            size="small"
            loading={uploading}
            disabled={uploading}
            icon={!uploading && <Ionicons name="camera" size={16} color={COLORS.primary[500]} />}
          />
        )}
      </View>

      {/* Empty State */}
      {visiblePhotos.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={64} color={COLORS.neutral[300]} />
          <Text style={styles.emptyTitle}>No photos yet</Text>
          <Text style={styles.emptyMessage}>
            Help others by uploading photos of this product
          </Text>
          {enableUpload && onUploadPhoto && (
            <Pressable style={styles.emptyButton} onPress={pickImage}>
              <Ionicons name="camera" size={20} color={COLORS.primary[500]} />
              <Text style={styles.emptyButtonText}>Upload First Photo</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <>
          {/* Photos Grid */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {visiblePhotos.map((photo) => (
              <Pressable
                key={photo.id}
                style={styles.photoCard}
                onPress={() => setSelectedPhoto(photo)}
                accessibilityRole="button"
                accessibilityLabel={`Photo by ${photo.userName}`}
              >
                <CachedImage
                  source={photo.imageUrl}
                  style={styles.photoImage}
                  contentFit="cover"
                />

                {/* Verified Badge */}
                {photo.isVerifiedPurchase && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.text.inverse} />
                  </View>
                )}

                {/* Photo Overlay */}
                <View style={styles.photoOverlay}>
                  <Text style={styles.photoUserName} numberOfLines={1}>
                    {photo.userName}
                  </Text>
                  <Pressable
                    style={styles.helpfulButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      onMarkHelpful?.(photo.id);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Mark as helpful. ${photo.helpful} people found this helpful`}
                  >
                    <Ionicons name="thumbs-up" size={14} color={COLORS.text.inverse} />
                    <Text style={styles.helpfulText}>{photo.helpful}</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          {/* More Photos Indicator */}
          {hasMore && (
            <View style={styles.moreContainer}>
              <Text style={styles.moreText}>
                +{photos.length - maxPhotos} more {photos.length - maxPhotos === 1 ? 'photo' : 'photos'}
              </Text>
            </View>
          )}
        </>
      )}

      {/* Full Photo Modal */}
      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          {/* Backdrop */}
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setSelectedPhoto(null)}
            accessibilityRole="button"
            accessibilityLabel="Close photo"
          />

          {/* Modal Content */}
          {selectedPhoto && (
            <View style={styles.modalContent}>
              {/* Close Button */}
              <Pressable
                style={styles.closeButton}
                onPress={() => setSelectedPhoto(null)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={28} color={COLORS.text.primary} />
              </Pressable>

              {/* Full Image */}
              <CachedImage
                source={selectedPhoto.imageUrl}
                style={styles.modalImage}
                contentFit="contain"
              />

              {/* Photo Info */}
              <View style={styles.modalInfo}>
                <View style={styles.modalUserInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {selectedPhoto.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.modalUserName}>{selectedPhoto.userName}</Text>
                    <View style={styles.modalMeta}>
                      {selectedPhoto.isVerifiedPurchase && (
                        <View style={styles.verifiedPurchaseRow}>
                          <Ionicons name="checkmark-circle" size={14} color={COLORS.success[700]} />
                          <Text style={styles.verifiedPurchaseText}>Verified Purchase</Text>
                        </View>
                      )}
                      <Text style={styles.modalDate}>• {formatDate(selectedPhoto.createdAt)}</Text>
                    </View>
                  </View>
                </View>

                {selectedPhoto.caption && (
                  <View style={styles.captionContainer}>
                    <Text style={styles.modalCaption}>{selectedPhoto.caption}</Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.modalHelpfulButton}
                    onPress={() => {
                      onMarkHelpful?.(selectedPhoto.id);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Mark as helpful"
                  >
                    <Ionicons name="thumbs-up" size={20} color={COLORS.primary[500]} />
                    <Text style={styles.modalHelpfulText}>
                      Helpful ({selectedPhoto.helpful})
                    </Text>
                  </Pressable>

                  <Button
                    title="Close"
                    onPress={() => setSelectedPhoto(null)}
                    variant="ghost"
                    size="small"
                  />
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  count: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
  },

  // Empty State
  emptyState: {
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyMessage: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary[50],
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary[500],
  },
  emptyButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary[500],
  },

  // Photos Grid
  scrollContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  photoCard: {
    width: 160,
    height: 160,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.neutral[100],
    ...SHADOWS.md,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  verifiedBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.success[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoUserName: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.inverse,
    fontWeight: '600',
    flex: 1,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: SPACING.xs,
  },
  helpfulText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.inverse,
    fontWeight: '600',
  },

  // More Photos
  moreContainer: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  moreText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary[500],
    fontWeight: '600',
  },

  // Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.xl,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...SHADOWS.md,
  },
  modalImage: {
    width: '100%',
    height: 400,
    backgroundColor: COLORS.neutral[100],
  },
  modalInfo: {
    padding: SPACING.lg,
  },
  modalUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary[700],
    fontSize: 18,
  },
  userDetails: {
    flex: 1,
  },
  modalUserName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  modalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  verifiedPurchaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedPurchaseText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success[700],
    fontWeight: '600',
  },
  modalDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
  },
  captionContainer: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
  },
  modalCaption: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  modalHelpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
  },
  modalHelpfulText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary[500],
  },
});

export default React.memo(CustomerPhotos);

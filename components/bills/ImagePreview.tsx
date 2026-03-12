import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  PinchGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImagePreviewProps {
  visible: boolean;
  imageUri: string;
  metadata?: {
    size?: number;
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  };
  onUse?: () => void;
  onReplace?: () => void;
  onCancel?: () => void;
  allowZoom?: boolean;
}

export default function ImagePreview({
  visible,
  imageUri,
  metadata,
  onUse,
  onReplace,
  onCancel,
  allowZoom = true,
}: ImagePreviewProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Zoom gesture values
  const scale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get quality indicator
  const getQualityInfo = (quality?: number) => {
    if (!quality) return { text: 'Unknown', color: '#666', icon: '?' };
    if (quality >= 80) return { text: 'Excellent', color: '#10B981', icon: '✓✓' };
    if (quality >= 60) return { text: 'Good', color: '#10B981', icon: '✓' };
    if (quality >= 40) return { text: 'Fair', color: '#F59E0B', icon: '!' };
    return { text: 'Poor', color: '#EF4444', icon: '✕' };
  };

  // Pinch gesture handler
  const pinchHandler = useAnimatedGestureHandler<
    PinchGestureHandlerGestureEvent,
    { startScale: number }
  >({
    onStart: (_, context) => {
      context.startScale = scale.value;
    },
    onActive: (event, context) => {
      // Limit scale between 1x and 4x
      const newScale = context.startScale * event.scale;
      scale.value = Math.min(Math.max(newScale, 1), 4);
      focalX.value = event.focalX;
      focalY.value = event.focalY;
    },
    onEnd: () => {
      // Reset to 1x if scale is close to 1
      if (scale.value < 1.1) {
        scale.value = withSpring(1);
      }
    },
  });

  // Animated style for zoom
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
      ],
    };
  });

  // Reset zoom when modal closes
  const handleClose = () => {
    scale.value = withTiming(1);
    if (onCancel) {
      onCancel();
    }
  };

  // Handle image load
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);

    // Get actual image dimensions
    if (imageUri) {
      Image.getSize(
        imageUri,
        (width, height) => {
          setImageDimensions({ width, height });
        },
        () => {
          // Error getting size, use metadata if available
          if (metadata?.width && metadata?.height) {
            setImageDimensions({ width: metadata.width, height: metadata.height });
          }
        }
      );
    }
  };

  // Handle image error
  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // Calculate image display dimensions
  const getImageDimensions = () => {
    const maxWidth = SCREEN_WIDTH;
    const maxHeight = SCREEN_HEIGHT * 0.6;

    const width = imageDimensions.width || metadata?.width || 0;
    const height = imageDimensions.height || metadata?.height || 0;

    if (!width || !height) {
      return { width: maxWidth, height: maxHeight };
    }

    const aspectRatio = width / height;

    if (aspectRatio > maxWidth / maxHeight) {
      // Width is the limiting factor
      return {
        width: maxWidth,
        height: maxWidth / aspectRatio,
      };
    } else {
      // Height is the limiting factor
      return {
        width: maxHeight * aspectRatio,
        height: maxHeight,
      };
    }
  };

  const displayDimensions = getImageDimensions();
  const qualityInfo = getQualityInfo(metadata?.quality);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.modalContainer}>
        <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleClose} style={styles.backButton}>
            <Text style={styles.backText}>◀ Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Full Preview</Text>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        {/* Image Container */}
        <ScrollView
          contentContainerStyle={styles.imageScrollContainer}
          showsVerticalScrollIndicator={false}
          scrollEnabled={scale.value > 1}
        >
          <View style={styles.imageContainer}>
            {allowZoom ? (
              <PinchGestureHandler onGestureEvent={pinchHandler}>
                <Animated.View style={animatedStyle}>
                  <CachedImage
                    source={imageUri}
                    style={[styles.image, displayDimensions]}
                    contentFit="contain"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                </Animated.View>
              </PinchGestureHandler>
            ) : (
              <CachedImage
                source={imageUri}
                style={[styles.image, displayDimensions]}
                contentFit="contain"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}

            {imageLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.loadingText}>Loading image...</Text>
              </View>
            )}

            {imageError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>Failed to load image</Text>
                <Pressable onPress={() => setImageError(false)} style={styles.retryButton}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            )}
          </View>

          {allowZoom && !imageLoading && !imageError && (
            <Text style={styles.zoomHint}>Pinch to zoom • Swipe to pan</Text>
          )}
        </ScrollView>

        {/* Metadata Section */}
        {!imageLoading && !imageError && (
          <View style={styles.metadataContainer}>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataText}>
                Size: {formatFileSize(metadata?.size)}
              </Text>
              <Text style={styles.metadataSeparator}>|</Text>
              <Text style={styles.metadataText}>
                {imageDimensions.width || metadata?.width || 0} × {imageDimensions.height || metadata?.height || 0} pixels
              </Text>
            </View>

            <View style={styles.metadataRow}>
              <Text style={styles.metadataText}>
                Format: {metadata?.format?.toUpperCase() || 'JPEG'}
              </Text>
              <Text style={styles.metadataSeparator}>|</Text>
              <View style={styles.qualityContainer}>
                <Text style={styles.metadataText}>Quality: </Text>
                <Text style={[styles.qualityText, { color: qualityInfo.color }]}>
                  {qualityInfo.text} {qualityInfo.icon}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {onUse && (
            <Pressable
              style={[styles.actionButton, styles.useButton]}
              onPress={onUse}
             
            >
              <Text style={styles.useButtonText}>✓ Use Image</Text>
            </Pressable>
          )}

          {onReplace && (
            <Pressable
              style={[styles.actionButton, styles.replaceButton]}
              onPress={onReplace}
             
            >
              <Text style={styles.replaceButtonText}>🔄 Replace</Text>
            </Pressable>
          )}
        </View>

        {onCancel && !onUse && !onReplace && (
          <Pressable
            style={[styles.actionButton, styles.cancelButton]}
            onPress={onCancel}
           
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
  },
  imageScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  image: {
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 12,
    opacity: 0.8,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  zoomHint: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  metadataContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    flexWrap: 'wrap',
  },
  metadataText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },
  metadataSeparator: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
    marginHorizontal: 8,
  },
  qualityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qualityText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useButton: {
    backgroundColor: '#8B5CF6',
  },
  useButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  replaceButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
  },
  replaceButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

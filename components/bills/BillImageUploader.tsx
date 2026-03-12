/**
 * Bill Image Uploader Component
 * Handles bill photo capture/selection with quality checking and progress tracking
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { platformAlertSimple, platformAlertDestructive } from '@/utils/platformAlert';
import { cameraService, ImageAsset } from '@/services/cameraService';
import { useImageQuality, ImageQualityResult } from '@/hooks/useImageQuality';
import { useBillUpload } from '@/hooks/useBillUpload';
import { UploadProgress } from '@/types/upload.types';
import { Ionicons } from '@expo/vector-icons';
import { FILE_SIZE_LIMITS, ALLOWED_MIME_TYPES, formatFileSize } from '@/utils/fileUploadConstants';

// Component Props
export interface BillImageUploaderProps {
  onImageSelected: (uri: string) => void;
  onImageRemoved?: () => void;
  onUploadStart?: () => void;
  onUploadProgress?: (progress: UploadProgress) => void;
  onUploadComplete?: (uri: string) => void;
  onUploadError?: (error: Error) => void;
  maxSize?: number; // bytes (default uses centralized constant)
  acceptedFormats?: string[]; // MIME types (default uses centralized constant)
  initialImageUri?: string;
}

// Upload state type
type UploaderState =
  | 'idle'
  | 'selecting'
  | 'quality_checking'
  | 'quality_warning'
  | 'uploading'
  | 'upload_error'
  | 'success';

/**
 * BillImageUploader Component
 */
export const BillImageUploader: React.FC<BillImageUploaderProps> = ({
  onImageSelected,
  onImageRemoved,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  maxSize = FILE_SIZE_LIMITS.MAX_IMAGE_SIZE, // Use centralized constant
  acceptedFormats = [...ALLOWED_MIME_TYPES.IMAGES], // Use centralized constant
  initialImageUri,
}) => {
  // State
  const [state, setState] = useState<UploaderState>('idle');
  const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(null);
  const [imageUri, setImageUri] = useState<string | undefined>(initialImageUri);
  const [qualityResult, setQualityResult] = useState<ImageQualityResult | null>(null);

  // Hooks
  const { checkQuality, isChecking } = useImageQuality({
    maxFileSize: maxSize,
    minWidth: 800,
    minHeight: 600,
  });

  const { percentComplete, uploadSpeed, timeRemaining, error: uploadError } = useBillUpload();

  // Animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Update initial image
  useEffect(() => {
    if (initialImageUri && !imageUri) {
      setImageUri(initialImageUri);
      setState('success');
    }
  }, [initialImageUri]);

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: percentComplete,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [percentComplete]);

  /**
   * Handle Take Photo
   */
  const handleTakePhoto = useCallback(async () => {
    try {
      setState('selecting');

      const asset = await cameraService.openCamera({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (asset) {
        setSelectedImage(asset);
        await checkImageQuality(asset);
      } else {
        setState('idle');
      }
    } catch (error) {
      platformAlertSimple('Camera Error', 'Failed to open camera. Please try again.');
      setState('idle');
    }
  }, []);

  /**
   * Handle Choose from Gallery
   */
  const handleChooseFromGallery = useCallback(async () => {
    try {
      setState('selecting');

      const assets = await cameraService.openImagePicker({
        allowsMultipleSelection: false,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (assets.length > 0) {
        const asset = assets[0];
        setSelectedImage(asset);
        await checkImageQuality(asset);
      } else {
        setState('idle');
      }
    } catch (error) {
      platformAlertSimple('Gallery Error', 'Failed to open gallery. Please try again.');
      setState('idle');
    }
  }, []);

  /**
   * Check image quality
   */
  const checkImageQuality = useCallback(
    async (asset: ImageAsset) => {
      setState('quality_checking');

      try {
        const result = await checkQuality(asset.uri);
        setQualityResult(result);

        if (result.isValid) {
          // Quality is good, proceed
          setImageUri(asset.uri);
          setState('success');
          onImageSelected(asset.uri);
        } else {
          // Quality issues detected
          setState('quality_warning');
        }
      } catch (error) {
        platformAlertSimple('Error', 'Failed to check image quality. Please try again.');
        setState('idle');
      }
    },
    [checkQuality, onImageSelected]
  );

  /**
   * Handle use anyway (ignore quality warnings)
   */
  const handleUseAnyway = useCallback(() => {
    if (selectedImage) {
      setImageUri(selectedImage.uri);
      setState('success');
      onImageSelected(selectedImage.uri);
    }
  }, [selectedImage, onImageSelected]);

  /**
   * Handle remove image
   */
  const handleRemoveImage = useCallback(() => {
    platformAlertDestructive('Remove Photo', 'Are you sure you want to remove this photo?', () => {
            setImageUri(undefined);
            setSelectedImage(null);
            setQualityResult(null);
            setState('idle');
            onImageRemoved?.();
          }, 'Remove');
  }, [onImageRemoved]);

  /**
   * Render quality indicator badge
   */
  const renderQualityBadge = () => {
    if (!qualityResult) return null;

    let color = '#10b981'; // green
    let text = 'Good';

    if (qualityResult.score < 50) {
      color = '#ef4444'; // red
      text = 'Poor';
    } else if (qualityResult.score < 70) {
      color = '#f59e0b'; // orange
      text = 'Fair';
    } else if (qualityResult.score >= 90) {
      color = '#10b981'; // green
      text = 'Excellent';
    }

    return (
      <View style={[styles.qualityBadge, { backgroundColor: color }]}>
        <Text style={styles.qualityBadgeText}>{text}</Text>
      </View>
    );
  };

  // formatFileSize is now imported from fileUploadConstants

  /**
   * Render upload progress
   */
  const renderUploadProgress = () => {
    if (state !== 'uploading') return null;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Uploading... {percentComplete}%</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>Speed: {uploadSpeed}</Text>
          <Text style={styles.progressText}>Time left: {timeRemaining}</Text>
        </View>
      </View>
    );
  };

  /**
   * Render error state
   */
  const renderErrorState = () => {
    if (state !== 'upload_error' || !uploadError) return null;

    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Upload Failed</Text>
        <Text style={styles.errorMessage}>{uploadError.message}</Text>
        {uploadError.retryable && (
          <Pressable style={styles.retryButton} onPress={() => setState('idle')}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        )}
      </View>
    );
  };

  /**
   * Render quality warning
   */
  const renderQualityWarning = () => {
    if (state !== 'quality_warning' || !qualityResult) return null;

    return (
      <View style={styles.warningContainer}>
        <Ionicons name="warning" size={48} color="#f59e0b" />
        <Text style={styles.warningTitle}>Quality Issues Detected</Text>

        <View style={styles.issuesList}>
          {qualityResult.errors.map((error, index) => (
            <View key={index} style={styles.issueItem}>
              <Ionicons name="close-circle" size={16} color="#ef4444" />
              <Text style={styles.issueText}>{error}</Text>
            </View>
          ))}
          {qualityResult.warnings.map((warning, index) => (
            <View key={index} style={styles.issueItem}>
              <Ionicons name="alert-circle" size={16} color="#f59e0b" />
              <Text style={styles.issueText}>{warning}</Text>
            </View>
          ))}
        </View>

        <View style={styles.warningActions}>
          <Pressable style={styles.retryPhotoButton} onPress={() => setState('idle')}>
            <Text style={styles.retryPhotoButtonText}>Retake Photo</Text>
          </Pressable>
          <Pressable style={styles.useAnywayButton} onPress={handleUseAnyway}>
            <Text style={styles.useAnywayButtonText}>Use Anyway</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  /**
   * Render idle state (selection buttons)
   */
  const renderIdleState = () => {
    if (state !== 'idle') return null;

    return (
      <>
        <View style={styles.header}>
          <Text style={styles.label}>
            Bill Photo <Text style={styles.required}>*</Text>
          </Text>
        </View>

        <View style={styles.buttonsContainer}>
          <Pressable
            style={styles.actionButton}
            onPress={handleTakePhoto}
            disabled={state === 'selecting'}
          >
            <Ionicons name="camera" size={24} color="#8b5cf6" />
            <Text style={styles.actionButtonText}>Take Photo</Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={handleChooseFromGallery}
            disabled={state === 'selecting'}
          >
            <Ionicons name="image" size={24} color="#8b5cf6" />
            <Text style={styles.actionButtonText}>Gallery</Text>
          </Pressable>
        </View>

        <Text style={styles.hint}>Ensure bill is clear and visible</Text>
      </>
    );
  };

  /**
   * Render success state (image preview)
   */
  const renderSuccessState = () => {
    if (state !== 'success' || !imageUri) return null;

    const fileName = imageUri.split('/').pop() || 'bill.jpg';
    const fileSize = selectedImage?.fileSize || 0;

    return (
      <>
        <View style={styles.header}>
          <Text style={styles.label}>
            Bill Photo <Text style={styles.required}>*</Text>
          </Text>
        </View>

        <View style={styles.previewContainer}>
          <CachedImage source={imageUri} style={styles.previewImage} />
          {renderQualityBadge()}

          <View style={styles.imageInfo}>
            <View style={styles.imageInfoRow}>
              <Ionicons name="document-text" size={16} color="#6b7280" />
              <Text style={styles.imageInfoText}>{fileName}</Text>
            </View>

            {fileSize > 0 && (
              <View style={styles.imageInfoRow}>
                <Ionicons name="document" size={16} color="#6b7280" />
                <Text style={styles.imageInfoText}>
                  Size: {formatFileSize(fileSize)} / {formatFileSize(maxSize)} (Max)
                </Text>
              </View>
            )}

            {qualityResult && (
              <View style={styles.imageInfoRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.imageInfoText}>Quality: {qualityResult.score}/100</Text>
              </View>
            )}
          </View>

          <Pressable style={styles.removeButton} onPress={handleRemoveImage}>
            <Ionicons name="trash" size={18} color="#ef4444" />
            <Text style={styles.removeButtonText}>Remove Image</Text>
          </Pressable>
        </View>
      </>
    );
  };

  /**
   * Render loading state
   */
  const renderLoadingState = () => {
    if (state !== 'selecting' && state !== 'quality_checking') return null;

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>
          {state === 'selecting' ? 'Opening...' : 'Checking quality...'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderIdleState()}
      {renderLoadingState()}
      {renderQualityWarning()}
      {renderSuccessState()}
      {renderUploadProgress()}
      {renderErrorState()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  required: {
    color: '#ef4444',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  hint: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  previewContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
    marginBottom: 12,
  },
  qualityBadge: {
    position: 'absolute',
    top: 24,
    right: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  qualityBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  imageInfo: {
    gap: 8,
    marginBottom: 16,
  },
  imageInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imageInfoText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  progressContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  progressHeader: {
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 13,
    color: '#6b7280',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ef4444',
    marginTop: 12,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  warningContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f59e0b',
    marginTop: 12,
    marginBottom: 16,
  },
  issuesList: {
    width: '100%',
    gap: 8,
    marginBottom: 20,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  issueText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
  },
  warningActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retryPhotoButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  retryPhotoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  useAnywayButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    alignItems: 'center',
  },
  useAnywayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default BillImageUploader;

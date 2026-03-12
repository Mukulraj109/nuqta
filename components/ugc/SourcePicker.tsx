// UGC Source Picker Component
// Allows users to select video source: Camera, Gallery, or URL

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  Dimensions,
  Platform} from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import { UploadSource } from '@/types/ugc-upload.types';

const { width } = Dimensions.get('window');

interface SourcePickerProps {
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  onSelectUrl: (url: string) => void;
  disabled?: boolean;
}

export default function SourcePicker({
  onSelectCamera,
  onSelectGallery,
  onSelectUrl,
  disabled = false,
}: SourcePickerProps) {
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      platformAlertSimple('Error', 'Please enter a valid URL');
      return;
    }

    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    if (!urlPattern.test(urlInput)) {
      platformAlertSimple('Error', 'Please enter a valid video URL');
      return;
    }

    onSelectUrl(urlInput);
    setUrlInput('');
    setShowUrlModal(false);
  };

  const handleCancelUrl = () => {
    setUrlInput('');
    setShowUrlModal(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Video Source</Text>
      <Text style={styles.subtitle}>Select how you want to add your video</Text>

      <View style={styles.optionsContainer}>
        {/* Camera Option */}
        <Pressable
          style={[styles.optionCard, disabled && styles.optionCardDisabled]}
          onPress={onSelectCamera}
          disabled={disabled}
         
        >
          <View style={[styles.iconContainer, styles.cameraIcon]}>
            <Ionicons name="videocam" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.optionTitle}>Record Video</Text>
          <Text style={styles.optionDescription}>
            Use your camera to record a new video
          </Text>
          <View style={styles.actionIndicator}>
            <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
          </View>
        </Pressable>

        {/* Gallery Option */}
        <Pressable
          style={[styles.optionCard, disabled && styles.optionCardDisabled]}
          onPress={onSelectGallery}
          disabled={disabled}
         
        >
          <View style={[styles.iconContainer, styles.galleryIcon]}>
            <Ionicons name="images" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.optionTitle}>Choose from Gallery</Text>
          <Text style={styles.optionDescription}>
            Select an existing video from your library
          </Text>
          <View style={styles.actionIndicator}>
            <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
          </View>
        </Pressable>

        {/* URL Option */}
        <Pressable
          style={[styles.optionCard, disabled && styles.optionCardDisabled]}
          onPress={() => setShowUrlModal(true)}
          disabled={disabled}
         
        >
          <View style={[styles.iconContainer, styles.urlIcon]}>
            <Ionicons name="link" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.optionTitle}>Import from URL</Text>
          <Text style={styles.optionDescription}>
            Paste a video URL from the web
          </Text>
          <View style={styles.actionIndicator}>
            <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
          </View>
        </Pressable>
      </View>

      {/* URL Input Modal */}
      <Modal
        visible={showUrlModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelUrl}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Import Video from URL</Text>
              <Pressable onPress={handleCancelUrl} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            <Text style={styles.modalDescription}>
              Enter the URL of the video you want to import
            </Text>

            <TextInput
              style={styles.urlInput}
              placeholder="https://example.com/video.mp4"
              placeholderTextColor="#9CA3AF"
              value={urlInput}
              onChangeText={setUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
              onSubmitEditing={handleUrlSubmit}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={handleCancelUrl}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.submitButton}
                onPress={handleUrlSubmit}
              >
                <Text style={styles.submitButtonText}>Import</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  optionCardDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cameraIcon: {
    backgroundColor: '#8B5CF6',
  },
  galleryIcon: {
    backgroundColor: '#EC4899',
  },
  urlIcon: {
    backgroundColor: '#3B82F6',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  actionIndicator: {
    marginTop: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  urlInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

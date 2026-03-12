// UGC Upload Service
// Handles file upload with progress tracking for UGC content

import apiClient, { ApiResponse } from './apiClient';
import { UGCMedia } from './ugcApi';

/**
 * Upload UGC content with progress tracking
 * Uses XMLHttpRequest for progress monitoring
 */
export async function uploadUGCContent(
  formData: FormData,
  onProgress: (progress: number) => void
): Promise<ApiResponse<{
  content: UGCMedia;
  message: string;
}>> {
  try {
    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              success: true,
              data: response.data || response,
              message: response.message || 'Upload successful'
            });
          } catch (err) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.message || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Set up request
      const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL ||
                     process.env.EXPO_PUBLIC_API_URL ||
                     'http://localhost:5001/api';
      const uploadUrl = `${baseURL}/ugc`;

      xhr.open('POST', uploadUrl);

      // Add auth token if available
      const token = apiClient.getAuthToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      // Send request
      xhr.send(formData);
    });
  } catch (error) {
    return {
      success: false,
      message: 'Failed to upload content',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Validate file before upload
 */
export function validateUploadFile(
  uri: string,
  type: 'photo' | 'video',
  fileSize?: number
): { valid: boolean; error?: string } {
  // Max file sizes
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

  // Check file size
  if (fileSize) {
    const maxSize = type === 'photo' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (fileSize > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit for ${type}s`
      };
    }
  }

  // Check file extension
  const extension = uri.split('.').pop()?.toLowerCase() || '';
  const allowedImageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const allowedVideoFormats = ['mp4', 'mov', 'avi', 'mkv'];
  const allowedFormats = type === 'photo' ? allowedImageFormats : allowedVideoFormats;

  if (!allowedFormats.includes(extension)) {
    return {
      valid: false,
      error: `Invalid ${type} format. Allowed: ${allowedFormats.join(', ')}`
    };
  }

  return { valid: true };
}

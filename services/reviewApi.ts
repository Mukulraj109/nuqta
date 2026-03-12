// Review API Service
// Handles store reviews and ratings

import { Platform } from 'react-native';
import apiClient, { ApiResponse } from './apiClient';
import {
  Review,
  ReviewsResponse,
  CreateReviewData,
  UpdateReviewData,
  ReviewFilters,
  UserReview,
  CanReviewResponse
} from '@/types/review.types';

class ReviewService {
  /**
   * Get reviews for a store
   */
  async getStoreReviews(
    storeId: string,
    filters: ReviewFilters = {}
  ): Promise<ApiResponse<ReviewsResponse>> {
    try {

      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.rating) params.append('rating', filters.rating.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);

      const queryString = params.toString();
      const endpoint = `/reviews/store/${storeId}${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<ReviewsResponse>(endpoint);

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new review for a store
   */
  async createReview(
    storeId: string,
    reviewData: CreateReviewData
  ): Promise<ApiResponse<{ review: Review }>> {
    try {

      const response = await apiClient.post<{ review: Review }>(
        `/reviews/store/${storeId}`,
        reviewData
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update an existing review
   */
  async updateReview(
    reviewId: string,
    updates: UpdateReviewData
  ): Promise<ApiResponse<{ review: Review }>> {
    try {

      const response = await apiClient.put<{ review: Review }>(
        `/reviews/${reviewId}`,
        updates
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<ApiResponse<null>> {
    try {

      const response = await apiClient.delete<null>(`/reviews/${reviewId}`);

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark a review as helpful
   */
  async markReviewHelpful(reviewId: string): Promise<ApiResponse<{ helpful: number }>> {
    try {

      const response = await apiClient.post<{ helpful: number }>(
        `/reviews/${reviewId}/helpful`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's own reviews
   */
  async getUserReviews(
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<{
    reviews: UserReview[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalReviews: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }>> {
    try {

      const response = await apiClient.get<{
        reviews: UserReview[];
        pagination: {
          currentPage: number;
          totalPages: number;
          totalReviews: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        };
      }>(`/reviews/user/my-reviews?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user can review a store
   */
  async canUserReviewStore(storeId: string): Promise<ApiResponse<CanReviewResponse>> {
    try {

      const response = await apiClient.get<CanReviewResponse>(
        `/reviews/store/${storeId}/can-review`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Report a review (future functionality)
   */
  async reportReview(
    reviewId: string,
    reason: string
  ): Promise<ApiResponse<{ message: string }>> {
    try {

      // This endpoint doesn't exist in backend yet, but we're creating it for future use
      const response = await apiClient.post<{ message: string }>(
        `/reviews/${reviewId}/report`,
        { reason }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload review image to Cloudinary
   */
  async uploadReviewImage(imageUri: string): Promise<ApiResponse<{ url: string; publicId: string }>> {
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'review-image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      // Handle web vs mobile (React Native)
      if (Platform.OS === 'web') {
        // Web - convert blob URL to file
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('image', blob, filename);
      } else {
        // Mobile (React Native) - use file URI
        formData.append('image', {
          uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
          name: filename,
          type,
        } as any);
      }

      const result = await apiClient.uploadFile<{ url: string; publicId: string }>(
        '/reviews/upload-image',
        formData
      );

      return result;
    } catch (error) {
      throw error;
    }
  }
}

// Create singleton instance
const reviewService = new ReviewService();

export default reviewService;

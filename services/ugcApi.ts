// User Generated Content (UGC) API Service
// Handles user photos, videos, and content sharing

import apiClient, { ApiResponse } from './apiClient';

export interface UGCMedia {
  _id: string;
  userId: string;
  user: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  type: 'photo' | 'video';
  url: string;
  thumbnail?: string;
  caption?: string;
  tags: string[];
  relatedProduct?: {
    _id: string;
    name: string;
    image: string;
  };
  relatedStore?: {
    _id: string;
    name: string;
    logo: string;
  };
  likes: number;
  comments: number;
  shares: number;
  views: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UGCComment {
  _id: string;
  userId: string;
  user: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  comment: string;
  likes: number;
  isLiked: boolean;
  replies: UGCComment[];
  createdAt: string;
}

export interface CreateUGCRequest {
  type: 'photo' | 'video';
  caption?: string;
  tags?: string[];
  relatedProductId?: string;
  relatedStoreId?: string;
}

export interface UGCFilters {
  type?: 'photo' | 'video';
  userId?: string;
  productId?: string;
  storeId?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

// ── Reel-specific types ──────────────────────────
export interface UgcReel {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: number;
  creator?: {
    id: string;
    name: string;
    avatar?: string;
  } | null;
  store?: {
    id: string;
    name: string;
    logo?: string;
  } | null;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  isPublished: boolean;
  likes: number;
  comments: number;
  views: number;
  shares: number;
  tags: string[];
  createdAt: string;
}

export interface CreateReelRequest {
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  tags?: string[];
  taggedProducts?: string[];
  taggedStores?: string[];
  storeId?: string;
  category?: string;
}

export interface CreateReelResponse {
  id: string;
  title: string;
  moderationStatus: string;
  coinReward?: {
    coinsAwarded: number;
    status: string;
    message: string;
  } | null;
}

export interface UgcPagination {
  current: number;
  pages: number;
  total: number;
  hasMore: boolean;
}

class UGCApiService {
  private baseUrl = '/ugc';

  /**
   * Get UGC feed
   */
  async getFeed(filters?: UGCFilters): Promise<ApiResponse<{
    content: UGCMedia[];
    total: number;
    hasMore: boolean;
  }>> {

    return apiClient.get(this.baseUrl, filters);
  }

  /**
   * Get UGC by ID
   */
  async getById(id: string): Promise<ApiResponse<{ content: UGCMedia }>> {

    return apiClient.get(`${this.baseUrl}/${id}`);
  }

  /**
   * Create new UGC (upload)
   */
  async create(data: CreateUGCRequest, file: FormData): Promise<ApiResponse<{
    content: UGCMedia;
    message: string;
  }>> {

    // Add metadata to FormData
    for (const key in data) {
      if (data[key as keyof CreateUGCRequest] !== undefined) {
        file.append(key, String(data[key as keyof CreateUGCRequest]));
      }
    }

    return apiClient.uploadFile(this.baseUrl, file);
  }

  /**
   * Update UGC
   */
  async update(id: string, data: {
    caption?: string;
    tags?: string[];
  }): Promise<ApiResponse<{ content: UGCMedia }>> {

    return apiClient.put(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Delete UGC
   */
  async delete(id: string): Promise<ApiResponse<{ message: string }>> {

    return apiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Like UGC content
   */
  async likeContent(id: string): Promise<ApiResponse<{
    isLiked: boolean;
    likes: number;
  }>> {
    return apiClient.post(`${this.baseUrl}/${id}/like`);
  }

  /**
   * Unlike UGC content
   */
  async unlikeContent(id: string): Promise<ApiResponse<{
    isLiked: boolean;
    likes: number;
  }>> {
    return apiClient.delete(`${this.baseUrl}/${id}/like`);
  }

  /**
   * Like/Unlike UGC (toggle)
   */
  async toggleLike(id: string): Promise<ApiResponse<{
    isLiked: boolean;
    likes: number;
  }>> {
    return apiClient.post(`${this.baseUrl}/${id}/like`);
  }

  /**
   * Bookmark UGC content
   */
  async bookmarkContent(id: string): Promise<ApiResponse<{
    isBookmarked: boolean;
  }>> {
    return apiClient.post(`${this.baseUrl}/${id}/bookmark`);
  }

  /**
   * Remove bookmark from UGC content
   */
  async removeBookmark(id: string): Promise<ApiResponse<{
    isBookmarked: boolean;
  }>> {
    return apiClient.delete(`${this.baseUrl}/${id}/bookmark`);
  }

  /**
   * Bookmark/Unbookmark UGC (toggle)
   */
  async toggleBookmark(id: string): Promise<ApiResponse<{
    isBookmarked: boolean;
  }>> {
    return apiClient.post(`${this.baseUrl}/${id}/bookmark`);
  }

  /**
   * Check if user liked content
   */
  async checkLikeStatus(id: string): Promise<ApiResponse<{
    isLiked: boolean;
  }>> {
    return apiClient.get(`${this.baseUrl}/${id}/like/status`);
  }

  /**
   * Check if user bookmarked content
   */
  async checkBookmarkStatus(id: string): Promise<ApiResponse<{
    isBookmarked: boolean;
  }>> {
    return apiClient.get(`${this.baseUrl}/${id}/bookmark/status`);
  }

  /**
   * Share UGC
   */
  async share(id: string): Promise<ApiResponse<{ shares: number }>> {

    return apiClient.post(`${this.baseUrl}/${id}/share`);
  }

  /**
   * Get comments for UGC
   */
  async getComments(id: string, limit = 20, offset = 0): Promise<ApiResponse<{
    comments: UGCComment[];
    total: number;
    hasMore: boolean;
  }>> {

    return apiClient.get(`${this.baseUrl}/${id}/comments`, { limit, offset });
  }

  /**
   * Add comment to UGC
   */
  async addComment(id: string, comment: string, parentId?: string): Promise<ApiResponse<{
    comment: UGCComment;
  }>> {

    return apiClient.post(`${this.baseUrl}/${id}/comments`, { comment, parentId });
  }

  /**
   * Like/Unlike comment
   */
  async toggleCommentLike(ugcId: string, commentId: string): Promise<ApiResponse<{
    isLiked: boolean;
    likes: number;
  }>> {

    return apiClient.post(`${this.baseUrl}/${ugcId}/comments/${commentId}/like`);
  }

  /**
   * Delete comment
   */
  async deleteComment(ugcId: string, commentId: string): Promise<ApiResponse<{ message: string }>> {

    return apiClient.delete(`${this.baseUrl}/${ugcId}/comments/${commentId}`);
  }

  /**
   * Report comment
   */
  async reportComment(ugcId: string, commentId: string, reason: string, description?: string): Promise<ApiResponse<{
    message: string;
  }>> {

    return apiClient.post(`${this.baseUrl}/${ugcId}/comments/${commentId}/report`, { reason, description });
  }

  /**
   * Get user's UGC
   */
  async getUserContent(userId?: string, type?: 'photo' | 'video'): Promise<ApiResponse<{
    content: UGCMedia[];
    total: number;
  }>> {

    return apiClient.get(`${this.baseUrl}/user/${userId || 'me'}`, type ? { type } : undefined);
  }

  /**
   * Get UGC for product
   */
  async getProductContent(productId: string): Promise<ApiResponse<{
    content: UGCMedia[];
    total: number;
  }>> {

    return apiClient.get(`${this.baseUrl}/product/${productId}`);
  }

  /**
   * Get UGC for store
   */
  async getStoreContent(storeId: string, params?: {
    type?: 'photo' | 'video';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{
    content: UGCMedia[];
    total: number;
  }>> {

    try {
      // First, try to get videos from the videos endpoint
      const videosResponse = await apiClient.get(`/videos/store/${storeId}`, {
        limit: params?.limit || 20,
        offset: params?.offset || 0
      });

      let allContent: UGCMedia[] = [];

      // Process videos if available
      if (videosResponse.success && videosResponse.data?.content) {
        allContent = [...videosResponse.data.content];
      } else {
      }

      // Then try to get UGC content
      const ugcResponse = await apiClient.get(`${this.baseUrl}/store/${storeId}`, params);

      // Add UGC content if available (deduplicate by _id)
      if (ugcResponse.success && ugcResponse.data?.content) {

        // Get existing IDs to avoid duplicates
        const existingIds = new Set(allContent.map(item => item._id));
        const uniqueUGC = ugcResponse.data.content.filter((item: any) => !existingIds.has(item._id));

        allContent = [...allContent, ...uniqueUGC];
      } else {
      }


      // Return combined content (NO MOCK DATA)
      return {
        success: true,
        data: {
          content: allContent,
          total: allContent.length
        }
      };

    } catch (error) {
      // Return empty array on error (NO MOCK DATA)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch content',
        data: {
          content: [],
          total: 0
        }
      };
    }
  }

  /**
   * Get mock UGC content for store (development fallback)
   */
  private getMockStoreContent(storeId: string): UGCMedia[] {
    const mockUsers = [
      { _id: 'user1', profile: { firstName: 'Sarah', lastName: 'Johnson', avatar: 'https://i.pravatar.cc/150?img=1' } },
      { _id: 'user2', profile: { firstName: 'Mike', lastName: 'Chen', avatar: 'https://i.pravatar.cc/150?img=2' } },
      { _id: 'user3', profile: { firstName: 'Emma', lastName: 'Williams', avatar: 'https://i.pravatar.cc/150?img=3' } },
      { _id: 'user4', profile: { firstName: 'James', lastName: 'Brown', avatar: 'https://i.pravatar.cc/150?img=4' } },
      { _id: 'user5', profile: { firstName: 'Lisa', lastName: 'Davis', avatar: 'https://i.pravatar.cc/150?img=5' } },
    ];

    return [
      // Video content
      {
        _id: `ugc-video-1-${storeId}`,
        userId: 'user1',
        user: mockUsers[0],
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=900&fit=crop',
        caption: 'Amazing quality products! Love shopping here 😍',
        tags: ['fashion', 'quality', 'shopping'],
        relatedProduct: {
          _id: 'prod1',
          name: 'Casual Cotton T-Shirt',
          image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=120&h=120&fit=crop'
        },
        relatedStore: {
          _id: storeId,
          name: 'Fashion Store',
          logo: 'https://cdn-icons-png.flaticon.com/512/3048/3048122.png'
        },
        likes: 1250,
        comments: 45,
        shares: 23,
        views: 2500,
        isLiked: false,
        isBookmarked: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: `ugc-video-2-${storeId}`,
        userId: 'user2',
        user: mockUsers[1],
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=900&fit=crop',
        caption: 'Perfect fit! Highly recommend this store 👌',
        tags: ['denim', 'jeans', 'style'],
        relatedProduct: {
          _id: 'prod2',
          name: 'Slim Fit Jeans',
          image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=120&h=120&fit=crop'
        },
        relatedStore: {
          _id: storeId,
          name: 'Fashion Store',
          logo: 'https://cdn-icons-png.flaticon.com/512/3048/3048122.png'
        },
        likes: 890,
        comments: 32,
        shares: 15,
        views: 1900,
        isLiked: true,
        isBookmarked: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: `ugc-video-3-${storeId}`,
        userId: 'user3',
        user: mockUsers[2],
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1520975918318-3a3d3a9a91a0?w=600&h=900&fit=crop',
        caption: 'Summer vibes with this beautiful dress! 🌸☀️',
        tags: ['dress', 'summer', 'floral'],
        relatedProduct: {
          _id: 'prod3',
          name: 'Floral Summer Dress',
          image: 'https://images.unsplash.com/photo-1520975918318-3a3d3a9a91a0?w=120&h=120&fit=crop'
        },
        relatedStore: {
          _id: storeId,
          name: 'Fashion Store',
          logo: 'https://cdn-icons-png.flaticon.com/512/3048/3048122.png'
        },
        likes: 2340,
        comments: 78,
        shares: 45,
        views: 3100,
        isLiked: false,
        isBookmarked: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      // Photo content
      {
        _id: `ugc-photo-1-${storeId}`,
        userId: 'user4',
        user: mockUsers[3],
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&h=900&fit=crop',
        caption: 'Timeless style! This leather jacket is a must-have 🧥',
        tags: ['leather', 'jacket', 'style'],
        relatedProduct: {
          _id: 'prod4',
          name: 'Classic Leather Jacket',
          image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=120&h=120&fit=crop'
        },
        relatedStore: {
          _id: storeId,
          name: 'Fashion Store',
          logo: 'https://cdn-icons-png.flaticon.com/512/3048/3048122.png'
        },
        likes: 5678,
        comments: 123,
        shares: 89,
        views: 8100,
        isLiked: false,
        isBookmarked: false,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: `ugc-photo-2-${storeId}`,
        userId: 'user5',
        user: mockUsers[4],
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1546456073-92b9f0a8d413?w=600&h=900&fit=crop',
        caption: 'Traditional meets modern! Love this handwoven kurta 🎨',
        tags: ['kurta', 'ethnic', 'handwoven'],
        relatedProduct: {
          _id: 'prod5',
          name: 'Handwoven Cotton Kurta',
          image: 'https://images.unsplash.com/photo-1546456073-92b9f0a8d413?w=120&h=120&fit=crop'
        },
        relatedStore: {
          _id: storeId,
          name: 'Fashion Store',
          logo: 'https://cdn-icons-png.flaticon.com/512/3048/3048122.png'
        },
        likes: 3456,
        comments: 67,
        shares: 34,
        views: 5400,
        isLiked: true,
        isBookmarked: true,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
      // Additional content for variety
      {
        _id: `ugc-photo-3-${storeId}`,
        userId: 'user1',
        user: mockUsers[0],
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=900&fit=crop',
        caption: 'Perfect for office wear! Professional and stylish 💼',
        tags: ['formal', 'blazer', 'office'],
        relatedProduct: {
          _id: 'prod6',
          name: 'Professional Blazer',
          image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=120&h=120&fit=crop'
        },
        relatedStore: {
          _id: storeId,
          name: 'Fashion Store',
          logo: 'https://cdn-icons-png.flaticon.com/512/3048/3048122.png'
        },
        likes: 4123,
        comments: 89,
        shares: 56,
        views: 6700,
        isLiked: false,
        isBookmarked: false,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: `ugc-photo-4-${storeId}`,
        userId: 'user2',
        user: mockUsers[1],
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&h=900&fit=crop',
        caption: 'Casual Friday essentials! Comfortable and trendy 👕',
        tags: ['casual', 'friday', 'comfort'],
        relatedProduct: {
          _id: 'prod7',
          name: 'Casual Polo Shirt',
          image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=120&h=120&fit=crop'
        },
        relatedStore: {
          _id: storeId,
          name: 'Fashion Store',
          logo: 'https://cdn-icons-png.flaticon.com/512/3048/3048122.png'
        },
        likes: 2789,
        comments: 45,
        shares: 28,
        views: 4200,
        isLiked: false,
        isBookmarked: false,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: `ugc-photo-5-${storeId}`,
        userId: 'user3',
        user: mockUsers[2],
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=900&fit=crop',
        caption: 'Winter collection is here! Stay warm and stylish 🧣❄️',
        tags: ['winter', 'coat', 'warm'],
        relatedProduct: {
          _id: 'prod8',
          name: 'Winter Wool Coat',
          image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=120&h=120&fit=crop'
        },
        relatedStore: {
          _id: storeId,
          name: 'Fashion Store',
          logo: 'https://cdn-icons-png.flaticon.com/512/3048/3048122.png'
        },
        likes: 6234,
        comments: 134,
        shares: 98,
        views: 9800,
        isLiked: true,
        isBookmarked: false,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: `ugc-photo-6-${storeId}`,
        userId: 'user4',
        user: mockUsers[3],
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&h=900&fit=crop',
        caption: 'Sneaker game strong! Perfect for everyday wear 👟',
        tags: ['sneakers', 'shoes', 'casual'],
        relatedProduct: {
          _id: 'prod9',
          name: 'Classic White Sneakers',
          image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=120&h=120&fit=crop'
        },
        relatedStore: {
          _id: storeId,
          name: 'Fashion Store',
          logo: 'https://cdn-icons-png.flaticon.com/512/3048/3048122.png'
        },
        likes: 7890,
        comments: 156,
        shares: 112,
        views: 12300,
        isLiked: false,
        isBookmarked: true,
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: `ugc-photo-7-${storeId}`,
        userId: 'user5',
        user: mockUsers[4],
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1581791538302-03537b9b97ff?w=600&h=900&fit=crop',
        caption: 'Gym wear that performs! Great quality and fit 💪',
        tags: ['gym', 'fitness', 'activewear'],
        relatedProduct: {
          _id: 'prod10',
          name: 'Athletic Performance Tee',
          image: 'https://images.unsplash.com/photo-1581791538302-03537b9b97ff?w=120&h=120&fit=crop'
        },
        relatedStore: {
          _id: storeId,
          name: 'Fashion Store',
          logo: 'https://cdn-icons-png.flaticon.com/512/3048/3048122.png'
        },
        likes: 3567,
        comments: 78,
        shares: 45,
        views: 5600,
        isLiked: false,
        isBookmarked: false,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  // ── Reel-specific methods ─────────────────────────

  /**
   * Create a new UGC reel
   */
  async createReel(data: CreateReelRequest): Promise<{ success: boolean; data?: CreateReelResponse; message?: string; error?: string }> {
    try {
      const response = await apiClient.post('/ugc/create', data);
      if (response.success && response.data) {
        return { success: true, data: response.data as CreateReelResponse, message: (response as any).message };
      }
      return { success: false, error: (response as any).message || 'Failed to create reel' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to create reel' };
    }
  }

  /**
   * Get user's UGC reels with moderation status
   */
  async getMyReels(
    page: number = 1,
    limit: number = 20
  ): Promise<{ success: boolean; data?: { reels: UgcReel[]; pagination: UgcPagination }; error?: string }> {
    try {
      const response = await apiClient.get(`/ugc/my-reels?page=${page}&limit=${limit}`);
      if (response.success && response.data) {
        return { success: true, data: response.data as { reels: UgcReel[]; pagination: UgcPagination } };
      }
      return { success: false, error: (response as any).message || 'Failed to fetch reels' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to fetch reels' };
    }
  }

  /**
   * Get public UGC reel feed (approved reels only)
   */
  async getReelFeed(
    page: number = 1,
    limit: number = 20
  ): Promise<{ success: boolean; data?: { reels: UgcReel[]; pagination: UgcPagination }; error?: string }> {
    try {
      const response = await apiClient.get(`/ugc/feed?page=${page}&limit=${limit}`);
      if (response.success && response.data) {
        return { success: true, data: response.data as { reels: UgcReel[]; pagination: UgcPagination } };
      }
      return { success: false, error: (response as any).message || 'Failed to fetch UGC feed' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to fetch UGC feed' };
    }
  }

  /**
   * Get bookmarked UGC
   */
  async getBookmarked(type?: 'photo' | 'video'): Promise<ApiResponse<{
    content: UGCMedia[];
    total: number;
  }>> {

    return apiClient.get(`${this.baseUrl}/bookmarked`, type ? { type } : undefined);
  }

  /**
   * Report UGC
   */
  async report(id: string, reason: string, description?: string): Promise<ApiResponse<{
    message: string;
  }>> {

    return apiClient.post(`${this.baseUrl}/${id}/report`, { reason, description });
  }
}

// Export singleton instance
const ugcApi = new UGCApiService();
export default ugcApi;

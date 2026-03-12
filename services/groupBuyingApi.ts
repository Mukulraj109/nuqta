// Group Buying API Service
// Handles all group buying backend communications

import apiClient, { ApiResponse } from './apiClient';
import {
  GroupBuyingProduct,
  GroupBuyingGroup,
  GroupBuyingStats,
  CreateGroupRequest,
  JoinGroupRequest,
  GroupCheckoutRequest,
  ListGroupsResponse,
  ListProductsResponse,
  GroupBuyingFilters,
  GroupMessage,
} from '@/types/groupBuying.types';

const BASE_PATH = '/group-buying';

class GroupBuyingApi {
  // Get available group buying products
  async getProducts(filters?: GroupBuyingFilters): Promise<ApiResponse<ListProductsResponse>> {
    try {

      const params: any = {};
      if (filters) {
        if (filters.category) params.category = filters.category;
        if (filters.minDiscount) params.minDiscount = filters.minDiscount;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        if (filters.sortBy) params.sortBy = filters.sortBy;
      }

      const response = await apiClient.get<ListProductsResponse>(`${BASE_PATH}/products`, params);

      if (response.success) {

      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch products',
      };
    }
  }

  // Get product details
  async getProduct(productId: string): Promise<ApiResponse<GroupBuyingProduct>> {
    try {

      const response = await apiClient.get<GroupBuyingProduct>(`${BASE_PATH}/products/${productId}`);

      if (response.success) {

      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch product',
      };
    }
  }

  // Get available groups
  async getAvailableGroups(filters?: GroupBuyingFilters): Promise<ApiResponse<ListGroupsResponse>> {
    try {

      const params: any = { status: 'active,filling' };
      if (filters) {
        if (filters.category) params.category = filters.category;
        if (filters.spotsAvailable !== undefined) params.spotsAvailable = filters.spotsAvailable;
        if (filters.expiringWithin) params.expiringWithin = filters.expiringWithin;
        if (filters.sortBy) params.sortBy = filters.sortBy;
      }

      const response = await apiClient.get<ListGroupsResponse>(`${BASE_PATH}/groups`, params);

      if (response.success) {

      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch groups',
      };
    }
  }

  // Get user's groups
  async getMyGroups(): Promise<ApiResponse<GroupBuyingGroup[]>> {
    try {

      const response = await apiClient.get<GroupBuyingGroup[]>(`${BASE_PATH}/groups/my-groups`);

      if (response.success) {

      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch your groups',
      };
    }
  }

  // Get group details by ID
  async getGroup(groupId: string): Promise<ApiResponse<GroupBuyingGroup>> {
    try {

      const response = await apiClient.get<GroupBuyingGroup>(`${BASE_PATH}/groups/${groupId}`);

      if (response.success) {

      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch group details',
      };
    }
  }

  // Get group by code
  async getGroupByCode(code: string): Promise<ApiResponse<GroupBuyingGroup>> {
    try {

      const response = await apiClient.get<GroupBuyingGroup>(`${BASE_PATH}/groups/code/${code}`);

      if (response.success) {

      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Group not found',
      };
    }
  }

  // Create new group
  async createGroup(data: CreateGroupRequest): Promise<ApiResponse<GroupBuyingGroup>> {
    try {

      const response = await apiClient.post<GroupBuyingGroup>(`${BASE_PATH}/groups`, data);

      if (response.success) {

      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create group',
      };
    }
  }

  // Join existing group
  async joinGroup(data: JoinGroupRequest): Promise<ApiResponse<GroupBuyingGroup>> {
    try {

      const response = await apiClient.post<GroupBuyingGroup>(`${BASE_PATH}/groups/join`, data);

      if (response.success) {

      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to join group',
      };
    }
  }

  // Leave group
  async leaveGroup(groupId: string): Promise<ApiResponse<{ success: boolean }>> {
    try {

      const response = await apiClient.post<{ success: boolean }>(`${BASE_PATH}/groups/${groupId}/leave`);

      if (response.success) {

      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to leave group',
      };
    }
  }

  // Send message to group
  async sendMessage(groupId: string, message: string): Promise<ApiResponse<GroupMessage>> {
    try {

      const response = await apiClient.post<GroupMessage>(`${BASE_PATH}/groups/${groupId}/messages`, {
        message,
      });

      if (response.success) {

      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      };
    }
  }

  // Get group messages
  async getMessages(groupId: string): Promise<ApiResponse<GroupMessage[]>> {
    try {

      const response = await apiClient.get<GroupMessage[]>(`${BASE_PATH}/groups/${groupId}/messages`);

      if (response.success) {

      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch messages',
      };
    }
  }

  // Checkout group order
  async checkout(data: GroupCheckoutRequest): Promise<ApiResponse<{ orderId: string; paymentUrl?: string }>> {
    try {

      const response = await apiClient.post<{ orderId: string; paymentUrl?: string }>(
        `${BASE_PATH}/groups/${data.groupId}/checkout`,
        {
          paymentMethod: data.paymentMethod,
          deliveryAddressId: data.deliveryAddressId,
        }
      );
      if (response.success) {

      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Checkout failed',
      };
    }
  }

  // Get group buying statistics
  async getStats(): Promise<ApiResponse<GroupBuyingStats>> {
    try {

      const response = await apiClient.get<GroupBuyingStats>(`${BASE_PATH}/stats`);

      if (response.success) {

      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
      };
    }
  }

  // Cancel group (only creator can cancel)
  async cancelGroup(groupId: string, reason?: string): Promise<ApiResponse<{ success: boolean }>> {
    try {

      const response = await apiClient.post<{ success: boolean }>(`${BASE_PATH}/groups/${groupId}/cancel`, {
        reason,
      });

      if (response.success) {

      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel group',
      };
    }
  }

  // Invite to group (generates shareable link)
  async getInviteLink(groupId: string): Promise<ApiResponse<{ inviteUrl: string; code: string }>> {
    try {

      const response = await apiClient.get<{ inviteUrl: string; code: string }>(
        `${BASE_PATH}/groups/${groupId}/invite`
      );
      if (response.success) {

      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate invite link',
      };
    }
  }
}

// Export singleton instance
const groupBuyingApi = new GroupBuyingApi();
export default groupBuyingApi;

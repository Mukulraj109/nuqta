// Address Management API Service
// Handles delivery addresses CRUD operations

import apiClient, { ApiResponse } from './apiClient';

export enum AddressType {
  HOME = 'HOME',
  OFFICE = 'OFFICE',
  OTHER = 'OTHER'
}

export interface Address {
  id: string;
  type: AddressType;
  title: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isDefault: boolean;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddressCreate {
  type: AddressType;
  title: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isDefault?: boolean;
  instructions?: string;
}

export interface AddressUpdate {
  type?: AddressType;
  title?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isDefault?: boolean;
  instructions?: string;
}

class AddressApiService {
  private baseUrl = '/addresses';

  // Get all user addresses
  async getUserAddresses(): Promise<ApiResponse<Address[]>> {
    return apiClient.get(this.baseUrl);
  }

  // Get single address by ID
  async getAddressById(id: string): Promise<ApiResponse<Address>> {
    return apiClient.get(`${this.baseUrl}/${id}`);
  }

  // Create new address
  async createAddress(data: AddressCreate): Promise<ApiResponse<Address>> {
    return apiClient.post(this.baseUrl, data);
  }

  // Update address
  async updateAddress(id: string, data: AddressUpdate): Promise<ApiResponse<Address>> {
    return apiClient.put(`${this.baseUrl}/${id}`, data);
  }

  // Delete address
  async deleteAddress(id: string): Promise<ApiResponse<{ deletedId: string }>> {
    return apiClient.delete(`${this.baseUrl}/${id}`);
  }

  // Set default address
  async setDefaultAddress(id: string): Promise<ApiResponse<Address>> {
    return apiClient.patch(`${this.baseUrl}/${id}/default`, {});
  }
}

export const addressApi = new AddressApiService();
export default addressApi;
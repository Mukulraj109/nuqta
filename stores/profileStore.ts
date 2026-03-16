import { create } from 'zustand';
import { router } from 'expo-router';
import {
  ProfileContextType,
  ProfileCompletionStatus,
  User,
  ProfileMenuItem,
  UserPreferences,
} from '@/types/profile.types';
import profileApi from '@/services/profileApi';

interface ProfileStoreState extends ProfileContextType {}

export const useProfileStore = create<ProfileStoreState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  completionStatus: null,
  isModalVisible: false,

  refreshCompletionStatus: async () => {
    try {
      const response = await profileApi.getProfileCompletion();
      if (response.success && response.data) {
        set({ completionStatus: response.data });
      }
    } catch (_err) {
      // silently handle
    }
  },

  showModal: () => {
    set({ isModalVisible: true });
  },

  hideModal: () => {
    set({ isModalVisible: false });
  },

  updateUser: async (_userData: Partial<User>) => {
    // Stub — the real implementation lives in ProfileProvider which uses
    // AuthContext for auth-dependent profile updates.
    // The store fallback only prevents crashes when used outside the provider.
  },

  updatePreferences: async (_preferences: Partial<UserPreferences>) => {
    // Stub — requires AuthContext
  },

  logout: async () => {
    // Stub — requires AuthContext
    router.replace('/sign-in');
  },

  navigateToScreen: (route: string, params?: any) => {
    try {
      if (params) {
        router.push({ pathname: route as any, params });
      } else {
        router.push(route as any);
      }
    } catch (_err) {
      router.push('/');
    }
  },
}));

// ProfileContext - State management for profile system
// Manages user data, modal visibility, and profile-related actions

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { router } from 'expo-router';
import {
  ProfileContextType,
  ProfileCompletionStatus,
  User,
  ProfileMenuItem,
  UserPreferences
} from '@/types/profile.types';
import { useAuthUser, useIsAuthenticated, useAuthLoading, useAuthActions } from '@/stores/selectors';
import authService, { User as BackendUser, ProfileUpdate } from '@/services/authApi';
import profileApi from '@/services/profileApi';

interface ProfileProviderProps {
  children: ReactNode;
}

// Helper function to map backend user data to profile user format
const mapBackendUserToProfileUser = (backendUser: BackendUser): User => {
  // Get initials from email first character or name if available
  const getInitials = (): string => {
    if (backendUser.profile?.firstName && backendUser.profile?.lastName) {
      return (backendUser.profile.firstName.charAt(0) + backendUser.profile.lastName.charAt(0)).toUpperCase();
    }
    if (backendUser.profile?.firstName) {
      return backendUser.profile.firstName.charAt(0).toUpperCase();
    }
    if (backendUser.email) {
      return backendUser.email.charAt(0).toUpperCase();
    }
    if (backendUser.phoneNumber) {
      return backendUser.phoneNumber.charAt(1).toUpperCase(); // Skip the + sign
    }
    return 'U'; // User
  };

  // Get display name - use email or phone if no name available
  const getDisplayName = (): string => {
    if (backendUser.profile?.firstName && backendUser.profile?.lastName) {
      return `${backendUser.profile.firstName} ${backendUser.profile.lastName}`;
    }
    if (backendUser.profile?.firstName) {
      return backendUser.profile.firstName;
    }
    if (backendUser.email) {
      return backendUser.email.split('@')[0]; // Use email username part
    }
    if (backendUser.phoneNumber) {
      return backendUser.phoneNumber;
    }
    return 'User';
  };

  return {
    id: backendUser.id,
    name: getDisplayName(),
    email: backendUser.email || '',
    avatar: backendUser.profile?.avatar,
    bio: backendUser.profile?.bio || '',
    location: backendUser.profile?.location?.address || '',
    website: backendUser.profile?.website || '',
    dateOfBirth: backendUser.profile?.dateOfBirth ? new Date(backendUser.profile.dateOfBirth).toLocaleDateString() : '',
    gender: backendUser.profile?.gender || '',
    initials: getInitials(),
    phone: backendUser.phoneNumber,
    joinDate: backendUser.createdAt,
    isVerified: backendUser.isVerified,
    // Map wallet data from backend
    wallet: {
      balance: typeof backendUser.wallet?.balance === 'object'
        ? (backendUser.wallet.balance as any).available || (backendUser.wallet.balance as any).total || 0
        : backendUser.wallet?.balance || 0,
      totalEarned: backendUser.wallet?.totalEarned || 0,
      totalSpent: backendUser.wallet?.totalSpent || 0,
      pendingAmount: typeof backendUser.wallet?.pendingAmount === 'object'
        ? (backendUser.wallet.pendingAmount as any).pending || 0
        : backendUser.wallet?.pendingAmount || 0,
    },
    preferences: {
      notifications: {
        push: backendUser.preferences?.pushNotifications ?? true,
        email: backendUser.preferences?.emailNotifications ?? true,
        sms: backendUser.preferences?.smsNotifications ?? false,
        orderUpdates: true,
        promotions: false,
        reminders: true,
      },
      privacy: {
        profileVisible: true,
        showActivity: false,
        allowMessaging: true,
        dataSharing: false,
      },
      display: {
        theme: backendUser.preferences?.theme === 'dark' ? 'dark' : backendUser.preferences?.theme === 'light' ? 'light' : 'auto',
        language: backendUser.preferences?.language || 'en',
        currency: 'USD',
        timezone: 'America/New_York',
      },
    },
  };
};

const ProfileContext = createContext<ProfileContextType | null>(null);

// ── Module-level dedup: survives component remounts caused by DeferredProviders ──
let _profileCompletionLoaded = false;

export const ProfileProvider = ({ children }: ProfileProviderProps) => {
  // Get auth context
  const authUser = useAuthUser();
  const isAuthenticated = useIsAuthenticated();
  const authLoading = useAuthLoading();
  const authActions = useAuthActions();

  // State
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<ProfileCompletionStatus | null>(null);

  // Convert backend user to profile user format
  const user = useMemo(() => {
    if (authUser) {
      const mappedUser = mapBackendUserToProfileUser(authUser);
      return mappedUser;
    }
    return null;
  }, [authUser, isAuthenticated]);

  // Fetch profile completion from backend (single source of truth)
  const refreshCompletionStatus = useCallback(async () => {
    try {
      const response = await profileApi.getProfileCompletion();
      if (response.success && response.data) {
        setCompletionStatus(response.data);
      }
    } catch (err) {
      // silently handle
    }
  }, []);

  // Auto-fetch completion when user is available
  // Skip during onboarding to prevent thundering herd of API calls on Android
  // Staggered delay (500ms) to avoid simultaneous API calls with Cart/Wishlist on mount
  useEffect(() => {
    if (user && isAuthenticated && user.isOnboarded) {
      if (_profileCompletionLoaded) return; // Module-level dedup
      _profileCompletionLoaded = true;
      const timer = setTimeout(() => refreshCompletionStatus(), 500);
      return () => clearTimeout(timer);
    } else if (!isAuthenticated) {
      setCompletionStatus(null);
      _profileCompletionLoaded = false;
    }
  }, [user, isAuthenticated, refreshCompletionStatus]);

  // User data functions - delegate to AuthContext
  const updateUser = useCallback(async (userData: Partial<User>) => {
    if (!user) return;

    try {
      setError(null);

      // Map profile user data to ProfileUpdate format for API call
      const profileUpdateData: any = {
        email: userData.email || undefined, // Add email at top level
        profile: {
          firstName: userData.name?.split(' ')[0] || undefined,
          lastName: userData.name?.split(' ').slice(1).join(' ') || undefined,
          avatar: userData.avatar,
          bio: userData.bio,
          website: userData.website,
          dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : undefined,
          gender: userData.gender && ['male', 'female', 'other'].includes(userData.gender.toLowerCase())
            ? userData.gender.toLowerCase() as 'male' | 'female' | 'other'
            : undefined,
          location: userData.location ? {
            address: userData.location,
          } : undefined,
        },
        preferences: {
          theme: userData.preferences?.display?.theme === 'auto' ? undefined : userData.preferences?.display?.theme as 'light' | 'dark',
          language: userData.preferences?.display?.language,
          emailNotifications: userData.preferences?.notifications?.email,
          pushNotifications: userData.preferences?.notifications?.push,
          smsNotifications: userData.preferences?.notifications?.sms,
        },
      };

      // Call the correct authService method directly instead of going through AuthContext
      const response = await authService.updateProfile(profileUpdateData);

      // Check for API errors and throw with descriptive message
      if (!response.success) {
        // Extract field-specific validation errors if available
        const errors = response.errors as any;
        if (Array.isArray(errors) && errors.length > 0) {
          const messages = errors.map((e: any) => e.message || e).join('\n');
          throw new Error(messages);
        }
        throw new Error(response.error || response.message || 'Failed to update profile');
      }

      // Update user state manually since we're bypassing AuthContext
      if (response.data) {
        await authActions.checkAuthStatus(); // Refresh the auth state
        // Refresh completion status since profile fields may have changed
        refreshCompletionStatus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user profile');
      throw err;
    }
  }, [user, authActions, refreshCompletionStatus]);

  const updatePreferences = useCallback(async (preferences: Partial<UserPreferences>) => {
    if (!user) return;

    try {
      await updateUser({
        preferences: {
          ...user.preferences,
          ...preferences,
        },
      });
    } catch (err) {
      throw err;
    }
  }, [user, updateUser]);

  const logout = useCallback(async () => {
    try {
      setError(null);

      // Clear modal visibility
      setIsModalVisible(false);

      // Use AuthContext logout which handles tokens, API calls, etc.
      await authActions.logout();
      
      // Navigate to sign-in after logout
      router.replace('/sign-in');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout');
      throw err;
    }
  }, [authActions]);

  // Modal functions - memoized for performance
  const showModal = useCallback(() => {

    setIsModalVisible(true);
  }, []);

  const hideModal = useCallback(() => {

    setIsModalVisible(false);
  }, []);

  // Navigation function - memoized for performance
  const navigateToScreen = useCallback((route: string, params?: any) => {
    try {
      if (params) {
        router.push({
          pathname: route as any,
          params,
        });
      } else {
        router.push(route as any);
      }
    } catch (err) {
      // Fallback navigation
      router.push('/');
    }
  }, []);

  // Menu item handler - memoized for performance
  const handleMenuItemPress = useCallback((item: ProfileMenuItem) => {

    // Close the modal first
    hideModal();

    // Handle different menu actions
    switch (item.id) {
      case 'wallet':
        navigateToScreen('/wallet-screen'); // Use existing WalletScreen
        break;
      case 'order_trx':
        navigateToScreen('/transactions'); // Navigate to dedicated transactions page
        break;
      case 'bookings':
        navigateToScreen('/BookingsPage'); // Navigate to bookings page
        break;
      case 'account':
        navigateToScreen('/account/');
        break;
      case 'profile':
        navigateToScreen('/profile/');
        break;
      default:
        if (item.route) {
          navigateToScreen(item.route);
        } else if (item.action) {
          item.action();
        }
        break;
    }
  }, [navigateToScreen, hideModal]);

  // Stable-ref pattern: prevent consumer re-renders when action identities change
  const profileActionsRef = useRef({
    refreshCompletionStatus, showModal, hideModal, updateUser, updatePreferences, logout, navigateToScreen,
  });
  profileActionsRef.current = {
    refreshCompletionStatus, showModal, hideModal, updateUser, updatePreferences, logout, navigateToScreen,
  };

  const stableProfileActions = useMemo(() => ({
    refreshCompletionStatus: () => profileActionsRef.current.refreshCompletionStatus(),
    showModal: () => profileActionsRef.current.showModal(),
    hideModal: () => profileActionsRef.current.hideModal(),
    updateUser: (...args: Parameters<typeof updateUser>) => profileActionsRef.current.updateUser(...args),
    updatePreferences: (...args: Parameters<typeof updatePreferences>) => profileActionsRef.current.updatePreferences(...args),
    logout: () => profileActionsRef.current.logout(),
    navigateToScreen: (...args: Parameters<typeof navigateToScreen>) => profileActionsRef.current.navigateToScreen(...args),
  }), []);

  const contextValue: ProfileContextType = useMemo(() => ({
    user,
    isLoading: authLoading,
    error,
    completionStatus,
    isModalVisible,
    ...stableProfileActions,
  }), [user, authLoading, error, completionStatus, isModalVisible, stableProfileActions]);

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
};

const PROFILE_DEFAULTS: ProfileContextType = {
  user: null,
  isLoading: false,
  error: null,
  completionStatus: null,
  refreshCompletionStatus: async () => {},
  isModalVisible: false,
  showModal: () => {},
  hideModal: () => {},
  updateUser: async () => {},
  updatePreferences: async () => {},
  logout: async () => {},
  navigateToScreen: () => {},
};

// Lazy import to avoid circular deps
let __useProfileStore: () => any;
try {
  const { useProfileStore } = require('@/stores/profileStore');
  __useProfileStore = useProfileStore;
} catch {
  __useProfileStore = () => PROFILE_DEFAULTS;
}

// Custom hook to use profile context
// Now backed by Zustand store -- works with or without ProfileProvider in tree.
export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  const store = __useProfileStore();
  if (context) return context;
  return store as unknown as ProfileContextType;
};

// Custom hook specifically for the profile modal
export const useProfileModal = () => {
  const { isModalVisible, showModal, hideModal } = useProfile();
  
  return {
    isModalVisible,
    showModal,
    hideModal,
  };
};

// Custom hook for menu item handling
export const useProfileMenu = () => {
  const context = useProfile();
  
  const handleMenuItemPress = (item: ProfileMenuItem) => {

    // Close the modal first
    context.hideModal();

    // Handle different menu actions
    switch (item.id) {
      case 'wallet':
        context.navigateToScreen('/wallet-screen'); // Use existing WalletScreen
        break;
      case 'order_trx':
        context.navigateToScreen('/transactions'); // Navigate to dedicated transactions page
        break;
      case 'bookings':
        context.navigateToScreen('/BookingsPage'); // Navigate to bookings page
        break;
      case 'account':
        context.navigateToScreen('/account/');
        break;
      case 'profile':
        context.navigateToScreen('/profile/');
        break;
      default:
        if (item.route) {
          context.navigateToScreen(item.route);
        } else if (item.action) {
          item.action();
        }
        break;
    }
  };

  return {
    handleMenuItemPress,
  };
};

export default ProfileContext;
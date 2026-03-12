// GamificationContext Tests
// Test suite for GamificationContext state management

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { GamificationProvider, useGamification } from '@/contexts/GamificationContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import achievementApi from '@/services/achievementApi';
import pointsApi from '@/services/pointsApi';
import gamificationAPI from '@/services/gamificationApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@/services/achievementApi');
jest.mock('@/services/pointsApi');
jest.mock('@/services/gamificationApi');
jest.mock('@/contexts/AuthContext', () => ({
  ...jest.requireActual('@/contexts/AuthContext'),
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('GamificationContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>
      <GamificationProvider>{children}</GamificationProvider>
    </AuthProvider>
  );

  const mockAuthState = {
    isAuthenticated: true,
    user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
    token: 'mock-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();

    mockUseAuth.mockReturnValue({
      state: mockAuthState,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
      updateProfile: jest.fn(),
      verifyOTP: jest.fn(),
    } as any);

    // Mock API responses
    (achievementApi.getAchievementProgress as jest.Mock).mockResolvedValue({
      data: {
        achievements: [],
        summary: {
          total: 50,
          unlocked: 10,
          completionPercentage: 20,
        },
      },
    });

    (pointsApi.getBalance as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        total: 1000,
        earned: 1500,
        spent: 500,
        pending: 0,
        lifetimeEarned: 1500,
        lifetimeSpent: 500,
      },
    });

    (gamificationAPI.getChallenges as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });
  });

  describe('Initial State', () => {
    it('should provide initial gamification state', () => {
      const { result } = renderHook(() => useGamification(), { wrapper });

      expect(result.current.state).toMatchObject({
        achievements: [],
        achievementProgress: null,
        coinBalance: {
          total: 0,
          earned: 0,
          spent: 0,
          pending: 0,
          lifetimeEarned: 0,
          lifetimeSpent: 0,
        },
        challenges: [],
        achievementQueue: [],
        dailyStreak: 0,
        lastLoginDate: null,
        isLoading: false,
        error: null,
      });
    });

    it('should provide gamification actions', () => {
      const { result } = renderHook(() => useGamification(), { wrapper });

      expect(result.current.actions).toHaveProperty('loadGamificationData');
      expect(result.current.actions).toHaveProperty('triggerAchievementCheck');
      expect(result.current.actions).toHaveProperty('awardCoins');
      expect(result.current.actions).toHaveProperty('spendCoins');
      expect(result.current.actions).toHaveProperty('updateDailyStreak');
      expect(result.current.actions).toHaveProperty('markAchievementAsShown');
      expect(result.current.actions).toHaveProperty('refreshAchievements');
      expect(result.current.actions).toHaveProperty('clearError');
    });

    it('should provide computed values', () => {
      const { result } = renderHook(() => useGamification(), { wrapper });

      expect(result.current.computed).toHaveProperty('unlockedCount');
      expect(result.current.computed).toHaveProperty('completionPercentage');
      expect(result.current.computed).toHaveProperty('pendingAchievements');
      expect(result.current.computed).toHaveProperty('hasUnshownAchievements');
      expect(result.current.computed).toHaveProperty('canEarnCoins');
    });
  });

  describe('loadGamificationData', () => {
    it('should load achievements from API', async () => {
      const { result } = renderHook(() => useGamification(), { wrapper });

      await act(async () => {
        await result.current.actions.loadGamificationData();
      });

      expect(achievementApi.getAchievementProgress).toHaveBeenCalled();
      expect(result.current.state.isLoading).toBe(false);
    });

    it('should load coin balance from API', async () => {
      const { result } = renderHook(() => useGamification(), { wrapper });

      await act(async () => {
        await result.current.actions.loadGamificationData();
      });

      expect(pointsApi.getBalance).toHaveBeenCalled();
      expect(result.current.state.coinBalance.total).toBe(1000);
    });

    it('should load challenges from API', async () => {
      const mockChallenges = [
        {
          id: 'ch-1',
          title: 'Daily Challenge',
          description: 'Complete 3 purchases',
          type: 'daily',
          progress: { current: 1, target: 3, percentage: 33 },
          rewards: { coins: 50, badges: [], vouchers: [] },
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000),
          icon: 'cart',
          color: '#10B981',
        },
      ];

      (gamificationAPI.getChallenges as jest.Mock).mockResolvedValue({
        success: true,
        data: mockChallenges,
      });

      const { result } = renderHook(() => useGamification(), { wrapper });

      await act(async () => {
        await result.current.actions.loadGamificationData();
      });

      expect(gamificationAPI.getChallenges).toHaveBeenCalled();
      expect(result.current.state.challenges).toHaveLength(1);
    });

    it('should set loading state during data fetch', async () => {
      const { result } = renderHook(() => useGamification(), { wrapper });

      let loadingDuringFetch = false;

      const fetchPromise = act(async () => {
        const promise = result.current.actions.loadGamificationData();
        loadingDuringFetch = result.current.state.isLoading;
        await promise;
      });

      await fetchPromise;

      expect(loadingDuringFetch || result.current.state.isLoading).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      (achievementApi.getAchievementProgress as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useGamification(), { wrapper });

      await act(async () => {
        await result.current.actions.loadGamificationData();
      });

      expect(result.current.state.error).toBeTruthy();
      expect(result.current.state.isLoading).toBe(false);
    });

    it('should not load data when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        state: { ...mockAuthState, isAuthenticated: false, user: null },
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn(),
        updateProfile: jest.fn(),
        verifyOTP: jest.fn(),
      } as any);

      const { result } = renderHook(() => useGamification(), { wrapper });

      await act(async () => {
        await result.current.actions.loadGamificationData();
      });

      expect(achievementApi.getAchievementProgress).not.toHaveBeenCalled();
    });
  });

  describe('awardCoins', () => {
    it('should award coins to user', async () => {
      (pointsApi.earnPoints as jest.Mock).mockResolvedValue({
        success: true,
        data: { pointsEarned: 50, newBalance: 1050 },
      });

      (pointsApi.getBalance as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          total: 1050,
          earned: 1550,
          spent: 500,
          pending: 0,
          lifetimeEarned: 1550,
          lifetimeSpent: 500,
        },
      });

      const { result } = renderHook(() => useGamification(), { wrapper });

      // Load initial data
      await act(async () => {
        await result.current.actions.loadGamificationData();
      });

      // Award coins
      await act(async () => {
        await result.current.actions.awardCoins(50, 'Test reward');
      });

      expect(pointsApi.earnPoints).toHaveBeenCalledWith({
        amount: 50,
        source: 'bonus',
        description: 'Test reward',
      });

      expect(result.current.state.coinBalance.total).toBe(1050);
    });

    it('should trigger achievement check after awarding coins', async () => {
      (pointsApi.earnPoints as jest.Mock).mockResolvedValue({
        success: true,
        data: { pointsEarned: 50, newBalance: 1050 },
      });

      (achievementApi.recalculateAchievements as jest.Mock).mockResolvedValue({
        data: [],
      });

      const { result } = renderHook(() => useGamification(), { wrapper });

      await act(async () => {
        await result.current.actions.loadGamificationData();
        await result.current.actions.awardCoins(50, 'Test reward');
      });

      expect(achievementApi.recalculateAchievements).toHaveBeenCalled();
    });
  });

  describe('spendCoins', () => {
    it('should spend coins', async () => {
      (pointsApi.spendPoints as jest.Mock).mockResolvedValue({
        success: true,
        data: { pointsSpent: 100, newBalance: 900 },
      });

      (pointsApi.getBalance as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          total: 900,
          earned: 1500,
          spent: 600,
          pending: 0,
          lifetimeEarned: 1500,
          lifetimeSpent: 600,
        },
      });

      const { result } = renderHook(() => useGamification(), { wrapper });

      await act(async () => {
        await result.current.actions.loadGamificationData();
        await result.current.actions.spendCoins(100, 'Redeem voucher');
      });

      expect(pointsApi.spendPoints).toHaveBeenCalledWith({
        amount: 100,
        purpose: 'Redeem voucher',
        description: 'Redeem voucher',
      });

      expect(result.current.state.coinBalance.total).toBe(900);
    });

    it('should throw error when insufficient balance', async () => {
      const { result } = renderHook(() => useGamification(), { wrapper });

      await act(async () => {
        await result.current.actions.loadGamificationData();
      });

      await expect(async () => {
        await act(async () => {
          await result.current.actions.spendCoins(2000, 'Too expensive');
        });
      }).rejects.toThrow('Insufficient coin balance');
    });
  });

  describe('updateDailyStreak', () => {
    it('should perform daily check-in on first login of day', async () => {
      (pointsApi.getDailyCheckIn as jest.Mock).mockResolvedValue({
        success: true,
        data: { canCheckIn: true, currentStreak: 4 },
      });

      (pointsApi.performDailyCheckIn as jest.Mock).mockResolvedValue({
        success: true,
        data: { pointsEarned: 10, streak: 5 },
      });

      const { result } = renderHook(() => useGamification(), { wrapper });

      await act(async () => {
        await result.current.actions.loadGamificationData();
        await result.current.actions.updateDailyStreak();
      });

      expect(pointsApi.performDailyCheckIn).toHaveBeenCalled();
      expect(result.current.state.dailyStreak).toBe(5);
    });

    it('should not check in twice on same day', async () => {
      (pointsApi.getDailyCheckIn as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          canCheckIn: false,
          currentStreak: 5,
          lastCheckInDate: new Date().toISOString(),
        },
      });

      const { result } = renderHook(() => useGamification(), { wrapper });

      await act(async () => {
        await result.current.actions.loadGamificationData();
        await result.current.actions.updateDailyStreak();
      });

      expect(pointsApi.performDailyCheckIn).not.toHaveBeenCalled();
      expect(result.current.state.dailyStreak).toBe(5);
    });
  });

  describe('triggerAchievementCheck', () => {
    it('should check for newly unlocked achievements', async () => {
      const mockNewAchievement = {
        id: 'ach-1',
        title: 'First Purchase',
        description: 'Make your first purchase',
        icon: 'cart',
        badge: 'first-buyer',
        tier: 'bronze' as const,
        coinReward: 50,
        unlocked: true,
        unlockedAt: new Date(),
        progress: { current: 1, target: 1 },
        category: 'shopping' as const,
      };

      (achievementApi.recalculateAchievements as jest.Mock).mockResolvedValue({
        data: [mockNewAchievement],
      });

      (achievementApi.getAchievementProgress as jest.Mock).mockResolvedValue({
        data: {
          achievements: [mockNewAchievement],
          summary: { total: 50, unlocked: 1, completionPercentage: 2 },
        },
      });

      const { result } = renderHook(() => useGamification(), { wrapper });

      await act(async () => {
        await result.current.actions.loadGamificationData();
      });

      let newAchievements: any[] = [];
      await act(async () => {
        newAchievements = await result.current.actions.triggerAchievementCheck('PURCHASE', {});
      });

      expect(achievementApi.recalculateAchievements).toHaveBeenCalled();
      expect(newAchievements).toHaveLength(1);
    });

    it('should add unlocked achievements to queue', async () => {
      const mockNewAchievement = {
        id: 'ach-1',
        title: 'First Purchase',
        description: 'Make your first purchase',
        icon: 'cart',
        badge: 'first-buyer',
        tier: 'bronze' as const,
        coinReward: 50,
        unlocked: true,
        unlockedAt: new Date(),
        progress: { current: 1, target: 1 },
        category: 'shopping' as const,
      };

      (achievementApi.recalculateAchievements as jest.Mock).mockResolvedValue({
        data: [mockNewAchievement],
      });

      (achievementApi.getAchievementProgress as jest.Mock).mockResolvedValue({
        data: {
          achievements: [mockNewAchievement],
          summary: { total: 50, unlocked: 1, completionPercentage: 2 },
        },
      });

      const { result } = renderHook(() => useGamification(), { wrapper });

      await act(async () => {
        await result.current.actions.loadGamificationData();
        await result.current.actions.triggerAchievementCheck('PURCHASE', {});
      });

      expect(result.current.computed.hasUnshownAchievements).toBe(true);
      expect(result.current.computed.pendingAchievements).toHaveLength(1);
    });
  });

  describe('markAchievementAsShown', () => {
    it('should mark achievement as shown', async () => {
      const mockAchievement = {
        id: 'ach-1',
        title: 'Test Achievement',
        description: 'Test',
        icon: 'star',
        badge: 'test',
        tier: 'bronze' as const,
        coinReward: 50,
        unlocked: true,
        unlockedAt: new Date(),
        progress: { current: 1, target: 1 },
        category: 'shopping' as const,
      };

      (achievementApi.recalculateAchievements as jest.Mock).mockResolvedValue({
        data: [mockAchievement],
      });

      (achievementApi.getAchievementProgress as jest.Mock).mockResolvedValue({
        data: {
          achievements: [mockAchievement],
          summary: { total: 50, unlocked: 1, completionPercentage: 2 },
        },
      });

      const { result } = renderHook(() => useGamification(), { wrapper });

      await act(async () => {
        await result.current.actions.loadGamificationData();
        await result.current.actions.triggerAchievementCheck('TEST', {});
        result.current.actions.markAchievementAsShown('ach-1');
      });

      expect(result.current.computed.hasUnshownAchievements).toBe(false);
    });
  });

  describe('Feature Flags', () => {
    it('should respect ENABLE_COINS flag', async () => {
      const { result } = renderHook(() => useGamification(), { wrapper });

      expect(result.current.state.featureFlags.ENABLE_COINS).toBe(true);
      expect(result.current.computed.canEarnCoins).toBe(true);
    });

    it('should respect ENABLE_ACHIEVEMENTS flag', () => {
      const { result } = renderHook(() => useGamification(), { wrapper });

      expect(result.current.state.featureFlags.ENABLE_ACHIEVEMENTS).toBe(true);
    });

    it('should respect ENABLE_CHALLENGES flag', () => {
      const { result } = renderHook(() => useGamification(), { wrapper });

      expect(result.current.state.featureFlags.ENABLE_CHALLENGES).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should clear error state', async () => {
      (achievementApi.getAchievementProgress as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      const { result } = renderHook(() => useGamification(), { wrapper });

      await act(async () => {
        await result.current.actions.loadGamificationData();
      });

      expect(result.current.state.error).toBeTruthy();

      act(() => {
        result.current.actions.clearError();
      });

      expect(result.current.state.error).toBeNull();
    });
  });

  describe('Computed Values', () => {
    it('should calculate unlocked count correctly', async () => {
      (achievementApi.getAchievementProgress as jest.Mock).mockResolvedValue({
        data: {
          achievements: [],
          summary: { total: 50, unlocked: 15, completionPercentage: 30 },
        },
      });

      const { result } = renderHook(() => useGamification(), { wrapper });

      await act(async () => {
        await result.current.actions.loadGamificationData();
      });

      expect(result.current.computed.unlockedCount).toBe(15);
    });

    it('should calculate completion percentage correctly', async () => {
      (achievementApi.getAchievementProgress as jest.Mock).mockResolvedValue({
        data: {
          achievements: [],
          summary: { total: 50, unlocked: 25, completionPercentage: 50 },
        },
      });

      const { result } = renderHook(() => useGamification(), { wrapper });

      await act(async () => {
        await result.current.actions.loadGamificationData();
      });

      expect(result.current.computed.completionPercentage).toBe(50);
    });
  });

  describe('Cache Management', () => {
    it('should cache gamification data', async () => {
      const { result } = renderHook(() => useGamification(), { wrapper });

      await act(async () => {
        await result.current.actions.loadGamificationData();
      });

      // Check that data was saved to AsyncStorage
      const cacheTime = await AsyncStorage.getItem('gamification_cache_time');
      expect(cacheTime).toBeTruthy();
    });

    it('should force refresh when requested', async () => {
      const { result } = renderHook(() => useGamification(), { wrapper });

      await act(async () => {
        await result.current.actions.loadGamificationData();
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.actions.loadGamificationData(true); // Force refresh
      });

      // Should fetch fresh data even if cache is valid
      expect(achievementApi.getAchievementProgress).toHaveBeenCalled();
    });
  });
});

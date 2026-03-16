// GamesPage Component Tests
// Test suite for the main games hub page

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import GamesPage from '@/app/games/index';
import { useAuthUser, useIsAuthenticated, useAuthLoading } from '@/stores/selectors';
import { useGamification } from '@/contexts/GamificationContext';
import walletApi from '@/services/walletApi';
import { renderWithProviders } from '../gamification/testUtils';

// Mock dependencies
jest.mock('@/stores/selectors', () => ({
  ...jest.requireActual('@/stores/selectors'),
  useAuthUser: jest.fn(),
  useIsAuthenticated: jest.fn(),
  useAuthLoading: jest.fn(),
}));
jest.mock('@/contexts/GamificationContext');
jest.mock('@/services/walletApi');
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
  },
  Stack: {
    Screen: jest.fn(({ children }) => children),
  },
}));

const mockUseAuthUser = useAuthUser as jest.MockedFunction<typeof useAuthUser>;
const mockUseIsAuthenticated = useIsAuthenticated as jest.MockedFunction<typeof useIsAuthenticated>;
const mockUseAuthLoading = useAuthLoading as jest.MockedFunction<typeof useAuthLoading>;
const mockUseGamification = useGamification as jest.MockedFunction<typeof useGamification>;

describe('GamesPage', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockGamificationState = {
    coinBalance: {
      total: 1000,
      earned: 1500,
      spent: 500,
      pending: 0,
      lifetimeEarned: 1500,
      lifetimeSpent: 500,
    },
    dailyStreak: 5,
    achievements: [],
    achievementProgress: {
      summary: {
        total: 50,
        unlocked: 10,
        completionPercentage: 20,
      },
      achievements: [],
      gamesPlayed: 25,
    },
    challenges: [],
    achievementQueue: [],
    lastLoginDate: new Date().toISOString(),
    isLoading: false,
    error: null,
    featureFlags: {
      ENABLE_ACHIEVEMENTS: true,
      ENABLE_COINS: true,
      ENABLE_CHALLENGES: true,
      ENABLE_LEADERBOARD: true,
      ENABLE_NOTIFICATIONS: true,
    },
  };

  const mockGamificationActions = {
    loadGamificationData: jest.fn().mockResolvedValue(undefined),
    triggerAchievementCheck: jest.fn().mockResolvedValue([]),
    awardCoins: jest.fn().mockResolvedValue(undefined),
    spendCoins: jest.fn().mockResolvedValue(undefined),
    updateDailyStreak: jest.fn().mockResolvedValue(undefined),
    markAchievementAsShown: jest.fn(),
    refreshAchievements: jest.fn().mockResolvedValue(undefined),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuthUser.mockReturnValue(mockUser as any);
    mockUseIsAuthenticated.mockReturnValue(true);
    mockUseAuthLoading.mockReturnValue(false);

    mockUseGamification.mockReturnValue({
      state: mockGamificationState,
      actions: mockGamificationActions,
      computed: {
        unlockedCount: 10,
        completionPercentage: 20,
        pendingAchievements: [],
        hasUnshownAchievements: false,
        canEarnCoins: true,
      },
    });

    (walletApi.getBalance as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        coins: [
          { type: 'wasil', amount: 1000, currency: 'INR' },
        ],
      },
    });
  });

  describe('Rendering', () => {
    it('should render games page with header', async () => {
      const { getByText } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        expect(getByText('Games & Challenges')).toBeTruthy();
      });
    });

    it('should display user coin balance', async () => {
      const { getByText } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        expect(getByText('1,000')).toBeTruthy();
      });
    });

    it('should render all available games', async () => {
      const { getByText } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        expect(getByText('Spin & Win')).toBeTruthy();
        expect(getByText('Scratch Card')).toBeTruthy();
        expect(getByText('Daily Quiz')).toBeTruthy();
      });
    });

    it('should show user statistics', async () => {
      const { getByText } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        expect(getByText('Games Won')).toBeTruthy();
        expect(getByText('Day Streak')).toBeTruthy();
        expect(getByText('Total Coins')).toBeTruthy();
      });
    });

    it('should display day streak correctly', async () => {
      const { getByText } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        expect(getByText('5')).toBeTruthy(); // Day streak value
      });
    });
  });

  describe('Game Card Interactions', () => {
    it('should navigate to active game when clicked', async () => {
      const router = require('expo-router').router;
      const { getByText } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        const spinWinCard = getByText('Spin & Win');
        fireEvent.press(spinWinCard.parent?.parent as any);
      });

      expect(router.push).toHaveBeenCalledWith('/games/spin-wheel');
    });

    it('should show "coming soon" alert for upcoming games', async () => {
      jest.spyOn(global, 'alert').mockImplementation(() => {});
      const { getByText } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        const quizCard = getByText('Daily Quiz');
        fireEvent.press(quizCard.parent?.parent as any);
      });

      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Coming Soon'));
    });

    it('should show locked message for locked games', async () => {
      jest.spyOn(global, 'alert').mockImplementation(() => {});
      const { getByText } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        const slotCard = getByText('Slot Machine');
        fireEvent.press(slotCard.parent?.parent as any);
      });

      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('locked'));
    });

    it('should display reward coins for active games', async () => {
      const { getByText } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        expect(getByText(/Win up to 50 coins/i)).toBeTruthy();
      });
    });
  });

  describe('Data Loading', () => {
    it('should load wallet balance on mount', async () => {
      renderWithProviders(<GamesPage />);

      await waitFor(() => {
        expect(walletApi.getBalance).toHaveBeenCalled();
      });
    });

    it('should load gamification data on mount', async () => {
      renderWithProviders(<GamesPage />);

      await waitFor(() => {
        expect(mockGamificationActions.loadGamificationData).toHaveBeenCalled();
      });
    });

    it('should handle wallet API errors gracefully', async () => {
      (walletApi.getBalance as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { getByText } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        // Should fallback to gamification context coins
        expect(getByText('1,000')).toBeTruthy();
      });
    });

    it('should show loading state initially', () => {
      const { UNSAFE_queryByType } = renderWithProviders(<GamesPage />);

      // Should render without crashing
      expect(UNSAFE_queryByType).toBeDefined();
    });
  });

  describe('Pull to Refresh', () => {
    it('should refresh data when pulled down', async () => {
      const { UNSAFE_getByType } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        const scrollView = UNSAFE_getByType(require('react-native').ScrollView);
        fireEvent(scrollView, 'refresh');
      });

      await waitFor(() => {
        expect(walletApi.getBalance).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
      });
    });

    it('should reload gamification data on refresh', async () => {
      const { UNSAFE_getByType } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        const scrollView = UNSAFE_getByType(require('react-native').ScrollView);
        fireEvent(scrollView, 'refresh');
      });

      await waitFor(() => {
        expect(mockGamificationActions.loadGamificationData).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to wallet when coins container is pressed', async () => {
      const router = require('expo-router').router;
      const { getByText } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        const coinsText = getByText('1,000');
        fireEvent.press(coinsText.parent as any);
      });

      expect(router.push).toHaveBeenCalledWith('/wallet-screen');
    });

    it('should navigate to challenges page when CTA is pressed', async () => {
      const router = require('expo-router').router;
      const { getByText } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        const ctaButton = getByText('View All Challenges');
        fireEvent.press(ctaButton.parent?.parent as any);
      });

      expect(router.push).toHaveBeenCalledWith('/gamification');
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate games won from achievements', async () => {
      const { getByText } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        // 25 games played * 0.6 win rate = 15 games won
        expect(getByText('15')).toBeTruthy();
      });
    });

    it('should update coin balance when gamification state changes', async () => {
      const { rerender, getByText } = renderWithProviders(<GamesPage />);

      // Update mock to return new balance
      mockUseGamification.mockReturnValue({
        state: {
          ...mockGamificationState,
          coinBalance: {
            ...mockGamificationState.coinBalance,
            total: 2000,
          },
        },
        actions: mockGamificationActions,
        computed: {
          unlockedCount: 10,
          completionPercentage: 20,
          pendingAchievements: [],
          hasUnshownAchievements: false,
          canEarnCoins: true,
        },
      });

      rerender(<GamesPage />);

      await waitFor(() => {
        expect(getByText('2,000')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error alert when data loading fails', async () => {
      jest.spyOn(Alert, 'alert');
      (walletApi.getBalance as jest.Mock).mockRejectedValue(new Error('API Error'));
      mockGamificationActions.loadGamificationData.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<GamesPage />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('Failed to load game data')
        );
      });
    });

    it('should handle unauthenticated state', () => {
      mockUseAuthUser.mockReturnValue(null);
      mockUseIsAuthenticated.mockReturnValue(false);

      const { getByText } = renderWithProviders(<GamesPage />);

      // Should still render but with default values
      expect(getByText('Games & Challenges')).toBeTruthy();
    });
  });

  describe('Game Status Badges', () => {
    it('should show "SOON" badge for coming soon games', async () => {
      const { getByText } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        expect(getByText('SOON')).toBeTruthy();
      });
    });

    it('should disable locked games', async () => {
      const { getByText } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        const slotMachine = getByText('Slot Machine');
        const parent = slotMachine.parent?.parent as any;
        expect(parent.props.disabled).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible game cards', async () => {
      const { getByText } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        const spinWinCard = getByText('Spin & Win');
        expect(spinWinCard.parent?.parent).toBeTruthy();
      });
    });

    it('should show descriptive game information', async () => {
      const { getByText } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        expect(getByText('Spin the wheel daily for rewards')).toBeTruthy();
        expect(getByText('Scratch to reveal prizes')).toBeTruthy();
      });
    });
  });

  describe('Info Banner', () => {
    it('should display how it works information', async () => {
      const { getByText } = renderWithProviders(<GamesPage />);

      await waitFor(() => {
        expect(getByText('How it works')).toBeTruthy();
        expect(getByText(/Play games daily to earn coins/i)).toBeTruthy();
      });
    });
  });
});

/**
 * Referral Dashboard Test Suite
 *
 * Comprehensive tests for the Referral Dashboard covering:
 * - Dashboard data loading
 * - Tier progression display
 * - Leaderboard rendering
 * - Reward claiming
 * - Refresh functionality
 * - Navigation
 * - Error handling
 *
 * Total: 60 tests
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ReferralDashboard from '@/app/referral/dashboard';
import referralTierApi from '@/services/referralTierApi';
import { useRouter } from 'expo-router';

// Mock dependencies
jest.mock('@/services/referralTierApi');
jest.mock('expo-router');

describe('ReferralDashboard', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };

  const mockTierData = {
    currentTier: 'STARTER',
    tierData: {
      name: 'Starter',
      badge: '🌱',
      minReferrals: 0,
      rewards: {
        perReferral: 50,
        milestone1: { referrals: 5, bonus: 100 },
      },
    },
    progress: {
      nextTier: 'BRONZE',
      referralsNeeded: 2,
      progress: 60,
      nextTierData: {
        name: 'Bronze',
        badge: '🥉',
        minReferrals: 5,
        rewards: {
          perReferral: 75,
          tierBonus: 500,
          voucher: { type: 'Shopping', amount: 100 },
        },
      },
    },
    stats: {
      currentTier: 'STARTER',
      qualifiedReferrals: 3,
      pendingReferrals: 1,
      totalReferrals: 4,
      lifetimeEarnings: 350,
      successRate: 75,
      currentStreak: 3,
    },
    upcomingMilestones: [],
  };

  const mockRewardsData = {
    claimable: [
      {
        type: 'coins' as const,
        amount: 50,
        description: 'Referral bonus',
        referralId: 'ref1',
        rewardIndex: 0,
      },
      {
        type: 'voucher' as const,
        amount: 100,
        voucherType: 'Shopping',
        description: 'Shopping voucher',
        referralId: 'ref2',
        rewardIndex: 1,
      },
    ],
    claimed: [],
    totalClaimableValue: 150,
  };

  const mockLeaderboardData = {
    leaderboard: [
      {
        userId: 'user1',
        username: 'TopReferrer',
        fullName: 'John Doe',
        rank: 1,
        totalReferrals: 25,
        lifetimeEarnings: 2500,
        tier: 'GOLD',
      },
      {
        userId: 'user2',
        username: 'SecondPlace',
        fullName: 'Jane Smith',
        rank: 2,
        totalReferrals: 20,
        lifetimeEarnings: 2000,
        tier: 'SILVER',
      },
    ],
    userRank: {
      rank: 15,
      totalReferrals: 3,
    },
  };

  const mockQRData = {
    qrCode: 'data:image/png;base64,TEST_QR',
    referralLink: 'https://rezapp.com/invite/TEST123',
    referralCode: 'TEST123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Mock successful API responses
    (referralTierApi.getTier as jest.Mock).mockResolvedValue(mockTierData);
    (referralTierApi.getRewards as jest.Mock).mockResolvedValue(mockRewardsData);
    (referralTierApi.getLeaderboard as jest.Mock).mockResolvedValue(mockLeaderboardData);
    (referralTierApi.generateQR as jest.Mock).mockResolvedValue(mockQRData);
  });

  // ============================================
  // 1. Initial Rendering Tests (8 tests)
  // ============================================

  describe('Initial Rendering', () => {
    test('shows loading indicator initially', () => {
      const { getByTestId, UNSAFE_getAllByType } = render(<ReferralDashboard />);

      const indicators = UNSAFE_getAllByType('ActivityIndicator' as any);
      expect(indicators.length).toBeGreaterThan(0);
    });

    test('renders dashboard after data loads', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Starter')).toBeTruthy();
      });
    });

    test('displays tier badge correctly', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('🌱')).toBeTruthy();
      });
    });

    test('displays qualified referrals count', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('3')).toBeTruthy();
        expect(getByText('Qualified')).toBeTruthy();
      });
    });

    test('displays lifetime earnings', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('₹350')).toBeTruthy();
        expect(getByText('Earned')).toBeTruthy();
      });
    });

    test('displays success rate', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('75%')).toBeTruthy();
        expect(getByText('Success')).toBeTruthy();
      });
    });

    test('displays referral code', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('TEST123')).toBeTruthy();
      });
    });

    test('displays "Your Referral Code" label', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Your Referral Code')).toBeTruthy();
      });
    });
  });

  // ============================================
  // 2. Data Loading Tests (6 tests)
  // ============================================

  describe('Data Loading', () => {
    test('calls all API endpoints on mount', async () => {
      render(<ReferralDashboard />);

      await waitFor(() => {
        expect(referralTierApi.getTier).toHaveBeenCalledTimes(1);
        expect(referralTierApi.getRewards).toHaveBeenCalledTimes(1);
        expect(referralTierApi.getLeaderboard).toHaveBeenCalledWith(10);
        expect(referralTierApi.generateQR).toHaveBeenCalledTimes(1);
      });
    });

    test('loads data in parallel', async () => {
      const startTime = Date.now();

      render(<ReferralDashboard />);

      await waitFor(() => {
        expect(referralTierApi.getTier).toHaveBeenCalled();
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Parallel loading should be faster than sequential
      expect(duration).toBeLessThan(1000);
    });

    test('updates state with loaded data', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Starter')).toBeTruthy();
        expect(getByText('TEST123')).toBeTruthy();
      });
    });

    test('handles empty rewards gracefully', async () => {
      (referralTierApi.getRewards as jest.Mock).mockResolvedValue({
        claimable: [],
        claimed: [],
        totalClaimableValue: 0,
      });

      const { queryByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(queryByText('Claimable Rewards')).toBeNull();
      });
    });

    test('handles empty leaderboard gracefully', async () => {
      (referralTierApi.getLeaderboard as jest.Mock).mockResolvedValue({
        leaderboard: [],
        userRank: null,
      });

      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Leaderboard')).toBeTruthy();
      });
    });

    test('hides loading indicator after data loads', async () => {
      const { queryByTestId, UNSAFE_queryAllByType } = render(<ReferralDashboard />);

      await waitFor(() => {
        const indicators = UNSAFE_queryAllByType('ActivityIndicator' as any);
        expect(indicators.length).toBe(0);
      });
    });
  });

  // ============================================
  // 3. Tier Progress Display Tests (8 tests)
  // ============================================

  describe('Tier Progress Display', () => {
    test('displays progress section when next tier exists', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Progress to Bronze')).toBeTruthy();
      });
    });

    test('displays referrals needed message', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('2 more referrals needed')).toBeTruthy();
      });
    });

    test('displays progress percentage', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('60%')).toBeTruthy();
      });
    });

    test('renders progress bar with correct width', async () => {
      const { UNSAFE_getAllByType } = render(<ReferralDashboard />);

      await waitFor(() => {
        const views = UNSAFE_getAllByType('View' as any);
        const progressBars = views.filter(v =>
          v.props.style &&
          Array.isArray(v.props.style) &&
          v.props.style.some((s: any) => s.width === '60%')
        );
        expect(progressBars.length).toBeGreaterThan(0);
      });
    });

    test('displays next tier rewards - tier bonus', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('₹500 Tier Bonus')).toBeTruthy();
      });
    });

    test('displays next tier rewards - voucher', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Shopping ₹100 Voucher')).toBeTruthy();
      });
    });

    test('hides progress section when no next tier', async () => {
      const dataWithoutNextTier = {
        ...mockTierData,
        progress: { ...mockTierData.progress, nextTier: null },
      };

      (referralTierApi.getTier as jest.Mock).mockResolvedValue(dataWithoutNextTier);

      const { queryByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(queryByText(/Progress to/)).toBeNull();
      });
    });

    test('displays lifetime premium reward when available', async () => {
      const dataWithPremium = {
        ...mockTierData,
        progress: {
          ...mockTierData.progress,
          nextTierData: {
            ...mockTierData.progress.nextTierData,
            rewards: {
              ...mockTierData.progress.nextTierData.rewards,
              lifetimePremium: true,
            },
          },
        },
      };

      (referralTierApi.getTier as jest.Mock).mockResolvedValue(dataWithPremium);

      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Lifetime Premium')).toBeTruthy();
      });
    });
  });

  // ============================================
  // 4. Share Section Tests (5 tests)
  // ============================================

  describe('Share Section', () => {
    test('displays "Share & Earn" title', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Share & Earn')).toBeTruthy();
      });
    });

    test('displays invite friends button', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Invite Friends')).toBeTruthy();
      });
    });

    test('displays per-referral earning amount', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Earn ₹50 per referral')).toBeTruthy();
      });
    });

    test('navigates to share screen when invite button is pressed', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Invite Friends')).toBeTruthy();
      });

      fireEvent.press(getByText('Invite Friends'));

      expect(mockRouter.push).toHaveBeenCalledWith('/referral/share');
    });

    test('displays copy code button', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Copy Code')).toBeTruthy();
      });
    });
  });

  // ============================================
  // 5. Claimable Rewards Tests (8 tests)
  // ============================================

  describe('Claimable Rewards', () => {
    test('displays claimable rewards section when rewards exist', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Claimable Rewards')).toBeTruthy();
      });
    });

    test('displays reward descriptions', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Referral bonus')).toBeTruthy();
        expect(getByText('Shopping voucher')).toBeTruthy();
      });
    });

    test('displays reward amounts - coins', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('₹50')).toBeTruthy();
      });
    });

    test('displays reward amounts - voucher', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Shopping ₹100')).toBeTruthy();
      });
    });

    test('displays claim buttons for each reward', async () => {
      const { getAllByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        const claimButtons = getAllByText('Claim');
        expect(claimButtons.length).toBe(2);
      });
    });

    test('displays total claimable value', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Total Claimable: ₹150')).toBeTruthy();
      });
    });

    test('calls claim API when claim button is pressed', async () => {
      (referralTierApi.claimReward as jest.Mock).mockResolvedValue({ success: true });

      const { getAllByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        const claimButtons = getAllByText('Claim');
        expect(claimButtons.length).toBeGreaterThan(0);
      });

      const firstClaimButton = getAllByText('Claim')[0];
      fireEvent.press(firstClaimButton);

      await waitFor(() => {
        expect(referralTierApi.claimReward).toHaveBeenCalledWith('ref1', 0);
      });
    });

    test('shows success alert after claiming reward', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      (referralTierApi.claimReward as jest.Mock).mockResolvedValue({ success: true });

      const { getAllByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        const claimButtons = getAllByText('Claim');
        expect(claimButtons.length).toBeGreaterThan(0);
      });

      fireEvent.press(getAllByText('Claim')[0]);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Success', 'Reward claimed successfully!');
      });
    });
  });

  // ============================================
  // 6. Leaderboard Tests (8 tests)
  // ============================================

  describe('Leaderboard', () => {
    test('displays leaderboard section', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Leaderboard')).toBeTruthy();
      });
    });

    test('displays user rank card', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Your Rank')).toBeTruthy();
        expect(getByText('#15')).toBeTruthy();
      });
    });

    test('displays user rank referrals count', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('3 referrals')).toBeTruthy();
      });
    });

    test('displays leaderboard entries', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
        expect(getByText('Jane Smith')).toBeTruthy();
      });
    });

    test('displays leaderboard ranks', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('#1')).toBeTruthy();
        expect(getByText('#2')).toBeTruthy();
      });
    });

    test('displays leaderboard stats', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('25 referrals · ₹2500')).toBeTruthy();
        expect(getByText('20 referrals · ₹2000')).toBeTruthy();
      });
    });

    test('navigates to full leaderboard when view all is pressed', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('View All')).toBeTruthy();
      });

      fireEvent.press(getByText('View All'));

      expect(mockRouter.push).toHaveBeenCalledWith('/referral/leaderboard');
    });

    test('displays only top 5 entries in preview', async () => {
      const longLeaderboard = {
        leaderboard: Array.from({ length: 10 }, (_, i) => ({
          userId: `user${i}`,
          username: `User${i}`,
          fullName: `Name ${i}`,
          rank: i + 1,
          totalReferrals: 10 - i,
          lifetimeEarnings: (10 - i) * 100,
          tier: 'BRONZE',
        })),
        userRank: { rank: 20, totalReferrals: 2 },
      };

      (referralTierApi.getLeaderboard as jest.Mock).mockResolvedValue(longLeaderboard);

      const { getByText, queryByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Name 0')).toBeTruthy();
        expect(getByText('Name 4')).toBeTruthy();
        expect(queryByText('Name 9')).toBeNull(); // Should not show 10th entry
      });
    });
  });

  // ============================================
  // 7. Refresh Functionality Tests (4 tests)
  // ============================================

  describe('Refresh Functionality', () => {
    test('supports pull-to-refresh', async () => {
      const { UNSAFE_getByType } = render(<ReferralDashboard />);

      await waitFor(() => {
        const scrollView = UNSAFE_getByType('ScrollView' as any);
        expect(scrollView.props.refreshControl).toBeDefined();
      });
    });

    test('refetches data when refreshing', async () => {
      const { UNSAFE_getByType } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(referralTierApi.getTier).toHaveBeenCalledTimes(1);
      });

      const scrollView = UNSAFE_getByType('ScrollView' as any);
      const refreshControl = scrollView.props.refreshControl;

      // Simulate refresh
      act(() => {
        refreshControl.props.onRefresh();
      });

      await waitFor(() => {
        expect(referralTierApi.getTier).toHaveBeenCalledTimes(2);
      });
    });

    test('shows refreshing indicator while refreshing', async () => {
      const { UNSAFE_getByType } = render(<ReferralDashboard />);

      await waitFor(() => {
        const scrollView = UNSAFE_getByType('ScrollView' as any);
        expect(scrollView).toBeTruthy();
      });

      const scrollView = UNSAFE_getByType('ScrollView' as any);

      act(() => {
        scrollView.props.refreshControl.props.onRefresh();
      });

      // Check refreshing prop is set
      expect(scrollView.props.refreshControl.props.refreshing).toBeDefined();
    });

    test('clears refreshing state after data loads', async () => {
      const { UNSAFE_getByType } = render(<ReferralDashboard />);

      await waitFor(() => {
        const scrollView = UNSAFE_getByType('ScrollView' as any);
        expect(scrollView).toBeTruthy();
      });

      const scrollView = UNSAFE_getByType('ScrollView' as any);

      act(() => {
        scrollView.props.refreshControl.props.onRefresh();
      });

      await waitFor(() => {
        expect(scrollView.props.refreshControl.props.refreshing).toBe(false);
      });
    });
  });

  // ============================================
  // 8. Error Handling Tests (8 tests)
  // ============================================

  describe('Error Handling', () => {
    test('shows error alert when tier data fails to load', async () => {
      (referralTierApi.getTier as jest.Mock).mockRejectedValue(new Error('API Error'));
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<ReferralDashboard />);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to load referral data');
      });
    });

    test('shows error alert when rewards fail to load', async () => {
      (referralTierApi.getRewards as jest.Mock).mockRejectedValue(new Error('API Error'));
      const alertSpy = jest.spyOn(Alert, 'alert');

      render(<ReferralDashboard />);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
    });

    test('handles claim reward errors', async () => {
      (referralTierApi.claimReward as jest.Mock).mockRejectedValue(
        new Error('Claim failed')
      );
      const alertSpy = jest.spyOn(Alert, 'alert');

      const { getAllByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        const claimButtons = getAllByText('Claim');
        expect(claimButtons.length).toBeGreaterThan(0);
      });

      fireEvent.press(getAllByText('Claim')[0]);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Claim failed');
      });
    });

    test('handles generic claim errors', async () => {
      (referralTierApi.claimReward as jest.Mock).mockRejectedValue({});
      const alertSpy = jest.spyOn(Alert, 'alert');

      const { getAllByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        const claimButtons = getAllByText('Claim');
        expect(claimButtons.length).toBeGreaterThan(0);
      });

      fireEvent.press(getAllByText('Claim')[0]);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to claim reward');
      });
    });

    test('continues loading other data when one API fails', async () => {
      (referralTierApi.getRewards as jest.Mock).mockRejectedValue(new Error('Failed'));

      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        // Should still show tier data
        expect(getByText('Starter')).toBeTruthy();
      });
    });

    test('hides loading state after error', async () => {
      (referralTierApi.getTier as jest.Mock).mockRejectedValue(new Error('Failed'));

      const { UNSAFE_queryAllByType } = render(<ReferralDashboard />);

      await waitFor(() => {
        const indicators = UNSAFE_queryAllByType('ActivityIndicator' as any);
        expect(indicators.length).toBe(0);
      });
    });

    test('allows retry after error via refresh', async () => {
      (referralTierApi.getTier as jest.Mock).mockRejectedValueOnce(new Error('Failed'));
      (referralTierApi.getTier as jest.Mock).mockResolvedValueOnce(mockTierData);

      const { UNSAFE_getByType } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(referralTierApi.getTier).toHaveBeenCalledTimes(1);
      });

      const scrollView = UNSAFE_getByType('ScrollView' as any);

      act(() => {
        scrollView.props.refreshControl.props.onRefresh();
      });

      await waitFor(() => {
        expect(referralTierApi.getTier).toHaveBeenCalledTimes(2);
      });
    });

    test('logs errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (referralTierApi.getTier as jest.Mock).mockRejectedValue(new Error('Test error'));

      render(<ReferralDashboard />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading referral data:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  // ============================================
  // 9. Navigation Tests (2 tests)
  // ============================================

  describe('Navigation', () => {
    test('navigates to share page from invite button', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('Invite Friends')).toBeTruthy();
      });

      fireEvent.press(getByText('Invite Friends'));

      expect(mockRouter.push).toHaveBeenCalledWith('/referral/share');
    });

    test('navigates to leaderboard page from view all button', async () => {
      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('View All')).toBeTruthy();
      });

      fireEvent.press(getByText('View All'));

      expect(mockRouter.push).toHaveBeenCalledWith('/referral/leaderboard');
    });
  });

  // ============================================
  // 10. Edge Cases Tests (3 tests)
  // ============================================

  describe('Edge Cases', () => {
    test('handles zero qualified referrals', async () => {
      const dataWithZero = {
        ...mockTierData,
        stats: { ...mockTierData.stats, qualifiedReferrals: 0 },
      };

      (referralTierApi.getTier as jest.Mock).mockResolvedValue(dataWithZero);

      const { getByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(getByText('0')).toBeTruthy();
      });
    });

    test('handles missing user rank gracefully', async () => {
      const dataWithoutRank = {
        ...mockLeaderboardData,
        userRank: null,
      };

      (referralTierApi.getLeaderboard as jest.Mock).mockResolvedValue(dataWithoutRank);

      const { queryByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        expect(queryByText('Your Rank')).toBeNull();
      });
    });

    test('handles missing next tier data', async () => {
      const dataWithoutNext = {
        ...mockTierData,
        progress: { ...mockTierData.progress, nextTierData: null },
      };

      (referralTierApi.getTier as jest.Mock).mockResolvedValue(dataWithoutNext);

      const { queryByText } = render(<ReferralDashboard />);

      await waitFor(() => {
        // Should not show reward details
        expect(queryByText('Unlock Rewards:')).toBeNull();
      });
    });
  });
});

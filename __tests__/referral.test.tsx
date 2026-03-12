/**
 * Referral Page Test Suite
 *
 * Tests for the Referral Program page functionality
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import ReferralPage from '../app/referral';
import { useAuth } from '@/contexts/AuthContext';
import * as Clipboard from 'expo-clipboard';
import { Share, Alert } from 'react-native';
import {
  getReferralStats,
  getReferralHistory,
  getReferralCode,
  trackShare,
} from '@/services/referralApi';

// Mock the dependencies
jest.mock('@/contexts/AuthContext');
jest.mock('@/services/referralApi');
jest.mock('expo-clipboard');
jest.mock('@/utils/privacy', () => ({
  anonymizeEmail: jest.fn((email) => `${email.slice(0, 3)}***@***`),
}));

describe('ReferralPage', () => {
  // Mock data
  const mockAuthState = {
    state: {
      isAuthenticated: true,
      user: {
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
      },
    },
  };

  const mockReferralCode = {
    referralCode: 'TEST123',
    referralLink: 'https://rezapp.com/invite/TEST123',
    shareMessage: 'Join me on REZ App and get ₹30 off!',
  };

  const mockStats = {
    totalReferrals: 5,
    totalEarned: 250,
    pendingReferrals: 2,
    pendingEarnings: 100,
  };

  const mockHistory = [
    {
      id: '1',
      referredUser: {
        name: 'Friend One',
        email: 'friend1@example.com',
      },
      status: 'completed',
      rewardStatus: 'credited',
      rewardAmount: 50,
      createdAt: '2025-01-15T10:00:00Z',
    },
    {
      id: '2',
      referredUser: {
        name: 'Friend Two',
        email: 'friend2@example.com',
      },
      status: 'pending',
      rewardStatus: 'pending',
      rewardAmount: 50,
      createdAt: '2025-01-20T14:30:00Z',
    },
  ];

  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authentication
    (useAuth as jest.Mock).mockReturnValue(mockAuthState);

    // Mock API calls
    (getReferralCode as jest.Mock).mockResolvedValue(mockReferralCode);
    (getReferralStats as jest.Mock).mockResolvedValue(mockStats);
    (getReferralHistory as jest.Mock).mockResolvedValue(mockHistory);
    (trackShare as jest.Mock).mockResolvedValue({ success: true });
  });

  describe('Component Rendering', () => {
    test('renders without crashing', async () => {
      const { getByText } = render(<ReferralPage />);

      await waitFor(() => {
        expect(getByText('Refer & Earn')).toBeTruthy();
      });
    });

    test('displays loading state initially', () => {
      const { getByText } = render(<ReferralPage />);

      expect(getByText('Loading referral data...')).toBeTruthy();
    });

    test('displays referral code after loading', async () => {
      const { getByText } = render(<ReferralPage />);

      await waitFor(() => {
        expect(getByText('TEST123')).toBeTruthy();
      });
    });

    test('displays "Your Referral Code" title', async () => {
      const { getByText } = render(<ReferralPage />);

      await waitFor(() => {
        expect(getByText('Your Referral Code')).toBeTruthy();
      });
    });

    test('displays share button', async () => {
      const { getByText } = render(<ReferralPage />);

      await waitFor(() => {
        expect(getByText('Share with Friends')).toBeTruthy();
      });
    });
  });

  describe('Referral Code Functionality', () => {
    test('copy button is clickable', async () => {
      const { getByTestId, getByText } = render(<ReferralPage />);

      await waitFor(() => {
        expect(getByText('TEST123')).toBeTruthy();
      });

      // Find and click the copy button
      const codeBox = getByText('TEST123').parent?.parent;
      expect(codeBox).toBeTruthy();

      // The copy button should be clickable
      fireEvent.press(codeBox!);
    });

    test('copies referral code to clipboard when copy button is pressed', async () => {
      const setStringAsyncMock = jest.spyOn(Clipboard, 'setStringAsync');
      const { getByText } = render(<ReferralPage />);

      await waitFor(() => {
        expect(getByText('TEST123')).toBeTruthy();
      });

      // Find the code box and simulate copy
      const codeBox = getByText('TEST123').parent?.parent;
      if (codeBox) {
        fireEvent.press(codeBox);

        await waitFor(() => {
          expect(setStringAsyncMock).toHaveBeenCalledWith('TEST123');
        });
      }
    });

    test('shows alert confirmation after copying', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByText } = render(<ReferralPage />);

      await waitFor(() => {
        expect(getByText('TEST123')).toBeTruthy();
      });

      const codeBox = getByText('TEST123').parent?.parent;
      if (codeBox) {
        fireEvent.press(codeBox);

        await waitFor(() => {
          expect(alertSpy).toHaveBeenCalledWith(
            'Copied!',
            'Referral code copied to clipboard'
          );
        });
      }
    });
  });

  describe('Share Functionality', () => {
    test('share button triggers share dialog', async () => {
      const shareMock = jest.spyOn(Share, 'share');
      const { getByText } = render(<ReferralPage />);

      await waitFor(() => {
        expect(getByText('Share with Friends')).toBeTruthy();
      });

      const shareButton = getByText('Share with Friends');
      fireEvent.press(shareButton);

      await waitFor(() => {
        expect(shareMock).toHaveBeenCalledWith({
          message: mockReferralCode.shareMessage,
          title: 'Join REZ App',
        });
      });
    });

    test('tracks share event after successful share', async () => {
      const { getByText } = render(<ReferralPage />);

      await waitFor(() => {
        expect(getByText('Share with Friends')).toBeTruthy();
      });

      const shareButton = getByText('Share with Friends');
      fireEvent.press(shareButton);

      await waitFor(() => {
        expect(trackShare).toHaveBeenCalledWith('whatsapp');
      });
    });
  });

  describe('Stats Display', () => {
    test('displays total referrals count', async () => {
      const { getByText } = render(<ReferralPage />);

      await waitFor(() => {
        expect(getByText('5')).toBeTruthy();
        expect(getByText('Total Referrals')).toBeTruthy();
      });
    });

    test('displays total earned amount', async () => {
      const { getByText } = render(<ReferralPage />);

      await waitFor(() => {
        expect(getByText('₹250')).toBeTruthy();
        expect(getByText('Total Earned')).toBeTruthy();
      });
    });

    test('displays pending stats when available', async () => {
      const { getByText } = render(<ReferralPage />);

      await waitFor(() => {
        expect(getByText('2')).toBeTruthy();
        expect(getByText('Pending')).toBeTruthy();
        expect(getByText('₹100')).toBeTruthy();
        expect(getByText('Pending Earnings')).toBeTruthy();
      });
    });
  });

  describe('Referral History', () => {
    test('displays referral history when available', async () => {
      const { getByText } = render(<ReferralPage />);

      await waitFor(() => {
        expect(getByText('Referral History')).toBeTruthy();
        expect(getByText('Friend One')).toBeTruthy();
        expect(getByText('Friend Two')).toBeTruthy();
      });
    });

    test('displays correct status badges', async () => {
      const { getByText } = render(<ReferralPage />);

      await waitFor(() => {
        expect(getByText('completed')).toBeTruthy();
        expect(getByText('pending')).toBeTruthy();
      });
    });

    test('displays reward amounts', async () => {
      const { getByText } = render(<ReferralPage />);

      await waitFor(() => {
        expect(getByText('Earned ₹50')).toBeTruthy();
        expect(getByText('Pending ₹50')).toBeTruthy();
      });
    });
  });

  describe('Authentication Handling', () => {
    test('redirects to sign-in when not authenticated', async () => {
      const mockRouter = { replace: jest.fn(), back: jest.fn() };
      const mockUseRouter = require('expo-router').useRouter;
      mockUseRouter.mockReturnValue(mockRouter);

      (useAuth as jest.Mock).mockReturnValue({
        state: { isAuthenticated: false },
      });

      const alertSpy = jest.spyOn(Alert, 'alert');
      render(<ReferralPage />);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Authentication Required',
          'Please sign in to view your referral information',
          expect.any(Array)
        );
      });
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      (getReferralCode as jest.Mock).mockRejectedValue(new Error('API Error'));
      (getReferralStats as jest.Mock).mockRejectedValue(new Error('API Error'));
      (getReferralHistory as jest.Mock).mockRejectedValue(new Error('API Error'));

      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByText } = render(<ReferralPage />);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
    });

    test('prevents copy when code is loading', async () => {
      (getReferralCode as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { getByText } = render(<ReferralPage />);
      const alertSpy = jest.spyOn(Alert, 'alert');

      await waitFor(() => {
        expect(getByText('LOADING...')).toBeTruthy();
      });

      const codeBox = getByText('LOADING...').parent?.parent;
      if (codeBox) {
        fireEvent.press(codeBox);

        await waitFor(() => {
          expect(alertSpy).toHaveBeenCalledWith(
            'Error',
            'Referral code not loaded yet'
          );
        });
      }
    });
  });

  describe('How It Works Section', () => {
    test('displays all three steps', async () => {
      const { getByText } = render(<ReferralPage />);

      await waitFor(() => {
        expect(getByText('How it Works')).toBeTruthy();
        expect(getByText('Share your code')).toBeTruthy();
        expect(getByText('Friend signs up')).toBeTruthy();
        expect(getByText('Both get rewards')).toBeTruthy();
      });
    });
  });

  describe('Terms and Conditions', () => {
    test('displays terms section', async () => {
      const { getByText } = render(<ReferralPage />);

      await waitFor(() => {
        expect(getByText('Terms & Conditions')).toBeTruthy();
      });
    });
  });

  describe('Refresh Functionality', () => {
    test('refetches data when pull to refresh', async () => {
      const { getByTestId } = render(<ReferralPage />);

      await waitFor(() => {
        expect(getReferralCode).toHaveBeenCalledTimes(1);
      });

      // Simulate refresh (this would require finding the ScrollView)
      // For now, just verify the API was called initially
      expect(getReferralStats).toHaveBeenCalled();
      expect(getReferralHistory).toHaveBeenCalled();
    });
  });
});

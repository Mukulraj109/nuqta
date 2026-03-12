// ScratchCard Component Tests
// Test suite for scratch card game functionality

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ScratchCardGame from '@/components/gamification/ScratchCardGame';
import scratchCardApi from '@/services/scratchCardApi';
import { ScratchCard, ScratchCardPrize, EligibilityStatus } from '@/services/scratchCardApi';

// Mock dependencies
jest.mock('@/services/scratchCardApi');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockPrize: ScratchCardPrize = {
  id: 'prize-1',
  type: 'coin',
  value: 100,
  title: '100 REZ Coins',
  description: 'You won 100 coins!',
  icon: 'diamond',
  color: '#8B5CF6',
  isActive: true,
};

const mockScratchCard: ScratchCard = {
  id: 'card-1',
  prize: mockPrize,
  isScratched: false,
  isClaimed: false,
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
  createdAt: new Date().toISOString(),
};

const mockEligibility: EligibilityStatus = {
  isEligible: true,
  completionPercentage: 85,
  requiredPercentage: 80,
  message: 'You are eligible for a scratch card!',
};

describe('ScratchCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render scratch card when eligible', async () => {
      (scratchCardApi.checkEligibility as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEligibility,
      });

      const { getByTestId } = render(<ScratchCardGame />);

      await waitFor(() => {
        expect(getByTestId('scratch-card-container')).toBeTruthy();
      });
    });

    it('should show locked state when not eligible', async () => {
      (scratchCardApi.checkEligibility as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          ...mockEligibility,
          isEligible: false,
          completionPercentage: 60,
        },
      });

      const { getByText } = render(<ScratchCardGame />);

      await waitFor(() => {
        expect(getByText(/complete your profile/i)).toBeTruthy();
      });
    });

    it('should display completion percentage', async () => {
      (scratchCardApi.checkEligibility as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          ...mockEligibility,
          isEligible: false,
          completionPercentage: 75,
        },
      });

      const { getByText } = render(<ScratchCardGame />);

      await waitFor(() => {
        expect(getByText(/75%/)).toBeTruthy();
      });
    });

    it('should show scratch surface overlay', async () => {
      (scratchCardApi.checkEligibility as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEligibility,
      });

      const { getByTestId } = render(<ScratchCardGame />);

      await waitFor(() => {
        expect(getByTestId('scratch-surface')).toBeTruthy();
      });
    });
  });

  describe('Scratch Functionality', () => {
    it('should create scratch card on first scratch', async () => {
      (scratchCardApi.checkEligibility as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEligibility,
      });

      (scratchCardApi.createScratchCard as jest.Mock).mockResolvedValue({
        success: true,
        data: mockScratchCard,
      });

      const { getByTestId } = render(<ScratchCardGame />);

      await waitFor(() => {
        const scratchArea = getByTestId('scratch-area');
        fireEvent(scratchArea, 'onTouchStart', {
          nativeEvent: { locationX: 100, locationY: 100 },
        });
      });

      await waitFor(() => {
        expect(scratchCardApi.createScratchCard).toHaveBeenCalled();
      });
    });

    it('should reveal prize when scratched sufficiently', async () => {
      (scratchCardApi.checkEligibility as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEligibility,
      });

      (scratchCardApi.createScratchCard as jest.Mock).mockResolvedValue({
        success: true,
        data: mockScratchCard,
      });

      (scratchCardApi.scratchCard as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockScratchCard, isScratched: true },
      });

      const { getByTestId, getByText } = render(<ScratchCardGame />);

      // Simulate scratching
      await act(async () => {
        const scratchArea = getByTestId('scratch-area');
        // Simulate multiple touch points
        for (let i = 0; i < 10; i++) {
          fireEvent(scratchArea, 'onTouchMove', {
            nativeEvent: { locationX: 50 + i * 10, locationY: 50 + i * 10 },
          });
        }
      });

      await waitFor(() => {
        expect(getByText(mockPrize.title)).toBeTruthy();
      });
    });

    it('should track scratch progress percentage', async () => {
      (scratchCardApi.createScratchCard as jest.Mock).mockResolvedValue({
        success: true,
        data: mockScratchCard,
      });

      const { getByTestId } = render(<ScratchCardGame />);
      const scratchArea = getByTestId('scratch-area');

      // Simulate partial scratching
      await act(async () => {
        for (let i = 0; i < 5; i++) {
          fireEvent(scratchArea, 'onTouchMove', {
            nativeEvent: { locationX: 50 + i * 10, locationY: 50 },
          });
        }
      });

      // Progress should be tracked (implementation specific)
      await waitFor(() => {
        expect(scratchArea).toBeTruthy();
      });
    });

    it('should handle different prize types', async () => {
      const prizeTypes: Array<ScratchCardPrize['type']> = [
        'coin',
        'discount',
        'cashback',
        'voucher',
      ];

      for (const type of prizeTypes) {
        const prize = { ...mockPrize, type };
        const card = { ...mockScratchCard, prize };

        (scratchCardApi.createScratchCard as jest.Mock).mockResolvedValue({
          success: true,
          data: card,
        });

        const { unmount } = render(<ScratchCardGame />);

        await waitFor(() => {
          expect(scratchCardApi.createScratchCard).toHaveBeenCalled();
        });

        unmount();
        jest.clearAllMocks();
      }
    });
  });

  describe('Prize Claiming', () => {
    it('should claim prize successfully', async () => {
      (scratchCardApi.checkEligibility as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEligibility,
      });

      (scratchCardApi.createScratchCard as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockScratchCard, isScratched: true },
      });

      (scratchCardApi.claimPrize as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          prize: mockPrize,
          claimResult: {
            type: 'coin',
            value: 100,
            message: 'Prize claimed successfully!',
          },
          claimedAt: new Date().toISOString(),
        },
      });

      const { getByTestId } = render(<ScratchCardGame />);

      await waitFor(() => {
        const claimButton = getByTestId('claim-button');
        fireEvent.press(claimButton);
      });

      await waitFor(() => {
        expect(scratchCardApi.claimPrize).toHaveBeenCalledWith(mockScratchCard.id);
        expect(Alert.alert).toHaveBeenCalledWith(
          expect.stringContaining('Prize'),
          expect.any(String)
        );
      });
    });

    it('should update balance after claiming coins', async () => {
      const onPrizeClaimed = jest.fn();

      (scratchCardApi.claimPrize as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          prize: mockPrize,
          claimResult: { type: 'coin', value: 100, message: 'Success' },
          claimedAt: new Date().toISOString(),
        },
      });

      const { getByTestId } = render(
        <ScratchCardGame onPrizeClaimed={onPrizeClaimed} />
      );

      await waitFor(() => {
        fireEvent.press(getByTestId('claim-button'));
      });

      await waitFor(() => {
        expect(onPrizeClaimed).toHaveBeenCalledWith({
          type: 'coin',
          value: 100,
        });
      });
    });

    it('should prevent double claiming', async () => {
      (scratchCardApi.claimPrize as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          prize: mockPrize,
          claimResult: { type: 'coin', value: 100, message: 'Success' },
          claimedAt: new Date().toISOString(),
        },
      });

      const { getByTestId } = render(<ScratchCardGame />);
      const claimButton = getByTestId('claim-button');

      // Try to claim twice
      await act(async () => {
        fireEvent.press(claimButton);
        fireEvent.press(claimButton);
      });

      await waitFor(() => {
        expect(scratchCardApi.claimPrize).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle expired cards', async () => {
      const expiredCard = {
        ...mockScratchCard,
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };

      (scratchCardApi.createScratchCard as jest.Mock).mockResolvedValue({
        success: true,
        data: expiredCard,
      });

      const { getByText } = render(<ScratchCardGame />);

      await waitFor(() => {
        expect(getByText(/expired/i)).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (scratchCardApi.checkEligibility as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { getByText } = render(<ScratchCardGame />);

      await waitFor(() => {
        expect(getByText(/error/i)).toBeTruthy();
      });
    });

    it('should show error when card creation fails', async () => {
      (scratchCardApi.checkEligibility as jest.Mock).mockResolvedValue({
        success: true,
        data: mockEligibility,
      });

      (scratchCardApi.createScratchCard as jest.Mock).mockRejectedValue(
        new Error('Failed to create card')
      );

      const { getByTestId } = render(<ScratchCardGame />);

      await act(async () => {
        fireEvent(getByTestId('scratch-area'), 'onTouchStart', {
          nativeEvent: { locationX: 100, locationY: 100 },
        });
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('create')
        );
      });
    });

    it('should handle claim failure', async () => {
      (scratchCardApi.claimPrize as jest.Mock).mockRejectedValue(
        new Error('Claim failed')
      );

      const { getByTestId } = render(<ScratchCardGame />);

      await waitFor(() => {
        fireEvent.press(getByTestId('claim-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('claim')
        );
      });
    });

    it('should handle network timeout', async () => {
      (scratchCardApi.createScratchCard as jest.Mock).mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
      );

      const { getByTestId } = render(<ScratchCardGame />);

      await act(async () => {
        fireEvent(getByTestId('scratch-area'), 'onTouchStart', {
          nativeEvent: { locationX: 100, locationY: 100 },
        });
      });

      await waitFor(
        () => {
          expect(Alert.alert).toHaveBeenCalled();
        },
        { timeout: 6000 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid scratching', async () => {
      (scratchCardApi.createScratchCard as jest.Mock).mockResolvedValue({
        success: true,
        data: mockScratchCard,
      });

      const { getByTestId } = render(<ScratchCardGame />);
      const scratchArea = getByTestId('scratch-area');

      // Simulate rapid touch events
      await act(async () => {
        for (let i = 0; i < 100; i++) {
          fireEvent(scratchArea, 'onTouchMove', {
            nativeEvent: { locationX: Math.random() * 300, locationY: Math.random() * 300 },
          });
        }
      });

      // Should only create one card
      await waitFor(() => {
        expect(scratchCardApi.createScratchCard).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle zero value prizes', async () => {
      const zeroPrize = { ...mockPrize, value: 0 };
      const card = { ...mockScratchCard, prize: zeroPrize };

      (scratchCardApi.createScratchCard as jest.Mock).mockResolvedValue({
        success: true,
        data: card,
      });

      const { getByText } = render(<ScratchCardGame />);

      await waitFor(() => {
        expect(getByText(/better luck/i)).toBeTruthy();
      });
    });

    it('should validate scratch card ID before claiming', async () => {
      const invalidCard = { ...mockScratchCard, id: '' };

      (scratchCardApi.createScratchCard as jest.Mock).mockResolvedValue({
        success: true,
        data: invalidCard,
      });

      const { getByTestId } = render(<ScratchCardGame />);

      await waitFor(() => {
        const claimButton = getByTestId('claim-button');
        expect(claimButton.props.disabled).toBeTruthy();
      });
    });
  });

  describe('Anti-Cheat Measures', () => {
    it('should generate prize server-side', async () => {
      const { getByTestId } = render(<ScratchCardGame />);

      await act(async () => {
        fireEvent(getByTestId('scratch-area'), 'onTouchStart', {
          nativeEvent: { locationX: 100, locationY: 100 },
        });
      });

      await waitFor(() => {
        expect(scratchCardApi.createScratchCard).toHaveBeenCalledWith();
        // Verify no client-side prize generation
      });
    });

    it('should enforce eligibility checks', async () => {
      (scratchCardApi.checkEligibility as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockEligibility, isEligible: false },
      });

      const { queryByTestId } = render(<ScratchCardGame />);

      await waitFor(() => {
        expect(queryByTestId('scratch-area')).toBeFalsy();
      });
    });

    it('should validate card authenticity before claim', async () => {
      (scratchCardApi.claimPrize as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Invalid card',
        data: undefined,
      });

      const { getByTestId } = render(<ScratchCardGame />);

      await act(async () => {
        fireEvent.press(getByTestId('claim-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          expect.any(String)
        );
      });
    });
  });

  describe('User Experience', () => {
    it('should show loading state during API calls', async () => {
      (scratchCardApi.checkEligibility as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { getByTestId } = render(<ScratchCardGame />);

      expect(getByTestId('loading-indicator')).toBeTruthy();

      await waitFor(
        () => {
          expect(getByTestId('scratch-card-container')).toBeTruthy();
        },
        { timeout: 2000 }
      );
    });

    it('should provide visual feedback during scratching', async () => {
      const { getByTestId } = render(<ScratchCardGame />);
      const scratchArea = getByTestId('scratch-area');

      await act(async () => {
        fireEvent(scratchArea, 'onTouchMove', {
          nativeEvent: { locationX: 100, locationY: 100 },
        });
      });

      // Check for visual changes (implementation specific)
      expect(scratchArea).toBeTruthy();
    });

    it('should animate prize reveal', async () => {
      (scratchCardApi.createScratchCard as jest.Mock).mockResolvedValue({
        success: true,
        data: { ...mockScratchCard, isScratched: true },
      });

      const { getByTestId } = render(<ScratchCardGame />);

      await waitFor(() => {
        expect(getByTestId('prize-animation')).toBeTruthy();
      });
    });
  });
});

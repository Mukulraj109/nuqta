// SpinWheel Component Tests
// Test suite for spin wheel game functionality

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SpinWheel from '@/components/gamification/SpinWheel';
import gamificationAPI from '@/services/gamificationApi';
import { SpinWheelResult, SpinWheelSegment } from '@/types/gamification.types';

// Mock dependencies
jest.mock('@/services/gamificationApi');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// Mock segments
const mockSegments: SpinWheelSegment[] = [
  { id: '1', label: '10 Coins', value: 10, color: '#FFD700', type: 'coins' },
  { id: '2', label: '50 Coins', value: 50, color: '#FF6347', type: 'coins' },
  { id: '3', label: '5% Discount', value: 5, color: '#4169E1', type: 'discount' },
  { id: '4', label: '100 Coins', value: 100, color: '#32CD32', type: 'coins' },
  { id: '5', label: 'Nothing', value: 0, color: '#808080', type: 'nothing' },
  { id: '6', label: '₹20 Cashback', value: 20, color: '#FF1493', type: 'cashback' },
];

const mockSpinResult: SpinWheelResult = {
  segment: mockSegments[0],
  prize: {
    type: 'coins',
    value: 10,
    description: 'You won 10 coins!',
  },
  rotation: 720 + 30, // 2 full rotations + angle
};

describe('SpinWheel Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render spin wheel with all segments', () => {
      const { getByTestId, getAllByTestId } = render(<SpinWheel />);

      expect(getByTestId('spin-wheel-container')).toBeTruthy();
      expect(getByTestId('spin-button')).toBeTruthy();
    });

    it('should display correct segment labels', () => {
      const { getByText } = render(<SpinWheel />);

      mockSegments.forEach(segment => {
        if (segment.label !== 'Nothing') {
          expect(getByText(segment.label)).toBeTruthy();
        }
      });
    });

    it('should show eligibility status', async () => {
      (gamificationAPI.canSpinWheel as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          canSpin: true,
          nextSpinAt: null,
          remainingCooldown: 0,
        },
      });

      const { getByText } = render(<SpinWheel />);

      await waitFor(() => {
        expect(getByText(/spin now/i)).toBeTruthy();
      });
    });

    it('should show cooldown timer when not eligible', async () => {
      const nextSpinTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

      (gamificationAPI.canSpinWheel as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          canSpin: false,
          nextSpinAt: nextSpinTime,
          remainingCooldown: 3600,
        },
      });

      const { getByText } = render(<SpinWheel />);

      await waitFor(() => {
        expect(getByText(/next spin in/i)).toBeTruthy();
      });
    });
  });

  describe('Spin Functionality', () => {
    it('should spin wheel and show result on successful spin', async () => {
      (gamificationAPI.canSpinWheel as jest.Mock).mockResolvedValue({
        success: true,
        data: { canSpin: true },
      });

      (gamificationAPI.spinWheel as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          result: mockSpinResult,
          coinsAdded: 10,
          newBalance: 110,
        },
      });

      const { getByTestId } = render(<SpinWheel />);
      const spinButton = getByTestId('spin-button');

      await act(async () => {
        fireEvent.press(spinButton);
      });

      await waitFor(() => {
        expect(gamificationAPI.spinWheel).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should disable spin button during spinning animation', async () => {
      (gamificationAPI.canSpinWheel as jest.Mock).mockResolvedValue({
        success: true,
        data: { canSpin: true },
      });

      (gamificationAPI.spinWheel as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          result: mockSpinResult,
          coinsAdded: 10,
          newBalance: 110,
        },
      });

      const { getByTestId } = render(<SpinWheel />);
      const spinButton = getByTestId('spin-button');

      await act(async () => {
        fireEvent.press(spinButton);
      });

      // Button should be disabled during spin
      expect(spinButton.props.disabled || spinButton.props.accessibilityState?.disabled).toBeTruthy();
    });

    it('should update coin balance after successful spin', async () => {
      (gamificationAPI.canSpinWheel as jest.Mock).mockResolvedValue({
        success: true,
        data: { canSpin: true },
      });

      (gamificationAPI.spinWheel as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          result: mockSpinResult,
          coinsAdded: 50,
          newBalance: 150,
        },
      });

      const onCoinsEarned = jest.fn();
      const { getByTestId } = render(<SpinWheel onCoinsEarned={onCoinsEarned} />);

      await act(async () => {
        fireEvent.press(getByTestId('spin-button'));
      });

      await waitFor(() => {
        expect(onCoinsEarned).toHaveBeenCalledWith(50, 150);
      });
    });

    it('should handle multiple prize types correctly', async () => {
      const prizeTypes = ['coins', 'discount', 'cashback', 'voucher', 'nothing'];

      for (const type of prizeTypes) {
        const result = {
          segment: { ...mockSegments[0], type: type as any },
          prize: { type: type as any, value: 20, description: `You won ${type}!` },
          rotation: 720,
        };

        (gamificationAPI.spinWheel as jest.Mock).mockResolvedValue({
          success: true,
          data: { result, coinsAdded: type === 'coins' ? 20 : 0, newBalance: 120 },
        });

        const { getByTestId, unmount } = render(<SpinWheel />);

        await act(async () => {
          fireEvent.press(getByTestId('spin-button'));
        });

        await waitFor(() => {
          expect(gamificationAPI.spinWheel).toHaveBeenCalled();
        });

        unmount();
        jest.clearAllMocks();
      }
    });
  });

  describe('Error Handling', () => {
    it('should show error alert on API failure', async () => {
      (gamificationAPI.canSpinWheel as jest.Mock).mockResolvedValue({
        success: true,
        data: { canSpin: true },
      });

      (gamificationAPI.spinWheel as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { getByTestId } = render(<SpinWheel />);

      await act(async () => {
        fireEvent.press(getByTestId('spin-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          expect.stringContaining('Unable to spin')
        );
      });
    });

    it('should handle cooldown period correctly', async () => {
      (gamificationAPI.canSpinWheel as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          canSpin: false,
          nextSpinAt: new Date(Date.now() + 1800000).toISOString(),
          remainingCooldown: 1800,
        },
      });

      const { getByTestId } = render(<SpinWheel />);
      const spinButton = getByTestId('spin-button');

      await waitFor(() => {
        expect(spinButton.props.disabled || spinButton.props.accessibilityState?.disabled).toBeTruthy();
      });
    });

    it('should handle insufficient attempts gracefully', async () => {
      (gamificationAPI.canSpinWheel as jest.Mock).mockResolvedValue({
        success: true,
        data: { canSpin: false },
      });

      (gamificationAPI.spinWheel as jest.Mock).mockRejectedValue({
        response: { data: { message: 'No spins available' } },
      });

      const { getByTestId } = render(<SpinWheel />);

      await act(async () => {
        fireEvent.press(getByTestId('spin-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should prevent multiple concurrent spins', async () => {
      (gamificationAPI.canSpinWheel as jest.Mock).mockResolvedValue({
        success: true,
        data: { canSpin: true },
      });

      (gamificationAPI.spinWheel as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: {
            result: mockSpinResult,
            coinsAdded: 10,
            newBalance: 110,
          },
        }), 1000))
      );

      const { getByTestId } = render(<SpinWheel />);
      const spinButton = getByTestId('spin-button');

      // Try to spin multiple times rapidly
      await act(async () => {
        fireEvent.press(spinButton);
        fireEvent.press(spinButton);
        fireEvent.press(spinButton);
      });

      await waitFor(() => {
        expect(gamificationAPI.spinWheel).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle zero value prizes', async () => {
      const nothingResult = {
        segment: mockSegments[4], // Nothing segment
        prize: { type: 'nothing' as const, value: 0, description: 'Better luck next time!' },
        rotation: 720,
      };

      (gamificationAPI.spinWheel as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          result: nothingResult,
          coinsAdded: 0,
          newBalance: 100,
        },
      });

      const { getByTestId } = render(<SpinWheel />);

      await act(async () => {
        fireEvent.press(getByTestId('spin-button'));
      });

      await waitFor(() => {
        expect(gamificationAPI.spinWheel).toHaveBeenCalled();
      });
    });

    it('should handle network timeout', async () => {
      (gamificationAPI.spinWheel as jest.Mock).mockImplementation(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        )
      );

      const { getByTestId } = render(<SpinWheel />);

      await act(async () => {
        fireEvent.press(getByTestId('spin-button'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      }, { timeout: 6000 });
    });
  });

  describe('Animation', () => {
    it('should complete spinning animation before showing result', async () => {
      (gamificationAPI.spinWheel as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          result: mockSpinResult,
          coinsAdded: 10,
          newBalance: 110,
        },
      });

      const { getByTestId, queryByTestId } = render(<SpinWheel />);

      await act(async () => {
        fireEvent.press(getByTestId('spin-button'));
      });

      // Result modal should not appear immediately
      expect(queryByTestId('result-modal')).toBeFalsy();

      // Wait for animation to complete
      await waitFor(() => {
        expect(queryByTestId('result-modal')).toBeTruthy();
      }, { timeout: 5000 });
    });
  });

  describe('Anti-Cheat Measures', () => {
    it('should validate spin result on server', async () => {
      const { getByTestId } = render(<SpinWheel />);

      await act(async () => {
        fireEvent.press(getByTestId('spin-button'));
      });

      await waitFor(() => {
        expect(gamificationAPI.spinWheel).toHaveBeenCalled();
        // Ensure no client-side result manipulation
        const callArgs = (gamificationAPI.spinWheel as jest.Mock).mock.calls[0];
        expect(callArgs).toEqual([]);
      });
    });

    it('should enforce cooldown period between spins', async () => {
      (gamificationAPI.canSpinWheel as jest.Mock)
        .mockResolvedValueOnce({
          success: true,
          data: { canSpin: true },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            canSpin: false,
            nextSpinAt: new Date(Date.now() + 86400000).toISOString(),
            remainingCooldown: 86400,
          },
        });

      (gamificationAPI.spinWheel as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          result: mockSpinResult,
          coinsAdded: 10,
          newBalance: 110,
        },
      });

      const { getByTestId, rerender } = render(<SpinWheel />);

      // First spin
      await act(async () => {
        fireEvent.press(getByTestId('spin-button'));
      });

      await waitFor(() => {
        expect(gamificationAPI.spinWheel).toHaveBeenCalledTimes(1);
      });

      // Rerender to refresh eligibility
      rerender(<SpinWheel />);

      // Try to spin again - should be disabled
      await waitFor(() => {
        const spinButton = getByTestId('spin-button');
        expect(spinButton.props.disabled || spinButton.props.accessibilityState?.disabled).toBeTruthy();
      });
    });
  });
});

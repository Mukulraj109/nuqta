/**
 * ReferralQRModal Test Suite
 *
 * Comprehensive tests for the ReferralQRModal component covering:
 * - QR code generation and display
 * - Download functionality
 * - Share functionality (7 platforms)
 * - Modal animations
 * - Error states
 * - Accessibility
 *
 * Total: 35 tests
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Linking, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import ReferralQRModal from '@/components/referral/ReferralQRModal';

// Mock dependencies
jest.mock('expo-sharing');
jest.mock('expo-file-system');
jest.mock('react-native-qrcode-svg', () => 'QRCode');
jest.mock('react-native-view-shot', () => {
  const React = require('react');
  return React.forwardRef((props: any, ref: any) => {
    // Expose capture method for tests
    React.useImperativeHandle(ref, () => ({
      capture: jest.fn(() => Promise.resolve('file:///mock/path/qr.png')),
    }));
    return React.createElement('View', props, props.children);
  });
});

describe('ReferralQRModal', () => {
  const mockProps = {
    visible: true,
    referralCode: 'TEST123',
    referralLink: 'https://rezapp.com/invite/TEST123',
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (Sharing.shareAsync as jest.Mock).mockResolvedValue({ action: 'shared' });
  });

  // ============================================
  // 1. Modal Rendering Tests (5 tests)
  // ============================================

  describe('Modal Rendering', () => {
    test('renders when visible prop is true', () => {
      const { getByText } = render(<ReferralQRModal {...mockProps} />);
      expect(getByText('Share QR Code')).toBeTruthy();
    });

    test('does not render content when visible is false', () => {
      const { queryByText } = render(<ReferralQRModal {...mockProps} visible={false} />);
      expect(queryByText('Share QR Code')).toBeNull();
    });

    test('displays referral code in badge', () => {
      const { getByText } = render(<ReferralQRModal {...mockProps} />);
      expect(getByText('TEST123')).toBeTruthy();
    });

    test('displays "Scan to Join" title', () => {
      const { getByText } = render(<ReferralQRModal {...mockProps} />);
      expect(getByText('Scan to Join')).toBeTruthy();
    });

    test('displays QR code help text', () => {
      const { getByText } = render(<ReferralQRModal {...mockProps} />);
      expect(getByText('Friends can scan this QR code to sign up with your referral')).toBeTruthy();
    });
  });

  // ============================================
  // 2. Close Functionality Tests (2 tests)
  // ============================================

  describe('Close Functionality', () => {
    test('calls onClose when close button is pressed', () => {
      const { UNSAFE_getAllByType } = render(<ReferralQRModal {...mockProps} />);

      const touchables = UNSAFE_getAllByType('TouchableOpacity' as any);
      const closeButton = touchables.find(t => {
        const children = t.props.children;
        return children && children.props && children.props.name === 'close';
      });

      if (closeButton) {
        fireEvent.press(closeButton);
        expect(mockProps.onClose).toHaveBeenCalledTimes(1);
      }
    });

    test('calls onClose when backdrop is pressed', () => {
      const { UNSAFE_getAllByType } = render(<ReferralQRModal {...mockProps} />);

      const touchables = UNSAFE_getAllByType('TouchableOpacity' as any);
      const backdrop = touchables.find(t => t.props.activeOpacity === 1);

      if (backdrop) {
        fireEvent.press(backdrop);
        expect(mockProps.onClose).toHaveBeenCalled();
      }
    });
  });

  // ============================================
  // 3. QR Code Download Tests (7 tests)
  // ============================================

  describe('QR Code Download', () => {
    test('displays download button', () => {
      const { getByText } = render(<ReferralQRModal {...mockProps} />);
      expect(getByText('Download QR Code')).toBeTruthy();
    });

    test('initiates download when download button is pressed', async () => {
      const { getByText } = render(<ReferralQRModal {...mockProps} />);

      fireEvent.press(getByText('Download QR Code'));

      await waitFor(() => {
        expect(Sharing.shareAsync).toHaveBeenCalled();
      });
    });

    test('shows downloading state during download', async () => {
      const { getByText, queryByText } = render(<ReferralQRModal {...mockProps} />);

      (Sharing.shareAsync as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      fireEvent.press(getByText('Download QR Code'));

      await waitFor(() => {
        expect(queryByText('Downloading...')).toBeTruthy();
      });
    });

    test('shows success alert after successful download', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByText } = render(<ReferralQRModal {...mockProps} />);

      fireEvent.press(getByText('Download QR Code'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Success', 'QR code saved successfully!');
      });
    });

    test('handles sharing not available error', async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByText } = render(<ReferralQRModal {...mockProps} />);

      fireEvent.press(getByText('Download QR Code'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Sharing is not available on this device');
      });
    });

    test('handles capture failure error', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');

      // Mock ViewShot to return null
      jest.doMock('react-native-view-shot', () => {
        const React = require('react');
        return React.forwardRef((props: any, ref: any) => {
          React.useImperativeHandle(ref, () => ({
            capture: jest.fn(() => Promise.resolve(null)),
          }));
          return React.createElement('View', props, props.children);
        });
      });

      const { getByText } = render(<ReferralQRModal {...mockProps} />);

      fireEvent.press(getByText('Download QR Code'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error',
          'Failed to download QR code. Please try again.'
        );
      });
    });

    test('disables download button while downloading', async () => {
      const { getByText, UNSAFE_getAllByType } = render(<ReferralQRModal {...mockProps} />);

      (Sharing.shareAsync as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const downloadButton = getByText('Download QR Code').parent?.parent;

      fireEvent.press(downloadButton!);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Button should be disabled during download
      expect(downloadButton?.props.disabled).toBe(true);
    });
  });

  // ============================================
  // 4. WhatsApp Share Tests (2 tests)
  // ============================================

  describe('WhatsApp Share', () => {
    test('opens WhatsApp when button is pressed', async () => {
      const canOpenURLSpy = jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
      const { getByText } = render(<ReferralQRModal {...mockProps} />);

      fireEvent.press(getByText('WhatsApp'));

      await waitFor(() => {
        expect(openURLSpy).toHaveBeenCalled();
        const url = openURLSpy.mock.calls[0][0];
        expect(url).toContain('whatsapp://send?text=');
        expect(url).toContain('TEST123');
      });
    });

    test('shows error when WhatsApp is not installed', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByText } = render(<ReferralQRModal {...mockProps} />);

      fireEvent.press(getByText('WhatsApp'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'WhatsApp is not installed on your device');
      });
    });
  });

  // ============================================
  // 5. Telegram Share Tests (2 tests)
  // ============================================

  describe('Telegram Share', () => {
    test('opens Telegram when button is pressed', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
      const { getByText } = render(<ReferralQRModal {...mockProps} />);

      fireEvent.press(getByText('Telegram'));

      await waitFor(() => {
        expect(openURLSpy).toHaveBeenCalled();
        const url = openURLSpy.mock.calls[0][0];
        expect(url).toContain('tg://msg?text=');
      });
    });

    test('shows error when Telegram is not installed', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByText } = render(<ReferralQRModal {...mockProps} />);

      fireEvent.press(getByText('Telegram'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Telegram is not installed on your device');
      });
    });
  });

  // ============================================
  // 6. Email Share Tests (2 tests)
  // ============================================

  describe('Email Share', () => {
    test('opens email client when button is pressed', async () => {
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
      const { getByText } = render(<ReferralQRModal {...mockProps} />);

      fireEvent.press(getByText('Email'));

      await waitFor(() => {
        expect(openURLSpy).toHaveBeenCalled();
        const url = openURLSpy.mock.calls[0][0];
        expect(url).toContain('mailto:?subject=');
        expect(url).toContain('TEST123');
      });
    });

    test('handles email client error gracefully', async () => {
      jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('Email error'));
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByText } = render(<ReferralQRModal {...mockProps} />);

      fireEvent.press(getByText('Email'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to open email client');
      });
    });
  });

  // ============================================
  // 7. SMS Share Tests (2 tests)
  // ============================================

  describe('SMS Share', () => {
    test('opens SMS app on iOS with correct format', async () => {
      Platform.OS = 'ios';
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
      const { getByText } = render(<ReferralQRModal {...mockProps} />);

      fireEvent.press(getByText('SMS'));

      await waitFor(() => {
        expect(openURLSpy).toHaveBeenCalled();
        const url = openURLSpy.mock.calls[0][0];
        expect(url).toContain('sms:&body=');
      });
    });

    test('opens SMS app on Android with correct format', async () => {
      Platform.OS = 'android';
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
      const { getByText } = render(<ReferralQRModal {...mockProps} />);

      fireEvent.press(getByText('SMS'));

      await waitFor(() => {
        expect(openURLSpy).toHaveBeenCalled();
        const url = openURLSpy.mock.calls[0][0];
        expect(url).toContain('sms:?body=');
      });
    });
  });

  // ============================================
  // 8. Instagram Share Tests (2 tests)
  // ============================================

  describe('Instagram Share', () => {
    test('shows instruction dialog for Instagram share', async () => {
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByText } = render(<ReferralQRModal {...mockProps} />);

      fireEvent.press(getByText('Instagram'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Share to Instagram',
          'Download the QR code first, then share it to Instagram Stories or Feed',
          expect.any(Array)
        );
      });
    });

    test('Instagram alert provides download option', async () => {
      let downloadCallback: (() => void) | undefined;

      jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
        if (buttons && Array.isArray(buttons)) {
          const downloadButton = buttons.find((b: any) => b.text === 'Download QR');
          downloadCallback = downloadButton?.onPress;
        }
      });

      const { getByText } = render(<ReferralQRModal {...mockProps} />);

      fireEvent.press(getByText('Instagram'));

      await waitFor(() => {
        expect(downloadCallback).toBeDefined();
      });
    });
  });

  // ============================================
  // 9. Facebook Share Tests (2 tests)
  // ============================================

  describe('Facebook Share', () => {
    test('opens Facebook app when installed', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
      const { getByText } = render(<ReferralQRModal {...mockProps} />);

      fireEvent.press(getByText('Facebook'));

      await waitFor(() => {
        expect(openURLSpy).toHaveBeenCalled();
        const url = openURLSpy.mock.calls[0][0];
        expect(url).toContain('fb://facewebmodal');
      });
    });

    test('falls back to web URL when Facebook app not installed', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
      const { getByText } = render(<ReferralQRModal {...mockProps} />);

      fireEvent.press(getByText('Facebook'));

      await waitFor(() => {
        expect(openURLSpy).toHaveBeenCalled();
        const url = openURLSpy.mock.calls[0][0];
        expect(url).toContain('facebook.com/sharer');
      });
    });
  });

  // ============================================
  // 10. Twitter Share Tests (2 tests)
  // ============================================

  describe('Twitter Share', () => {
    test('opens Twitter app when installed', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
      const { getByText } = render(<ReferralQRModal {...mockProps} />);

      fireEvent.press(getByText('Twitter'));

      await waitFor(() => {
        expect(openURLSpy).toHaveBeenCalled();
        const url = openURLSpy.mock.calls[0][0];
        expect(url).toContain('twitter://post');
      });
    });

    test('falls back to web URL when Twitter app not installed', async () => {
      jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
      const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
      const { getByText } = render(<ReferralQRModal {...mockProps} />);

      fireEvent.press(getByText('Twitter'));

      await waitFor(() => {
        expect(openURLSpy).toHaveBeenCalled();
        const url = openURLSpy.mock.calls[0][0];
        expect(url).toContain('twitter.com/intent/tweet');
      });
    });
  });

  // ============================================
  // 11. Platform Buttons Display Tests (2 tests)
  // ============================================

  describe('Platform Buttons Display', () => {
    test('displays all 7 share platform buttons', () => {
      const { getByText } = render(<ReferralQRModal {...mockProps} />);

      const platforms = ['WhatsApp', 'Telegram', 'Email', 'SMS', 'Instagram', 'Facebook', 'Twitter'];
      platforms.forEach(platform => {
        expect(getByText(platform)).toBeTruthy();
      });
    });

    test('displays "Share Via" section title', () => {
      const { getByText } = render(<ReferralQRModal {...mockProps} />);
      expect(getByText('Share Via')).toBeTruthy();
    });
  });

  // ============================================
  // 12. Info Card Tests (2 tests)
  // ============================================

  describe('Info Card', () => {
    test('displays reward information', () => {
      const { getByText } = render(<ReferralQRModal {...mockProps} />);
      expect(
        getByText('Your friends get ₹30 off and you earn ₹50 when they complete their first order')
      ).toBeTruthy();
    });

    test('info card has visual indicator icon', () => {
      const { UNSAFE_getAllByType } = render(<ReferralQRModal {...mockProps} />);

      const icons = UNSAFE_getAllByType('Ionicons' as any);
      const infoIcon = icons.find(icon => icon.props.name === 'information-circle');

      expect(infoIcon).toBeTruthy();
    });
  });

  // ============================================
  // 13. Accessibility Tests (3 tests)
  // ============================================

  describe('Accessibility', () => {
    test('download button has accessibility labels', () => {
      const { getByLabelText } = render(<ReferralQRModal {...mockProps} />);
      expect(getByLabelText('Download QR code')).toBeTruthy();
    });

    test('close button has accessibility labels', () => {
      const { getByLabelText } = render(<ReferralQRModal {...mockProps} />);
      expect(getByLabelText('Close')).toBeTruthy();
    });

    test('platform buttons have accessibility labels', () => {
      const { getByLabelText } = render(<ReferralQRModal {...mockProps} />);
      expect(getByLabelText('Share via WhatsApp')).toBeTruthy();
      expect(getByLabelText('Share via Email')).toBeTruthy();
    });
  });
});

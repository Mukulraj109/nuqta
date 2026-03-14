// Referral QR Modal Component
// Modal for displaying and sharing QR code with referral code

import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Platform,
  Linking} from 'react-native';
import { platformAlertSimple, platformAlertConfirm } from '@/utils/platformAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';
import { ThemedText } from '@/components/ThemedText';
import { useRegion } from '@/contexts/RegionContext';

interface ReferralQRModalProps {
  visible: boolean;
  referralCode: string;
  referralLink: string;
  onClose: () => void;
}

interface SharePlatform {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  action: () => Promise<void>;
}

function ReferralQRModal({
  visible,
  referralCode,
  referralLink,
  onClose,
}: ReferralQRModalProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  const [isDownloading, setIsDownloading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const viewShotRef = useRef<ViewShot>(null);

  // Animate modal entrance
  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Handle QR code download
  const handleDownloadQR = async () => {
    try {
      setIsDownloading(true);

      if (!viewShotRef.current) {
        throw new Error('ViewShot ref not available');
      }

      // Capture the QR code as image
      const uri = await viewShotRef.current.capture();

      if (!uri) {
        throw new Error('Failed to capture QR code');
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        platformAlertSimple('Error', 'Sharing is not available on this device');
        return;
      }

      // Share/Save the image
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Save QR Code',
        UTI: 'public.png',
      });

      platformAlertSimple('Success', 'QR code saved successfully!');
    } catch (error) {
      platformAlertSimple('Error', 'Failed to download QR code. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Platform-specific share handlers
  const handleWhatsAppShare = async () => {
    try {
      const message = `🎉 Join me on REZ and get ${currencySymbol}30 off your first order!\n\nUse my code: ${referralCode}\n\n✨ Shop from top brands\n💰 Earn rewards\n\n${referralLink}`;
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        platformAlertSimple('Error', 'WhatsApp is not installed on your device');
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to open WhatsApp');
    }
  };

  const handleTelegramShare = async () => {
    try {
      const message = `🚀 Check out REZ!\n\nUse code ${referralCode} for ${currencySymbol}30 off.\n\n${referralLink}`;
      const telegramUrl = `tg://msg?text=${encodeURIComponent(message)}`;

      const canOpen = await Linking.canOpenURL(telegramUrl);
      if (canOpen) {
        await Linking.openURL(telegramUrl);
      } else {
        platformAlertSimple('Error', 'Telegram is not installed on your device');
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to open Telegram');
    }
  };

  const handleEmailShare = async () => {
    try {
      const subject = `Get ${currencySymbol}30 off on REZ - My referral gift!`;
      const body = `Hi!\n\nI've been using REZ to shop from local stores. Use my code ${referralCode} for ${currencySymbol}30 off!\n\n${referralLink}`;
      const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      await Linking.openURL(emailUrl);
    } catch (error) {
      platformAlertSimple('Error', 'Failed to open email client');
    }
  };

  const handleSMSShare = async () => {
    try {
      const message = `Hey! Join REZ and get ${currencySymbol}30 off. Code: ${referralCode}\n${referralLink}`;
      const smsUrl = Platform.OS === 'ios'
        ? `sms:&body=${encodeURIComponent(message)}`
        : `sms:?body=${encodeURIComponent(message)}`;

      await Linking.openURL(smsUrl);
    } catch (error) {
      platformAlertSimple('Error', 'Failed to open SMS');
    }
  };

  const handleInstagramShare = async () => {
    try {
      // Instagram doesn't support URL schemes for direct sharing
      // We'll download the QR first, then open Instagram
      platformAlertConfirm(
        'Share to Instagram',
        'Download the QR code first, then share it to Instagram Stories or Feed',
        handleDownloadQR,
        'Download QR'
      );
    } catch (error) {
      // silently handle
    }
  };

  const handleFacebookShare = async () => {
    try {
      const fbUrl = `fb://facewebmodal/f?href=${encodeURIComponent(referralLink)}`;

      const canOpen = await Linking.canOpenURL(fbUrl);
      if (canOpen) {
        await Linking.openURL(fbUrl);
      } else {
        // Fallback to web URL
        await Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`);
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to open Facebook');
    }
  };

  const handleTwitterShare = async () => {
    try {
      const tweetText = `Join me on REZ and get ${currencySymbol}30 off! Use code: ${referralCode}`;
      const twitterUrl = `twitter://post?message=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(referralLink)}`;

      const canOpen = await Linking.canOpenURL(twitterUrl);
      if (canOpen) {
        await Linking.openURL(twitterUrl);
      } else {
        // Fallback to web URL
        await Linking.openURL(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(referralLink)}`);
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to open Twitter');
    }
  };

  // Define share platforms with actions
  const sharePlatforms: SharePlatform[] = [
    {
      name: 'WhatsApp',
      icon: 'logo-whatsapp',
      color: '#25D366',
      action: handleWhatsAppShare,
    },
    {
      name: 'Telegram',
      icon: 'paper-plane',
      color: '#0088cc',
      action: handleTelegramShare,
    },
    {
      name: 'Email',
      icon: 'mail',
      color: '#6366f1',
      action: handleEmailShare,
    },
    {
      name: 'SMS',
      icon: 'chatbox',
      color: '#10b981',
      action: handleSMSShare,
    },
    {
      name: 'Instagram',
      icon: 'logo-instagram',
      color: '#E4405F',
      action: handleInstagramShare,
    },
    {
      name: 'Facebook',
      icon: 'logo-facebook',
      color: '#1877f2',
      action: handleFacebookShare,
    },
    {
      name: 'Twitter',
      icon: 'logo-twitter',
      color: '#1DA1F2',
      action: handleTwitterShare,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Pressable
          style={styles.backdrop}
         
          onPress={onClose}
          accessibilityLabel="Close modal"
          accessibilityHint="Tap to close the QR code modal"
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.header}>
            <ThemedText style={styles.headerTitle}>Share QR Code</ThemedText>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close"
              accessibilityHint="Close the QR code modal"
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            {/* QR Code Section */}
            <View style={styles.qrSection}>
              <ThemedText style={styles.sectionTitle}>Scan to Join</ThemedText>

              <ViewShot
                ref={viewShotRef}
                options={{ format: 'png', quality: 1.0 }}
                style={styles.qrWrapper}
              >
                <View style={styles.qrContainer}>
                  <QRCode
                    value={referralLink}
                    size={200}
                    color="#111827"
                    backgroundColor="#FFFFFF"
                    logo={require('@/assets/images/icon.png')}
                    logoSize={40}
                    logoBackgroundColor="#FFFFFF"
                    logoBorderRadius={20}
                  />

                  {/* Referral Code Badge */}
                  <View style={styles.codeBadge}>
                    <ThemedText style={styles.codeLabel}>Code:</ThemedText>
                    <ThemedText style={styles.codeValue}>{referralCode}</ThemedText>
                  </View>
                </View>
              </ViewShot>

              <ThemedText style={styles.qrSubtext}>
                Friends can scan this QR code to sign up with your referral
              </ThemedText>
            </View>

            {/* Download Button */}
            <Pressable
              style={styles.downloadButton}
              onPress={handleDownloadQR}
              disabled={isDownloading}
              accessibilityLabel="Download QR code"
              accessibilityHint="Save the QR code as an image to your device"
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.downloadButtonGradient}
              >
                {isDownloading ? (
                  <ThemedText style={styles.downloadButtonText}>Downloading...</ThemedText>
                ) : (
                  <>
                    <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                    <ThemedText style={styles.downloadButtonText}>Download QR Code</ThemedText>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            {/* Share Platforms */}
            <View style={styles.platformsSection}>
              <ThemedText style={styles.sectionTitle}>Share Via</ThemedText>
              <View style={styles.platformsGrid}>
                {sharePlatforms.map((platform) => (
                  <Pressable
                    key={platform.name}
                    style={styles.platformButton}
                    onPress={platform.action}
                    accessibilityLabel={`Share via ${platform.name}`}
                    accessibilityHint={`Opens ${platform.name} to share your referral`}
                  >
                    <View style={[styles.platformIcon, { backgroundColor: platform.color }]}>
                      <Ionicons name={platform.icon} size={24} color="#FFFFFF" />
                    </View>
                    <ThemedText style={styles.platformText}>{platform.name}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="information-circle" size={20} color="#8B5CF6" />
                <ThemedText style={styles.infoText}>
                  Your friends get {currencySymbol}30 off and you earn {currencySymbol}50 when they complete their first order
                </ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  qrWrapper: {
    backgroundColor: 'transparent',
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    gap: 6,
  },
  codeLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  codeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B5CF6',
    letterSpacing: 1.5,
  },
  qrSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  downloadButton: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  downloadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  platformsSection: {
    marginBottom: 20,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  platformButton: {
    alignItems: 'center',
    width: '22%',
    minWidth: 70,
  },
  platformIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  platformText: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default React.memo(ReferralQRModal);

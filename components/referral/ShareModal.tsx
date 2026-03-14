// Share Modal Component
// Modal for sharing referral code via multiple channels

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Share as RNShare,
  Clipboard,
  Linking} from 'react-native';
import { platformAlertSimple } from '@/utils/platformAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { ThemedText } from '@/components/ThemedText';
import referralService from '@/services/referralApi';
import type { ShareTemplate } from '@/types/referral.types';
import analyticsService from '@/services/analyticsService';
import { useRegion } from '@/contexts/RegionContext';

interface ShareModalProps {
  visible: boolean;
  referralCode: string;
  referralLink: string;
  currentTierProgress?: {
    current: number;
    target: number;
    nextTier: string;
  };
  onClose: () => void;
}

const getSharePlatforms = (currencySymbol: string): ShareTemplate[] => [
  {
    type: 'whatsapp',
    icon: 'logo-whatsapp',
    color: '#25D366',
    message: `🎉 Join me on REZ and get ${currencySymbol}30 off your first order! Use my code: {CODE}\n\n✨ Shop from top brands\n💰 Earn rewards\n\n{LINK}`,
  },
  {
    type: 'facebook',
    icon: 'logo-facebook',
    color: '#1877f2',
    message: `Just discovered REZ - amazing deals! 🛍️\n\nUse my code {CODE} for ${currencySymbol}30 off!\n\n{LINK}`,
  },
  {
    type: 'instagram',
    icon: 'logo-instagram',
    color: '#E4405F',
    message: `💎 Shop smarter with REZ!\n\nCode: {CODE}\nGet ${currencySymbol}30 off!\n\n{LINK}`,
  },
  {
    type: 'telegram',
    icon: 'paper-plane',
    color: '#0088cc',
    message: `🚀 Check out REZ!\n\nUse code {CODE} for ${currencySymbol}30 off.\n\n{LINK}`,
  },
  {
    type: 'sms',
    icon: 'chatbox',
    color: '#10b981',
    message: `Hey! Join REZ and get ${currencySymbol}30 off. Code: {CODE}\n{LINK}`,
  },
  {
    type: 'email',
    icon: 'mail',
    color: '#6366f1',
    subject: `Get ${currencySymbol}30 off on REZ - My referral gift!`,
    message: `Hi!\n\nI've been using REZ to shop from local stores. Use my code {CODE} for ${currencySymbol}30 off!\n\n{LINK}`,
  },
];

function ShareModal({
  visible,
  referralCode,
  referralLink,
  currentTierProgress,
  onClose,
}: ShareModalProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const SHARE_PLATFORMS = getSharePlatforms(currencySymbol);
  const [isCopied, setIsCopied] = useState(false);

  // Handle copy code
  const handleCopyCode = async () => {
    await Clipboard.setString(referralCode);
    setIsCopied(true);

    // ✅ Analytics: Track code copy from share modal

    platformAlertSimple('Copied!', 'Referral code copied to clipboard');

    setTimeout(() => setIsCopied(false), 3000);
  };

  // Handle copy link
  const handleCopyLink = async () => {
    await Clipboard.setString(referralLink);

    // ✅ Analytics: Track link copy

    platformAlertSimple('Copied!', 'Referral link copied to clipboard');
  };

  // Handle share via platform
  const handleShare = async (platform: ShareTemplate) => {
    try {
      // Replace placeholders
      const message = platform.message
        .replace('{CODE}', referralCode)
        .replace('{LINK}', referralLink);

      // ✅ Analytics: Track share attempt by platform
      analyticsService.track('referral_shared', { platform: platform.type });

      // Track share event
      await referralService.shareReferralLink(platform.type as any);

      switch (platform.type) {
        case 'whatsapp':
          const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
          await Linking.openURL(whatsappUrl);
          break;

        case 'facebook':
          const fbUrl = `fb://facewebmodal/f?href=${encodeURIComponent(referralLink)}`;
          await Linking.openURL(fbUrl);
          break;

        case 'telegram':
          const telegramUrl = `tg://msg?text=${encodeURIComponent(message)}`;
          await Linking.openURL(telegramUrl);
          break;

        case 'email':
          const emailUrl = `mailto:?subject=${encodeURIComponent(platform.subject || '')}&body=${encodeURIComponent(message)}`;
          await Linking.openURL(emailUrl);
          break;

        case 'sms':
          const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
          await Linking.openURL(smsUrl);
          break;

        default:
          // Use native share sheet
          await RNShare.share({
            message,
            title: 'Join REZ',
          });
      }
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        platformAlertSimple('Error', 'Could not open share dialog');
      }
    }
  };

  // Render share button
  const renderShareButton = (platform: ShareTemplate) => (
    <Pressable
      key={platform.type}
      style={styles.platformButton}
      onPress={() => handleShare(platform)}
    >
      <View style={[styles.platformIcon, { backgroundColor: platform.color }]}>
        <Ionicons name={platform.icon as any} size={24} color="#FFFFFF" />
      </View>
      <ThemedText style={styles.platformText}>
        {platform.type.charAt(0).toUpperCase() + platform.type.slice(1)}
      </ThemedText>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalContainer}>
          <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.header}>
            <ThemedText style={styles.headerTitle}>Share Referral</ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Tier Progress (if available) */}
            {currentTierProgress && (
              <View style={styles.progressCard}>
                <ThemedText style={styles.progressTitle}>Progress to {currentTierProgress.nextTier}</ThemedText>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(currentTierProgress.current / currentTierProgress.target) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <ThemedText style={styles.progressText}>
                  {currentTierProgress.current}/{currentTierProgress.target} referrals
                </ThemedText>
              </View>
            )}

            {/* QR Code */}
            <View style={styles.qrSection}>
              <ThemedText style={styles.sectionTitle}>QR Code</ThemedText>
              <View style={styles.qrContainer}>
                <QRCode value={referralLink} size={180} />
              </View>
              <ThemedText style={styles.qrSubtext}>Scan to join with your referral code</ThemedText>
            </View>

            {/* Referral Code */}
            <View style={styles.codeSection}>
              <ThemedText style={styles.sectionTitle}>Your Referral Code</ThemedText>
              <Pressable style={styles.codeContainer} onPress={handleCopyCode}>
                <ThemedText style={styles.codeText}>{referralCode}</ThemedText>
                <View style={styles.copyButton}>
                  <Ionicons name={isCopied ? 'checkmark' : 'copy'} size={20} color="#8B5CF6" />
                  <ThemedText style={styles.copyText}>{isCopied ? 'Copied!' : 'Copy'}</ThemedText>
                </View>
              </Pressable>
            </View>

            {/* Referral Link */}
            <View style={styles.linkSection}>
              <ThemedText style={styles.sectionTitle}>Referral Link</ThemedText>
              <Pressable style={styles.linkContainer} onPress={handleCopyLink}>
                <ThemedText style={styles.linkText} numberOfLines={1}>
                  {referralLink}
                </ThemedText>
                <Ionicons name="copy-outline" size={20} color="#6B7280" />
              </Pressable>
            </View>

            {/* Share Platforms */}
            <View style={styles.platformsSection}>
              <ThemedText style={styles.sectionTitle}>Share Via</ThemedText>
              <View style={styles.platformsGrid}>
                {SHARE_PLATFORMS.map(renderShareButton)}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
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
  },
  progressCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  qrSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  codeSection: {
    marginBottom: 24,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  copyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  linkSection: {
    marginBottom: 24,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  linkText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  platformsSection: {
    marginBottom: 24,
  },
  platformsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  platformButton: {
    alignItems: 'center',
    width: '30%',
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
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  platformText: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
});

export default React.memo(ShareModal);

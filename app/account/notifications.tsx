import { withErrorBoundary } from '@/utils/withErrorBoundary';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import notificationService from '../../services/notificationService';
import { platformAlertSimple } from '@/utils/platformAlert';
import { NotificationListSkeleton } from '@/components/skeletons';
import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';

interface PushNotifications {
  enabled: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  recommendations: boolean;
  priceAlerts: boolean;
  deliveryUpdates: boolean;
  paymentUpdates: boolean;
  securityAlerts: boolean;
  chatMessages: boolean;
}

interface EmailNotifications {
  enabled: boolean;
  newsletters: boolean;
  orderReceipts: boolean;
  weeklyDigest: boolean;
  promotions: boolean;
  securityAlerts: boolean;
  accountUpdates: boolean;
}

interface SMSNotifications {
  enabled: boolean;
  orderUpdates: boolean;
  deliveryAlerts: boolean;
  paymentConfirmations: boolean;
  securityAlerts: boolean;
  otpMessages: boolean;
}

interface InAppNotifications {
  enabled: boolean;
  showBadges: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  bannerStyle: 'BANNER' | 'ALERT' | 'SILENT';
}

interface NotificationSettings {
  push: PushNotifications;
  email: EmailNotifications;
  sms: SMSNotifications;
  inApp: InAppNotifications;
}

function NotificationsScreen() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Cleanup success timer on unmount
  useEffect(() => {
    return () => clearTimeout(successTimerRef.current);
  }, []);

  const getDefaultSettings = (): NotificationSettings => ({
    push: {
      enabled: true,
      orderUpdates: true,
      promotions: false,
      recommendations: true,
      priceAlerts: true,
      deliveryUpdates: true,
      paymentUpdates: true,
      securityAlerts: true,
      chatMessages: true,
    },
    email: {
      enabled: true,
      newsletters: false,
      orderReceipts: true,
      weeklyDigest: true,
      promotions: false,
      securityAlerts: true,
      accountUpdates: true,
    },
    sms: {
      enabled: true,
      orderUpdates: true,
      deliveryAlerts: true,
      paymentConfirmations: true,
      securityAlerts: true,
      otpMessages: true,
    },
    inApp: {
      enabled: true,
      showBadges: true,
      soundEnabled: true,
      vibrationEnabled: true,
      bannerStyle: 'BANNER',
    },
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotificationSettings();

      if (response.success && response.data) {
        if (!isMounted()) return;
        setSettings(response.data as NotificationSettings);
      } else {
        // Set default settings if none exist
        if (!isMounted()) return;
        setSettings(getDefaultSettings());
      }
    } catch (error) {
      // Set default settings on error
      if (!isMounted()) return;
      setSettings(getDefaultSettings());
    } finally {
      if (!isMounted()) return;
      setLoading(false);
    }
  };

  const updatePushSettings = async (updates: Partial<PushNotifications>) => {
    if (!settings) return;

    const newPushSettings = { ...settings.push, ...updates };
    setSettings({ ...settings, push: newPushSettings });

    try {
      setSaving(true);
      const response = await notificationService.updatePushSettings(newPushSettings);

      if (!response.success) {
        platformAlertSimple('Error', 'Failed to update push notification settings. Please try again.');
        // Revert to previous state
        if (!isMounted()) return;
        setSettings(settings);
      } else {
        // Show success message
        if (!isMounted()) return;
        setShowSuccessMessage(true);
        clearTimeout(successTimerRef.current);
        successTimerRef.current = setTimeout(() => { if (isMounted()) setShowSuccessMessage(false); }, 2000);
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to update push notification settings. Please check your connection and try again.');
      // Revert to previous state
      if (!isMounted()) return;
      setSettings(settings);
    } finally {
      if (!isMounted()) return;
      setSaving(false);
    }
  };

  const updateEmailSettings = async (updates: Partial<EmailNotifications>) => {
    if (!settings) return;

    const newEmailSettings = { ...settings.email, ...updates };
    setSettings({ ...settings, email: newEmailSettings });

    try {
      setSaving(true);
      const response = await notificationService.updateEmailSettings(newEmailSettings);

      if (!response.success) {
        platformAlertSimple('Error', 'Failed to update email notification settings. Please try again.');
        if (!isMounted()) return;
        setSettings(settings);
      } else {
        if (!isMounted()) return;
        setShowSuccessMessage(true);
        clearTimeout(successTimerRef.current);
        successTimerRef.current = setTimeout(() => { if (isMounted()) setShowSuccessMessage(false); }, 2000);
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to update email notification settings. Please check your connection and try again.');
      if (!isMounted()) return;
      setSettings(settings);
    } finally {
      if (!isMounted()) return;
      setSaving(false);
    }
  };

  const updateSMSSettings = async (updates: Partial<SMSNotifications>) => {
    if (!settings) return;

    const newSMSSettings = { ...settings.sms, ...updates };
    setSettings({ ...settings, sms: newSMSSettings });

    try {
      setSaving(true);
      const response = await notificationService.updateSMSSettings(newSMSSettings);

      if (!response.success) {
        platformAlertSimple('Error', 'Failed to update SMS notification settings. Please try again.');
        if (!isMounted()) return;
        setSettings(settings);
      } else {
        if (!isMounted()) return;
        setShowSuccessMessage(true);
        clearTimeout(successTimerRef.current);
        successTimerRef.current = setTimeout(() => { if (isMounted()) setShowSuccessMessage(false); }, 2000);
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to update SMS notification settings. Please check your connection and try again.');
      if (!isMounted()) return;
      setSettings(settings);
    } finally {
      if (!isMounted()) return;
      setSaving(false);
    }
  };

  const updateInAppSettings = async (updates: Partial<InAppNotifications>) => {
    if (!settings) return;

    const newInAppSettings = { ...settings.inApp, ...updates };
    setSettings({ ...settings, inApp: newInAppSettings });

    try {
      setSaving(true);
      const response = await notificationService.updateInAppSettings(newInAppSettings);

      if (!response.success) {
        platformAlertSimple('Error', 'Failed to update in-app notification settings. Please try again.');
        if (!isMounted()) return;
        setSettings(settings);
      } else {
        if (!isMounted()) return;
        setShowSuccessMessage(true);
        clearTimeout(successTimerRef.current);
        successTimerRef.current = setTimeout(() => { if (isMounted()) setShowSuccessMessage(false); }, 2000);
      }
    } catch (error) {
      platformAlertSimple('Error', 'Failed to update in-app notification settings. Please check your connection and try again.');
      if (!isMounted()) return;
      setSettings(settings);
    } finally {
      if (!isMounted()) return;
      setSaving(false);
    }
  };

  const renderSettingItem = (
    title: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    disabled?: boolean
  ) => (
    <View style={styles.settingItem}>
      <Text style={[styles.settingTitle, disabled && styles.disabledText]}>
        {title}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || saving}
        trackColor={{ false: Colors.border.default, true: Colors.info }}
        thumbColor={value ? Colors.background.primary : Colors.background.secondary}
      />
    </View>
  );

  const renderSection = (title: string, icon: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={24} color={Colors.info} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <NotificationListSkeleton />
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={styles.errorContainer}>
        <Text
          style={styles.errorText}
          accessibilityRole="alert"
        >
          Failed to load settings
        </Text>
        <Pressable
          style={styles.retryButton}
          onPress={loadSettings}
          accessibilityLabel="Retry loading notification settings"
          accessibilityRole="button"
          accessibilityHint="Double tap to try loading settings again"
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          accessibilityHint="Navigate to previous screen"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">Notification Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Push Notifications */}
        <Pressable
          style={styles.notificationSection}
          onPress={() => router.push('/account/push-notifications')}
          accessibilityLabel="Push notifications settings"
          accessibilityRole="button"
          accessibilityHint="Navigate to manage push notification preferences"
        >
          <View style={styles.sectionIcon}>
            <Ionicons name="notifications" size={24} color={Colors.info} />
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.notificationSectionTitle}>Push Notifications</Text>
            <Text style={styles.sectionDescription}>Manage push notification preferences</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
        </Pressable>

        {/* Email Notifications */}
        <Pressable
          style={styles.notificationSection}
          onPress={() => router.push('/account/email-notifications')}
          accessibilityLabel="Email notifications settings"
          accessibilityRole="button"
          accessibilityHint="Navigate to manage email notification settings"
        >
          <View style={styles.sectionIcon}>
            <Ionicons name="mail" size={24} color={Colors.info} />
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.notificationSectionTitle}>Email Notifications</Text>
            <Text style={styles.sectionDescription}>Manage email notification settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
        </Pressable>

        {/* SMS Notifications */}
        <Pressable
          style={styles.notificationSection}
          onPress={() => router.push('/account/sms-notifications')}
          accessibilityLabel="SMS notifications settings"
          accessibilityRole="button"
          accessibilityHint="Navigate to manage SMS notification preferences"
        >
          <View style={styles.sectionIcon}>
            <Ionicons name="chatbox" size={24} color={Colors.info} />
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.notificationSectionTitle}>SMS Notifications</Text>
            <Text style={styles.sectionDescription}>Manage SMS notification preferences</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
        </Pressable>

        {/* Notification History */}
        <Pressable
          style={styles.notificationSection}
          onPress={() => router.push('/account/notification-history')}
          accessibilityLabel="Notification history"
          accessibilityRole="button"
          accessibilityHint="Navigate to view all past notifications"
        >
          <View style={styles.sectionIcon}>
            <Ionicons name="time" size={24} color={Colors.info} />
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.notificationSectionTitle}>Notification History</Text>
            <Text style={styles.sectionDescription}>View all past notifications</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.text.tertiary} />
        </Pressable>
      </ScrollView>

      {/* Saving Indicator */}
      {saving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color={Colors.text.inverse} />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <View style={styles.successIndicator}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.text.inverse} />
          <Text style={styles.successText}>Settings saved!</Text>
        </View>
      )}
    </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h3,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 120,
  },
  section: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
    padding: Spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  sectionTitle: {
    ...Typography.h4,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: Spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  settingTitle: {
    ...Typography.bodyLarge,
    color: Colors.text.secondary,
    flex: 1,
  },
  disabledText: {
    color: Colors.text.tertiary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
  },
  loadingText: {
    marginTop: Spacing.base,
    ...Typography.bodyLarge,
    color: Colors.text.tertiary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    padding: Spacing['2xl'],
  },
  errorText: {
    ...Typography.h4,
    color: Colors.error,
    marginBottom: Spacing.base,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.info,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  retryButtonText: {
    color: Colors.text.inverse,
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  savingIndicator: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: Colors.info,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  savingText: {
    color: Colors.text.inverse,
    ...Typography.body,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  successIndicator: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: Colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  successText: {
    color: Colors.text.inverse,
    ...Typography.body,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  notificationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base,
  },
  sectionContent: {
    flex: 1,
  },
  notificationSectionTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    ...Typography.body,
    color: Colors.text.tertiary,
  },
});

export default withErrorBoundary(NotificationsScreen, 'AccountNotifications');

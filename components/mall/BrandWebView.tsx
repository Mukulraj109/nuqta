/**
 * BrandWebView Component
 *
 * In-app WebView for viewing brand websites
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';

interface BrandWebViewProps {
  url: string;
  brandName: string;
  cashbackPercentage?: number;
  onClose?: () => void;
}

const BrandWebView: React.FC<BrandWebViewProps> = ({
  url,
  brandName,
  cashbackPercentage,
  onClose,
}) => {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(url);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  }, [onClose, router]);

  const handleGoBack = useCallback(() => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    }
  }, [canGoBack]);

  const handleGoForward = useCallback(() => {
    if (canGoForward && webViewRef.current) {
      webViewRef.current.goForward();
    }
  }, [canGoForward]);

  const handleReload = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  }, []);

  const isUrlSafe = useCallback((testUrl: string): boolean => {
    try {
      const parsed = new URL(testUrl);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, []);

  const handleShouldStartLoad = useCallback((event: any): boolean => {
    const navUrl = event.url || event.nativeEvent?.url;
    if (!navUrl) return true;
    return isUrlSafe(navUrl);
  }, [isUrlSafe]);

  const handleNavigationStateChange = useCallback((navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
    setIsLoading(navState.loading);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color={colors.neutral[700]} />
        </Pressable>

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {brandName}
          </Text>
          {cashbackPercentage && (
            <View style={styles.cashbackBadge}>
              <Text style={styles.cashbackText}>
                {cashbackPercentage}% Cashback
              </Text>
            </View>
          )}
        </View>

        <Pressable
          style={styles.reloadButton}
          onPress={handleReload}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="reload" size={20} color={colors.neutral[700]} />
        </Pressable>
      </View>

      {/* URL Bar */}
      <View style={styles.urlBar}>
        <Ionicons name="lock-closed" size={14} color={colors.warningScale[400]} />
        <Text style={styles.urlText} numberOfLines={1}>
          {currentUrl.replace(/^https?:\/\//, '').split('/')[0]}
        </Text>
      </View>

      {/* WebView */}
      <View style={styles.webViewContainer}>
        {isUrlSafe(url) ? (
          <WebView
            ref={webViewRef}
            source={{ uri: url }}
            style={styles.webView}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            sharedCookiesEnabled={false}
            thirdPartyCookiesEnabled={false}
            allowsBackForwardNavigationGestures={true}
          />
        ) : (
          <View style={styles.loadingOverlay}>
            <Ionicons name="shield-outline" size={48} color={colors.error} />
            <Text style={[styles.loadingText, { color: colors.error }]}>
              This URL is not allowed. Only HTTPS URLs are supported.
            </Text>
          </View>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.nileBlue} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Pressable
          style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
          onPress={handleGoBack}
          disabled={!canGoBack}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={canGoBack ? colors.neutral[700] : colors.neutral[300]}
          />
        </Pressable>

        <Pressable
          style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
          onPress={handleGoForward}
          disabled={!canGoForward}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={canGoForward ? colors.neutral[700] : colors.neutral[300]}
          />
        </Pressable>

        <View style={styles.navSpacer} />

        <View style={styles.cashbackReminder}>
          <Ionicons name="gift-outline" size={18} color={colors.nileBlue} />
          <Text style={styles.reminderText}>
            Cashback will be tracked automatically
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  closeButton: {
    padding: 4,
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.neutral[900],
  },
  cashbackBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.linen,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  cashbackText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  reloadButton: {
    padding: 4,
  },
  urlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  urlText: {
    flex: 1,
    fontSize: 13,
    color: colors.neutral[500],
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.neutral[500],
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.background.primary,
    ...Platform.select({
      ios: {
        paddingBottom: 20,
      },
    }),
  },
  navButton: {
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navSpacer: {
    flex: 1,
  },
  cashbackReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.linen,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  reminderText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.nileBlue,
  },
});

export default React.memo(BrandWebView);

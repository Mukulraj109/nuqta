// ProfileMenuModal Component
// Premium glassmorphism design with Nuqta palette (mustard/nile blue accents)

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import { platformAlertSimple, platformAlertDestructive } from '@/utils/platformAlert';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import {
  useAuthActions,
  useGetCurrencySymbol,
  useGetLocale,
  useRegionState,
  useSetRegion,
} from '@/stores/selectors';
import { ProfileMenuModalProps, ProfileMenuItem } from '@/types/profile.types';
import type { RegionId } from '@/stores/regionStore';
import { useLocation } from '@/contexts/LocationContext';
import { UserLocation } from '@/types/location.types';
import { colors } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_WIDTH = SCREEN_WIDTH * 0.88;

// Nuqta Design Colors
const COLORS = {
  // Primary - Nuqta Palette
  primary: colors.lightMustard,        // Light Mustard
  primaryDark: colors.nileBlue,    // Nile Blue
  primaryLight: 'rgba(255, 205, 87, 0.1)',
  primaryGlow: 'rgba(255, 205, 87, 0.3)',

  // Gold (rewards) - matches Mustard
  gold: colors.lightMustard,
  goldLight: 'rgba(255, 205, 87, 0.15)',
  goldGlow: 'rgba(255, 205, 87, 0.3)',

  // Dark Navy - Nile Blue
  navy: colors.nileBlue,

  // Text
  textPrimary: colors.nileBlue,
  textSecondary: '#1F2D3D',
  textMuted: colors.gray[400],

  // Surface - Linen
  surface: colors.linen,
  white: colors.background.primary,

  // Glass
  glassWhite: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.4)',

  // Status
  success: colors.lightMustard,
  error: colors.error,
};

// Region data with flags - Dubai first as default
const REGIONS_DATA: { id: RegionId; name: string; flag: string; currency: string; coords: { lat: number; lng: number }; country: string }[] = [
  { id: 'dubai', name: 'Dubai', flag: '🇦🇪', currency: 'AED', coords: { lat: 25.2048, lng: 55.2708 }, country: 'United Arab Emirates' },
  { id: 'bangalore', name: 'Bangalore', flag: '🇮🇳', currency: 'INR', coords: { lat: 12.9716, lng: 77.5946 }, country: 'India' },
  { id: 'china', name: 'China', flag: '🇨🇳', currency: 'CNY', coords: { lat: 31.2304, lng: 121.4737 }, country: 'China' },
];

// Custom Confirmation Modal Component
interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: string;
  confirmColor?: string;
}

const ConfirmationModal = ({
  visible,
  title,
  message,
  confirmText = 'Continue',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  icon = 'globe-outline',
  confirmColor = COLORS.primary,
}: ConfirmModalProps) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let _anim: Animated.CompositeAnimation;
    if (visible) {
      _anim = Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]);
      _anim.start();
    } else {
      _anim = Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]);
      _anim.start();
    }
  
    return () => _anim.stop();
}, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onCancel}
    >
      <Animated.View style={[confirmStyles.backdrop, { opacity: opacityAnim }]}>
        <Animated.View
          style={[
            confirmStyles.modalContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Icon */}
          <View style={confirmStyles.iconContainer}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={confirmStyles.iconGradient}
            >
              <Ionicons name={icon as any} size={32} color={colors.background.primary} />
            </LinearGradient>
          </View>

          {/* Title */}
          <ThemedText style={confirmStyles.title}>{title}</ThemedText>

          {/* Message */}
          <ThemedText style={confirmStyles.message}>{message}</ThemedText>

          {/* Warning Badge */}
          <View style={confirmStyles.warningBadge}>
            <Ionicons name="warning" size={16} color={colors.warningScale[400]} />
            <ThemedText style={confirmStyles.warningText}>
              Your cart will be cleared
            </ThemedText>
          </View>

          {/* Buttons */}
          <View style={confirmStyles.buttonContainer}>
            <Pressable
              style={confirmStyles.cancelButton}
              onPress={onCancel}
             
            >
              <ThemedText style={confirmStyles.cancelButtonText}>
                {cancelText}
              </ThemedText>
            </Pressable>

            <Pressable
              style={[confirmStyles.confirmButton, { backgroundColor: confirmColor }]}
              onPress={onConfirm}
             
            >
              <Ionicons name="swap-horizontal" size={18} color={colors.background.primary} />
              <ThemedText style={confirmStyles.confirmButtonText}>
                {confirmText}
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const confirmStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 34, 64, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(255, 205, 87, 0.4)',
      },
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tint.amberLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.brand.amberDark,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(255, 205, 87, 0.3)',
      },
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.background.primary,
  },
});

function ProfileMenuModal({
  visible,
  onClose,
  user,
  menuSections,
  onMenuItemPress,
}: ProfileMenuModalProps) {
  const slideAnim = useRef(new Animated.Value(MODAL_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const actions = useAuthActions();
  const regionState = useRegionState();
  const setRegion = useSetRegion();
  const getCurrencySymbol = useGetCurrencySymbol();
  const getLocale = useGetLocale();
  const { setManualLocation } = useLocation();
  const currencySymbol = getCurrencySymbol();
  const locale = getLocale();
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [showRegionConfirm, setShowRegionConfirm] = useState(false);
  const [pendingRegion, setPendingRegion] = useState<RegionId | null>(null);

  const currentRegionData = REGIONS_DATA.find(r => r.id === regionState.currentRegion) || REGIONS_DATA[0];
  const pendingRegionData = pendingRegion ? REGIONS_DATA.find(r => r.id === pendingRegion) : null;

  const handleRegionChange = async (regionId: RegionId) => {
    if (regionId === regionState.currentRegion) {
      setShowRegionPicker(false);
      return;
    }

    // Show custom confirmation modal
    setPendingRegion(regionId);
    setShowRegionConfirm(true);
  };

  // Helper function to update location based on region
  const updateLocationForRegion = async (regionId: RegionId) => {
    const regionData = REGIONS_DATA.find(r => r.id === regionId);
    if (regionData) {
      const newLocation: UserLocation = {
        coordinates: {
          latitude: regionData.coords.lat,
          longitude: regionData.coords.lng,
        },
        address: {
          address: `${regionData.name}, ${regionData.country}`,
          city: regionData.name,
          state: regionData.name,
          country: regionData.country,
          pincode: '',
          formattedAddress: `${regionData.name}, ${regionData.country}`,
        },
        lastUpdated: new Date(),
        source: 'manual' as const,
      };
      await setManualLocation(newLocation);
    }
  };

  const confirmRegionChange = async () => {
    if (!pendingRegion) return;

    try {
      await setRegion(pendingRegion);
      // Update location context with the new region's default location
      await updateLocationForRegion(pendingRegion);

      setShowRegionPicker(false);
      setShowRegionConfirm(false);
      setPendingRegion(null);
    } catch (error) {
      platformAlertSimple('Error', 'Failed to change region. Please try again.');
    }
  };

  const cancelRegionChange = () => {
    setShowRegionConfirm(false);
    setPendingRegion(null);
  };

  useEffect(() => {
    let _anim: Animated.CompositeAnimation;
    if (visible) {
      _anim = Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
      _anim.start();
    } else {
      _anim = Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: MODAL_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]);
      _anim.start();
    }
  
    return () => _anim.stop();
}, [visible]);

  const performLogout = async () => {
    try {
      onClose();
      // AuthContext navigation guard handles redirect after logout
      await actions.logout();
    } catch (error) {
      platformAlertSimple('Logout Error', 'There was an issue logging you out.');
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      performLogout();
      return;
    }
    platformAlertDestructive('Logout', 'Are you sure you want to logout?', performLogout, 'Logout');
  };

  const renderHeader = () => (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}
    >
      {/* Glass overlay effect */}
      <View style={styles.headerGlassOverlay} />

      {/* Close Button */}
      <Pressable
        style={styles.closeButton}
        onPress={onClose}
       
      >
        <View style={styles.closeButtonInner}>
          <Ionicons name="close" size={20} color={COLORS.white} />
        </View>
      </Pressable>

      {/* User Section */}
      <View style={styles.userSection}>
        {/* Avatar with gradient ring */}
        <View style={styles.avatarWrapper}>
          <LinearGradient
            colors={[COLORS.gold, colors.warning]}
            style={styles.avatarRing}
          >
            <View style={styles.avatarInner}>
              <ThemedText style={styles.avatarText}>
                {user?.initials || 'U'}
              </ThemedText>
            </View>
          </LinearGradient>
          {/* Online indicator */}
          <View style={styles.onlineIndicator} />
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <ThemedText style={styles.userName}>
            {user?.name || 'User Name'}
          </ThemedText>
          <ThemedText style={styles.userEmail}>
            {user?.email || 'user@example.com'}
          </ThemedText>

          {/* Verified Badge */}
          {user?.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
              <ThemedText style={styles.verifiedText}>Verified</ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={styles.statIconWrapper}>
            <Ionicons name="wallet" size={16} color={COLORS.gold} />
          </View>
          <ThemedText style={styles.statValue}>
            {currencySymbol}{user?.wallet?.balance?.toLocaleString(locale) || '0'}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Wallet</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={styles.statIconWrapper}>
            <Ionicons name="trending-up" size={16} color={COLORS.gold} />
          </View>
          <ThemedText style={styles.statValue}>
            {currencySymbol}{user?.wallet?.totalEarned?.toLocaleString(locale) || '0'}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Earned</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={styles.statIconWrapper}>
            <Ionicons name="time" size={16} color={COLORS.gold} />
          </View>
          <ThemedText style={styles.statValue}>
            {currencySymbol}{user?.wallet?.pendingAmount?.toLocaleString(locale) || '0'}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Pending</ThemedText>
        </View>
      </View>

      {/* Region Selector Card */}
      <View style={styles.regionSelectorContainer}>
        <Pressable
          style={styles.regionCard}
          onPress={() => setShowRegionPicker(!showRegionPicker)}
         
        >
          <View style={styles.regionCardContent}>
            <View style={styles.regionIconContainer}>
              <Ionicons name="globe-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.regionTextContainer}>
              <ThemedText style={styles.regionLabel}>Region</ThemedText>
              <ThemedText style={styles.regionValue}>
                {currentRegionData.flag} {currentRegionData.name} ({currentRegionData.currency})
              </ThemedText>
            </View>
            <View style={styles.regionArrowContainer}>
              <Ionicons
                name={showRegionPicker ? "chevron-up" : "chevron-down"}
                size={18}
                color={COLORS.textMuted}
              />
            </View>
          </View>
        </Pressable>

        {/* Region Picker Dropdown */}
        {showRegionPicker && (
          <View style={styles.regionPickerDropdown}>
            {REGIONS_DATA.map((region) => (
              <Pressable
                key={region.id}
                style={[
                  styles.regionOption,
                  region.id === regionState.currentRegion && styles.regionOptionActive,
                ]}
                onPress={() => handleRegionChange(region.id)}
               
              >
                <ThemedText style={styles.regionOptionFlag}>{region.flag}</ThemedText>
                <View style={styles.regionOptionTextContainer}>
                  <ThemedText style={[
                    styles.regionOptionName,
                    region.id === regionState.currentRegion && styles.regionOptionNameActive,
                  ]}>
                    {region.name}
                  </ThemedText>
                  <ThemedText style={styles.regionOptionCurrency}>
                    {region.currency}
                  </ThemedText>
                </View>
                {region.id === regionState.currentRegion && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                )}
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Partner Profile Quick Action - Premium Glass Card */}
      <Pressable
        style={styles.partnerCard}
        onPress={() => {
          onClose();
          router.push('/profile/partner' as any);
        }}
       
      >
        {Platform.OS === 'web' ? (
          <View style={styles.partnerCardGlass}>
            <View style={styles.partnerCardContent}>
              <LinearGradient
                colors={['rgba(255, 200, 87, 0.2)', 'rgba(255, 200, 87, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.partnerIconContainer}
              >
                <Ionicons name="star" size={26} color={COLORS.gold} />
              </LinearGradient>
              <View style={styles.partnerTextContainer}>
                <ThemedText style={styles.partnerTitle}>Partner Program</ThemedText>
                <ThemedText style={styles.partnerDescription}>Level 1 • Earn rewards</ThemedText>
              </View>
              <View style={styles.partnerArrowContainer}>
                <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
              </View>
            </View>
          </View>
        ) : (
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.partnerCardGradient}
          >
            <LinearGradient
              colors={['rgba(255, 200, 87, 0.2)', 'rgba(255, 200, 87, 0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.partnerIconContainer}
            >
              <Ionicons name="star" size={26} color={COLORS.gold} />
            </LinearGradient>
            <View style={styles.partnerTextContainer}>
              <ThemedText style={styles.partnerTitle}>Partner Program</ThemedText>
              <ThemedText style={styles.partnerDescription}>Level 1 • Earn rewards</ThemedText>
            </View>
            <View style={styles.partnerArrowContainer}>
              <Ionicons name="chevron-forward" size={22} color={COLORS.primary} />
            </View>
          </LinearGradient>
        )}
      </Pressable>
    </LinearGradient>
  );

  const renderMenuItem = (item: ProfileMenuItem, index: number) => {
    const isGold = item.id === 'wallet' || item.id === 'subscription';
    const isNew = item.badge === 'NEW';

    return (
      <Pressable
        key={item.id}
        style={[
          styles.menuItem,
          isGold && styles.menuItemGold,
        ]}
        onPress={() => item.isEnabled && onMenuItemPress(item)}
       
        disabled={!item.isEnabled}
      >
        {/* Icon */}
        <View style={[
          styles.menuIconContainer,
          isGold && styles.menuIconGold,
        ]}>
          <Ionicons
            name={item.icon as any}
            size={20}
            color={isGold ? COLORS.gold : COLORS.primary}
          />
        </View>

        {/* Title */}
        <View style={styles.menuTextContainer}>
          <ThemedText style={styles.menuTitle}>{item.title}</ThemedText>
          {item.description && (
            <ThemedText style={styles.menuDescription}>{item.description}</ThemedText>
          )}
        </View>

        {/* Badge & Arrow */}
        <View style={styles.menuRight}>
          {item.badge && (
            <View style={[
              styles.badge,
              isNew ? styles.badgeNew : styles.badgeNumeric,
            ]}>
              <ThemedText style={[
                styles.badgeText,
                isNew && styles.badgeTextNew,
              ]}>
                {item.badge}
              </ThemedText>
            </View>
          )}
          {item.showArrow && (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={COLORS.textMuted}
            />
          )}
        </View>
      </Pressable>
    );
  };

  const renderMenuSection = (section: any, sectionIndex: number) => (
    <View key={`section_${sectionIndex}`} style={styles.menuSection}>
      {sectionIndex === 1 && (
        <View style={styles.sectionHeader}>
          <LinearGradient
            colors={[COLORS.gold, colors.warning]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sectionHeaderAccent}
          />
          <ThemedText style={styles.sectionTitle}>Premium Features</ThemedText>
        </View>
      )}
      {section.items.filter((item: ProfileMenuItem) => item.isEnabled !== false).map((item: ProfileMenuItem, index: number) =>
        renderMenuItem(item, index)
      )}
    </View>
  );

  return (
    <>
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />

      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ translateX: slideAnim }],
                height: SCREEN_HEIGHT,
                paddingBottom: insets.bottom,
              },
            ]}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* Glass Background for Web */}
            {Platform.OS === 'web' && (
              <View style={styles.webGlassBackground} />
            )}

            {renderHeader()}

            <ScrollView
              style={styles.menuContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.menuContent}
              bounces={false}
            >
              {/* Quick Actions Title */}
              <View style={styles.quickActionsHeader}>
                <ThemedText style={styles.quickActionsTitle}>Quick Actions</ThemedText>
                <View style={styles.quickActionsTitleLine} />
              </View>

              {menuSections?.map(renderMenuSection)}

              {/* Logout Button at Bottom */}
              <View style={styles.logoutContainer}>
                <Pressable
                  style={styles.logoutButtonBottom}
                  onPress={handleLogout}
                 
                >
                  <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
                  <ThemedText style={styles.logoutTextBottom}>Sign Out</ThemedText>
                </Pressable>
              </View>

              <View style={styles.footerSpace} />
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>

    {/* Region Change Confirmation Modal */}
    <ConfirmationModal
      visible={showRegionConfirm}
      title="Change Region"
      message={pendingRegionData
        ? `Switch from ${currentRegionData.name} to ${pendingRegionData.name}? Prices will be shown in ${pendingRegionData.currency}.`
        : 'Are you sure you want to change region?'
      }
      confirmText="Switch Region"
      cancelText="Cancel"
      onConfirm={confirmRegionChange}
      onCancel={cancelRegionChange}
      icon="globe-outline"
    />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 34, 64, 0.6)',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  modalContainer: {
    width: MODAL_WIDTH,
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.9)',
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRightWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -8, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 48,
      },
      android: {
        elevation: 30,
      },
      web: {
        // @ts-ignore - web only
        backdropFilter: 'blur(60px) saturate(200%)',
        // @ts-ignore - web only
        WebkitBackdropFilter: 'blur(60px) saturate(200%)',
        boxShadow: `
          0 25px 50px rgba(0, 0, 0, 0.15),
          inset 0 1px 0 rgba(255, 255, 255, 0.6)
        `,
      },
    }),
  },
  webGlassBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    // @ts-ignore - web only
    backdropFilter: 'blur(60px) saturate(200%)',
    // @ts-ignore - web only
    WebkitBackdropFilter: 'blur(60px) saturate(200%)',
  },

  // Header
  headerContainer: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 28,
    position: 'relative',
    overflow: 'visible',
  },
  headerGlassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      web: {
        // @ts-ignore - web only
        backdropFilter: 'blur(20px)',
        // @ts-ignore - web only
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // User Section
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(255, 215, 0, 0.4)',
      },
    }),
  },
  avatarInner: {
    flex: 1,
    borderRadius: 33,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 205, 87, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 205, 87, 0.4)',
    ...Platform.select({
      web: {
        // @ts-ignore - web only
        backdropFilter: 'blur(20px)',
        // @ts-ignore - web only
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 2px 8px rgba(255, 205, 87, 0.2)',
      },
      ios: {
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 4,
  },

  // Stats Row - Premium Glass Card
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Platform.OS === 'web' 
      ? 'rgba(255, 255, 255, 0.2)' 
      : 'rgba(255, 255, 255, 0.18)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      web: {
        // @ts-ignore - web only
        backdropFilter: 'blur(30px) saturate(180%)',
        // @ts-ignore - web only
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 200, 87, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 87, 0.3)',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(255, 200, 87, 0.2)',
      },
      ios: {
        shadowColor: COLORS.gold,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 8,
  },

  // Partner Card - Premium Glass Design (TASK.md compliant)
  partnerCard: {
    marginTop: 12,
    marginBottom: -12,
    zIndex: 10,
    paddingHorizontal: 0,
  },
  // Web: Glass Card with backdrop-filter
  partnerCardGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      } as any,
      default: {},
    }),
  },
  partnerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  // Native: Gradient fallback
  partnerCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.12)',
      },
    }),
  },
  partnerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 200, 87, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 16px rgba(255, 200, 87, 0.25)',
      },
    }),
  },
  partnerTextContainer: {
    flex: 1,
  },
  partnerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 3,
    letterSpacing: 0.15,
    lineHeight: 20,
  },
  partnerDescription: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 16,
  },
  partnerArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 205, 87, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 205, 87, 0.15)',
  },
  
  // Logout Button at Bottom
  logoutContainer: {
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 0,
  },
  logoutButtonBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Platform.OS === 'web'
      ? 'rgba(255, 255, 255, 0.85)'
      : 'rgba(255, 255, 255, 0.98)',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.error,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
      web: {
        // @ts-ignore - web only
        backdropFilter: 'blur(40px) saturate(180%)',
        // @ts-ignore - web only
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      },
    }),
  },
  logoutTextBottom: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.error,
    marginLeft: 10,
    letterSpacing: 0.2,
  },

  // Menu Container
  menuContainer: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' 
      ? 'rgba(247, 250, 252, 0.6)' 
      : 'rgba(247, 250, 252, 0.85)',
  },
  menuContent: {
    paddingTop: 20,
    paddingHorizontal: 12,
    paddingBottom: 32,
  },

  // Quick Actions Header
  quickActionsHeader: {
    marginBottom: 12,
    paddingTop: 0,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  quickActionsTitleLine: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sectionHeaderAccent: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Menu Section
  menuSection: {
    marginBottom: 4,
  },

  // Menu Item - Premium Glass Card
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'web'
      ? 'rgba(255, 255, 255, 0.7)'
      : 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 205, 87, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.navy,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
      web: {
        // @ts-ignore - web only
        backdropFilter: 'blur(40px) saturate(180%)',
        // @ts-ignore - web only
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      },
    }),
  },
  menuItemGold: {
    backgroundColor: Platform.OS === 'web'
      ? 'rgba(255, 200, 87, 0.15)'
      : 'rgba(255, 200, 87, 0.12)',
    borderColor: 'rgba(255, 200, 87, 0.35)',
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.gold,
        shadowOpacity: 0.2,
      },
      web: {
        // @ts-ignore - web only
        backdropFilter: 'blur(40px) saturate(180%)',
        // @ts-ignore - web only
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        boxShadow: '0 8px 32px rgba(255, 200, 87, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      },
    }),
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 205, 87, 0.2)',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(255, 205, 87, 0.15)',
      },
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  menuIconGold: {
    backgroundColor: COLORS.goldLight,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    letterSpacing: 0.1,
    lineHeight: 18,
  },
  menuDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Badge
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  badgeNew: {
    backgroundColor: COLORS.primary,
  },
  badgeNumeric: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryGlow,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  badgeTextNew: {
    color: COLORS.white,
    fontSize: 9,
    letterSpacing: 0.5,
  },

  footerSpace: {
    height: 40,
  },

  // Region Selector Styles
  regionSelectorContainer: {
    marginTop: 12,
    marginBottom: 4,
  },
  regionCard: {
    backgroundColor: Platform.OS === 'web'
      ? 'rgba(255, 255, 255, 0.25)'
      : 'rgba(255, 255, 255, 0.2)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    ...Platform.select({
      web: {
        // @ts-ignore - web only
        backdropFilter: 'blur(30px) saturate(180%)',
        // @ts-ignore - web only
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  regionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  regionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 205, 87, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 205, 87, 0.2)',
  },
  regionTextContainer: {
    flex: 1,
  },
  regionLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    marginBottom: 2,
  },
  regionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  regionArrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  regionPickerDropdown: {
    marginTop: 8,
    backgroundColor: Platform.OS === 'web'
      ? 'rgba(255, 255, 255, 0.95)'
      : 'rgba(255, 255, 255, 0.98)',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 205, 87, 0.2)',
    ...Platform.select({
      web: {
        // @ts-ignore - web only
        backdropFilter: 'blur(40px)',
        // @ts-ignore - web only
        WebkitBackdropFilter: 'blur(40px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  regionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  regionOptionActive: {
    backgroundColor: 'rgba(255, 205, 87, 0.08)',
  },
  regionOptionFlag: {
    fontSize: 24,
    marginRight: 14,
  },
  regionOptionTextContainer: {
    flex: 1,
  },
  regionOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  regionOptionNameActive: {
    color: COLORS.primary,
  },
  regionOptionCurrency: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});

export default React.memo(ProfileMenuModal);

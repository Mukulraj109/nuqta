// AboutModal.tsx - Premium Glassmorphism Design
// Green & Gold color theme following TASK.md

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { useRegion } from '@/contexts/RegionContext';

// Premium Glass Design Tokens - Green & Gold Theme
const GLASS = {
  lightBg: 'rgba(255, 255, 255, 0.85)',
  lightBorder: 'rgba(255, 255, 255, 0.5)',
  lightHighlight: 'rgba(255, 255, 255, 0.8)',
  frostedBg: 'rgba(255, 255, 255, 0.95)',
  tintedGreenBg: 'rgba(0, 192, 106, 0.08)',
  tintedGreenBorder: 'rgba(0, 192, 106, 0.2)',
  tintedGoldBg: 'rgba(255, 200, 87, 0.1)',
  tintedGoldBorder: 'rgba(255, 200, 87, 0.3)',
};

const COLORS = {
  primary: '#ffcd57',
  primaryDark: '#00996B',
  gold: '#FFC857',
  goldDark: '#E5A500',
  navy: '#0B2240',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  white: '#FFFFFF',
  surface: '#F7FAFC',
  success: '#10B981',
};

interface StoreInfo {
  name: string;
  description?: string;
  establishedYear: number;
  address: {
    doorNo: string;
    floor: string;
    street: string;
    area: string;
    city: string;
    state: string;
    pinCode: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
    whatsapp?: string;
  };
  deliveryInfo?: {
    deliveryTime?: string;
    minimumOrder?: number;
    deliveryFee?: number;
    freeDeliveryAbove?: number;
  };
  isOpen: boolean;
  categories: string[];
  hours: {
    day: string;
    time: string;
  }[];
}

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
  storeData?: StoreInfo;
}

export default function AboutModal({ visible, onClose, storeData }: AboutModalProps) {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const slideAnim = useRef(new Animated.Value(screenData.height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
      slideAnim.setValue(window.height);
    });

    return () => subscription?.remove();
  }, [slideAnim]);

  const defaultStoreData: StoreInfo = {
    name: 'Reliance Trends',
    establishedYear: 2020,
    address: {
      doorNo: '40A',
      floor: '1st floor',
      street: '5th A Main Rd',
      area: 'H Block, HBR Layout',
      city: 'Bengaluru',
      state: 'Karnataka',
      pinCode: '560043',
    },
    isOpen: true,
    categories: ['Boys', 'Girls', 'Personal items', 'Gift cards', 'Loyalty program'],
    hours: [
      { day: 'Monday', time: '10:00 AM - 6:00 PM' },
      { day: 'Tuesday', time: '10:00 AM - 6:00 PM' },
      { day: 'Wednesday', time: '10:00 AM - 6:00 PM' },
      { day: 'Thursday', time: '10:00 AM - 6:00 PM' },
      { day: 'Friday', time: '10:00 AM - 6:00 PM' },
      { day: 'Saturday', time: '10:00 AM - 6:00 PM' },
      { day: 'Sunday', time: 'Closed' },
    ],
  };

  const store = storeData || defaultStoreData;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: screenData.height,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim, scaleAnim]);

  const handleBackdropPress = () => {
    onClose();
  };

  const handleModalPress = (event: any) => {
    event.stopPropagation();
  };

  const formatAddress = () => {
    const { doorNo, floor, street, area, city, state, pinCode } = store.address;

    const addressParts: string[] = [];

    if (doorNo && floor) {
      addressParts.push(`Door no. ${doorNo} - ${floor}`);
    } else if (doorNo) {
      addressParts.push(`Door no. ${doorNo}`);
    } else if (floor) {
      addressParts.push(floor);
    }

    if (street) addressParts.push(street);
    if (area) addressParts.push(area);
    if (city) addressParts.push(city);

    const statePinParts: string[] = [];
    if (state) statePinParts.push(state);
    if (pinCode) statePinParts.push(pinCode);

    let formattedAddress = addressParts.join(', ');
    if (statePinParts.length > 0) {
      formattedAddress += (addressParts.length > 0 ? ', ' : '') + statePinParts.join(' ');
    }

    return formattedAddress || 'Address not available';
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
      accessibilityLabel="About store dialog"
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          {/* Blur Background */}
          <Animated.View style={[styles.blurContainer, { opacity: fadeAnim }]}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={60} tint="dark" style={styles.blur} />
            ) : (
              <View style={[styles.blur, styles.androidBlur]} />
            )}
          </Animated.View>

          <TouchableWithoutFeedback onPress={handleModalPress}>
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                  ],
                },
              ]}
            >
              {/* Glass Modal */}
              {Platform.OS === 'ios' ? (
                <BlurView intensity={80} tint="light" style={styles.modal}>
                  {renderModalContent()}
                </BlurView>
              ) : (
                <View style={[styles.modal, styles.modalAndroid]}>
                  {renderModalContent()}
                </View>
              )}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  function renderModalContent() {
    return (
      <>
        {/* Glass Highlight at top */}
        <View style={styles.glassHighlight} />

        {/* Handle Bar */}
        <View style={styles.handleBar} />

        {/* Premium Close Button */}
        <Pressable
          style={styles.closeButton}
          onPress={onClose}
          accessibilityLabel="Close about store"
          accessibilityRole="button"
          accessibilityHint="Double tap to close this dialog"
        >
          <Ionicons name="close" size={20} color={COLORS.textSecondary} />
        </Pressable>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          {/* About Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.sectionIconBg}
              >
                <Ionicons name="information-circle" size={18} color={COLORS.white} />
              </LinearGradient>
              <ThemedText style={styles.sectionTitle}>About</ThemedText>
            </View>

            <View style={styles.glassCard}>
              <View style={styles.cardHighlight} />
              <ThemedText style={styles.establishedText}>Est. Year - {store.establishedYear}</ThemedText>

              {store.description && (
                <ThemedText style={styles.descriptionText}>{store.description}</ThemedText>
              )}

              <ThemedText style={styles.addressText}>{formatAddress()}</ThemedText>

              {(store.address.state || store.address.city || store.address.pinCode) && (
                <ThemedText style={styles.stateText}>
                  {[
                    store.address.state && `State - ${store.address.state}`,
                    store.address.city && `City - ${store.address.city}`,
                    store.address.pinCode && `Pin Code - ${store.address.pinCode}`
                  ].filter(Boolean).join(', ')}
                </ThemedText>
              )}

              {/* Open Now Button */}
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.openNowButton}
              >
                <Ionicons name="time-outline" size={16} color={COLORS.white} />
                <ThemedText style={styles.openNowText}>Open now</ThemedText>
              </LinearGradient>
            </View>
          </View>

          {/* Contact Information Section */}
          {store.contact && (store.contact.phone || store.contact.email || store.contact.website || store.contact.whatsapp) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={[COLORS.gold, COLORS.goldDark]}
                  style={styles.sectionIconBg}
                >
                  <Ionicons name="call" size={16} color={COLORS.navy} />
                </LinearGradient>
                <ThemedText style={styles.sectionTitle}>Contact</ThemedText>
              </View>

              <View style={styles.glassCard}>
                <View style={styles.cardHighlight} />
                {store.contact.phone && (
                  <View style={styles.contactRow}>
                    <View style={styles.contactIconBg}>
                      <Ionicons name="call-outline" size={16} color={COLORS.primary} />
                    </View>
                    <ThemedText style={styles.contactText}>{store.contact.phone}</ThemedText>
                  </View>
                )}
                {store.contact.email && (
                  <View style={styles.contactRow}>
                    <View style={styles.contactIconBg}>
                      <Ionicons name="mail-outline" size={16} color={COLORS.primary} />
                    </View>
                    <ThemedText style={styles.contactText}>{store.contact.email}</ThemedText>
                  </View>
                )}
                {store.contact.website && (
                  <View style={styles.contactRow}>
                    <View style={styles.contactIconBg}>
                      <Ionicons name="globe-outline" size={16} color={COLORS.primary} />
                    </View>
                    <ThemedText style={styles.contactText}>{store.contact.website}</ThemedText>
                  </View>
                )}
                {store.contact.whatsapp && (
                  <View style={styles.contactRow}>
                    <View style={[styles.contactIconBg, { backgroundColor: GLASS.tintedGreenBg }]}>
                      <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                    </View>
                    <ThemedText style={styles.contactText}>{store.contact.whatsapp}</ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Delivery Information Section */}
          {store.deliveryInfo && (store.deliveryInfo.deliveryTime || store.deliveryInfo.minimumOrder !== undefined || store.deliveryInfo.deliveryFee !== undefined || store.deliveryInfo.freeDeliveryAbove !== undefined) && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryDark]}
                  style={styles.sectionIconBg}
                >
                  <Ionicons name="bicycle" size={16} color={COLORS.white} />
                </LinearGradient>
                <ThemedText style={styles.sectionTitle}>Delivery</ThemedText>
              </View>

              <View style={styles.glassCard}>
                <View style={styles.cardHighlight} />
                {store.deliveryInfo.deliveryTime && (
                  <View style={styles.deliveryRow}>
                    <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                    <ThemedText style={styles.deliveryText}>Delivery Time: {store.deliveryInfo.deliveryTime}</ThemedText>
                  </View>
                )}
                {store.deliveryInfo.minimumOrder !== undefined && (
                  <View style={styles.deliveryRow}>
                    <Ionicons name="cash-outline" size={18} color={COLORS.primary} />
                    <ThemedText style={styles.deliveryText}>Minimum Order: {currencySymbol}{store.deliveryInfo.minimumOrder}</ThemedText>
                  </View>
                )}
                {store.deliveryInfo.deliveryFee !== undefined && (
                  <View style={styles.deliveryRow}>
                    <Ionicons name="bicycle-outline" size={18} color={COLORS.primary} />
                    <ThemedText style={styles.deliveryText}>Delivery Fee: {currencySymbol}{store.deliveryInfo.deliveryFee}</ThemedText>
                  </View>
                )}
                {store.deliveryInfo.freeDeliveryAbove !== undefined && (
                  <View style={styles.deliveryRow}>
                    <Ionicons name="gift-outline" size={18} color={COLORS.success} />
                    <ThemedText style={styles.deliveryText}>Free Delivery Above: {currencySymbol}{store.deliveryInfo.freeDeliveryAbove}</ThemedText>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Products Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={[COLORS.gold, COLORS.goldDark]}
                style={styles.sectionIconBg}
              >
                <Ionicons name="pricetag" size={16} color={COLORS.navy} />
              </LinearGradient>
              <ThemedText style={styles.sectionTitle}>Products</ThemedText>
            </View>

            <View style={styles.tagsContainer}>
              {store.categories.map((category, index) => (
                <View key={index} style={styles.tag}>
                  <ThemedText style={styles.tagText}>{category}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Store Hours Section */}
          <View style={[styles.section, { marginBottom: 32 }]}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.sectionIconBg}
              >
                <Ionicons name="calendar" size={16} color={COLORS.white} />
              </LinearGradient>
              <ThemedText style={styles.sectionTitle}>Store Hours</ThemedText>
            </View>

            <View style={styles.glassCard}>
              <View style={styles.cardHighlight} />
              {store.hours.map((schedule, index) => (
                <View
                  key={index}
                  style={[
                    styles.hourRow,
                    index === store.hours.length - 1 && { borderBottomWidth: 0 }
                  ]}
                >
                  <ThemedText style={styles.dayText}>{schedule.day}</ThemedText>
                  <ThemedText style={[
                    styles.timeText,
                    schedule.time === 'Closed' && styles.closedText
                  ]}>
                    {schedule.time}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </>
    );
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  blurContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  blur: {
    flex: 1,
  },

  androidBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },

  modal: {
    borderRadius: 28,
    width: '100%',
    maxHeight: '90%',
    padding: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS.lightBorder,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.navy,
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },

  modalAndroid: {
    backgroundColor: GLASS.frostedBg,
  },

  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: GLASS.lightHighlight,
  },

  handleBar: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    marginBottom: 16,
  },

  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: GLASS.lightBg,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: GLASS.lightBorder,
  },

  scrollView: {
    marginTop: 8,
  },

  section: {
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },

  sectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },

  glassCard: {
    backgroundColor: GLASS.lightBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: GLASS.lightBorder,
    overflow: 'hidden',
  },

  cardHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: GLASS.lightHighlight,
  },

  establishedText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 10,
    fontWeight: '500',
  },

  descriptionText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: 12,
  },

  addressText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 6,
    lineHeight: 20,
  },

  stateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },

  openNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 24,
    paddingVertical: 14,
  },

  openNowText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },

  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },

  contactIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: GLASS.tintedGreenBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GLASS.tintedGreenBorder,
  },

  contactText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
    fontWeight: '500',
  },

  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },

  deliveryText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
  },

  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  tag: {
    backgroundColor: GLASS.tintedGreenBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: GLASS.tintedGreenBorder,
  },

  tagText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },

  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },

  dayText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },

  timeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  closedText: {
    color: '#EF4444',
    fontWeight: '600',
  },
});

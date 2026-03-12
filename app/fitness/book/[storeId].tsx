/**
 * Fitness Booking Page - Gym/Studio/Trainer specific booking
 * Handles membership plans, class bookings, trainer sessions, day passes
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Platform,
  Dimensions,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { FormPageSkeleton } from '@/components/skeletons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '@/services/apiClient';
import { showAlert } from '@/components/common/CrossPlatformAlert';
import { useRegion } from '@/contexts/RegionContext';

import { Colors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/DesignSystem';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Booking types
type BookingTabType = 'membership' | 'classes' | 'trainer' | 'daypass';

interface Store {
  _id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  banner: string[];
  ratings: { average: number; count: number };
  location: { address: string; city: string };
  offers: { cashback: number };
  tags: string[];
  serviceTypes?: string[];
}

interface MembershipPlan {
  id: string;
  name: string;
  duration: string;
  durationMonths: number;
  price: number;
  originalPrice: number;
  features: string[];
  popular?: boolean;
}

interface FitnessClass {
  id: string;
  name: string;
  instructor: string;
  time: string;
  duration: string;
  spots: number;
  maxSpots: number;
  price: number;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

// TODO: Fetch membership plans from API when fitness booking backend is implemented.
// These hardcoded plans are placeholder data used until the API is ready.
const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    duration: '1 Month',
    durationMonths: 1,
    price: 2499,
    originalPrice: 2999,
    features: ['Full gym access', 'Locker room', 'Fitness assessment'],
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    duration: '3 Months',
    durationMonths: 3,
    price: 5999,
    originalPrice: 7999,
    features: ['Full gym access', 'Locker room', 'Fitness assessment', '1 PT session/month', 'Diet consultation'],
    popular: true,
  },
  {
    id: 'halfyearly',
    name: 'Half Yearly',
    duration: '6 Months',
    durationMonths: 6,
    price: 9999,
    originalPrice: 13999,
    features: ['Full gym access', 'Locker room', 'Fitness assessment', '2 PT sessions/month', 'Diet consultation', 'Group classes'],
  },
  {
    id: 'annual',
    name: 'Annual',
    duration: '12 Months',
    durationMonths: 12,
    price: 17999,
    originalPrice: 25999,
    features: ['Full gym access', 'Locker room', 'Fitness assessment', '4 PT sessions/month', 'Diet consultation', 'All group classes', 'Guest passes'],
  },
];

// TODO: Fetch class schedule from API when fitness booking backend is implemented.
// These hardcoded classes are placeholder data used until the API is ready.
const SAMPLE_CLASSES: FitnessClass[] = [
  { id: '1', name: 'Morning Yoga', instructor: 'Priya S.', time: '06:00 AM', duration: '60 min', spots: 8, maxSpots: 15, price: 299 },
  { id: '2', name: 'HIIT Blast', instructor: 'Rahul K.', time: '07:30 AM', duration: '45 min', spots: 5, maxSpots: 20, price: 349 },
  { id: '3', name: 'Pilates Core', instructor: 'Sneha M.', time: '09:00 AM', duration: '50 min', spots: 12, maxSpots: 12, price: 399 },
  { id: '4', name: 'Zumba', instructor: 'Meera P.', time: '05:00 PM', duration: '60 min', spots: 3, maxSpots: 25, price: 249 },
  { id: '5', name: 'CrossFit', instructor: 'Vikram R.', time: '06:30 PM', duration: '60 min', spots: 10, maxSpots: 15, price: 449 },
  { id: '6', name: 'Spin Class', instructor: 'Arjun D.', time: '07:30 PM', duration: '45 min', spots: 6, maxSpots: 20, price: 349 },
];

const FitnessBookingPage: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const { storeId, storeName, cashback, type } = useLocalSearchParams<{
    storeId: string;
    storeName?: string;
    cashback?: string;
    type?: string;
  }>();

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<BookingTabType>(
    (type as BookingTabType) || 'membership'
  );

  // Membership state
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);

  // Class booking state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<FitnessClass | null>(null);
  const [classes, setClasses] = useState<FitnessClass[]>(SAMPLE_CLASSES);

  // Trainer session state
  const [selectedTrainerDate, setSelectedTrainerDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<'single' | 'pack5' | 'pack10'>('single');

  // Day pass state
  const [dayPassDate, setDayPassDate] = useState<Date>(new Date());
  const [dayPassCount, setDayPassCount] = useState(1);

  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchStore = useCallback(async () => {
    if (!storeId) return;

    try {
      const response = await apiClient.get(`/stores/${storeId}`);
      const storeData = (response.data as any)?.store || response.data;
      setStore(storeData);
    } catch (error) {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  // Generate next 14 days
  const getNextDays = (count: number) => {
    const days = [];
    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const nextDays = getNextDays(14);

  // Generate time slots for trainer sessions
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 6; hour <= 20; hour++) {
      slots.push({
        id: `${hour}:00`,
        time: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
        available: Math.random() > 0.3, // Simulated availability
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getTrainerPrice = () => {
    switch (sessionType) {
      case 'single': return 999;
      case 'pack5': return 4499;
      case 'pack10': return 7999;
      default: return 999;
    }
  };

  const getDayPassPrice = () => 499 * dayPassCount;

  const getCashbackAmount = () => {
    const cashbackPercent = parseInt(cashback || '0') || store?.offers?.cashback || 15;
    let totalPrice = 0;

    switch (activeTab) {
      case 'membership':
        totalPrice = selectedPlan?.price || 0;
        break;
      case 'classes':
        totalPrice = selectedClass?.price || 0;
        break;
      case 'trainer':
        totalPrice = getTrainerPrice();
        break;
      case 'daypass':
        totalPrice = getDayPassPrice();
        break;
    }

    return Math.round(totalPrice * cashbackPercent / 100);
  };

  const getTotalPrice = () => {
    switch (activeTab) {
      case 'membership':
        return selectedPlan?.price || 0;
      case 'classes':
        return selectedClass?.price || 0;
      case 'trainer':
        return getTrainerPrice();
      case 'daypass':
        return getDayPassPrice();
      default:
        return 0;
    }
  };

  const validateForm = () => {
    if (!customerName.trim()) {
      setErrorMessage('Please enter your name');
      return false;
    }
    if (!customerPhone.trim()) {
      setErrorMessage('Please enter your phone number');
      return false;
    }

    switch (activeTab) {
      case 'membership':
        if (!selectedPlan) {
          setErrorMessage('Please select a membership plan');
          return false;
        }
        break;
      case 'classes':
        if (!selectedClass) {
          setErrorMessage('Please select a class');
          return false;
        }
        break;
      case 'trainer':
        if (!selectedTimeSlot) {
          setErrorMessage('Please select a time slot');
          return false;
        }
        break;
    }

    return true;
  };

  const handleBooking = async () => {
    if (!validateForm()) return;

    setErrorMessage('');
    setSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // TODO: Replace with actual booking API
      // const response = await apiClient.post('/bookings/fitness', { ... });

      setSubmitting(false);
      setShowSuccessModal(true);
    } catch (error) {
      setSubmitting(false);
      setErrorMessage('Failed to complete booking. Please try again.');
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { id: 'membership' as BookingTabType, label: 'Membership', icon: 'card' },
          { id: 'classes' as BookingTabType, label: 'Classes', icon: 'people' },
          { id: 'trainer' as BookingTabType, label: 'Trainer', icon: 'person' },
          { id: 'daypass' as BookingTabType, label: 'Day Pass', icon: 'ticket' },
        ].map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.id ? Colors.background.primary : Colors.text.tertiary}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderMembershipPlans = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Choose Your Plan</Text>
      {MEMBERSHIP_PLANS.map((plan) => (
        <Pressable
          key={plan.id}
          style={[
            styles.planCard,
            selectedPlan?.id === plan.id && styles.planCardSelected,
            plan.popular && styles.planCardPopular,
          ]}
          onPress={() => setSelectedPlan(plan)}
         
        >
          {plan.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
            </View>
          )}
          <View style={styles.planHeader}>
            <View>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planDuration}>{plan.duration}</Text>
            </View>
            <View style={styles.planPriceContainer}>
              <Text style={styles.planOriginalPrice}>{currencySymbol}{plan.originalPrice.toLocaleString()}</Text>
              <Text style={styles.planPrice}>{currencySymbol}{plan.price.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.planFeatures}>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
          {selectedPlan?.id === plan.id && (
            <View style={styles.selectedIndicator}>
              <Ionicons name="checkmark-circle" size={24} color={'#F97316'} />
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );

  const renderDateSelector = (selected: Date, onSelect: (date: Date) => void) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
      {nextDays.map((date, index) => {
        const isSelected = date.toDateString() === selected.toDateString();
        const isToday = date.toDateString() === new Date().toDateString();
        return (
          <Pressable
            key={index}
            style={[styles.dateCard, isSelected && styles.dateCardSelected]}
            onPress={() => onSelect(date)}
          >
            <Text style={[styles.dateDay, isSelected && styles.dateTextSelected]}>
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </Text>
            <Text style={[styles.dateNumber, isSelected && styles.dateTextSelected]}>
              {date.getDate()}
            </Text>
            {isToday && <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const renderClassBooking = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Date</Text>
      {renderDateSelector(selectedDate, setSelectedDate)}

      <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Available Classes</Text>
      {classes.map((cls) => {
        const isFull = cls.spots === 0;
        const isSelected = selectedClass?.id === cls.id;
        return (
          <Pressable
            key={cls.id}
            style={[
              styles.classCard,
              isSelected && styles.classCardSelected,
              isFull && styles.classCardFull,
            ]}
            onPress={() => !isFull && setSelectedClass(cls)}
            disabled={isFull}
           
          >
            <View style={styles.classTime}>
              <Text style={styles.classTimeText}>{cls.time}</Text>
              <Text style={styles.classDuration}>{cls.duration}</Text>
            </View>
            <View style={styles.classInfo}>
              <Text style={styles.className}>{cls.name}</Text>
              <Text style={styles.classInstructor}>{cls.instructor}</Text>
              <View style={styles.spotsRow}>
                <Ionicons name="people" size={14} color={isFull ? Colors.error : Colors.text.tertiary} />
                <Text style={[styles.spotsText, isFull && styles.spotsTextFull]}>
                  {isFull ? 'Full' : `${cls.spots} spots left`}
                </Text>
              </View>
            </View>
            <View style={styles.classPrice}>
              <Text style={styles.classPriceText}>{currencySymbol}{cls.price}</Text>
              {isSelected && <Ionicons name="checkmark-circle" size={20} color={'#F97316'} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  const renderTrainerBooking = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Session Type</Text>
      <View style={styles.sessionTypeContainer}>
        {[
          { id: 'single' as const, label: 'Single Session', price: 999 },
          { id: 'pack5' as const, label: '5 Sessions', price: 4499, save: '10%' },
          { id: 'pack10' as const, label: '10 Sessions', price: 7999, save: '20%' },
        ].map((option) => (
          <Pressable
            key={option.id}
            style={[styles.sessionOption, sessionType === option.id && styles.sessionOptionSelected]}
            onPress={() => setSessionType(option.id)}
          >
            {option.save && (
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>Save {option.save}</Text>
              </View>
            )}
            <Text style={[styles.sessionLabel, sessionType === option.id && styles.sessionLabelSelected]}>
              {option.label}
            </Text>
            <Text style={[styles.sessionPrice, sessionType === option.id && styles.sessionPriceSelected]}>
              {currencySymbol}{option.price.toLocaleString()}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Select Date</Text>
      {renderDateSelector(selectedTrainerDate, setSelectedTrainerDate)}

      <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Select Time</Text>
      <View style={styles.timeGrid}>
        {timeSlots.map((slot) => (
          <Pressable
            key={slot.id}
            style={[
              styles.timeSlot,
              selectedTimeSlot === slot.id && styles.timeSlotSelected,
              !slot.available && styles.timeSlotDisabled,
            ]}
            onPress={() => slot.available && setSelectedTimeSlot(slot.id)}
            disabled={!slot.available}
          >
            <Text style={[
              styles.timeSlotText,
              selectedTimeSlot === slot.id && styles.timeSlotTextSelected,
              !slot.available && styles.timeSlotTextDisabled,
            ]}>
              {slot.time}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderDayPass = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Date</Text>
      {renderDateSelector(dayPassDate, setDayPassDate)}

      <View style={styles.dayPassCard}>
        <View style={styles.dayPassHeader}>
          <View>
            <Text style={styles.dayPassTitle}>Day Pass</Text>
            <Text style={styles.dayPassSubtitle}>Full gym access for 1 day</Text>
          </View>
          <Text style={styles.dayPassPrice}>{currencySymbol}499/pass</Text>
        </View>

        <View style={styles.dayPassFeatures}>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.featureText}>Full equipment access</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.featureText}>Locker room & shower</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.featureText}>Valid for 12 hours</Text>
          </View>
        </View>

        <View style={styles.quantitySelector}>
          <Text style={styles.quantityLabel}>Number of Passes</Text>
          <View style={styles.quantityControls}>
            <Pressable
              style={styles.quantityButton}
              onPress={() => dayPassCount > 1 && setDayPassCount(dayPassCount - 1)}
            >
              <Ionicons name="remove" size={20} color={Colors.nileBlue} />
            </Pressable>
            <Text style={styles.quantityValue}>{dayPassCount}</Text>
            <Pressable
              style={styles.quantityButton}
              onPress={() => dayPassCount < 5 && setDayPassCount(dayPassCount + 1)}
            >
              <Ionicons name="add" size={20} color={Colors.nileBlue} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );

  const renderCustomerDetails = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Details</Text>
      <View style={styles.inputContainer}>
        <Ionicons name="person" size={18} color={Colors.text.tertiary} />
        <TextInput
          style={styles.input}
          placeholder="Full Name *"
          placeholderTextColor={Colors.text.tertiary}
          value={customerName}
          onChangeText={setCustomerName}
        />
      </View>
      <View style={styles.inputContainer}>
        <Ionicons name="call" size={18} color={Colors.text.tertiary} />
        <TextInput
          style={styles.input}
          placeholder="Phone Number *"
          placeholderTextColor={Colors.text.tertiary}
          value={customerPhone}
          onChangeText={setCustomerPhone}
          keyboardType="phone-pad"
        />
      </View>
      <View style={styles.inputContainer}>
        <Ionicons name="mail" size={18} color={Colors.text.tertiary} />
        <TextInput
          style={styles.input}
          placeholder="Email (Optional)"
          placeholderTextColor={Colors.text.tertiary}
          value={customerEmail}
          onChangeText={setCustomerEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <FormPageSkeleton />
      </View>
    );
  }

  const displayName = store?.name || storeName || 'Fitness Center';
  const displayCashback = parseInt(cashback || '0') || store?.offers?.cashback || 15;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <LinearGradient
            colors={['#F97316', '#EA580C']}
            style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top : 16 }]}
          >
            <View style={styles.headerTop}>
              <Pressable style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={Colors.text.inverse} />
              </Pressable>
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle}>{displayName}</Text>
                <View style={styles.cashbackRow}>
                  <Ionicons name="gift" size={14} color={Colors.text.inverse} />
                  <Text style={styles.cashbackText}>{displayCashback}% Cashback</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Tabs */}
          {renderTabs()}

          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 180 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {activeTab === 'membership' && renderMembershipPlans()}
            {activeTab === 'classes' && renderClassBooking()}
            {activeTab === 'trainer' && renderTrainerBooking()}
            {activeTab === 'daypass' && renderDayPass()}
            {renderCustomerDetails()}
          </ScrollView>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.error} />
              <Text style={styles.errorText}>{errorMessage}</Text>
              <Pressable onPress={() => setErrorMessage('')}>
                <Ionicons name="close" size={18} color={Colors.error} />
              </Pressable>
            </View>
          ) : null}

          {/* Bottom Bar */}
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.priceSection}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalPrice}>{currencySymbol}{getTotalPrice().toLocaleString()}</Text>
              {getCashbackAmount() > 0 && (
                <Text style={styles.cashbackEarn}>
                  Earn {currencySymbol}{getCashbackAmount()} cashback
                </Text>
              )}
            </View>
            <Pressable
              style={styles.bookButton}
              onPress={handleBooking}
              disabled={submitting}
             
            >
              <LinearGradient
                colors={['#F97316', '#EA580C']}
                style={styles.bookButtonGradient}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={Colors.text.inverse} />
                ) : (
                  <>
                    <Text style={styles.bookButtonText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={20} color={Colors.text.inverse} />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </KeyboardAvoidingView>

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={handleSuccessClose}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
              </View>
              <Text style={styles.modalTitle}>Booking Confirmed!</Text>
              <Text style={styles.modalMessage}>
                {activeTab === 'membership'
                  ? `Your ${selectedPlan?.name} membership is confirmed.`
                  : activeTab === 'classes'
                  ? `You're booked for ${selectedClass?.name}.`
                  : activeTab === 'trainer'
                  ? 'Your trainer session is confirmed.'
                  : 'Your day pass is confirmed.'}
              </Text>
              <View style={styles.modalDetails}>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Amount Paid</Text>
                  <Text style={styles.modalDetailValue}>{currencySymbol}{getTotalPrice().toLocaleString()}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Cashback Earned</Text>
                  <Text style={[styles.modalDetailValue, { color: Colors.success }]}>
                    {currencySymbol}{getCashbackAmount()}
                  </Text>
                </View>
              </View>
              <Pressable style={styles.doneButton} onPress={handleSuccessClose}>
                <LinearGradient
                  colors={['#F97316', '#EA580C']}
                  style={styles.doneButtonGradient}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.secondary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background.primary },
  loadingText: { marginTop: Spacing.md, fontSize: Typography.body.fontSize, color: Colors.text.tertiary },

  header: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: BorderRadius.xl, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, marginLeft: Spacing.md },
  headerTitle: { fontSize: Typography.h4.fontSize, fontWeight: '700', color: Colors.text.inverse },
  cashbackRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
  cashbackText: { fontSize: Typography.bodySmall.fontSize, color: 'rgba(255,255,255,0.9)' },

  tabsContainer: { backgroundColor: Colors.background.primary, paddingVertical: Spacing.md, paddingHorizontal: Spacing.base, borderBottomWidth: 1, borderBottomColor: Colors.border.default },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.base, paddingVertical: 10, borderRadius: BorderRadius.xl, backgroundColor: Colors.background.secondary, marginRight: Spacing.sm },
  tabActive: { backgroundColor: '#F97316' },
  tabText: { fontSize: Typography.body.fontSize, fontWeight: '600', color: Colors.text.tertiary },
  tabTextActive: { color: Colors.text.inverse },

  content: { flex: 1 },
  section: { padding: Spacing.base },
  sectionTitle: { fontSize: Typography.bodyLarge.fontSize, fontWeight: '700', color: Colors.nileBlue, marginBottom: Spacing.md },

  // Membership Plans
  planCard: { backgroundColor: Colors.background.primary, borderRadius: BorderRadius.lg, padding: Spacing.base, marginBottom: Spacing.md, borderWidth: 2, borderColor: Colors.border.default, position: 'relative' },
  planCardSelected: { borderColor: '#F97316' },
  planCardPopular: { borderColor: Colors.brand.purple },
  popularBadge: { position: 'absolute', top: -1, right: 16, backgroundColor: Colors.brand.purple, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  popularBadgeText: { fontSize: Typography.overline.fontSize, fontWeight: '700', color: Colors.text.inverse },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  planName: { fontSize: Typography.h4.fontSize, fontWeight: '700', color: Colors.nileBlue },
  planDuration: { fontSize: Typography.bodySmall.fontSize, color: Colors.text.tertiary, marginTop: 2 },
  planPriceContainer: { alignItems: 'flex-end' },
  planOriginalPrice: { fontSize: Typography.bodySmall.fontSize, color: Colors.text.tertiary, textDecorationLine: 'line-through' },
  planPrice: { fontSize: 22, fontWeight: '700', color: '#F97316' },
  planFeatures: { borderTopWidth: 1, borderTopColor: Colors.border.default, paddingTop: Spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 6 },
  featureText: { fontSize: Typography.bodySmall.fontSize, color: Colors.text.tertiary, flex: 1 },
  selectedIndicator: { position: 'absolute', top: 16, left: 16 },

  // Date Selector
  dateScroll: { marginBottom: Spacing.sm },
  dateCard: { width: 60, height: 72, borderRadius: BorderRadius.md, backgroundColor: Colors.background.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm, borderWidth: 1.5, borderColor: Colors.border.default },
  dateCardSelected: { borderColor: '#F97316', backgroundColor: '#F97316' },
  dateDay: { fontSize: Typography.caption.fontSize, fontWeight: '500', color: Colors.text.tertiary, textTransform: 'uppercase' },
  dateNumber: { fontSize: Typography.h3.fontSize, fontWeight: '700', color: Colors.nileBlue, marginVertical: 2 },
  dateTextSelected: { color: Colors.text.inverse },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#F97316' },
  todayDotSelected: { backgroundColor: Colors.background.primary },

  // Class Booking
  classCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background.primary, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: 10, borderWidth: 1.5, borderColor: Colors.border.default },
  classCardSelected: { borderColor: '#F97316', backgroundColor: '#FFF7ED' },
  classCardFull: { opacity: 0.6 },
  classTime: { width: 70, alignItems: 'center', paddingRight: Spacing.md, borderRightWidth: 1, borderRightColor: Colors.border.default },
  classTimeText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '700', color: Colors.nileBlue },
  classDuration: { fontSize: Typography.caption.fontSize, color: Colors.text.tertiary, marginTop: 2 },
  classInfo: { flex: 1, paddingHorizontal: Spacing.md },
  className: { fontSize: Typography.body.fontSize, fontWeight: '600', color: Colors.nileBlue },
  classInstructor: { fontSize: Typography.bodySmall.fontSize, color: Colors.text.tertiary, marginTop: 2 },
  spotsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xs },
  spotsText: { fontSize: Typography.caption.fontSize, color: Colors.text.tertiary },
  spotsTextFull: { color: Colors.error },
  classPrice: { alignItems: 'center', gap: Spacing.xs },
  classPriceText: { fontSize: Typography.bodyLarge.fontSize, fontWeight: '700', color: '#F97316' },

  // Trainer Booking
  sessionTypeContainer: { flexDirection: 'row', gap: Spacing.sm },
  sessionOption: { flex: 1, backgroundColor: Colors.background.primary, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border.default, position: 'relative' },
  sessionOptionSelected: { borderColor: '#F97316', backgroundColor: '#FFF7ED' },
  saveBadge: { position: 'absolute', top: -8, right: 8, backgroundColor: Colors.success, paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.sm },
  saveBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.text.inverse },
  sessionLabel: { fontSize: Typography.bodySmall.fontSize, fontWeight: '600', color: Colors.text.tertiary, textAlign: 'center', marginBottom: Spacing.xs },
  sessionLabelSelected: { color: Colors.nileBlue },
  sessionPrice: { fontSize: Typography.bodyLarge.fontSize, fontWeight: '700', color: Colors.nileBlue },
  sessionPriceSelected: { color: '#F97316' },

  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  timeSlot: { width: (SCREEN_WIDTH - 48) / 4, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.background.primary, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border.default },
  timeSlotSelected: { borderColor: '#F97316', backgroundColor: '#FFF7ED' },
  timeSlotDisabled: { backgroundColor: Colors.background.secondary, opacity: 0.5 },
  timeSlotText: { fontSize: Typography.bodySmall.fontSize, fontWeight: '500', color: Colors.text.tertiary },
  timeSlotTextSelected: { color: '#F97316', fontWeight: '600' },
  timeSlotTextDisabled: { color: Colors.text.tertiary },

  // Day Pass
  dayPassCard: { backgroundColor: Colors.background.primary, borderRadius: BorderRadius.lg, padding: Spacing.base, borderWidth: 1.5, borderColor: Colors.border.default },
  dayPassHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.base },
  dayPassTitle: { fontSize: Typography.h4.fontSize, fontWeight: '700', color: Colors.nileBlue },
  dayPassSubtitle: { fontSize: Typography.bodySmall.fontSize, color: Colors.text.tertiary, marginTop: 2 },
  dayPassPrice: { fontSize: Typography.h4.fontSize, fontWeight: '700', color: '#F97316' },
  dayPassFeatures: { borderBottomWidth: 1, borderBottomColor: Colors.border.default, paddingBottom: Spacing.md, marginBottom: Spacing.base },
  quantitySelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quantityLabel: { fontSize: Typography.body.fontSize, fontWeight: '600', color: Colors.nileBlue },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  quantityButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background.secondary, justifyContent: 'center', alignItems: 'center' },
  quantityValue: { fontSize: Typography.h4.fontSize, fontWeight: '700', color: Colors.nileBlue, width: 30, textAlign: 'center' },

  // Customer Details
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background.primary, borderRadius: BorderRadius.md, paddingHorizontal: 14, borderWidth: 1.5, borderColor: Colors.border.default, marginBottom: Spacing.md },
  input: { flex: 1, height: 48, fontSize: Typography.body.fontSize, color: Colors.nileBlue, marginLeft: 10 },

  // Error Banner
  errorBanner: { position: 'absolute', top: 120, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.errorScale[100], borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.sm, zIndex: 100 },
  errorText: { flex: 1, fontSize: Typography.body.fontSize, color: Colors.error, fontWeight: '500' },

  // Bottom Bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: Spacing.base, backgroundColor: Colors.background.primary, borderTopWidth: 1, borderTopColor: Colors.border.default },
  priceSection: {},
  totalLabel: { fontSize: Typography.bodySmall.fontSize, color: Colors.text.tertiary },
  totalPrice: { fontSize: Typography.h3.fontSize, fontWeight: '700', color: Colors.nileBlue },
  cashbackEarn: { fontSize: Typography.caption.fontSize, color: Colors.success, fontWeight: '600' },
  bookButton: { borderRadius: BorderRadius['2xl'], overflow: 'hidden' },
  bookButtonGradient: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: 14 },
  bookButtonText: { fontSize: Typography.bodyLarge.fontSize, fontWeight: '700', color: Colors.text.inverse },

  // Success Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalContent: { backgroundColor: Colors.background.primary, borderRadius: BorderRadius['2xl'], padding: Spacing.xl, width: '100%', maxWidth: 340, alignItems: 'center' },
  successIcon: { marginBottom: Spacing.base },
  modalTitle: { fontSize: 22, fontWeight: '700', color: Colors.nileBlue, marginBottom: Spacing.sm },
  modalMessage: { fontSize: Typography.body.fontSize, color: Colors.text.tertiary, textAlign: 'center', marginBottom: Spacing.lg },
  modalDetails: { width: '100%', backgroundColor: Colors.background.secondary, borderRadius: BorderRadius.md, padding: Spacing.base, marginBottom: Spacing.lg },
  modalDetailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  modalDetailLabel: { fontSize: Typography.body.fontSize, color: Colors.text.tertiary },
  modalDetailValue: { fontSize: Typography.body.fontSize, fontWeight: '700', color: Colors.nileBlue },
  doneButton: { width: '100%', borderRadius: BorderRadius.md, overflow: 'hidden' },
  doneButtonGradient: { paddingVertical: 14, alignItems: 'center' },
  doneButtonText: { fontSize: Typography.bodyLarge.fontSize, fontWeight: '700', color: Colors.text.inverse },
});

export default FitnessBookingPage;

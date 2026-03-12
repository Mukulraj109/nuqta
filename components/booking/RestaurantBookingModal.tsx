import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import MenuPreOrderModal from './MenuPreOrderModal';
import type { MenuItem } from './MenuItemCard';
import { useRegion } from '@/contexts/RegionContext';

const { width } = Dimensions.get('window');

interface RestaurantBookingModalProps {
  visible: boolean;
  restaurant: RestaurantInfo;
  onClose: () => void;
  onConfirm: (booking: RestaurantBookingData) => void;
  loading?: boolean;
}

interface RestaurantInfo {
  id: string;
  name: string;
  image: string;
  address: string;
  cuisine: string[];
}

interface RestaurantBookingData {
  restaurantId: string;
  date: string;
  timeSlot: string;
  partySize: number;
  seatingPreference?: 'indoor' | 'outdoor' | 'window' | 'booth';
  occasion?: string;
  specialRequests?: string;
  menuItems?: any[];
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  tablesLeft?: number;
}

const QUICK_PARTY_SIZES = [2, 4, 6, 8];

const OCCASIONS = [
  { id: 'birthday', label: 'Birthday', icon: 'gift-outline' },
  { id: 'anniversary', label: 'Anniversary', icon: 'heart-outline' },
  { id: 'business', label: 'Business', icon: 'briefcase-outline' },
  { id: 'casual', label: 'Casual', icon: 'cafe-outline' },
];

const SEATING_PREFERENCES = [
  { id: 'indoor', label: 'Indoor', icon: 'home-outline' },
  { id: 'outdoor', label: 'Outdoor', icon: 'sunny-outline' },
  { id: 'window', label: 'Window Seat', icon: 'moon-outline' },
  { id: 'booth', label: 'Booth', icon: 'grid-outline' },
];

const RestaurantBookingModal: React.FC<RestaurantBookingModalProps> = ({
  visible,
  restaurant,
  onClose,
  onConfirm,
  loading = false,
}) => {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  const [currentStep, setCurrentStep] = useState(1);
  const [partySize, setPartySize] = useState(2);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [seatingPreference, setSeatingPreference] = useState<string>('');
  const [occasion, setOccasion] = useState<string>('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [wheelchairAccessible, setWheelchairAccessible] = useState(false);
  const [highChairNeeded, setHighChairNeeded] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showMenuModal, setShowMenuModal] = useState(false);

  const totalSteps = 6;

  // Generate next 30 days
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        id: date.toISOString().split('T')[0],
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString('en-US', { month: 'short' }),
      });
    }
    return dates;
  }, []);

  // Generate time slots based on selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];

    const slots: TimeSlot[] = [];

    // Breakfast slots
    for (let hour = 8; hour <= 11; hour++) {
      slots.push({
        id: `${hour}:00`,
        time: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
        available: Math.random() > 0.3,
        tablesLeft: Math.floor(Math.random() * 5) + 1,
      });
    }

    // Lunch slots
    for (let hour = 12; hour <= 15; hour++) {
      slots.push({
        id: `${hour}:00`,
        time: `${hour > 12 ? hour - 12 : hour}:00 PM`,
        available: Math.random() > 0.2,
        tablesLeft: Math.floor(Math.random() * 8) + 1,
      });
    }

    // Dinner slots
    for (let hour = 18; hour <= 22; hour++) {
      slots.push({
        id: `${hour}:00`,
        time: `${hour > 12 ? hour - 12 : hour}:00 PM`,
        available: Math.random() > 0.4,
        tablesLeft: Math.floor(Math.random() * 6) + 1,
      });
    }

    return slots;
  }, [selectedDate]);

  const handlePartySizeChange = (increment: boolean) => {
    if (increment) {
      setPartySize(Math.min(partySize + 1, 50));
    } else {
      setPartySize(Math.max(partySize - 1, 1));
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setPartySize(2);
    setSelectedDate('');
    setSelectedTimeSlot('');
    setSeatingPreference('');
    setOccasion('');
    setSpecialRequests('');
    setWheelchairAccessible(false);
    setHighChairNeeded(false);
    setMenuItems([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirm = () => {
    const bookingData: RestaurantBookingData = {
      restaurantId: restaurant.id,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      partySize,
      seatingPreference: seatingPreference as any,
      occasion,
      specialRequests: specialRequests || undefined,
      menuItems: menuItems.length > 0 ? menuItems : undefined,
    };
    onConfirm(bookingData);
    resetForm();
  };

  const handleAddMenuItems = (items: MenuItem[]) => {
    setMenuItems(items);
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return partySize >= 1;
      case 2:
        return selectedDate && selectedTimeSlot;
      case 3:
        return true; // Optional step
      case 4:
        return true; // Optional step
      case 5:
        return true; // Optional step
      case 6:
        return true; // Confirmation step
      default:
        return false;
    }
  };

  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index < currentStep && styles.progressDotActive,
            index === currentStep - 1 && styles.progressDotCurrent,
          ]}
        />
      ))}
    </View>
  );

  const renderPartyIcon = (size: number) => {
    const iconCount = Math.min(size, 8);
    return (
      <View style={styles.partyIconContainer}>
        {Array.from({ length: iconCount }).map((_, i) => (
          <Ionicons key={i} name="person" size={16} color="#7C3AED" />
        ))}
        {size > 8 && <Text style={styles.partyMoreText}>+{size - 8}</Text>}
      </View>
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How many people?</Text>
      <Text style={styles.stepSubtitle}>Select your party size</Text>

      <View style={styles.partySizeContainer}>
        <Pressable
          style={styles.partySizeButton}
          onPress={() => handlePartySizeChange(false)}
          disabled={partySize <= 1}
        >
          <Ionicons
            name="remove-circle"
            size={40}
            color={partySize <= 1 ? '#D1D5DB' : '#7C3AED'}
          />
        </Pressable>

        <View style={styles.partySizeDisplay}>
          {renderPartyIcon(partySize)}
          <Text style={styles.partySizeNumber}>{partySize}</Text>
          <Text style={styles.partySizeLabel}>
            {partySize === 1 ? 'Guest' : 'Guests'}
          </Text>
        </View>

        <Pressable
          style={styles.partySizeButton}
          onPress={() => handlePartySizeChange(true)}
          disabled={partySize >= 50}
        >
          <Ionicons
            name="add-circle"
            size={40}
            color={partySize >= 50 ? '#D1D5DB' : '#7C3AED'}
          />
        </Pressable>
      </View>

      <Text style={styles.quickSelectLabel}>Quick Select:</Text>
      <View style={styles.quickSelectContainer}>
        {QUICK_PARTY_SIZES.map((size) => (
          <Pressable
            key={size}
            style={[
              styles.quickSelectButton,
              partySize === size && styles.quickSelectButtonActive,
            ]}
            onPress={() => setPartySize(size)}
          >
            <Text
              style={[
                styles.quickSelectText,
                partySize === size && styles.quickSelectTextActive,
              ]}
            >
              {size}
            </Text>
          </Pressable>
        ))}
      </View>

      {partySize > 20 && (
        <View style={styles.largPartyNote}>
          <Ionicons name="information-circle" size={20} color="#F59E0B" />
          <Text style={styles.largePartyText}>
            Large party reservations may require confirmation. We'll contact you
            shortly.
          </Text>
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>When would you like to dine?</Text>
      <Text style={styles.stepSubtitle}>Select date and time</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScrollView}>
        {availableDates.map((dateObj) => (
          <Pressable
            key={dateObj.id}
            style={[
              styles.dateCard,
              selectedDate === dateObj.date && styles.dateCardActive,
            ]}
            onPress={() => {
              setSelectedDate(dateObj.date);
              setSelectedTimeSlot(''); // Reset time slot when date changes
            }}
          >
            <Text
              style={[
                styles.dateDayName,
                selectedDate === dateObj.date && styles.dateTextActive,
              ]}
            >
              {dateObj.dayName}
            </Text>
            <Text
              style={[
                styles.dateDayNumber,
                selectedDate === dateObj.date && styles.dateTextActive,
              ]}
            >
              {dateObj.dayNumber}
            </Text>
            <Text
              style={[
                styles.dateMonthName,
                selectedDate === dateObj.date && styles.dateTextActive,
              ]}
            >
              {dateObj.monthName}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {selectedDate && (
        <>
          <Text style={styles.timeSlotsHeader}>Available Time Slots:</Text>
          <ScrollView style={styles.timeSlotsContainer}>
            <View style={styles.timeSlotSection}>
              <Text style={styles.timeSlotSectionTitle}>Breakfast (8 AM - 11 AM)</Text>
              <View style={styles.timeSlotGrid}>
                {timeSlots.slice(0, 4).map((slot) => (
                  <Pressable
                    key={slot.id}
                    style={[
                      styles.timeSlotCard,
                      !slot.available && styles.timeSlotCardDisabled,
                      selectedTimeSlot === slot.id && styles.timeSlotCardActive,
                    ]}
                    onPress={() => slot.available && setSelectedTimeSlot(slot.id)}
                    disabled={!slot.available}
                  >
                    <Text
                      style={[
                        styles.timeSlotTime,
                        !slot.available && styles.timeSlotTextDisabled,
                        selectedTimeSlot === slot.id && styles.timeSlotTextActive,
                      ]}
                    >
                      {slot.time}
                    </Text>
                    {slot.available && slot.tablesLeft && slot.tablesLeft <= 3 && (
                      <Text style={styles.timeSlotTables}>
                        {slot.tablesLeft} left
                      </Text>
                    )}
                    {!slot.available && (
                      <Text style={styles.timeSlotFullText}>Full</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.timeSlotSection}>
              <Text style={styles.timeSlotSectionTitle}>Lunch (12 PM - 3 PM)</Text>
              <View style={styles.timeSlotGrid}>
                {timeSlots.slice(4, 8).map((slot) => (
                  <Pressable
                    key={slot.id}
                    style={[
                      styles.timeSlotCard,
                      !slot.available && styles.timeSlotCardDisabled,
                      selectedTimeSlot === slot.id && styles.timeSlotCardActive,
                    ]}
                    onPress={() => slot.available && setSelectedTimeSlot(slot.id)}
                    disabled={!slot.available}
                  >
                    <Text
                      style={[
                        styles.timeSlotTime,
                        !slot.available && styles.timeSlotTextDisabled,
                        selectedTimeSlot === slot.id && styles.timeSlotTextActive,
                      ]}
                    >
                      {slot.time}
                    </Text>
                    {slot.available && slot.tablesLeft && slot.tablesLeft <= 3 && (
                      <Text style={styles.timeSlotTables}>
                        {slot.tablesLeft} left
                      </Text>
                    )}
                    {!slot.available && (
                      <Text style={styles.timeSlotFullText}>Full</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.timeSlotSection}>
              <Text style={styles.timeSlotSectionTitle}>Dinner (6 PM - 10 PM)</Text>
              <View style={styles.timeSlotGrid}>
                {timeSlots.slice(8).map((slot) => (
                  <Pressable
                    key={slot.id}
                    style={[
                      styles.timeSlotCard,
                      !slot.available && styles.timeSlotCardDisabled,
                      selectedTimeSlot === slot.id && styles.timeSlotCardActive,
                    ]}
                    onPress={() => slot.available && setSelectedTimeSlot(slot.id)}
                    disabled={!slot.available}
                  >
                    <Text
                      style={[
                        styles.timeSlotTime,
                        !slot.available && styles.timeSlotTextDisabled,
                        selectedTimeSlot === slot.id && styles.timeSlotTextActive,
                      ]}
                    >
                      {slot.time}
                    </Text>
                    {slot.available && slot.tablesLeft && slot.tablesLeft <= 3 && (
                      <Text style={styles.timeSlotTables}>
                        {slot.tablesLeft} left
                      </Text>
                    )}
                    {!slot.available && (
                      <Text style={styles.timeSlotFullText}>Full</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
        </>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Seating Preferences</Text>
      <Text style={styles.stepSubtitle}>Optional - We'll try our best to accommodate</Text>

      <View style={styles.preferencesGrid}>
        {SEATING_PREFERENCES.map((pref) => (
          <Pressable
            key={pref.id}
            style={[
              styles.preferenceCard,
              seatingPreference === pref.id && styles.preferenceCardActive,
            ]}
            onPress={() =>
              setSeatingPreference(seatingPreference === pref.id ? '' : pref.id)
            }
          >
            <Ionicons
              name={pref.icon as any}
              size={32}
              color={seatingPreference === pref.id ? '#7C3AED' : '#6B7280'}
            />
            <Text
              style={[
                styles.preferenceLabel,
                seatingPreference === pref.id && styles.preferenceLabelActive,
              ]}
            >
              {pref.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.accessibilitySection}>
        <Text style={styles.accessibilityTitle}>Additional Requirements</Text>

        <Pressable
          style={styles.checkboxRow}
          onPress={() => setWheelchairAccessible(!wheelchairAccessible)}
        >
          <View
            style={[
              styles.checkbox,
              wheelchairAccessible && styles.checkboxActive,
            ]}
          >
            {wheelchairAccessible && (
              <Ionicons name="checkmark" size={18} color="#FFF" />
            )}
          </View>
          <Text style={styles.checkboxLabel}>Wheelchair Accessible</Text>
        </Pressable>

        <Pressable
          style={styles.checkboxRow}
          onPress={() => setHighChairNeeded(!highChairNeeded)}
        >
          <View
            style={[styles.checkbox, highChairNeeded && styles.checkboxActive]}
          >
            {highChairNeeded && (
              <Ionicons name="checkmark" size={18} color="#FFF" />
            )}
          </View>
          <Text style={styles.checkboxLabel}>High Chair Needed</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Special Occasion?</Text>
      <Text style={styles.stepSubtitle}>
        Optional - Let us make your celebration special
      </Text>

      <View style={styles.occasionsGrid}>
        {OCCASIONS.map((occ) => (
          <Pressable
            key={occ.id}
            style={[
              styles.occasionCard,
              occasion === occ.id && styles.occasionCardActive,
            ]}
            onPress={() => setOccasion(occasion === occ.id ? '' : occ.id)}
          >
            <Ionicons
              name={occ.icon as any}
              size={28}
              color={occasion === occ.id ? '#7C3AED' : '#6B7280'}
            />
            <Text
              style={[
                styles.occasionLabel,
                occasion === occ.id && styles.occasionLabelActive,
              ]}
            >
              {occ.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.specialRequestsSection}>
        <Text style={styles.specialRequestsLabel}>Special Requests</Text>
        <TextInput
          style={styles.specialRequestsInput}
          placeholder="Any dietary restrictions, allergies, or special requests..."
          placeholderTextColor="#9CA3AF"
          value={specialRequests}
          onChangeText={setSpecialRequests}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.specialRequestsHint}>
          e.g., "Vegetarian options", "Nut allergy", "Surprise dessert"
        </Text>
      </View>
    </View>
  );

  const renderStep5 = () => {
    const totalMenuItems = menuItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalMenuAmount = menuItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Pre-order Menu Items</Text>
        <Text style={styles.stepSubtitle}>Optional - Save time at the restaurant</Text>

        {menuItems.length > 0 ? (
          <>
            <View style={styles.menuSummaryCard}>
              <View style={styles.menuSummaryHeader}>
                <Ionicons name="restaurant" size={24} color="#7C3AED" />
                <Text style={styles.menuSummaryTitle}>
                  {totalMenuItems} item{totalMenuItems !== 1 ? 's' : ''} selected
                </Text>
              </View>

              <ScrollView style={styles.menuItemsList} showsVerticalScrollIndicator={false}>
                {menuItems.map((item) => (
                  <View key={item.id} style={styles.menuSummaryItem}>
                    <View style={styles.menuItemInfo}>
                      <View style={styles.menuItemHeader}>
                        <View style={[styles.vegIndicatorSmall, item.isVeg ? styles.veg : styles.nonVeg]}>
                          <View style={[styles.vegDotSmall, item.isVeg ? styles.vegDot : styles.nonVegDot]} />
                        </View>
                        <Text style={styles.menuItemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
                      <Text style={styles.menuItemQuantity}>Qty: {item.quantity}</Text>
                    </View>
                    <Text style={styles.menuItemPrice}>{currencySymbol}{item.price * item.quantity}</Text>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.menuTotalRow}>
                <Text style={styles.menuTotalLabel}>Total Amount</Text>
                <Text style={styles.menuTotalAmount}>{currencySymbol}{totalMenuAmount}</Text>
              </View>

              <Pressable
                style={styles.editMenuButton}
                onPress={() => setShowMenuModal(true)}
              >
                <Ionicons name="create-outline" size={20} color="#7C3AED" />
                <Text style={styles.editMenuButtonText}>Edit Menu Selection</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.menuEmptyState}>
            <Ionicons name="restaurant-outline" size={64} color="#D1D5DB" />
            <Text style={styles.menuEmptyTitle}>No items selected</Text>
            <Text style={styles.menuEmptyText}>
              Browse the menu and pre-order your favorite dishes to save time at the restaurant.
            </Text>
            <Pressable
              style={styles.browseMenuButton}
              onPress={() => setShowMenuModal(true)}
            >
              <Ionicons name="book-outline" size={20} color="#FFF" />
              <Text style={styles.browseMenuButtonText}>Browse Menu & Pre-order</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  const renderStep6 = () => {
    const selectedDateObj = availableDates.find((d) => d.date === selectedDate);
    const selectedTimeObj = timeSlots.find((t) => t.id === selectedTimeSlot);
    const selectedSeatingObj = SEATING_PREFERENCES.find(
      (p) => p.id === seatingPreference
    );
    const selectedOccasionObj = OCCASIONS.find((o) => o.id === occasion);

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Confirm Your Reservation</Text>
        <Text style={styles.stepSubtitle}>Please review your booking details</Text>

        <View style={styles.confirmationCard}>
          <CachedImage
            source={restaurant.image}
            style={styles.confirmationImage}
          />
          <View style={styles.confirmationDetails}>
            <Text style={styles.confirmationRestaurantName}>{restaurant.name}</Text>
            <Text style={styles.confirmationAddress}>{restaurant.address}</Text>
            <View style={styles.confirmationCuisine}>
              {restaurant.cuisine.map((c, i) => (
                <Text key={i} style={styles.confirmationCuisineText}>
                  {c}
                  {i < restaurant.cuisine.length - 1 ? ' • ' : ''}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="calendar-outline" size={20} color="#7C3AED" />
            </View>
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>
                {selectedDateObj?.dayName}, {selectedDateObj?.monthName}{' '}
                {selectedDateObj?.dayNumber}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="time-outline" size={20} color="#7C3AED" />
            </View>
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryLabel}>Time</Text>
              <Text style={styles.summaryValue}>{selectedTimeObj?.time}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="people-outline" size={20} color="#7C3AED" />
            </View>
            <View style={styles.summaryTextContainer}>
              <Text style={styles.summaryLabel}>Party Size</Text>
              <Text style={styles.summaryValue}>
                {partySize} {partySize === 1 ? 'Guest' : 'Guests'}
              </Text>
            </View>
          </View>

          {seatingPreference && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryIconContainer}>
                <Ionicons
                  name={
                    SEATING_PREFERENCES.find((p) => p.id === seatingPreference)
                      ?.icon as any
                  }
                  size={20}
                  color="#7C3AED"
                />
              </View>
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryLabel}>Seating</Text>
                <Text style={styles.summaryValue}>
                  {selectedSeatingObj?.label}
                </Text>
              </View>
            </View>
          )}

          {occasion && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryIconContainer}>
                <Ionicons
                  name={OCCASIONS.find((o) => o.id === occasion)?.icon as any}
                  size={20}
                  color="#7C3AED"
                />
              </View>
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryLabel}>Occasion</Text>
                <Text style={styles.summaryValue}>
                  {selectedOccasionObj?.label}
                </Text>
              </View>
            </View>
          )}

          {specialRequests && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="document-text-outline" size={20} color="#7C3AED" />
              </View>
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryLabel}>Special Requests</Text>
                <Text style={styles.summaryValue}>{specialRequests}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.policySection}>
          <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
          <Text style={styles.policyText}>
            Cancellation Policy: Free cancellation up to 2 hours before reservation
            time. No-shows may incur a fee.
          </Text>
        </View>
      </View>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      default:
        return null;
    }
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={handleClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#1F2937" />
            </Pressable>
            <Text style={styles.headerTitle}>Table Reservation</Text>
            <View style={styles.headerSpacer} />
          </View>

          {renderProgressIndicator()}

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {renderStepContent()}
          </ScrollView>

          <View style={styles.footer}>
            {currentStep > 1 && (
              <Pressable
                style={styles.backButton}
                onPress={handleBack}
                disabled={loading}
              >
                <Ionicons name="arrow-back" size={20} color="#7C3AED" />
                <Text style={styles.backButtonText}>Back</Text>
              </Pressable>
            )}

            {currentStep < totalSteps ? (
              <Pressable
                style={[
                  styles.nextButton,
                  currentStep === 1 && styles.nextButtonFull,
                  !canProceedToNextStep() && styles.nextButtonDisabled,
                ]}
                onPress={handleNext}
                disabled={!canProceedToNextStep() || loading}
              >
                <Text style={styles.nextButtonText}>
                  {currentStep === 3 || currentStep === 4 || currentStep === 5
                    ? 'Skip'
                    : 'Next'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" />
              </Pressable>
            ) : (
              <Pressable
                style={[
                  styles.confirmButton,
                  currentStep === 1 && styles.nextButtonFull,
                  loading && styles.confirmButtonDisabled,
                ]}
                onPress={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.confirmButtonText}>Confirming...</Text>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <Text style={styles.confirmButtonText}>Confirm Reservation</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      <MenuPreOrderModal
        visible={showMenuModal}
        restaurant={restaurant}
        onClose={() => setShowMenuModal(false)}
        onAddItems={handleAddMenuItems}
        initialItems={menuItems}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 36,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFF',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: {
    backgroundColor: '#7C3AED',
  },
  progressDotCurrent: {
    width: 24,
    backgroundColor: '#7C3AED',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  partySizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  partySizeButton: {
    padding: 8,
  },
  partySizeDisplay: {
    alignItems: 'center',
  },
  partyIconContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    maxWidth: 120,
  },
  partyMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
    marginLeft: 4,
  },
  partySizeNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 4,
  },
  partySizeLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  quickSelectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  quickSelectContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quickSelectButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  quickSelectButtonActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3E8FF',
  },
  quickSelectText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  quickSelectTextActive: {
    color: '#7C3AED',
  },
  largPartyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  largePartyText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
  },
  dateScrollView: {
    marginBottom: 24,
  },
  dateCard: {
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: 80,
  },
  dateCardActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3E8FF',
  },
  dateDayName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  dateDayNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  dateMonthName: {
    fontSize: 12,
    color: '#6B7280',
  },
  dateTextActive: {
    color: '#7C3AED',
  },
  timeSlotsHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  timeSlotsContainer: {
    maxHeight: 400,
  },
  timeSlotSection: {
    marginBottom: 24,
  },
  timeSlotSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlotCard: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: (width - 60) / 3,
    alignItems: 'center',
  },
  timeSlotCardActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3E8FF',
  },
  timeSlotCardDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  timeSlotTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  timeSlotTextActive: {
    color: '#7C3AED',
  },
  timeSlotTextDisabled: {
    color: '#9CA3AF',
  },
  timeSlotTables: {
    fontSize: 11,
    color: '#F59E0B',
  },
  timeSlotFullText: {
    fontSize: 11,
    color: '#EF4444',
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  preferenceCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    width: (width - 60) / 2,
  },
  preferenceCardActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3E8FF',
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  preferenceLabelActive: {
    color: '#7C3AED',
  },
  accessibilitySection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
  },
  accessibilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#374151',
  },
  occasionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  occasionCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    width: (width - 60) / 2,
  },
  occasionCardActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3E8FF',
  },
  occasionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 8,
  },
  occasionLabelActive: {
    color: '#7C3AED',
  },
  specialRequestsSection: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
  },
  specialRequestsLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  specialRequestsInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  specialRequestsHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  placeholderContainer: {
    backgroundColor: '#FFF',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  placeholderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
  },
  placeholderButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  confirmationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  confirmationImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  confirmationDetails: {
    padding: 16,
  },
  confirmationRestaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  confirmationAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  confirmationCuisine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  confirmationCuisineText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '500',
  },
  summarySection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryIconContainer: {
    width: 40,
    alignItems: 'center',
    paddingTop: 2,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  policySection: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  policyText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7C3AED',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  // Menu Pre-order Styles
  menuSummaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
  },
  menuSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  menuSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  menuItemsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  menuSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 8,
  },
  menuItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  menuItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vegIndicatorSmall: {
    width: 14,
    height: 14,
    borderRadius: 2,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  vegDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  menuItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  menuItemQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  menuItemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7C3AED',
  },
  menuTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#E5E7EB',
    marginBottom: 16,
  },
  menuTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  menuTotalAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#7C3AED',
  },
  editMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#7C3AED',
    gap: 8,
  },
  editMenuButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7C3AED',
  },
  menuEmptyState: {
    backgroundColor: '#FFF',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  menuEmptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  menuEmptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  browseMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  browseMenuButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default RestaurantBookingModal;

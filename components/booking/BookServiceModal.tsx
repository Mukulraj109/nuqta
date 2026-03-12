import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { Ionicons } from '@expo/vector-icons';
import { useRegion } from '@/contexts/RegionContext';

const { width, height } = Dimensions.get('window');

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  description?: string;
}

interface BookingData {
  serviceId: string;
  date: string; // ISO date
  timeSlot: string; // "09:00"
  staffId?: string;
  notes?: string;
}

interface BookServiceModalProps {
  visible: boolean;
  service: ServiceItem;
  onClose: () => void;
  onConfirm: (booking: BookingData) => void;
  loading?: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  photo?: string;
  rating: number;
  specialization?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const BookServiceModal: React.FC<BookServiceModalProps> = ({
  visible,
  service,
  onClose,
  onConfirm,
  loading = false,
}) => {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [slideAnim] = useState(new Animated.Value(0));

  const totalSteps = 5;

  // Generate next 30 days
  const availableDates = useMemo(() => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  // Generate time slots (9 AM - 8 PM, 30-min intervals)
  const generateTimeSlots = useMemo((): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 20;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // Mock availability - randomly mark some as unavailable
        const isAvailable = Math.random() > 0.3;

        slots.push({
          time: timeString,
          available: isAvailable,
        });
      }
    }
    return slots;
  }, []);

  // Mock staff data
  const staffMembers: StaffMember[] = useMemo(() => [
    {
      id: 'any',
      name: 'Any Available Staff',
      rating: 0,
      specialization: 'Auto-assign best available',
    },
    {
      id: '1',
      name: 'Sarah Johnson',
      photo: 'https://i.pravatar.cc/150?img=1',
      rating: 4.8,
      specialization: 'Hair Specialist',
    },
    {
      id: '2',
      name: 'Michael Chen',
      photo: 'https://i.pravatar.cc/150?img=2',
      rating: 4.9,
      specialization: 'Spa Therapist',
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      photo: 'https://i.pravatar.cc/150?img=3',
      rating: 4.7,
      specialization: 'Beauty Expert',
    },
    {
      id: '4',
      name: 'David Kumar',
      photo: 'https://i.pravatar.cc/150?img=4',
      rating: 4.9,
      specialization: 'Senior Stylist',
    },
  ], []);

  // Group time slots by period
  const groupedTimeSlots = useMemo(() => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    generateTimeSlots.forEach((slot) => {
      const hour = parseInt(slot.time.split(':')[0]);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 17) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  }, [generateTimeSlots]);

  const formatDate = (date: Date): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSameDate = (date1: Date, date2: Date): boolean => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const animateStep = (direction: 'next' | 'back') => {
    Animated.timing(slideAnim, {
      toValue: direction === 'next' ? -width : width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      slideAnim.setValue(0);
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      animateStep('next');
      setCurrentStep(currentStep + 1);
    } else {
      handleConfirm();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      animateStep('back');
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirm = () => {
    if (!selectedDate || !selectedTimeSlot) return;

    const bookingData: BookingData = {
      serviceId: service.id,
      date: selectedDate.toISOString(),
      timeSlot: selectedTimeSlot,
      staffId: selectedStaff || undefined,
      notes: notes || undefined,
    };

    onConfirm(bookingData);
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return true; // Service is pre-selected
      case 2:
        return selectedDate !== null;
      case 3:
        return selectedTimeSlot !== null;
      case 4:
        return true; // Staff selection is optional
      case 5:
        return true; // Confirmation step
      default:
        return false;
    }
  };

  const resetModal = () => {
    setCurrentStep(1);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setSelectedStaff(null);
    setNotes('');
    onClose();
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        {[...Array(totalSteps)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressSegment,
              index < currentStep && styles.progressSegmentActive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.progressText}>
        Step {currentStep} of {totalSteps}
      </Text>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Selected Service</Text>
      <View style={styles.serviceCard}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          {service.description && (
            <Text style={styles.serviceDescription}>{service.description}</Text>
          )}
          <View style={styles.serviceDetails}>
            <View style={styles.serviceDetailItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.serviceDetailText}>{service.duration} min</Text>
            </View>
            <View style={styles.serviceDetailItem}>
              <Ionicons name="cash-outline" size={16} color="#666" />
              <Text style={styles.serviceDetailText}>{currencySymbol}{service.price}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Date</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateScroll}
        contentContainerStyle={styles.dateScrollContent}
      >
        {availableDates.map((date, index) => {
          const selected = selectedDate && isSameDate(date, selectedDate);
          const today = isToday(date);

          return (
            <Pressable
              key={index}
              style={[
                styles.dateCard,
                selected && styles.dateCardSelected,
                today && !selected && styles.dateCardToday,
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text
                style={[
                  styles.dateDayName,
                  selected && styles.dateTextSelected,
                  today && !selected && styles.dateTextToday,
                ]}
              >
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text
                style={[
                  styles.dateDay,
                  selected && styles.dateTextSelected,
                  today && !selected && styles.dateTextToday,
                ]}
              >
                {date.getDate()}
              </Text>
              <Text
                style={[
                  styles.dateMonth,
                  selected && styles.dateTextSelected,
                  today && !selected && styles.dateTextToday,
                ]}
              >
                {date.toLocaleDateString('en-US', { month: 'short' })}
              </Text>
              {today && (
                <Text
                  style={[
                    styles.todayLabel,
                    selected && styles.todayLabelSelected,
                  ]}
                >
                  Today
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderTimeSlotSection = (title: string, slots: TimeSlot[]) => (
    <View style={styles.timeSection}>
      <Text style={styles.timeSectionTitle}>{title}</Text>
      <View style={styles.timeGrid}>
        {slots.map((slot, index) => {
          const selected = selectedTimeSlot === slot.time;
          return (
            <Pressable
              key={index}
              style={[
                styles.timeSlot,
                !slot.available && styles.timeSlotUnavailable,
                selected && styles.timeSlotSelected,
              ]}
              onPress={() => slot.available && setSelectedTimeSlot(slot.time)}
              disabled={!slot.available}
            >
              <Text
                style={[
                  styles.timeSlotText,
                  !slot.available && styles.timeSlotTextUnavailable,
                  selected && styles.timeSlotTextSelected,
                ]}
              >
                {slot.time}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Time Slot</Text>
      <Text style={styles.stepSubtitle}>
        {selectedDate ? formatDate(selectedDate) : 'No date selected'}
      </Text>
      <ScrollView
        style={styles.timeSlotsContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderTimeSlotSection('Morning', groupedTimeSlots.morning)}
        {renderTimeSlotSection('Afternoon', groupedTimeSlots.afternoon)}
        {renderTimeSlotSection('Evening', groupedTimeSlots.evening)}

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotAvailable]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotUnavailable]} />
            <Text style={styles.legendText}>Booked</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendDotSelected]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Staff (Optional)</Text>
      <Text style={styles.stepSubtitle}>Choose your preferred staff member</Text>
      <ScrollView
        style={styles.staffContainer}
        showsVerticalScrollIndicator={false}
      >
        {staffMembers.map((staff) => {
          const selected = selectedStaff === staff.id;
          const isAny = staff.id === 'any';

          return (
            <Pressable
              key={staff.id}
              style={[
                styles.staffCard,
                selected && styles.staffCardSelected,
              ]}
              onPress={() => setSelectedStaff(staff.id)}
            >
              <View style={styles.staffCardContent}>
                {isAny ? (
                  <View style={styles.staffPhotoPlaceholder}>
                    <Ionicons name="people" size={32} color="#7C3AED" />
                  </View>
                ) : (
                  <CachedImage
                    source={staff.photo}
                    style={styles.staffPhoto}
                  />
                )}
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>{staff.name}</Text>
                  {staff.specialization && (
                    <Text style={styles.staffSpecialization}>
                      {staff.specialization}
                    </Text>
                  )}
                  {!isAny && (
                    <View style={styles.staffRating}>
                      <Ionicons name="star" size={14} color="#FFC107" />
                      <Text style={styles.staffRatingText}>{staff.rating}</Text>
                    </View>
                  )}
                </View>
                {selected && (
                  <Ionicons name="checkmark-circle" size={24} color="#7C3AED" />
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderStep5 = () => {
    const selectedStaffMember = staffMembers.find((s) => s.id === selectedStaff);

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Booking Summary</Text>
        <ScrollView
          style={styles.summaryContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summarySection}>
            <Text style={styles.summarySectionTitle}>Service</Text>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Name:</Text>
              <Text style={styles.summaryValue}>{service.name}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Duration:</Text>
              <Text style={styles.summaryValue}>{service.duration} minutes</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Price:</Text>
              <Text style={styles.summaryValuePrice}>{currencySymbol}{service.price}</Text>
            </View>
          </View>

          <View style={styles.summarySection}>
            <Text style={styles.summarySectionTitle}>Date & Time</Text>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>
                {selectedDate ? formatDate(selectedDate) : 'Not selected'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Time:</Text>
              <Text style={styles.summaryValue}>
                {selectedTimeSlot || 'Not selected'}
              </Text>
            </View>
          </View>

          {selectedStaffMember && (
            <View style={styles.summarySection}>
              <Text style={styles.summarySectionTitle}>Staff Member</Text>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Name:</Text>
                <Text style={styles.summaryValue}>{selectedStaffMember.name}</Text>
              </View>
              {selectedStaffMember.specialization && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Specialization:</Text>
                  <Text style={styles.summaryValue}>
                    {selectedStaffMember.specialization}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.summarySection}>
            <Text style={styles.summarySectionTitle}>Additional Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any special requests or notes..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderCurrentStep = () => {
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
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={resetModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={resetModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
            <Text style={styles.headerTitle}>Book Appointment</Text>
            <View style={styles.closeButton} />
          </View>

          {/* Progress Bar */}
          {renderProgressBar()}

          {/* Step Content */}
          <Animated.View
            style={[
              styles.content,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            {renderCurrentStep()}
          </Animated.View>

          {/* Footer Navigation */}
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
            <View style={styles.footerSpacer} />
            <Pressable
              style={[
                styles.nextButton,
                !canProceed() && styles.nextButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={!canProceed() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {currentStep === totalSteps ? 'Confirm Booking' : 'Next'}
                  </Text>
                  {currentStep < totalSteps && (
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  )}
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.85,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 4,
    width: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: '#7C3AED',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },

  // Step 1: Service Selection
  serviceCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  serviceInfo: {
    gap: 8,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  serviceDetails: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  serviceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceDetailText: {
    fontSize: 14,
    color: '#666',
  },

  // Step 2: Date Selection
  dateScroll: {
    flexGrow: 0,
  },
  dateScrollContent: {
    gap: 12,
    paddingRight: 20,
  },
  dateCard: {
    width: 70,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateCardToday: {
    borderColor: '#7C3AED',
    backgroundColor: '#F3E8FF',
  },
  dateCardSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  dateDayName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  dateMonth: {
    fontSize: 12,
    color: '#666',
  },
  dateTextToday: {
    color: '#7C3AED',
  },
  dateTextSelected: {
    color: '#fff',
  },
  todayLabel: {
    fontSize: 10,
    color: '#7C3AED',
    marginTop: 4,
    fontWeight: '600',
  },
  todayLabelSelected: {
    color: '#fff',
  },

  // Step 3: Time Slot Selection
  timeSlotsContainer: {
    flex: 1,
  },
  timeSection: {
    marginBottom: 24,
  },
  timeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    width: (width - 60) / 3,
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  timeSlotUnavailable: {
    backgroundColor: '#f0f0f0',
    borderColor: '#e0e0e0',
  },
  timeSlotSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  timeSlotTextUnavailable: {
    color: '#999',
  },
  timeSlotTextSelected: {
    color: '#fff',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendDotAvailable: {
    backgroundColor: '#F3E8FF',
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  legendDotUnavailable: {
    backgroundColor: '#f0f0f0',
  },
  legendDotSelected: {
    backgroundColor: '#7C3AED',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },

  // Step 4: Staff Selection
  staffContainer: {
    flex: 1,
  },
  staffCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  staffCardSelected: {
    backgroundColor: '#F3E8FF',
    borderColor: '#7C3AED',
  },
  staffCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  staffPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e0e0',
  },
  staffPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffInfo: {
    flex: 1,
    gap: 4,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  staffSpecialization: {
    fontSize: 13,
    color: '#666',
  },
  staffRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  staffRatingText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },

  // Step 5: Confirmation
  summaryContainer: {
    flex: 1,
  },
  summarySection: {
    marginBottom: 24,
  },
  summarySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  summaryValuePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7C3AED',
  },
  notesInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  footerSpacer: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7C3AED',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C3AED',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default BookServiceModal;

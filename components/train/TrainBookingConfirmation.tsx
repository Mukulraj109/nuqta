/**
 * Train Booking Confirmation - Displays booking success and details
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

interface TrainDetails {
  id: string;
  name: string;
  route: {
    from: string;
    to: string;
    fromStation?: string;
    toStation?: string;
  };
  trainNumber?: string;
  trainType?: string;
  departureTime?: string;
  arrivalTime?: string;
}

interface BookingData {
  travelDate: Date;
  returnDate?: Date;
  tripType: 'one-way' | 'round-trip';
  passengers: {
    adults: number;
    children: number;
  };
  trainClass: 'sleeper' | 'ac3' | 'ac2' | 'ac1';
  selectedExtras: {
    meals?: boolean;
    bedding?: boolean;
    insurance?: boolean;
  };
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
  bookingId?: string;
  bookingNumber?: string;
}

interface TrainBookingConfirmationProps {
  train: TrainDetails;
  bookingData: BookingData;
  onClose: () => void;
}

const TrainBookingConfirmation: React.FC<TrainBookingConfirmationProps> = ({
  train,
  bookingData,
  onClose,
}) => {
  const router = useRouter();
  const bookingNumber = bookingData.bookingNumber || 'N/A';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#111827" />
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#22C55E" />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your train ticket has been confirmed
          </Text>
        </View>

        {/* Booking Number */}
        <View style={styles.bookingNumberCard}>
          <Text style={styles.bookingNumberLabel}>Booking Number</Text>
          <Text style={styles.bookingNumber}>{bookingNumber}</Text>
          <Text style={styles.bookingNote}>
            Please save this number for your records
          </Text>
        </View>

        {/* Booking Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="train" size={24} color="#22C55E" />
            <Text style={styles.cardTitle}>Booking Details</Text>
          </View>

          {/* Train Name */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Train</Text>
            <Text style={styles.detailValue}>{train.name}</Text>
          </View>

          {/* Route */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Route</Text>
            <Text style={styles.detailValue}>
              {train.route.from} → {train.route.to}
            </Text>
          </View>

          {/* Stations */}
          {train.route.fromStation && train.route.toStation && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Stations</Text>
              <View>
                <Text style={styles.detailValue}>{train.route.fromStation}</Text>
                <Text style={styles.detailSubtext}>to {train.route.toStation}</Text>
              </View>
            </View>
          )}

          {/* Travel Date */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Travel Date</Text>
            <View>
              <Text style={styles.detailValue}>
                {bookingData.travelDate.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.detailSubtext}>Departure: {train.departureTime || '08:00'}</Text>
            </View>
          </View>

          {/* Return Date (if round-trip) */}
          {bookingData.returnDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Return Date</Text>
              <View>
                <Text style={styles.detailValue}>
                  {bookingData.returnDate.toLocaleDateString('en-IN', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.detailSubtext}>Departure: {train.departureTime || '08:00'}</Text>
              </View>
            </View>
          )}

          {/* Passengers */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Passengers</Text>
            <Text style={styles.detailValue}>
              {bookingData.passengers.adults} Adult(s)
              {bookingData.passengers.children > 0 && `, ${bookingData.passengers.children} Child(ren)`}
            </Text>
          </View>

          {/* Class */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Class</Text>
            <Text style={styles.detailValue}>
              {bookingData.trainClass.toUpperCase()}
            </Text>
          </View>

          {/* Extras */}
          {Object.entries(bookingData.selectedExtras).some(([_, value]) => value) && (
            <View style={styles.extrasSection}>
              <Text style={styles.extrasTitle}>Extras</Text>
              {bookingData.selectedExtras.meals && (
                <View style={styles.extraItem}>
                  <Ionicons name="restaurant" size={16} color="#22C55E" />
                  <Text style={styles.extraText}>Meals</Text>
                </View>
              )}
              {bookingData.selectedExtras.bedding && (
                <View style={styles.extraItem}>
                  <Ionicons name="bed" size={16} color="#22C55E" />
                  <Text style={styles.extraText}>Bedding</Text>
                </View>
              )}
              {bookingData.selectedExtras.insurance && (
                <View style={styles.extraItem}>
                  <Ionicons name="shield-checkmark" size={16} color="#22C55E" />
                  <Text style={styles.extraText}>Travel Insurance</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Contact Info Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={24} color="#22C55E" />
            <Text style={styles.cardTitle}>Contact Information</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue}>{bookingData.contactInfo.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{bookingData.contactInfo.email}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{bookingData.contactInfo.phone}</Text>
          </View>
        </View>

        {/* Important Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            A confirmation email has been sent to {bookingData.contactInfo.email}. 
            Please arrive at the station 30 minutes before departure. Keep your booking number handy.
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <Pressable
          style={styles.viewBookingsButton}
          onPress={() => {
            onClose();
            router.push('/my-bookings' as any);
          }}
        >
          <Text style={styles.viewBookingsButtonText}>View Bookings</Text>
        </Pressable>
        <Pressable
          style={styles.primaryButton}
          onPress={onClose}
        >
          <LinearGradient
            colors={['#22C55E', '#16A34A']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.primaryButtonText}>Done</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  successContainer: {
    alignItems: 'center',
    padding: 32,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  bookingNumberCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#22C55E',
    alignItems: 'center',
  },
  bookingNumberLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  bookingNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22C55E',
    marginBottom: 8,
    letterSpacing: 2,
  },
  bookingNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  detailsCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  detailSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
  },
  extrasSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  extrasTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  extraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  extraText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    margin: 20,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default React.memo(TrainBookingConfirmation);

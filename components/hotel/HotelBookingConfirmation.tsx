/**
 * Hotel Booking Confirmation - Displays booking success and details
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

interface HotelDetails {
  id: string;
  name: string;
  location: {
    city: string;
    address?: string;
  };
  checkInTime: string;
  checkOutTime: string;
}

interface BookingData {
  checkInDate: Date;
  checkOutDate: Date;
  rooms: number;
  guests: {
    adults: number;
    children: number;
  };
  roomType: 'standard' | 'deluxe' | 'suite';
  selectedExtras: {
    breakfast?: boolean;
    wifi?: boolean;
    parking?: boolean;
    lateCheckout?: boolean;
  };
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
  bookingId?: string;
  bookingNumber?: string;
}

interface HotelBookingConfirmationProps {
  hotel: HotelDetails;
  bookingData: BookingData;
  onClose: () => void;
}

const HotelBookingConfirmation: React.FC<HotelBookingConfirmationProps> = ({
  hotel,
  bookingData,
  onClose,
}) => {
  const calculateNights = () => {
    const diffTime = bookingData.checkOutDate.getTime() - bookingData.checkInDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const nights = calculateNights();

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
            Your hotel reservation has been confirmed
          </Text>
        </View>

        {/* Booking Number */}
        {bookingData.bookingNumber && (
          <View style={styles.bookingNumberCard}>
            <Text style={styles.bookingNumberLabel}>Booking Number</Text>
            <Text style={styles.bookingNumber}>{bookingData.bookingNumber}</Text>
            <Text style={styles.bookingNote}>
              Please save this number for your records
            </Text>
          </View>
        )}

        {/* Booking Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="bed" size={24} color="#EC4899" />
            <Text style={styles.cardTitle}>Booking Details</Text>
          </View>

          {/* Hotel Name */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hotel</Text>
            <Text style={styles.detailValue}>{hotel.name}</Text>
          </View>

          {/* Location */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>
              {hotel.location.address || hotel.location.city}
            </Text>
          </View>

          {/* Check-in */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Check-in</Text>
            <View>
              <Text style={styles.detailValue}>
                {bookingData.checkInDate.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.detailSubtext}>{hotel.checkInTime}</Text>
            </View>
          </View>

          {/* Check-out */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Check-out</Text>
            <View>
              <Text style={styles.detailValue}>
                {bookingData.checkOutDate.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.detailSubtext}>{hotel.checkOutTime}</Text>
            </View>
          </View>

          {/* Nights */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>
              {nights} {nights === 1 ? 'Night' : 'Nights'}
            </Text>
          </View>

          {/* Rooms */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rooms</Text>
            <Text style={styles.detailValue}>
              {bookingData.rooms} {bookingData.rooms === 1 ? 'Room' : 'Rooms'}
            </Text>
          </View>

          {/* Guests */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Guests</Text>
            <Text style={styles.detailValue}>
              {bookingData.guests.adults + bookingData.guests.children} {bookingData.guests.adults + bookingData.guests.children === 1 ? 'Guest' : 'Guests'}
            </Text>
          </View>

          {/* Room Type */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Room Type</Text>
            <Text style={styles.detailValue}>
              {bookingData.roomType.charAt(0).toUpperCase() + bookingData.roomType.slice(1)}
            </Text>
          </View>

          {/* Extras */}
          {Object.entries(bookingData.selectedExtras).some(([_, value]) => value) && (
            <View style={styles.extrasSection}>
              <Text style={styles.extrasTitle}>Extras</Text>
              {bookingData.selectedExtras.breakfast && (
                <View style={styles.extraItem}>
                  <Ionicons name="restaurant" size={16} color="#EC4899" />
                  <Text style={styles.extraText}>Breakfast</Text>
                </View>
              )}
              {bookingData.selectedExtras.wifi && (
                <View style={styles.extraItem}>
                  <Ionicons name="wifi" size={16} color="#EC4899" />
                  <Text style={styles.extraText}>Wi-Fi</Text>
                </View>
              )}
              {bookingData.selectedExtras.parking && (
                <View style={styles.extraItem}>
                  <Ionicons name="car" size={16} color="#EC4899" />
                  <Text style={styles.extraText}>Parking</Text>
                </View>
              )}
              {bookingData.selectedExtras.lateCheckout && (
                <View style={styles.extraItem}>
                  <Ionicons name="time" size={16} color="#EC4899" />
                  <Text style={styles.extraText}>Late Check-out</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Contact Info Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={24} color="#EC4899" />
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
            Please check-in at the hotel reception on your arrival date.
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
            colors={['#EC4899', '#DB2777']}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  viewBookingsButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 10,
  },
  viewBookingsButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  primaryButton: {
    flex: 1,
    marginLeft: 10,
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

export default HotelBookingConfirmation;

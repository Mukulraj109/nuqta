// Address Selection Modal for Checkout
// Modal to select a delivery address during checkout

import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { CheckoutDeliveryAddress } from '@/types/checkout.types';

interface AddressSelectionModalProps {
  visible: boolean;
  addresses: CheckoutDeliveryAddress[];
  selectedAddressId?: string;
  onSelect: (address: CheckoutDeliveryAddress) => void;
  onClose: () => void;
  onAddNew: () => void;
  loading?: boolean;
}

export default function AddressSelectionModal({
  visible,
  addresses,
  selectedAddressId,
  onSelect,
  onClose,
  onAddNew,
  loading = false,
}: AddressSelectionModalProps) {
  const getAddressTypeIcon = (type?: string) => {
    switch (type) {
      case 'HOME':
        return 'home';
      case 'OFFICE':
        return 'business';
      default:
        return 'location';
    }
  };

  const getAddressTypeColor = (type?: string) => {
    switch (type) {
      case 'HOME':
        return '#ffcd57';
      case 'OFFICE':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Select Delivery Address</ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffcd57" />
              <ThemedText style={styles.loadingText}>Loading addresses...</ThemedText>
            </View>
          ) : addresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={64} color="#E5E7EB" />
              <ThemedText style={styles.emptyTitle}>No Saved Addresses</ThemedText>
              <ThemedText style={styles.emptyDescription}>
                Add a delivery address to continue with your order
              </ThemedText>
              <Pressable style={styles.addNewButton} onPress={onAddNew}>
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <ThemedText style={styles.addNewButtonText}>Add New Address</ThemedText>
              </Pressable>
            </View>
          ) : (
            <>
              <ScrollView
                style={styles.addressList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.addressListContent}
              >
                {addresses.map((address, index) => {
                  const isSelected = address.id === selectedAddressId;
                  return (
                    <Pressable
                      key={address.id || index}
                      style={[
                        styles.addressItem,
                        isSelected && styles.addressItemSelected,
                      ]}
                      onPress={() => onSelect(address)}
                     
                    >
                      <View style={styles.addressItemContent}>
                        <View
                          style={[
                            styles.addressTypeIcon,
                            { backgroundColor: getAddressTypeColor(address.type) },
                          ]}
                        >
                          <Ionicons
                            name={getAddressTypeIcon(address.type)}
                            size={18}
                            color="#FFFFFF"
                          />
                        </View>

                        <View style={styles.addressInfo}>
                          <View style={styles.addressTitleRow}>
                            <ThemedText style={styles.addressTitle}>
                              {address.name || address.type || 'Address'}
                            </ThemedText>
                            {address.isDefault && (
                              <View style={styles.defaultBadge}>
                                <ThemedText style={styles.defaultBadgeText}>Default</ThemedText>
                              </View>
                            )}
                          </View>

                          {address.phone && (
                            <View style={styles.phoneRow}>
                              <Ionicons name="call-outline" size={12} color="#6B7280" />
                              <ThemedText style={styles.phoneText}>{address.phone}</ThemedText>
                            </View>
                          )}

                          <ThemedText style={styles.addressLine} numberOfLines={2}>
                            {address.addressLine1}
                            {address.addressLine2 ? `, ${address.addressLine2}` : ''}
                          </ThemedText>

                          <ThemedText style={styles.addressCity}>
                            {address.city}, {address.state} - {address.pincode}
                          </ThemedText>

                          {address.instructions && (
                            <View style={styles.instructionsRow}>
                              <Ionicons name="information-circle-outline" size={12} color="#9CA3AF" />
                              <ThemedText style={styles.instructionsText} numberOfLines={1}>
                                {address.instructions}
                              </ThemedText>
                            </View>
                          )}
                        </View>

                        <View style={styles.radioContainer}>
                          <View
                            style={[
                              styles.radioOuter,
                              isSelected && styles.radioOuterSelected,
                            ]}
                          >
                            {isSelected && <View style={styles.radioInner} />}
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Add New Address Button */}
              <View style={styles.footer}>
                <Pressable style={styles.addNewOutlineButton} onPress={onAddNew}>
                  <Ionicons name="add-circle-outline" size={20} color="#ffcd57" />
                  <ThemedText style={styles.addNewOutlineButtonText}>Add New Address</ThemedText>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: 300,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffcd57',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addNewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addressList: {
    flex: 1,
  },
  addressListContent: {
    padding: 16,
    paddingBottom: 8,
  },
  addressItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  addressItemSelected: {
    borderColor: '#ffcd57',
    backgroundColor: '#F0FDF4',
  },
  addressItemContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  addressTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressInfo: {
    flex: 1,
    marginRight: 12,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  defaultBadge: {
    backgroundColor: '#ffcd57',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  phoneText: {
    fontSize: 13,
    color: '#6B7280',
  },
  addressLine: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 2,
    lineHeight: 20,
  },
  addressCity: {
    fontSize: 13,
    color: '#6B7280',
  },
  instructionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  instructionsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    flex: 1,
  },
  radioContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#ffcd57',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffcd57',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  addNewOutlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ffcd57',
    gap: 8,
  },
  addNewOutlineButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffcd57',
  },
});

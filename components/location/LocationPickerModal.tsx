import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAddressSearch } from '@/hooks/useLocation';
import { useLocation } from '@/contexts/LocationContext';
import { AddressSearchResult, UserLocation } from '@/types/location.types';

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: AddressSearchResult) => void;
  currentLocation?: UserLocation | null;
}

type ModalStep = 'search' | 'details';

export default function LocationPickerModal({
  visible,
  onClose,
  onLocationSelect,
  currentLocation,
}: LocationPickerModalProps) {
  const [query, setQuery] = useState('');
  const { search, searchResults, isSearching, clearResults } = useAddressSearch();
  const { getCurrentLocation } = useLocation();
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput>(null);

  // New state for details form
  const [modalStep, setModalStep] = useState<ModalStep>('search');
  const [selectedLocation, setSelectedLocation] = useState<AddressSearchResult | null>(null);
  const [locality, setLocality] = useState('');
  const [pincode, setPincode] = useState('');

  // Debounced search effect
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        search(query);
      }, 300);
    } else {
      clearResults();
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search, clearResults]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setQuery('');
      clearResults();
      setModalStep('search');
      setSelectedLocation(null);
      setLocality('');
      setPincode('');
    } else {
      // Focus input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible, clearResults]);

  const handleUseCurrentLocation = useCallback(async () => {
    Keyboard.dismiss();
    setIsGettingCurrentLocation(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        onClose();
      }
    } catch (error) {
      // silently handle
    } finally {
      setIsGettingCurrentLocation(false);
    }
  }, [getCurrentLocation, onClose]);

  const handleSelectResult = useCallback((result: AddressSearchResult) => {
    Keyboard.dismiss();
    // Instead of immediately selecting, show details form
    setSelectedLocation(result);
    setLocality('');
    setPincode(result.pincode || '');
    setModalStep('details');
  }, []);

  const handleConfirmLocation = useCallback(() => {
    if (!selectedLocation) return;

    // Build enhanced address with user-provided details
    let enhancedAddress = selectedLocation.formattedAddress;
    if (locality.trim()) {
      enhancedAddress = `${locality.trim()}, ${enhancedAddress}`;
    }

    const enhancedLocation: AddressSearchResult = {
      ...selectedLocation,
      formattedAddress: enhancedAddress,
      address: enhancedAddress,
      pincode: pincode.trim() || selectedLocation.pincode || '',
    };

    onLocationSelect(enhancedLocation);
  }, [selectedLocation, locality, pincode, onLocationSelect]);

  const handleBackToSearch = useCallback(() => {
    setModalStep('search');
    setSelectedLocation(null);
    setLocality('');
    setPincode('');
  }, []);

  const handleClearQuery = useCallback(() => {
    setQuery('');
    clearResults();
    inputRef.current?.focus();
  }, [clearResults]);

  const renderResultItem = useCallback(({ item }: { item: AddressSearchResult }) => (
    <Pressable
      style={styles.resultItem}
      onPress={() => handleSelectResult(item)}
     
    >
      <View style={styles.resultIconContainer}>
        <Ionicons name="location-outline" size={20} color="#666" />
      </View>
      <View style={styles.resultTextContainer}>
        <Text style={styles.resultAddress} numberOfLines={2}>
          {item.formattedAddress}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#999" />
    </Pressable>
  ), [handleSelectResult]);

  const keyExtractor = useCallback((item: AddressSearchResult, index: number) =>
    `${item.placeId || item.address}-${index}`, []);

  const ListEmptyComponent = useCallback(() => {
    if (query.length >= 2 && !isSearching) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>
            No locations found for "{query}"
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Try a different search term
          </Text>
        </View>
      );
    }
    if (query.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyStateText}>
            Search for a location
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Type at least 2 characters to search
          </Text>
        </View>
      );
    }
    return null;
  }, [query, isSearching]);

  // Render Details Form
  const renderDetailsForm = () => (
    <ScrollView style={styles.detailsContainer} keyboardShouldPersistTaps="handled">
      {/* Selected Location Display */}
      <View style={styles.selectedLocationCard}>
        <View style={styles.selectedLocationIcon}>
          <Ionicons name="location" size={24} color="#00C06A" />
        </View>
        <View style={styles.selectedLocationInfo}>
          <Text style={styles.selectedLocationLabel}>Selected Location</Text>
          <Text style={styles.selectedLocationAddress} numberOfLines={2}>
            {selectedLocation?.formattedAddress}
          </Text>
          {(selectedLocation?.city || selectedLocation?.state) && (
            <Text style={styles.selectedLocationMeta}>
              {[selectedLocation?.city, selectedLocation?.state].filter(Boolean).join(', ')}
            </Text>
          )}
        </View>
      </View>

      {/* Optional Details Section */}
      <View style={styles.optionalSection}>
        <Text style={styles.optionalTitle}>Add More Details (Optional)</Text>
        <Text style={styles.optionalSubtitle}>
          Add your area or pincode for a more accurate location
        </Text>

        {/* Locality/Area Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Area / Locality / Street</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="business-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.detailInput}
              placeholder="e.g., Boring Road, Gandhi Maidan"
              placeholderTextColor="#9CA3AF"
              value={locality}
              onChangeText={setLocality}
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Pincode Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Pincode</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.detailInput}
              placeholder="e.g., 800001"
              placeholderTextColor="#9CA3AF"
              value={pincode}
              onChangeText={setPincode}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Pressable
          style={styles.confirmButton}
          onPress={handleConfirmLocation}
         
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.confirmButtonText}>Confirm Location</Text>
        </Pressable>

        <Pressable
          style={styles.skipButton}
          onPress={handleConfirmLocation}
         
        >
          <Text style={styles.skipButtonText}>Skip & Continue</Text>
        </Pressable>
      </View>
    </ScrollView>
  );

  // Render Search View
  const renderSearchView = () => (
    <>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder="Search for area, street, city..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable
            onPress={handleClearQuery}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </Pressable>
        )}
        {isSearching && (
          <ActivityIndicator size="small" color="#00C06A" style={styles.searchLoader} />
        )}
      </View>

      {/* Use Current Location Button */}
      <Pressable
        style={styles.currentLocationButton}
        onPress={handleUseCurrentLocation}
       
        disabled={isGettingCurrentLocation}
      >
        <View style={styles.currentLocationIcon}>
          {isGettingCurrentLocation ? (
            <ActivityIndicator size="small" color="#00C06A" />
          ) : (
            <Ionicons name="locate" size={20} color="#00C06A" />
          )}
        </View>
        <View style={styles.currentLocationTextContainer}>
          <Text style={styles.currentLocationTitle}>Use current location</Text>
          <Text style={styles.currentLocationSubtitle} numberOfLines={1}>
            {currentLocation?.address?.formattedAddress || 'Detect my location using GPS'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#00C06A" />
      </Pressable>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Search Results</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Results List */}
      <FlatList
        data={searchResults}
        renderItem={renderResultItem}
        keyExtractor={keyExtractor}
        style={styles.resultsList}
        contentContainerStyle={searchResults.length === 0 ? styles.emptyListContent : undefined}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={ListEmptyComponent}
      />
    </>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable
          style={styles.backdrop}
         
          onPress={onClose}
        />
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            {modalStep === 'details' ? (
              <Pressable
                onPress={handleBackToSearch}
                style={styles.backButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={24} color="#1F2937" />
              </Pressable>
            ) : null}
            <Text style={[styles.headerTitle, modalStep === 'details' && styles.headerTitleWithBack]}>
              {modalStep === 'search' ? 'Change Location' : 'Confirm Location'}
            </Text>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#1F2937" />
            </Pressable>
          </View>

          {modalStep === 'search' ? renderSearchView() : renderDetailsForm()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '60%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  headerTitleWithBack: {
    textAlign: 'center',
    marginRight: 36,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 0,
  },
  searchLoader: {
    marginLeft: 8,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F0FDF4',
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  currentLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  currentLocationTextContainer: {
    flex: 1,
  },
  currentLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00C06A',
  },
  currentLocationSubtitle: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 12,
    fontWeight: '500',
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  resultIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultAddress: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  // Details Form Styles
  detailsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  selectedLocationCard: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  selectedLocationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedLocationInfo: {
    flex: 1,
  },
  selectedLocationLabel: {
    fontSize: 12,
    color: '#00C06A',
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedLocationAddress: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    lineHeight: 20,
  },
  selectedLocationMeta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  optionalSection: {
    marginTop: 24,
  },
  optionalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  optionalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 10,
  },
  detailInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 0,
  },
  actionButtons: {
    marginTop: 24,
    marginBottom: 32,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00C06A',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
});

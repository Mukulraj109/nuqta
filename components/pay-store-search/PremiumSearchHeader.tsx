/**
 * PremiumSearchHeader Component
 *
 * Premium search header with gradient background, styled search input.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PremiumSearchHeaderProps,
  PAYMENT_SEARCH_COLORS,
} from '@/types/paymentStoreSearch.types';

export const PremiumSearchHeader: React.FC<PremiumSearchHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onBack,
  onVoiceSearch,
  isSearching,
}) => {
  const insets = useSafeAreaInsets();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#E8FFF3', '#F0FFF7', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Top Row: Back Button & Title */}
      <View style={styles.topRow}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
         
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>

        <Text style={styles.title}>Find Store to Pay</Text>

        <View style={styles.placeholder} />
      </View>

      {/* Search Input */}
      <View style={[
        styles.searchContainer,
        isFocused && styles.searchContainerFocused
      ]}>
        <Ionicons
          name="search"
          size={20}
          color={isFocused ? '#00C06A' : '#9CA3AF'}
        />

        <TextInput
          style={styles.searchInput}
          placeholder="Search stores to pay..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={onSearchChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        {isSearching && (
          <Ionicons name="sync" size={18} color="#00C06A" />
        )}

        {searchQuery.length > 0 && !isSearching && (
          <Pressable
            onPress={() => onSearchChange('')}
           
          >
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 36,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  searchContainerFocused: {
    borderColor: '#00C06A',
    shadowColor: '#00C06A',
    shadowOpacity: 0.15,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
});

export default PremiumSearchHeader;

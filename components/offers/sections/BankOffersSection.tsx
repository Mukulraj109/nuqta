/**
 * BankOffersSection Component
 *
 * Bank & Wallet Offers
 * ReZ brand styling
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOffersTheme } from '@/contexts/OffersThemeContext';
import { useRegion } from '@/contexts/RegionContext';
import { SectionHeader, HorizontalScrollSection } from '../common';
import { BankOffer } from '@/types/offers.types';
import { Spacing, BorderRadius, Shadows, Colors } from '@/constants/DesignSystem';

// New Color Palette
const PALETTE = {
  nileBlue: '#1a3a52',
  lightMustard: '#ffcd57',
  linen: '#faf1e0',
  lightPeach: '#ffd7b5',
  lavenderMist: '#dfebf7',
};

interface BankOffersSectionProps {
  offers: BankOffer[];
  onViewAll?: () => void;
}

export const BankOffersSection: React.FC<BankOffersSectionProps> = ({
  offers,
  onViewAll,
}) => {
  const router = useRouter();
  const { theme, isDark } = useOffersTheme();
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  if (offers.length === 0) return null;

  const handleOfferPress = (offer: BankOffer) => {
    router.push(`/bank-offers/${offer.id}`);
  };

  const getCardTypeIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return 'card';
      case 'debit':
        return 'card-outline';
      case 'wallet':
        return 'wallet';
      default:
        return 'card';
    }
  };

  const getCardTypeColor = (type: string) => {
    switch (type) {
      case 'credit':
        return '#8B5CF6';
      case 'debit':
        return '#3B82F6';
      case 'wallet':
        return PALETTE.lightMustard;
      default:
        return '#6B7280';
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: Spacing.lg,
    },
    card: {
      width: 200,
      backgroundColor: isDark ? theme.colors.background.card : '#FFFFFF',
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: isDark ? theme.colors.border.light : '#E5E7EB',
      overflow: 'hidden',
      ...(isDark ? {} : Shadows.medium),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE',
    },
    bankLogoContainer: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      ...Shadows.subtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.sm,
    },
    bankLogo: {
      width: 36,
      height: 36,
    },
    bankLogoPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: '#3B82F6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bankLogoText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    bankInfo: {
      flex: 1,
    },
    bankName: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.text.primary,
      marginBottom: 2,
    },
    cardTypeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    cardTypeText: {
      fontSize: 9,
      fontWeight: '700',
      marginLeft: 3,
      textTransform: 'uppercase',
    },
    content: {
      padding: Spacing.md,
    },
    offerTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: PALETTE.nileBlue,
      marginBottom: 4,
    },
    maxDiscount: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.colors.text.secondary,
      marginBottom: Spacing.xs,
    },
    terms: {
      fontSize: 10,
      fontWeight: '500',
      color: theme.colors.text.tertiary,
      marginBottom: Spacing.sm,
    },
    minAmount: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    minAmountText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.text.tertiary,
      marginLeft: 4,
    },
  });

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Bank & Wallet Offers"
        subtitle="Extra rewards on payments"
        icon="card"
        iconColor="#3B82F6"
        showViewAll={offers.length > 3}
        onViewAll={onViewAll}
      />
      <HorizontalScrollSection>
        {offers.map((offer) => {
          const cardTypeColor = getCardTypeColor(offer.cardType);
          return (
            <Pressable
              key={offer.id}
              style={styles.card}
              onPress={() => handleOfferPress(offer)}
             
            >
              <View style={styles.header}>
                <View style={styles.bankLogoContainer}>
                  {offer.bankLogo ? (
                    <CachedImage
                      source={{ uri: offer.bankLogo }}
                      style={styles.bankLogo}
                      contentFit="contain"
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View style={styles.bankLogoPlaceholder}>
                      <Text style={styles.bankLogoText}>
                        {offer.bankName.charAt(0)}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.bankInfo}>
                  <Text style={styles.bankName} numberOfLines={1}>
                    {offer.bankName}
                  </Text>
                  <View
                    style={[
                      styles.cardTypeBadge,
                      { backgroundColor: `${cardTypeColor}20` },
                    ]}
                  >
                    <Ionicons
                      name={getCardTypeIcon(offer.cardType)}
                      size={10}
                      color={cardTypeColor}
                    />
                    <Text style={[styles.cardTypeText, { color: cardTypeColor }]}>
                      {offer.cardType}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.content}>
                <Text style={styles.offerTitle}>{offer.offerTitle}</Text>
                <Text style={styles.maxDiscount}>
                  Max discount: {currencySymbol}{offer.maxDiscount}
                </Text>
                <Text style={styles.terms} numberOfLines={1}>
                  {offer.terms}
                </Text>
                <View style={styles.minAmount}>
                  <Ionicons
                    name="information-circle-outline"
                    size={12}
                    color={theme.colors.text.tertiary}
                  />
                  <Text style={styles.minAmountText}>
                    Min. {currencySymbol}{offer.minTransactionAmount}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </HorizontalScrollSection>
    </View>
  );
};

export default React.memo(BankOffersSection);

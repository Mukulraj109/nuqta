/**
 * BankOffersSection Component
 * Horizontal scrollable bank/card offer cards
 * Adapted from Rez_v-2-main bank offers pattern
 */

import React, { memo, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import bankOffersApi, { BankOffer } from '@/services/bankOffersApi';
import { bankOffersData } from '@/data/categoryDummyData';
import { useRegion } from '@/contexts/RegionContext';

interface BankOffersSectionProps {
  categorySlug?: string;
  offers?: BankOffer[];
  onOfferPress?: (offer: BankOffer) => void;
}

const CARD_WIDTH = 240;

const BankOfferCard = memo(({
  offer,
  onPress,
  currencySymbol,
}: {
  offer: BankOffer;
  onPress: () => void;
  currencySymbol: string;
}) => (
  <Pressable
    style={styles.offerCard}
    onPress={onPress}
   
    accessibilityLabel={`${offer.bank} offer`}
    accessibilityRole="button"
  >
    <View style={styles.cardHeader}>
      <View style={styles.bankIcon}>
        <Text style={styles.iconEmoji}>{offer.icon}</Text>
      </View>
      <View style={styles.bankInfo}>
        <Text style={styles.bankName}>{offer.bank}</Text>
        <Text style={styles.cardType}>{offer.cardType}</Text>
      </View>
    </View>

    <View style={styles.offerDetails}>
      <Text style={styles.offerText}>{offer.offer}</Text>
      <View style={styles.termsRow}>
        <Text style={styles.termsText}>Max {currencySymbol}{offer.maxDiscount}</Text>
        <Text style={styles.dotSeparator}>•</Text>
        <Text style={styles.termsText}>Min {currencySymbol}{offer.minOrder}</Text>
      </View>
    </View>

    <View style={styles.applyButton}>
      <Text style={styles.applyText}>Apply</Text>
    </View>
  </Pressable>
));

BankOfferCard.displayName = 'BankOfferCard';

const BankOffersSection: React.FC<BankOffersSectionProps> = ({
  categorySlug,
  offers,
  onOfferPress,
}) => {
  const router = useRouter();
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const [apiOffers, setApiOffers] = useState<BankOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (offers) {
      setApiOffers(offers);
      setLoading(false);
      return;
    }

    const fetchOffers = async () => {
      try {
        setLoading(true);
        const response = await bankOffersApi.getOffers(
          categorySlug ? { category: categorySlug, limit: 10 } : { limit: 10 }
        );
        if (response.success && response.data?.offers?.length > 0) {
          setApiOffers(response.data.offers);
        } else {
          // Fallback to dummy data if API returns empty
          setApiOffers(bankOffersData as any);
        }
      } catch (err) {
        // Fallback to dummy data on error
        setApiOffers(bankOffersData as any);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [categorySlug, offers]);

  const displayOffers = offers || apiOffers;

  const handlePress = useCallback((offer: BankOffer) => {
    if (onOfferPress) {
      onOfferPress(offer);
    } else {
      const offerId = offer._id || (offer as any).id;
      router.push({
        pathname: '/offer/bank/[id]',
        params: { id: offerId },
      } as any);
    }
  }, [router, onOfferPress]);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="small" color="#ffcd57" />
      </View>
    );
  }

  if (!displayOffers || displayOffers.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.bankEmoji}>💳</Text>
          <Text style={styles.sectionTitle}>Bank Offers</Text>
        </View>
        <Pressable
          style={styles.seeAllButton}
          onPress={() => router.push('/offers/bank' as any)}
          accessibilityLabel="See all bank offers"
        >
          <Text style={styles.seeAllText}>All Offers</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {displayOffers.map((offer) => (
          <BankOfferCard
            key={offer._id || (offer as any).id}
            offer={offer}
            onPress={() => handlePress(offer)}
            currencySymbol={currencySymbol}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#1a3a52',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(11, 34, 64, 0.04), 0 8px 24px rgba(11, 34, 64, 0.06)',
      },
    }),
  },
  loadingContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bankEmoji: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
  },
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  offerCard: {
    width: CARD_WIDTH,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  bankIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconEmoji: {
    fontSize: 22,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  cardType: {
    fontSize: 12,
    color: '#6B7280',
  },
  offerDetails: {
    marginBottom: 14,
  },
  offerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a3a52',
    marginBottom: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  dotSeparator: {
    fontSize: 11,
    color: '#9CA3AF',
    marginHorizontal: 6,
  },
  applyButton: {
    backgroundColor: '#ffcd57',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default memo(BankOffersSection);

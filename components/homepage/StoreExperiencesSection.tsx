/**
 * StoreExperiencesSection Component
 * Displays store experience cards for different store types:
 * - 60-Minute Delivery (fastDelivery)
 * - ₹1 Store (budgetFriendly)
 * - Luxury Store (premium)
 * - Organic Store (organic)
 * Connected to /api/experiences/homepage
 */

import React, { memo, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { StoreExperienceCard, StoreExperienceCardProps } from './cards/StoreExperienceCard';
import { experiencesApi } from '@/services/experiencesApi';
import { useRegion } from '@/contexts/RegionContext';

// Fallback store experience configurations generator - Nuqta palette
const getFallbackStoreExperiences = (currencySymbol: string): StoreExperienceCardProps[] => [
  {
    title: '60-Minute Delivery',
    subtitle: 'Fashion, beauty, grocery & essentials',
    icon: '⚡',
    buttonText: 'Shop Now',
    gradientColors: ['#1a3a52', '#243f55'] as const,
    storeType: 'fastDelivery',
    buttonTextColor: '#1a3a52',
  },
  {
    title: `${currencySymbol}1 Store`,
    subtitle: `${currencySymbol}1 products + delivery cashback on sharing`,
    icon: '🏷️',
    buttonText: 'Explore Deals',
    gradientColors: ['#ffd7b5', '#E8B896'] as const,
    storeType: 'budgetFriendly',
    buttonTextColor: '#1a3a52',
  },
  {
    title: 'Luxury Store',
    subtitle: 'Premium brands with exclusive rewards',
    icon: '👑',
    buttonText: 'Shop Luxury',
    gradientColors: ['#1a3a52', '#2d4a5f'] as const,
    storeType: 'premium',
    buttonTextColor: '#1a3a52',
  },
  {
    title: 'Organic Store',
    subtitle: 'Eco-friendly & sustainable products',
    icon: '🌿',
    buttonText: 'Go Green',
    gradientColors: ['#dfebf7', '#b8d4ed'] as const,
    storeType: 'organic',
    buttonTextColor: '#1a3a52',
  },
];

// Map experience types to gradient colors and button text colors - Nuqta palette
const EXPERIENCE_STYLES: Record<string, { gradientColors: readonly [string, string]; buttonTextColor: string; buttonText: string }> = {
  fastDelivery: { gradientColors: ['#1a3a52', '#243f55'], buttonTextColor: '#1a3a52', buttonText: 'Shop Now' },
  oneRupee: { gradientColors: ['#ffd7b5', '#E8B896'], buttonTextColor: '#1a3a52', buttonText: 'Explore Deals' },
  budgetFriendly: { gradientColors: ['#ffd7b5', '#E8B896'], buttonTextColor: '#1a3a52', buttonText: 'Explore Deals' },
  luxury: { gradientColors: ['#1a3a52', '#2d4a5f'], buttonTextColor: '#1a3a52', buttonText: 'Shop Luxury' },
  premium: { gradientColors: ['#1a3a52', '#2d4a5f'], buttonTextColor: '#1a3a52', buttonText: 'Shop Luxury' },
  organic: { gradientColors: ['#dfebf7', '#b8d4ed'], buttonTextColor: '#1a3a52', buttonText: 'Go Green' },
};

interface StoreExperiencesSectionProps {
  showTitle?: boolean;
}

const StoreExperiencesSection: React.FC<StoreExperiencesSectionProps> = memo(({
  showTitle = true,
}) => {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();
  const fallbackExperiences = getFallbackStoreExperiences(currencySymbol);
  const [isLoading, setIsLoading] = useState(true);
  const [experiences, setExperiences] = useState<StoreExperienceCardProps[]>(fallbackExperiences);

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        setIsLoading(true);
        const response = await experiencesApi.getHomepageExperiences(4);

        if (response.success && response.data && response.data.experiences.length > 0) {
          // Transform API data to component format
          const transformedExperiences = response.data.experiences.map((exp, index) => {
            const styles = EXPERIENCE_STYLES[exp.type] || EXPERIENCE_STYLES.fastDelivery;
            const fallback = fallbackExperiences[index] || fallbackExperiences[0];

            return {
              title: exp.title,
              subtitle: exp.subtitle || fallback.subtitle,
              icon: exp.icon,
              buttonText: styles.buttonText,
              gradientColors: styles.gradientColors,
              storeType: exp.type,
              buttonTextColor: styles.buttonTextColor,
            } as StoreExperienceCardProps;
          });

          setExperiences(transformedExperiences);
        }
      } catch (error) {
        // Keep using fallback data
      } finally {
        setIsLoading(false);
      }
    };

    fetchExperiences();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="small" color="#ffcd57" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showTitle && (
        <ThemedText style={styles.sectionTitle}>Store Experiences</ThemedText>
      )}
      <View style={styles.cardsContainer}>
        {experiences.map((experience) => (
          <StoreExperienceCard
            key={experience.storeType}
            {...experience}
          />
        ))}
      </View>
    </View>
  );
});

StoreExperiencesSection.displayName = 'StoreExperiencesSection';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1a3a52',
  },
  cardsContainer: {
    gap: 4,
  },
});

export { StoreExperiencesSection };

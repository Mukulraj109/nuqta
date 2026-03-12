import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { VariantOptionButton } from './VariantOptionButton';
import { useProductVariants } from '@/hooks/useProductVariants';
import { IProductVariant, IVariantOption } from '@/types/product-variants.types';

/**
 * ProductVariantSelector Component
 *
 * Main component for selecting product variants (size, color, etc.)
 * Handles all variant selection logic and displays options in an intuitive UI
 */
interface ProductVariantSelectorProps {
  variants: IProductVariant[];
  selectedVariant: IProductVariant | null;
  onVariantChange: (variant: IProductVariant | null) => void;
  showTitle?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const ProductVariantSelector: React.FC<ProductVariantSelectorProps> = ({
  variants,
  selectedVariant: externalSelectedVariant,
  onVariantChange,
  showTitle = true,
  size = 'medium',
}) => {
  // Use variant hook for selection logic
  const {
    selectedAttributes,
    selectedVariant,
    options,
    isSelectionComplete,
    selectAttribute,
    isOptionAvailable,
  } = useProductVariants({
    variants,
    onVariantChange,
  });

  // No variants to select
  if (!variants || variants.length === 0) {
    return null;
  }

  // Only one variant and no options to select
  if (variants.length === 1 && options.length === 0) {
    return null;
  }

  /**
   * Determine if an attribute should use color variant
   */
  const shouldUseColorVariant = (option: IVariantOption): boolean => {
    const name = option.name.toLowerCase();
    return name === 'color' || name === 'colour';
  };

  /**
   * Try to extract hex color from value
   * Simple heuristic: if value starts with #, treat as hex
   */
  const getHexColor = (value: string): string | undefined => {
    if (value.startsWith('#')) {
      return value;
    }

    // Map common color names to hex codes
    const colorMap: { [key: string]: string } = {
      black: '#000000',
      white: '#FFFFFF',
      red: '#EF4444',
      blue: '#3B82F6',
      green: '#10B981',
      yellow: '#FBBF24',
      orange: '#F97316',
      purple: '#8B5CF6',
      pink: '#EC4899',
      gray: '#6B7280',
      grey: '#6B7280',
      brown: '#92400E',
      navy: '#1E3A8A',
      beige: '#F5F5DC',
      gold: '#FFD700',
      silver: '#C0C0C0',
    };

    return colorMap[value.toLowerCase()];
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      {showTitle && (
        <ThemedText style={styles.mainTitle}>Select Options</ThemedText>
      )}

      {/* Render each option group */}
      {options.map((option, index) => {
        const isColorVariant = shouldUseColorVariant(option);
        const selectedValue = selectedAttributes[option.name];

        return (
          <View key={option.name} style={styles.optionGroup}>
            {/* Option Name and Selected Value */}
            <View style={styles.optionHeader}>
              <ThemedText style={styles.optionName}>{option.name}</ThemedText>
              {selectedValue && (
                <ThemedText style={styles.selectedValue}>: {selectedValue}</ThemedText>
              )}
            </View>

            {/* Option Values */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionValuesContainer}
              accessibilityRole="radiogroup"
              accessibilityLabel={`${option.name} options`}
            >
              {option.values.map((valueObj) => {
                const isSelected = selectedValue === valueObj.value;
                const isAvailable = isOptionAvailable(option.name, valueObj.value);
                const hexColor = isColorVariant ? getHexColor(valueObj.value) : undefined;

                return (
                  <VariantOptionButton
                    key={valueObj.value}
                    value={valueObj.value}
                    displayName={valueObj.displayName}
                    isSelected={isSelected}
                    isAvailable={isAvailable}
                    onPress={() => selectAttribute(option.name, valueObj.value)}
                    hexColor={hexColor}
                    size={size}
                    variant={isColorVariant ? 'color' : 'text'}
                  />
                );
              })}
            </ScrollView>
          </View>
        );
      })}

      {/* Selection Status Message */}
      {!isSelectionComplete && options.length > 0 && (
        <View style={styles.statusContainer}>
          <ThemedText style={styles.statusText}>
            Please select all options to continue
          </ThemedText>
        </View>
      )}

      {/* Selected Variant Info */}
      {isSelectionComplete && selectedVariant && (
        <View style={styles.variantInfoContainer}>
          <View style={styles.variantInfoRow}>
            <ThemedText style={styles.variantInfoLabel}>SKU:</ThemedText>
            <ThemedText style={styles.variantInfoValue}>{selectedVariant.sku}</ThemedText>
          </View>
          {selectedVariant.inventory && (
            <View style={styles.variantInfoRow}>
              <ThemedText style={styles.variantInfoLabel}>Stock:</ThemedText>
              <ThemedText
                style={[
                  styles.variantInfoValue,
                  selectedVariant.inventory.quantity > 0 ? styles.inStock : styles.outOfStock,
                ]}
              >
                {selectedVariant.inventory.quantity > 0
                  ? `${selectedVariant.inventory.quantity} available`
                  : 'Out of Stock'}
              </ThemedText>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    paddingHorizontal: 16,
  },

  // Option Group
  optionGroup: {
    marginBottom: 24,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  selectedValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 4,
  },

  // Option Values
  optionValuesContainer: {
    paddingHorizontal: 16,
    paddingRight: 8, // Extra padding for horizontal scroll
  },

  // Status Message
  statusContainer: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Variant Info
  variantInfoContainer: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  variantInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  variantInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 8,
  },
  variantInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  inStock: {
    color: '#059669',
  },
  outOfStock: {
    color: '#DC2626',
  },
});

export default ProductVariantSelector;

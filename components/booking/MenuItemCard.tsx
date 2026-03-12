import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRegion } from '@/contexts/RegionContext';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isVeg?: boolean;
  spiceLevel?: 'mild' | 'medium' | 'hot';
  allergens?: string[];
  quantity: number;
}

interface MenuItemCardProps {
  item: MenuItem;
  onQuantityChange: (id: string, quantity: number) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onQuantityChange }) => {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  const getSpiceIndicator = () => {
    if (!item.spiceLevel) return null;

    const peppers = {
      mild: 1,
      medium: 2,
      hot: 3,
    };

    return (
      <View style={styles.spiceContainer}>
        {Array.from({ length: peppers[item.spiceLevel] }).map((_, idx) => (
          <Text key={idx} style={styles.spiceIcon}>🌶️</Text>
        ))}
      </View>
    );
  };

  const handleIncrement = () => {
    onQuantityChange(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 0) {
      onQuantityChange(item.id, item.quantity - 1);
    }
  };

  const handleAdd = () => {
    onQuantityChange(item.id, 1);
  };

  return (
    <View style={styles.card}>
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" cachePolicy="memory-disk" />
      )}

      <View style={styles.content}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            {/* Veg/Non-Veg Indicator */}
            <View style={[styles.vegIndicator, item.isVeg ? styles.veg : styles.nonVeg]}>
              <View style={[styles.vegDot, item.isVeg ? styles.vegDot : styles.nonVegDot]} />
            </View>

            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          </View>

          {getSpiceIndicator()}
        </View>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Allergens */}
        {item.allergens && item.allergens.length > 0 && (
          <View style={styles.allergenContainer}>
            <Ionicons name="alert-circle-outline" size={12} color="#EF4444" />
            <Text style={styles.allergenText}>
              Contains: {item.allergens.join(', ')}
            </Text>
          </View>
        )}

        {/* Price and Actions */}
        <View style={styles.footer}>
          <Text style={styles.price}>{currencySymbol}{item.price}</Text>

          {item.quantity === 0 ? (
            <Pressable style={styles.addButton} onPress={handleAdd}>
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          ) : (
            <View style={styles.quantityContainer}>
              <Pressable style={styles.quantityButton} onPress={handleDecrement}>
                <Ionicons name="remove" size={16} color="#FFF" />
              </Pressable>

              <Text style={styles.quantityText}>{item.quantity}</Text>

              <Pressable style={styles.quantityButton} onPress={handleIncrement}>
                <Ionicons name="add" size={16} color="#FFF" />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vegIndicator: {
    width: 16,
    height: 16,
    borderRadius: 2,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  veg: {
    borderColor: '#10B981',
  },
  nonVeg: {
    borderColor: '#EF4444',
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  nonVegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  spiceContainer: {
    flexDirection: 'row',
    marginLeft: 4,
  },
  spiceIcon: {
    fontSize: 12,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 6,
  },
  allergenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  allergenText: {
    fontSize: 11,
    color: '#EF4444',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7C3AED',
  },
  addButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 6,
    overflow: 'hidden',
  },
  quantityButton: {
    padding: 6,
    paddingHorizontal: 12,
  },
  quantityText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
});

export default MenuItemCard;

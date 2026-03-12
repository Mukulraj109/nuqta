import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import MenuItemCard, { MenuItem } from './MenuItemCard';
import { useRegion } from '@/contexts/RegionContext';

interface RestaurantInfo {
  id: string;
  name: string;
  cuisine?: string;
}

interface MenuPreOrderModalProps {
  visible: boolean;
  restaurant: RestaurantInfo;
  onClose: () => void;
  onAddItems: (items: MenuItem[]) => void;
  initialItems?: MenuItem[];
}

// Mock Menu Data
const MOCK_MENU_DATA: MenuItem[] = [
  // Appetizers
  {
    id: 'app1',
    name: 'Paneer Tikka',
    description: 'Grilled cottage cheese marinated in spices and yogurt',
    price: 280,
    category: 'Appetizers',
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400',
    isVeg: true,
    spiceLevel: 'medium',
    quantity: 0,
  },
  {
    id: 'app2',
    name: 'Chicken Wings',
    description: 'Crispy fried wings tossed in spicy buffalo sauce',
    price: 350,
    category: 'Appetizers',
    image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400',
    isVeg: false,
    spiceLevel: 'hot',
    allergens: ['Gluten'],
    quantity: 0,
  },
  {
    id: 'app3',
    name: 'Spring Rolls',
    description: 'Crispy vegetable rolls with sweet chili sauce',
    price: 220,
    category: 'Appetizers',
    image: 'https://images.unsplash.com/photo-1613564834361-9436948817d1?w=400',
    isVeg: true,
    quantity: 0,
  },
  {
    id: 'app4',
    name: 'Fish Fingers',
    description: 'Golden fried fish strips with tartar sauce',
    price: 380,
    category: 'Appetizers',
    image: 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=400',
    isVeg: false,
    allergens: ['Gluten', 'Fish'],
    quantity: 0,
  },
  {
    id: 'app5',
    name: 'Bruschetta',
    description: 'Toasted bread topped with tomatoes, basil, and olive oil',
    price: 260,
    category: 'Appetizers',
    image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400',
    isVeg: true,
    quantity: 0,
  },

  // Main Course
  {
    id: 'main1',
    name: 'Butter Chicken',
    description: 'Tender chicken in rich tomato and butter gravy',
    price: 450,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400',
    isVeg: false,
    spiceLevel: 'mild',
    allergens: ['Dairy'],
    quantity: 0,
  },
  {
    id: 'main2',
    name: 'Dal Makhani',
    description: 'Creamy black lentils slow-cooked with butter and cream',
    price: 320,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
    isVeg: true,
    spiceLevel: 'mild',
    allergens: ['Dairy'],
    quantity: 0,
  },
  {
    id: 'main3',
    name: 'Biryani',
    description: 'Aromatic basmati rice with spiced chicken and herbs',
    price: 480,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
    isVeg: false,
    spiceLevel: 'medium',
    quantity: 0,
  },
  {
    id: 'main4',
    name: 'Paneer Butter Masala',
    description: 'Cottage cheese in creamy tomato gravy',
    price: 380,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400',
    isVeg: true,
    spiceLevel: 'mild',
    allergens: ['Dairy'],
    quantity: 0,
  },
  {
    id: 'main5',
    name: 'Grilled Salmon',
    description: 'Fresh salmon fillet with lemon butter sauce',
    price: 680,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
    isVeg: false,
    allergens: ['Fish', 'Dairy'],
    quantity: 0,
  },
  {
    id: 'main6',
    name: 'Pasta Alfredo',
    description: 'Creamy fettuccine pasta with parmesan cheese',
    price: 420,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400',
    isVeg: true,
    allergens: ['Gluten', 'Dairy'],
    quantity: 0,
  },
  {
    id: 'main7',
    name: 'Lamb Rogan Josh',
    description: 'Slow-cooked lamb in aromatic Kashmiri gravy',
    price: 550,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
    isVeg: false,
    spiceLevel: 'medium',
    quantity: 0,
  },
  {
    id: 'main8',
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato sauce, mozzarella, and basil',
    price: 380,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    isVeg: true,
    allergens: ['Gluten', 'Dairy'],
    quantity: 0,
  },
  {
    id: 'main9',
    name: 'Thai Green Curry',
    description: 'Coconut-based curry with vegetables and tofu',
    price: 420,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400',
    isVeg: true,
    spiceLevel: 'medium',
    quantity: 0,
  },
  {
    id: 'main10',
    name: 'Steak',
    description: 'Grilled beef steak with mashed potatoes and vegetables',
    price: 750,
    category: 'Main Course',
    image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400',
    isVeg: false,
    quantity: 0,
  },

  // Desserts
  {
    id: 'des1',
    name: 'Gulab Jamun',
    description: 'Soft milk dumplings in rose-flavored sugar syrup',
    price: 120,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400',
    isVeg: true,
    allergens: ['Dairy', 'Gluten'],
    quantity: 0,
  },
  {
    id: 'des2',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center and vanilla ice cream',
    price: 220,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400',
    isVeg: true,
    allergens: ['Dairy', 'Gluten', 'Eggs'],
    quantity: 0,
  },
  {
    id: 'des3',
    name: 'Tiramisu',
    description: 'Classic Italian dessert with coffee-soaked ladyfingers',
    price: 280,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
    isVeg: true,
    allergens: ['Dairy', 'Gluten', 'Eggs'],
    quantity: 0,
  },
  {
    id: 'des4',
    name: 'Ice Cream Sundae',
    description: 'Three scoops with chocolate sauce, nuts, and cherry',
    price: 180,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400',
    isVeg: true,
    allergens: ['Dairy', 'Nuts'],
    quantity: 0,
  },
  {
    id: 'des5',
    name: 'Cheesecake',
    description: 'Creamy New York-style cheesecake with berry compote',
    price: 260,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400',
    isVeg: true,
    allergens: ['Dairy', 'Gluten', 'Eggs'],
    quantity: 0,
  },

  // Beverages
  {
    id: 'bev1',
    name: 'Mango Lassi',
    description: 'Traditional yogurt drink blended with fresh mango',
    price: 120,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400',
    isVeg: true,
    allergens: ['Dairy'],
    quantity: 0,
  },
  {
    id: 'bev2',
    name: 'Fresh Lime Soda',
    description: 'Refreshing lime juice with soda and mint',
    price: 80,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
    isVeg: true,
    quantity: 0,
  },
  {
    id: 'bev3',
    name: 'Masala Chai',
    description: 'Indian spiced tea with milk and aromatic herbs',
    price: 60,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1597318118234-a65f322de01f?w=400',
    isVeg: true,
    allergens: ['Dairy'],
    quantity: 0,
  },
  {
    id: 'bev4',
    name: 'Fresh Juice',
    description: 'Choice of orange, watermelon, or pomegranate',
    price: 100,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
    isVeg: true,
    quantity: 0,
  },
  {
    id: 'bev5',
    name: 'Cold Coffee',
    description: 'Blended iced coffee with vanilla ice cream',
    price: 140,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400',
    isVeg: true,
    allergens: ['Dairy'],
    quantity: 0,
  },
];

const CATEGORIES = ['All', 'Appetizers', 'Main Course', 'Desserts', 'Beverages'];

const MenuPreOrderModal: React.FC<MenuPreOrderModalProps> = ({
  visible,
  restaurant,
  onClose,
  onAddItems,
  initialItems = [],
}) => {
  const { getCurrencySymbol } = useRegion();
  const currencySymbol = getCurrencySymbol();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    // Initialize with quantities from initialItems
    return MOCK_MENU_DATA.map(item => {
      const initialItem = initialItems.find(i => i.id === item.id);
      return initialItem ? { ...item, quantity: initialItem.quantity } : item;
    });
  });

  // Filter and search menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Calculate totals
  const { totalItems, totalAmount } = useMemo(() => {
    return menuItems.reduce(
      (acc, item) => ({
        totalItems: acc.totalItems + item.quantity,
        totalAmount: acc.totalAmount + item.price * item.quantity,
      }),
      { totalItems: 0, totalAmount: 0 }
    );
  }, [menuItems]);

  const handleQuantityChange = (id: string, quantity: number) => {
    setMenuItems(prev =>
      prev.map(item => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const handleAddToReservation = () => {
    const selectedItems = menuItems.filter(item => item.quantity > 0);
    onAddItems(selectedItems);
    onClose();
  };

  const handleClear = () => {
    setMenuItems(prev => prev.map(item => ({ ...item, quantity: 0 })));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
        )}

        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </Pressable>

              <View style={styles.headerTitle}>
                <Text style={styles.title}>Pre-Order Menu</Text>
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
              </View>

              {totalItems > 0 && (
                <Pressable onPress={handleClear} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Clear</Text>
                </Pressable>
              )}
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search menu items..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9CA3AF"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </Pressable>
              )}
            </View>

            {/* Category Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {CATEGORIES.map(category => (
                <Pressable
                  key={category}
                  style={[
                    styles.categoryTab,
                    selectedCategory === category && styles.categoryTabActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category && styles.categoryTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Menu Items */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.menuList}
            showsVerticalScrollIndicator={false}
          >
            {filteredItems.length > 0 ? (
              <View style={styles.gridContainer}>
                {filteredItems.map(item => (
                  <View key={item.id} style={styles.gridItem}>
                    <MenuItemCard item={item} onQuantityChange={handleQuantityChange} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="restaurant-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyStateText}>No items found</Text>
                <Text style={styles.emptyStateSubtext}>
                  {searchQuery ? 'Try a different search' : 'No items in this category'}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer / Cart Summary */}
          {totalItems > 0 && (
            <View style={styles.footer}>
              <View style={styles.totalContainer}>
                <View>
                  <Text style={styles.itemCount}>{totalItems} items</Text>
                  <Text style={styles.totalAmount}>{currencySymbol}{totalAmount}</Text>
                </View>

                <Pressable
                  style={styles.addButton}
                  onPress={handleAddToReservation}
                >
                  <Text style={styles.addButtonText}>Add to Reservation</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  androidBlur: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  restaurantName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  clearButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    marginLeft: 8,
    padding: 0,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  categoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: '#7C3AED',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  menuList: {
    padding: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridItem: {
    width: '48%',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  footer: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MenuPreOrderModal;

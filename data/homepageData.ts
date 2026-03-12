import { 
  EventItem, 
  StoreItem, 

  BrandedStoreItem, 

  HomepageSection,
  HomepageState 
} from '@/types/homepage.types';

// Events Data
export const eventsData: EventItem[] = [
  {
    id: 'event_001',
    type: 'event',
    title: 'Art of Living - Happiness Program',
    subtitle: 'Free • Online',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=200&fit=crop',
    description: 'Transform your life with ancient wisdom and modern techniques. Learn breathing exercises, meditation, and stress management in this comprehensive wellness program.',
    price: { amount: 0, currency: '₹', isFree: true },
    location: 'Online',
    date: '2025-08-25',
    time: '7:00 PM',
    category: 'Wellness',
    organizer: 'Art of Living Foundation',
    isOnline: true,
    registrationRequired: true,
    bookingUrl: 'https://www.artofliving.org/register'
  },
  {
    id: 'event_002',
    type: 'event',
    title: 'Music Concert - Classical Night',
    subtitle: '₹299 • Venue',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=200&fit=crop',
    description: 'An evening of classical music by renowned artists. Experience the beauty of Indian classical music in the historic Bangalore Palace.',
    price: { amount: 299, currency: '₹', isFree: false },
    location: 'Bangalore Palace',
    date: '2025-08-28',
    time: '6:30 PM',
    category: 'Music',
    organizer: 'Cultural Events Bangalore',
    isOnline: false,
    registrationRequired: true,
    availableSlots: [
      { id: 'slot1', time: '6:30 PM', available: true, maxCapacity: 200, bookedCount: 45 },
      { id: 'slot2', time: '8:00 PM', available: true, maxCapacity: 200, bookedCount: 120 },
      { id: 'slot3', time: '9:30 PM', available: false, maxCapacity: 200, bookedCount: 200 },
    ]
  },
  {
    id: 'event_003',
    type: 'event',
    title: 'Tech Meetup - AI Revolution',
    subtitle: 'Free • Venue',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop',
    description: 'Latest trends in AI and machine learning. Join industry experts and tech enthusiasts for discussions on AI innovations and networking.',
    price: { amount: 0, currency: '₹', isFree: true },
    location: 'Tech Park, Whitefield',
    date: '2025-08-30',
    time: '10:00 AM',
    category: 'Technology',
    organizer: 'Bangalore Tech Community',
    isOnline: false,
    registrationRequired: true,
    availableSlots: [
      { id: 'slot1', time: '10:00 AM', available: true, maxCapacity: 150, bookedCount: 85 },
      { id: 'slot2', time: '2:00 PM', available: true, maxCapacity: 150, bookedCount: 52 },
      { id: 'slot3', time: '4:00 PM', available: true, maxCapacity: 150, bookedCount: 12 },
    ]
  }
];

// Trending Stores Data
export const trendingStoresData: StoreItem[] = [
  {
    id: 'store_trending_001',
    type: 'store',
    title: 'Mack Weldon',
    name: 'Mack Weldon',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=200&fit=crop',
    description: 'Premium men\'s essentials and underwear',
    logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
    rating: { value: 4.6, count: 1247, maxValue: 5 },
    cashback: { percentage: 12, maxAmount: 500 },
    category: 'Fashion',
    location: { address: 'Koramangala', city: 'Bangalore', distance: '2.3 km' },
    isTrending: true,
    deliveryTime: '30-45 mins',
    minimumOrder: 299
  },
  {
    id: 'store_trending_002',
    type: 'store',
    title: 'Columbia',
    name: 'Columbia Sportswear',
    image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5b?w=400&h=200&fit=crop',
    description: 'Premium men\'s essentials gear and sportswear',
    logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop',
    rating: { value: 4.4, count: 892, maxValue: 5 },
    cashback: { percentage: 10, maxAmount: 1000 },
    category: 'Sports',
    location: { address: 'Brigade Road', city: 'Bangalore', distance: '5.1 km' },
    isTrending: true,
    deliveryTime: '45-60 mins',
    minimumOrder: 999
  },
  {
    id: 'store_trending_003',
    type: 'store',
    title: 'Local Bookstore',
    name: 'Page Turner Books',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop',
    description: 'Curated collection of books and stationery',
    rating: { value: 4.8, count: 456, maxValue: 5 },
    cashback: { percentage: 8, maxAmount: 200 },
    category: 'Books',
    location: { address: 'Indiranagar', city: 'Bangalore', distance: '3.7 km' },
    isTrending: true,
    deliveryTime: '20-30 mins',
    minimumOrder: 199
  }
];

// New Stores Data
export const newStoresData: StoreItem[] = [
  {
    id: 'store_new_001',
    type: 'store',
    title: 'Safeway Fresh',
    name: 'Safeway Fresh Market',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop',
    description: 'Fresh groceries and organic produce',
    rating: { value: 4.3, count: 127, maxValue: 5 },
    cashback: { percentage: 15, maxAmount: 300 },
    category: 'Grocery',
    location: { address: 'HSR Layout', city: 'Bangalore', distance: '1.8 km' },
    isNew: true,
    deliveryTime: '25-40 mins',
    minimumOrder: 199
  },
  {
    id: 'store_new_002',
    type: 'store',
    title: 'Target Express',
    name: 'Target Express Store',
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=400&h=200&fit=crop',
    description: 'Everything you need, delivered fast',
    rating: { value: 4.1, count: 89, maxValue: 5 },
    cashback: { percentage: 8, maxAmount: 500 },
    category: 'General',
    location: { address: 'Marathahalli', city: 'Bangalore', distance: '4.2 km' },
    isNew: true,
    deliveryTime: '35-50 mins',
    minimumOrder: 399
  }
];

// Today's Top Stores (Branded) Data
export const topStoresData: BrandedStoreItem[] = [
  {
    id: 'branded_001',
    type: 'branded_store',
    title: 'Adidas',
    brandName: 'Adidas',
    image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=200&fit=crop',
    brandLogo: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=100&h=100&fit=crop',
    backgroundColor: '#E8E8FF',
    description: 'Sports apparel and footwear',
    discount: { percentage: 20, description: '20% off' },
    cashback: { percentage: 10, description: 'Up to 10% cash back' },
    category: 'Sports',
    isPartner: true,
    partnerLevel: 'gold',
    validUntil: '2025-08-31'
  },
  {
    id: 'branded_002',
    type: 'branded_store',
    title: 'Nike',
    brandName: 'Nike',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=200&fit=crop',
    brandLogo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop',
    backgroundColor: '#FFE8E8',
    description: 'Just Do It - Premium sportswear',
    discount: { percentage: 20, description: '20% off' },
    cashback: { percentage: 10, description: 'Up to 10% cash back' },
    category: 'Sports',
    isPartner: true,
    partnerLevel: 'gold',
    validUntil: '2025-08-31'
  },
  {
    id: 'branded_003',
    type: 'branded_store',
    title: 'Puma',
    brandName: 'Puma',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
    brandLogo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop',
    backgroundColor: '#E8FFE8',
    description: 'Forever Faster - Athletic wear',
    discount: { percentage: 20, description: '20% off' },
    cashback: { percentage: 12, description: 'Up to 12% cash back' },
    category: 'Sports',
    isPartner: true,
    partnerLevel: 'silver',
    validUntil: '2025-08-31'
  }
];



// Homepage Sections Configuration
export const homepageSections: HomepageSection[] = [
  {
    id: 'events',
    title: 'Events',
    type: 'events',
    showViewAll: false,
    isHorizontalScroll: true,
    items: eventsData,
    loading: false,
    error: null,
    lastUpdated: new Date().toISOString(),
    refreshable: true,
    priority: 1
  },
  {
    id: 'just_for_you',
    title: 'Just for you',
    type: 'recommendations',
    showViewAll: false,
    isHorizontalScroll: true,
    items: [], // Real data loaded from backend via batch/individual API calls
    loading: true, // Show loading state until real data arrives
    error: null,
    lastUpdated: new Date().toISOString(),
    refreshable: true,
    priority: 2
  },
  {
    id: 'trending_stores',
    title: 'Trending Stores',
    type: 'stores',
    showViewAll: false,
    isHorizontalScroll: true,
    items: trendingStoresData,
    loading: false,
    error: null,
    lastUpdated: new Date().toISOString(),
    refreshable: true,
    priority: 3
  },
  {
    id: 'new_stores',
    title: 'New stores',
    type: 'stores',
    showViewAll: false,
    isHorizontalScroll: true,
    items: newStoresData,
    loading: false,
    error: null,
    lastUpdated: new Date().toISOString(),
    refreshable: true,
    priority: 4
  },
  {
    id: 'top_stores',
    title: 'Today\'s top stores',
    type: 'branded_stores',
    showViewAll: false,
    isHorizontalScroll: true,
    items: topStoresData,
    loading: false,
    error: null,
    lastUpdated: new Date().toISOString(),
    refreshable: true,
    priority: 5
  },
  {
    id: 'new_arrivals',
    title: 'New Arrivals',
    type: 'products',
    showViewAll: false,
    isHorizontalScroll: true,
    items: [], // Real data loaded from backend via batch/individual API calls
    loading: true, // Show loading state until real data arrives
    error: null,
    lastUpdated: new Date().toISOString(),
    refreshable: true,
    priority: 6
  }
];

// Initial Homepage State
export const initialHomepageState: HomepageState = {
  sections: homepageSections,
  user: {
    id: 'user_123',
    preferences: ['fitness', 'home_office', 'books', 'wellness'],
    location: {
      city: 'Bangalore',
      state: 'Karnataka'
    }
  },
  loading: false,
  error: null,
  lastRefresh: null
};

// Helper functions for data manipulation
export const getSectionById = (sectionId: string): HomepageSection | undefined => {
  return homepageSections.find(section => section.id === sectionId);
};

export const getSectionsByType = (type: HomepageSection['type']): HomepageSection[] => {
  return homepageSections.filter(section => section.type === type);
};

export const getItemById = (itemId: string): any => {
  for (const section of homepageSections) {
    const item = section.items.find(item => item.id === itemId);
    if (item) return item;
  }
  return null;
};

export const refreshSectionData = async (sectionId: string): Promise<HomepageSection> => {
  const section = getSectionById(sectionId);
  if (!section) {
    throw new Error(`Section with id ${sectionId} not found`);
  }

  // Return updated section with new timestamp
  return {
    ...section,
    lastUpdated: new Date().toISOString(),
    loading: false,
    error: null
  };
};

// Fallback data loader (used when batch endpoint fails)
export const fetchHomepageData = async (): Promise<HomepageState> => {
  return {
    ...initialHomepageState,
    lastRefresh: new Date().toISOString()
  };
};

export const fetchSectionData = async (sectionId: string): Promise<HomepageSection> => {
  const section = getSectionById(sectionId);
  if (!section) {
    throw new Error(`Section ${sectionId} not found`);
  }
  
  return section;
};

// Export all data for easy access
export default {
  eventsData,
  trendingStoresData,
  newStoresData,
  topStoresData,
  homepageSections,
  initialHomepageState,
  getSectionById,
  getSectionsByType,
  getItemById,
  refreshSectionData,
  fetchHomepageData,
  fetchSectionData
};
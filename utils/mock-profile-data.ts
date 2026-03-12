import { 
  ProfileData, 
  ProfileOption, 
  ReferData, 
  RechargeOption 
} from '@/types/profile';

// Mock Profile Data
export const mockProfileData: ProfileData = {
  id: 'profile-12345',
  name: 'Rejahul',
  email: 'rejahul@example.com',
  phone: '+91 9876543210',
  completionPercentage: 60,
  profilePicture: undefined,
  isVerified: false,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date(),
};

// Mock Profile Options
export const mockProfileOptions: ProfileOption[] = [
  {
    id: "1",
    icon: "wallet-outline",
    title: "Wallet",
    subtitle: "Complete milestones and tasks for the exciting rewards",
    rightLabel: "₹2,075",
    badgeColor: "#38C172",
    onPress: () => {},
  },
  {
    id: "2",
    icon: "receipt-outline",
    title: "Order History",
    subtitle: "View order details",
    onPress: () => {},
  },
  {
    id: "3",
    icon: "heart-outline",
    title: "Wishlist",
    subtitle: "All your Favorites",
    onPress: () => {},
  },
  {
    id: "4",
    icon: "location-outline",
    title: "Saved address",
    subtitle: "Edit, add, delete your address",
    onPress: () => {},
  },
  {
    id: "5",
    icon: "resize-outline",
    title: "Ring Sizer",
    subtitle: "Check your ring size",
    onPress: () => {},
  },
];

// Mock Refer and Earn Data
export const mockReferData: ReferData = {
  title: "Refer and Earn",
  subtitle: "Invite your friends and get free jewellery",
  inviteButtonText: "Invite",
  inviteLink: "https://example.com/invite/user123",
  referralCode: "REF123",
  earnedRewards: 250,
  totalReferrals: 5,
};

// Mock Recharge Options
export const mockRechargeOptions: number[] = [120, 500, 1000, 5000, 10000];

export const mockRechargeOptionsWithBonus: RechargeOption[] = [
  {
    amount: 120,
    bonus: 12,
    isPopular: false,
  },
  {
    amount: 500,
    bonus: 75,
    isPopular: true,
  },
  {
    amount: 1000,
    bonus: 150,
    isPopular: false,
  },
  {
    amount: 5000,
    bonus: 1000,
    isPopular: false,
  },
  {
    amount: 10000,
    bonus: 2500,
    isPopular: false,
  },
];

// Mock API functions
export const fetchProfileData = async (userId: string): Promise<ProfileData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate random failures (5% chance)
  if (Math.random() < 0.05) {
    throw new Error('Failed to fetch profile data');
  }
  
  return {
    ...mockProfileData,
    id: userId,
    updatedAt: new Date(),
  };
};

export const fetchProfileOptions = async (userId: string): Promise<ProfileOption[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Simulate random failures (3% chance)
  if (Math.random() < 0.03) {
    throw new Error('Failed to fetch profile options');
  }
  
  return mockProfileOptions;
};

export const fetchReferData = async (userId: string): Promise<ReferData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simulate random failures (5% chance)
  if (Math.random() < 0.05) {
    throw new Error('Failed to fetch refer data');
  }
  
  // Add some randomization to the data
  return {
    ...mockReferData,
    earnedRewards: Math.floor(Math.random() * 500) + 100,
    totalReferrals: Math.floor(Math.random() * 10) + 1,
  };
};

export const updateProfileCompletion = async (
  userId: string, 
  completionPercentage: number
): Promise<ProfileData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  return {
    ...mockProfileData,
    id: userId,
    completionPercentage,
    updatedAt: new Date(),
  };
};

export const processWalletRecharge = async (
  userId: string, 
  amount: number
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate random failures (10% chance)
  if (Math.random() < 0.1) {
    return {
      success: false,
      error: 'Payment processing failed. Please try again.',
    };
  }
  
  return {
    success: true,
    transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
  };
};

// Default exports
export default {
  mockProfileData,
  mockProfileOptions,
  mockReferData,
  mockRechargeOptions,
  mockRechargeOptionsWithBonus,
  fetchProfileData,
  fetchProfileOptions,
  fetchReferData,
  updateProfileCompletion,
  processWalletRecharge,
};
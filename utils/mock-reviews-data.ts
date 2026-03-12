import { Review, RatingBreakdown, ReviewStats, UGCContent, UserReviewProfile } from '@/types/reviews';

// Mock user profiles
const mockUserProfiles: UserReviewProfile[] = [
  {
    userId: 'user1',
    userName: 'Andrew',
    userAvatar: 'https://i.pravatar.cc/150?img=1',
    totalReviews: 47,
    averageGiven: 4.2,
    isVerifiedReviewer: true,
    reviewerLevel: 'Gold',
    joinedDate: new Date('2022-03-15'),
  },
  {
    userId: 'user2',
    userName: 'Elsa',
    userAvatar: 'https://i.pravatar.cc/150?img=2',
    totalReviews: 23,
    averageGiven: 4.6,
    isVerifiedReviewer: true,
    reviewerLevel: 'Silver',
    joinedDate: new Date('2022-08-20'),
  },
  {
    userId: 'user3',
    userName: 'John',
    userAvatar: 'https://i.pravatar.cc/150?img=3',
    totalReviews: 89,
    averageGiven: 4.1,
    isVerifiedReviewer: true,
    reviewerLevel: 'Platinum',
    joinedDate: new Date('2021-11-10'),
  },
  {
    userId: 'user4',
    userName: 'Sarah',
    userAvatar: 'https://i.pravatar.cc/150?img=4',
    totalReviews: 12,
    averageGiven: 4.8,
    isVerifiedReviewer: false,
    reviewerLevel: 'Bronze',
    joinedDate: new Date('2023-05-03'),
  },
  {
    userId: 'user5',
    userName: 'Mike',
    userAvatar: 'https://i.pravatar.cc/150?img=5',
    totalReviews: 156,
    averageGiven: 3.9,
    isVerifiedReviewer: true,
    reviewerLevel: 'Platinum',
    joinedDate: new Date('2021-02-28'),
  },
];

// Mock reviews data
const mockReviews: Review[] = [
  {
    id: 'rev1',
    userId: 'user1',
    userName: 'Andrew',
    userAvatar: 'https://i.pravatar.cc/150?img=1',
    rating: 5,
    reviewText: 'Great products and great service! The delivery was super fast and the quality exceeded my expectations. Will definitely shop here again.',
    date: new Date('2023-12-04'),
    likes: 22,
    isLiked: false,
    isVerified: true,
    helpfulCount: 18,
    isHelpful: false,
    images: [
      { id: 'img1', uri: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400', caption: 'Product packaging' },
      { id: 'img2', uri: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400', caption: 'Product quality' },
    ],
  },
  {
    id: 'rev2',
    userId: 'user2',
    userName: 'Elsa',
    userAvatar: 'https://i.pravatar.cc/150?img=2',
    rating: 5,
    reviewText: 'Very impressed by the delivery speed and customer service. The staff was helpful and the products are authentic.',
    date: new Date('2023-12-04'),
    likes: 22,
    isLiked: false,
    isVerified: true,
    helpfulCount: 15,
    isHelpful: false,
    storeResponse: {
      id: 'resp1',
      responseText: 'Thank you so much for your kind words! We\'re delighted to hear about your positive experience.',
      date: new Date('2023-12-05'),
      responderName: 'Store Manager',
      responderRole: 'Manager',
    },
  },
  {
    id: 'rev3',
    userId: 'user3',
    userName: 'John',
    userAvatar: 'https://i.pravatar.cc/150?img=3',
    rating: 4,
    reviewText: 'Good quality products and fast delivery. The only minor issue was that one item was slightly different from the description, but overall satisfied. Recommended!',
    date: new Date('2023-12-04'),
    likes: 15,
    isLiked: false,
    isVerified: true,
    helpfulCount: 12,
    isHelpful: false,
  },
  {
    id: 'rev4',
    userId: 'user4',
    userName: 'Sarah',
    userAvatar: 'https://i.pravatar.cc/150?img=4',
    rating: 5,
    reviewText: 'Absolutely love shopping here! The variety is amazing and the prices are competitive. Customer service is top-notch.',
    date: new Date('2023-12-03'),
    likes: 31,
    isLiked: true,
    isVerified: false,
    helpfulCount: 25,
    isHelpful: true,
    images: [
      { id: 'img3', uri: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400', caption: 'Store ambiance' },
    ],
  },
  {
    id: 'rev5',
    userId: 'user5',
    userName: 'Mike',
    userAvatar: 'https://i.pravatar.cc/150?img=5',
    rating: 3,
    reviewText: 'Average experience. Products are okay but nothing exceptional. Delivery took longer than expected. Could be better.',
    date: new Date('2023-12-02'),
    likes: 8,
    isLiked: false,
    isVerified: true,
    helpfulCount: 6,
    isHelpful: false,
  },
  {
    id: 'rev6',
    userId: 'user1',
    userName: 'Andrew',
    userAvatar: 'https://i.pravatar.cc/150?img=1',
    rating: 4,
    reviewText: 'Second time shopping here. Consistent quality and good service. The mobile app could use some improvements though.',
    date: new Date('2023-12-01'),
    likes: 12,
    isLiked: false,
    isVerified: true,
    helpfulCount: 9,
    isHelpful: false,
  },
  {
    id: 'rev7',
    userId: 'user2',
    userName: 'Elsa',
    userAvatar: 'https://i.pravatar.cc/150?img=2',
    rating: 5,
    reviewText: 'Fantastic selection of trendy clothes! Found exactly what I was looking for. The fitting room experience was great too.',
    date: new Date('2023-11-30'),
    likes: 19,
    isLiked: false,
    isVerified: true,
    helpfulCount: 16,
    isHelpful: false,
    images: [
      { id: 'img4', uri: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400', caption: 'Fashion collection' },
      { id: 'img5', uri: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400', caption: 'Store interior' },
    ],
  },
  {
    id: 'rev8',
    userId: 'user3',
    userName: 'John',
    userAvatar: 'https://i.pravatar.cc/150?img=3',
    rating: 2,
    reviewText: 'Disappointed with my recent purchase. The product quality was below expectations and return process was complicated.',
    date: new Date('2023-11-29'),
    likes: 4,
    isLiked: false,
    isVerified: true,
    helpfulCount: 7,
    isHelpful: false,
    storeResponse: {
      id: 'resp2',
      responseText: 'We apologize for your experience. Please contact our customer service team so we can make this right.',
      date: new Date('2023-11-30'),
      responderName: 'Customer Service',
      responderRole: 'Support Team',
    },
  },
];

// Mock UGC content
const mockUGCContent: UGCContent[] = [
  {
    id: 'ugc1',
    userId: 'user1',
    userName: 'Andrew',
    userAvatar: 'https://i.pravatar.cc/150?img=1',
    contentType: 'image',
    uri: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
    caption: 'Love my new outfit from here! #fashion #style',
    likes: 45,
    isLiked: true,
    date: new Date('2023-12-05'),
    productTags: ['T-shirt', 'Jeans'],
  },
  {
    id: 'ugc2',
    userId: 'user4',
    userName: 'Sarah',
    userAvatar: 'https://i.pravatar.cc/150?img=4',
    contentType: 'image',
    uri: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
    caption: 'Perfect fit and amazing quality! 💯',
    likes: 67,
    isLiked: false,
    date: new Date('2023-12-04'),
    productTags: ['Dress'],
  },
  {
    id: 'ugc3',
    userId: 'user2',
    userName: 'Elsa',
    userAvatar: 'https://i.pravatar.cc/150?img=2',
    contentType: 'video',
    uri: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    caption: 'Trying on my new purchases! So happy with everything 😍',
    likes: 89,
    isLiked: true,
    date: new Date('2023-12-03'),
    productTags: ['Jacket', 'Shoes'],
  },
];

// Rating breakdown for the store
export const mockRatingBreakdown: RatingBreakdown = {
  fiveStars: 65, // 65%
  fourStars: 20, // 20%
  threeStars: 10, // 10%
  twoStars: 3,   // 3%
  oneStar: 2,    // 2%
};

// Store review stats
export const mockReviewStats: ReviewStats = {
  totalReviews: 291,
  averageRating: 4.4,
  ratingBreakdown: mockRatingBreakdown,
  monthlyTrend: [
    { month: 'Nov', year: 2023, averageRating: 4.3, reviewCount: 45 },
    { month: 'Dec', year: 2023, averageRating: 4.4, reviewCount: 52 },
    { month: 'Jan', year: 2024, averageRating: 4.5, reviewCount: 38 },
  ],
};

// Helper functions
export const getReviewsByStoreId = (storeId: string): Review[] => {
  // In a real app, this would filter by storeId
  return mockReviews;
};

export const getReviewsByRating = (rating: number): Review[] => {
  return mockReviews.filter(review => review.rating === rating);
};

export const getReviewById = (reviewId: string): Review | undefined => {
  return mockReviews.find(review => review.id === reviewId);
};

export const getUserProfile = (userId: string): UserReviewProfile | undefined => {
  return mockUserProfiles.find(profile => profile.userId === userId);
};

export const getUGCContent = (): UGCContent[] => {
  return mockUGCContent;
};

export const getReviewStats = (storeId: string): ReviewStats => {
  // In a real app, this would calculate stats for specific store
  return mockReviewStats;
};

export const sortReviews = (reviews: Review[], sortBy: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'): Review[] => {
  const sorted = [...reviews];
  
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => b.date.getTime() - a.date.getTime());
    case 'oldest':
      return sorted.sort((a, b) => a.date.getTime() - b.date.getTime());
    case 'highest':
      return sorted.sort((a, b) => b.rating - a.rating);
    case 'lowest':
      return sorted.sort((a, b) => a.rating - b.rating);
    case 'helpful':
      return sorted.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
    default:
      return sorted;
  }
};

// Export main data
export { mockReviews, mockUserProfiles, mockUGCContent };
export default {
  reviews: mockReviews,
  userProfiles: mockUserProfiles,
  ugcContent: mockUGCContent,
  ratingBreakdown: mockRatingBreakdown,
  reviewStats: mockReviewStats,
};
# Search Page API Integration Guide

## 📋 Overview

This document provides a complete guide for integrating the Search Page with your backend APIs. The search page is now production-ready with advanced features including caching, analytics, debouncing, and optimized performance.

---

## 🔌 API Endpoints Used

### 1. Categories API
**Endpoint:** `GET /api/categories`

**Query Parameters:**
- `featured` (boolean): Get only featured categories

**Response Format:**
```typescript
{
  success: boolean;
  data: Array<{
    _id: string;
    name: string;
    slug: string;
    description: string;
    image?: string;
    icon?: string;
    type: 'going_out' | 'home_delivery';
    isFeatured: boolean;
    cashbackPercentage?: number;
  }>;
}
```

**Usage in Search Page:**
```typescript
const response = await apiClient.get('/categories', {
  featured: true
});
```

---

### 2. Product Search API
**Endpoint:** `GET /api/search/products`

**Query Parameters:**
- `q` (string): Search query
- `page` (number): Page number for pagination
- `limit` (number): Results per page
- `minPrice` (number, optional): Minimum price filter
- `maxPrice` (number, optional): Maximum price filter
- `minRating` (number, optional): Minimum rating filter
- `category` (string, optional): Category filter
- `sortBy` (string, optional): Sort option

**Response Format:**
```typescript
{
  success: boolean;
  data: Array<{
    _id: string;
    name: string;
    description: string;
    shortDescription?: string;
    images: string[];
    category: {
      _id: string;
      name: string;
    };
    pricing: {
      selling: number;
      original?: number;
      currency: string;
    };
    cashback?: {
      percentage: number;
    };
    ratings?: {
      average: number;
      count: number;
    };
    tags?: string[];
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}
```

---

### 3. Store Search API
**Endpoint:** `GET /api/search/stores`

**Query Parameters:**
- `q` (string): Search query
- `page` (number): Page number
- `limit` (number): Results per page
- `category` (string, optional): Category filter
- `sortBy` (string, optional): Sort option

**Response Format:**
```typescript
{
  success: boolean;
  data: Array<{
    _id: string;
    name: string;
    slug: string;
    description?: string;
    logo: string;
    location?: {
      address: string;
      coordinates: [number, number];
    };
    ratings?: {
      average: number;
      count: number;
    };
    category?: {
      _id: string;
      name: string;
    };
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}
```

---

## 🛠️ Backend Integration Steps

### Step 1: Implement Categories Endpoint

Create an endpoint to fetch featured categories:

```typescript
// Example Express.js route
router.get('/api/categories', async (req, res) => {
  try {
    const { featured } = req.query;
    
    const query = featured === 'true' ? { isFeatured: true } : {};
    const categories = await Category.find(query).lean();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### Step 2: Implement Product Search Endpoint

Create a full-text search endpoint for products:

```typescript
router.get('/api/search/products', async (req, res) => {
  try {
    const {
      q,
      page = 1,
      limit = 20,
      minPrice,
      maxPrice,
      minRating,
      category,
      sortBy = 'relevance'
    } = req.query;
    
    // Build search query
    const searchQuery = {
      $text: { $search: q }
    };
    
    // Add filters
    if (minPrice || maxPrice) {
      searchQuery['pricing.selling'] = {};
      if (minPrice) searchQuery['pricing.selling'].$gte = Number(minPrice);
      if (maxPrice) searchQuery['pricing.selling'].$lte = Number(maxPrice);
    }
    
    if (minRating) {
      searchQuery['ratings.average'] = { $gte: Number(minRating) };
    }
    
    if (category) {
      searchQuery.category = category;
    }
    
    // Build sort options
    let sort = {};
    switch (sortBy) {
      case 'price_low':
        sort = { 'pricing.selling': 1 };
        break;
      case 'price_high':
        sort = { 'pricing.selling': -1 };
        break;
      case 'rating':
        sort = { 'ratings.average': -1 };
        break;
      default:
        sort = { score: { $meta: 'textScore' } };
    }
    
    // Execute query
    const skip = (page - 1) * limit;
    const products = await Product
      .find(searchQuery)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('category')
      .lean();
    
    const total = await Product.countDocuments(searchQuery);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore: skip + products.length < total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### Step 3: Implement Store Search Endpoint

Create a search endpoint for stores:

```typescript
router.get('/api/search/stores', async (req, res) => {
  try {
    const {
      q,
      page = 1,
      limit = 20,
      category,
      sortBy = 'relevance'
    } = req.query;
    
    const searchQuery = {
      $text: { $search: q }
    };
    
    if (category) {
      searchQuery.category = category;
    }
    
    const sort = sortBy === 'rating' 
      ? { 'ratings.average': -1 }
      : { score: { $meta: 'textScore' } };
    
    const skip = (page - 1) * limit;
    const stores = await Store
      .find(searchQuery)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('category')
      .lean();
    
    const total = await Store.countDocuments(searchQuery);
    
    res.json({
      success: true,
      data: stores,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore: skip + stores.length < total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### Step 4: Create Text Indexes

Ensure your database has text indexes for search:

```javascript
// MongoDB indexes
db.products.createIndex({
  name: "text",
  description: "text",
  tags: "text"
});

db.stores.createIndex({
  name: "text",
  description: "text"
});

db.categories.createIndex({
  name: "text",
  description: "text"
});
```

---

## 🎯 Frontend Integration

### Using the Search Hook

The search page uses the `useSearch` hook for API integration:

```typescript
import { useSearch } from '@/hooks/useSearch';

const { state, actions } = useSearch();

// Search all (products + stores)
await actions.searchAll('pizza');

// Access results
const products = state.productResults;
const stores = state.storeResults;
const pagination = state.pagination;
```

### Caching Implementation

The search page automatically caches results:

```typescript
import { searchCacheService } from '@/services/searchCacheService';

// Save to cache
await searchCacheService.saveToCache(query, results);

// Get from cache
const cached = await searchCacheService.getFromCache(query);

// Clear cache
await searchCacheService.clearCache();

// Get cache statistics
const stats = await searchCacheService.getCacheStats();
```

### Analytics Tracking

All search interactions are tracked:

```typescript
import { searchAnalyticsService } from '@/services/searchAnalyticsService';

// Track search
await searchAnalyticsService.trackSearch('pizza', 15);

// Track result click
await searchAnalyticsService.trackResultClick(
  'pizza',
  'product-123',
  'product',
  1 // position
);

// Get analytics
const analytics = await searchAnalyticsService.getAnalytics(7); // last 7 days
```

---

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```env
# API Configuration
EXPO_PUBLIC_API_URL=https://api.yourapp.com
EXPO_PUBLIC_API_TIMEOUT=10000

# Search Configuration
SEARCH_CACHE_DURATION=300000  # 5 minutes
SEARCH_DEBOUNCE_DELAY=300     # 300ms
SEARCH_MIN_LENGTH=2           # Minimum query length
```

### API Client Configuration

The `apiClient` is configured in `utils/apiClient.ts`:

```typescript
import { create } from 'apisauce';

const apiClient = create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: Number(process.env.EXPO_PUBLIC_API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth interceptor
apiClient.addAsyncRequestTransform(async (request) => {
  const token = await getAuthToken();
  if (token) {
    request.headers['Authorization'] = `Bearer ${token}`;
  }
});
```

---

## 📊 Data Mapping

### Category Mapping

```typescript
const mapToSearchCategory = (cat: any): SearchCategory => ({
  id: cat._id,
  name: cat.name,
  slug: cat.slug,
  description: cat.description,
  image: cat.image || cat.icon,
  cashbackPercentage: cat.cashbackPercentage || 10,
  isPopular: cat.isFeatured || false,
});
```

### Product Result Mapping

```typescript
const mapProductToSearchResult = (product: any): SearchResult => ({
  id: product._id,
  title: product.name,
  description: product.shortDescription || product.description || '',
  image: product.images?.[0],
  category: product.category?.name || '',
  cashbackPercentage: product.cashback?.percentage || 0,
  rating: product.ratings?.average,
  price: {
    current: product.pricing?.selling || 0,
    original: product.pricing?.original,
    currency: 'INR'
  },
  tags: product.tags || [],
});
```

### Store Result Mapping

```typescript
const mapStoreToSearchResult = (store: any): SearchResult => ({
  id: store._id,
  title: store.name,
  description: store.description || '',
  image: store.logo,
  category: 'Store',
  cashbackPercentage: 10,
  rating: store.ratings?.average,
  location: store.location?.address,
});
```

---

## 🚀 Performance Optimization

### 1. Debouncing

Search queries are debounced to reduce API calls:

```typescript
import useDebouncedSearch from '@/hooks/useDebouncedSearch';

const { debouncedValue } = useDebouncedSearch('', {
  delay: 300,
  minLength: 2
});

// Only searches when user stops typing for 300ms
```

### 2. Caching

Results are cached for 5 minutes to improve performance:

- Cache hit: Instant results
- Cache miss: API call + cache update
- Automatic cleanup of old entries

### 3. Virtualized Lists

Large result sets use virtualized rendering:

```typescript
import VirtualizedResultsList from '@/components/search/VirtualizedResultsList';

<VirtualizedResultsList
  results={results}
  onResultPress={handleResultPress}
  onEndReached={loadMore}
/>
```

### 4. Image Optimization

Images use `react-native-fast-image` for better performance:

```typescript
<FastImage
  source={{ 
    uri: imageUrl,
    priority: FastImage.priority.normal,
    cache: FastImage.cacheControl.immutable,
  }}
/>
```

---

## 🧪 Testing

### Running Tests

```bash
# Unit tests
cd frontend
npm test -- search.test.ts

# E2E tests (requires setup)
npm run test:e2e
```

### Test Coverage

- ✅ Debounced search hook
- ✅ Cache service (save, retrieve, clear)
- ✅ Analytics service (tracking, stats)
- ✅ Search integration
- ✅ E2E user flows

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Search Returns No Results

**Symptom:** Empty search results despite valid query

**Solutions:**
- Check if text indexes are created on the database
- Verify API endpoint is returning data
- Check network requests in DevTools
- Verify mapping functions are correct

#### 2. Search is Too Slow

**Symptom:** Search takes > 3 seconds

**Solutions:**
- Enable caching
- Add database indexes
- Optimize database queries
- Use pagination
- Reduce result limit

#### 3. Cache Not Working

**Symptom:** Same query always hits API

**Solutions:**
- Check AsyncStorage permissions
- Verify cache expiration settings
- Clear old cache: `searchCacheService.clearCache()`

#### 4. Analytics Not Tracking

**Symptom:** Analytics show zero events

**Solutions:**
- Check AsyncStorage is working
- Verify analytics service initialization
- Check console for errors
- Manually test: `searchAnalyticsService.trackSearch('test', 5)`

---

## 📈 Analytics Dashboard

### Viewing Analytics Data

Get analytics for the last 7 days:

```typescript
const analytics = await searchAnalyticsService.getAnalytics(7);

console.log('Total Searches:', analytics.totalSearches);
console.log('Total Clicks:', analytics.totalClicks);
console.log('CTR:', analytics.clickThroughRate.toFixed(2) + '%');
console.log('Popular Queries:', analytics.popularQueries);
console.log('No Results Queries:', analytics.noResultsQueries);
console.log('Avg Click Position:', analytics.averagePosition);
```

### Export Analytics

Export analytics data for reporting:

```typescript
const exported = await searchAnalyticsService.exportAnalytics();
console.log(exported); // JSON string
```

---

## 🔐 Security Considerations

### 1. Input Validation

Always validate search queries on the backend:

```typescript
if (!q || q.length < 2 || q.length > 100) {
  return res.status(400).json({
    success: false,
    error: 'Invalid search query'
  });
}
```

### 2. Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
import rateLimit from 'express-rate-limit';

const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30 // 30 requests per minute
});

router.get('/api/search/*', searchLimiter);
```

### 3. SQL Injection Prevention

Use parameterized queries and sanitize input:

```typescript
import validator from 'validator';

const sanitizedQuery = validator.escape(q);
```

---

## 📝 Summary

The Search Page is now fully integrated with:

✅ Real backend APIs  
✅ Advanced caching system  
✅ Analytics tracking  
✅ Debounced search  
✅ Performance optimizations  
✅ Comprehensive error handling  
✅ Unit and E2E tests  

For support or questions, refer to the main documentation or contact the development team.


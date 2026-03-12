# Data Formatters & Normalizers

Comprehensive utilities for formatting prices, ratings, and normalizing product/store data across the application.

## Overview

These utilities solve common data inconsistency issues by providing:

1. **Product Data Normalization** - Handles different API response structures
2. **Price Formatting** - Consistent price display with currency symbols
3. **Rating Formatting** - Safe rating calculations with validation

## Files Created

```
utils/
├── productDataNormalizer.ts  # Product/store data normalization
├── priceFormatter.ts          # Price formatting & validation
├── ratingFormatter.ts         # Rating formatting & display
└── dataFormatters.ts          # Central export file
```

---

## Product Data Normalizer

**File:** `utils/productDataNormalizer.ts`

Normalizes inconsistent product and store data from different API sources.

### Key Functions

#### `normalizeProductPrice(product)`

Prioritizes `price.current` over `pricing.selling` to handle different API structures.

```typescript
import { normalizeProductPrice } from '@/utils/dataFormatters';

const product = { price: { current: 100, original: 150 } };
const normalized = normalizeProductPrice(product);
// { current: 100, original: 150, discount: 33 }
```

**Priority Order:**
1. `price.current` / `price.original`
2. `pricing.selling` / `pricing.mrp`
3. `sellingPrice` / `mrp`

#### `normalizeProductRating(product)`

Prioritizes `rating.value` over `ratings.average`.

```typescript
const product = { rating: { value: 4.5, count: 120 } };
const normalized = normalizeProductRating(product);
// { value: 4.5, count: 120 }
```

**Priority Order:**
1. `rating.value` / `rating.count`
2. `ratings.average` / `ratings.total`
3. `ratingValue` / `ratingCount`

#### `normalizeProductId(product)`

Standardizes `_id` to `id`.

```typescript
const product = { _id: '12345' };
const id = normalizeProductId(product);
// '12345'
```

**Priority Order:**
1. `id`
2. `_id` (MongoDB default)
3. `productId`

#### `normalizeProductImage(product)`

Handles both image arrays and single image objects.

```typescript
const product = { images: [{ url: 'img1.jpg' }, { url: 'img2.jpg' }] };
const normalized = normalizeProductImage(product);
// [{ url: 'img1.jpg', alt: 'Product image 1' }, ...]
```

**Priority Order:**
1. `images` array
2. `image` array
3. `image` object
4. `image` string
5. `imageUrl`
6. `thumbnail`

#### `normalizeProduct(product)`

Normalizes all fields at once.

```typescript
const rawProduct = {
  _id: '123',
  price: { current: 100, original: 150 },
  rating: { value: 4.5, count: 120 },
  images: ['img1.jpg']
};

const normalized = normalizeProduct(rawProduct);
// {
//   ...rawProduct,
//   id: '123',
//   price: { current: 100, original: 150, discount: 33 },
//   rating: { value: 4.5, count: 120 },
//   images: [{ url: 'img1.jpg', alt: '...' }]
// }
```

#### `normalizeProducts(products[])`

Normalizes an array of products.

```typescript
const products = [product1, product2, product3];
const normalized = normalizeProducts(products);
```

### Store Functions

- `normalizeStoreId(store)` - Standardizes store ID
- `normalizeStoreName(store)` - Standardizes store name
- `normalizeStore(store)` - Normalizes entire store object
- `normalizeStores(stores[])` - Normalizes array of stores

---

## Price Formatter

**File:** `utils/priceFormatter.ts`

Provides consistent price formatting with currency symbols and validation.

### Key Functions

#### `validatePrice(price)`

Validates if a price is valid.

```typescript
import { validatePrice } from '@/utils/dataFormatters';

validatePrice(100);        // 100
validatePrice('100');      // 100
validatePrice(null);       // null
validatePrice(-10);        // null
validatePrice(undefined);  // null
```

#### `formatPrice(price, currency?, showDecimals?)`

Formats price with currency symbol.

```typescript
import { formatPrice } from '@/utils/dataFormatters';

formatPrice(1234.56);              // '₹1,234.56'
formatPrice(1234.56, 'USD');       // '$1,234.56'
formatPrice(1234, 'INR', false);   // '₹1,234'
formatPrice(null);                 // null
```

**Supported Currencies:** INR, USD, EUR, GBP, JPY, AUD, CAD

#### `formatDiscount(originalPrice, currentPrice)`

Calculates discount percentage.

```typescript
import { formatDiscount } from '@/utils/dataFormatters';

formatDiscount(100, 80);   // 20
formatDiscount(100, 100);  // null
formatDiscount(100, 120);  // null (invalid)
```

#### `formatDiscountString(originalPrice, currentPrice)`

Formats discount as string.

```typescript
formatDiscountString(100, 80);   // '20% OFF'
formatDiscountString(100, 100);  // null
```

#### `formatSavings(originalPrice, currentPrice, currency?)`

Calculates and formats savings amount.

```typescript
formatSavings(100, 80);           // 'Save ₹20.00'
formatSavings(100, 80, 'USD');    // 'Save $20.00'
```

#### `formatPriceDisplay(originalPrice, currentPrice, currency?)`

Complete price display object.

```typescript
formatPriceDisplay(100, 80);
// {
//   current: '₹80.00',
//   original: '₹100.00',
//   discount: '20% OFF',
//   savings: 'Save ₹20.00'
// }
```

#### `formatPriceRange(minPrice, maxPrice, currency?)`

Formats price range.

```typescript
formatPriceRange(100, 200);  // '₹100.00 - ₹200.00'
formatPriceRange(100, 100);  // '₹100.00'
```

### Utility Functions

- `parsePrice(priceString)` - Extracts number from price string
- `comparePrice(price1, price2)` - Compares two prices
- `isPriceInRange(price, min, max)` - Checks if price is in range
- `calculateSavings(original, current)` - Calculates savings amount

---

## Rating Formatter

**File:** `utils/ratingFormatter.ts`

Provides safe rating formatting with validation and display utilities.

### Key Functions

#### `validateRating(rating)`

Validates rating value (0-5).

```typescript
import { validateRating } from '@/utils/dataFormatters';

validateRating(4.5);       // 4.5
validateRating('4.5');     // 4.5
validateRating(6);         // null (exceeds max)
validateRating(-1);        // null (below min)
```

#### `formatRating(rating, decimals?)`

Formats rating to decimal places.

```typescript
import { formatRating } from '@/utils/dataFormatters';

formatRating(4.567);       // 4.6
formatRating(4.567, 2);    // 4.57
formatRating(null);        // null
```

#### `getRatingDisplay(rating, reviewCount?, decimals?)`

Gets rating display string.

```typescript
import { getRatingDisplay } from '@/utils/dataFormatters';

getRatingDisplay(4.5);              // '4.5'
getRatingDisplay(4.5, 120);         // '4.5 (120)'
getRatingDisplay(4.567, 120, 2);    // '4.57 (120)'
```

#### `getStarDisplay(rating)`

Gets star counts for display.

```typescript
getStarDisplay(4.5);
// { full: 4, half: 1, empty: 0 }

getStarDisplay(3.2);
// { full: 3, half: 0, empty: 2 }
```

#### `formatReviewCount(count)`

Formats review count with K/M suffixes.

```typescript
formatReviewCount(100);      // '100'
formatReviewCount(1500);     // '1.5K'
formatReviewCount(1500000);  // '1.5M'
```

#### `getReviewCountText(count, showZero?)`

Gets review count text.

```typescript
getReviewCountText(100);     // '100 reviews'
getReviewCountText(1);       // '1 review'
getReviewCountText(0);       // null
getReviewCountText(0, true); // '0 reviews'
```

#### `getRatingColor(rating)`

Gets color code based on rating.

```typescript
getRatingColor(4.5);  // '#4CAF50' (green)
getRatingColor(3.5);  // '#8BC34A' (light green)
getRatingColor(2.5);  // '#FFC107' (amber)
getRatingColor(1.5);  // '#FF9800' (orange)
getRatingColor(0.5);  // '#F44336' (red)
```

#### `getRatingCategory(rating)`

Gets category label.

```typescript
getRatingCategory(4.5);  // 'Excellent'
getRatingCategory(3.5);  // 'Good'
getRatingCategory(2.5);  // 'Average'
getRatingCategory(1.5);  // 'Below Average'
getRatingCategory(0.5);  // 'Poor'
```

#### `formatRatingDisplay(rating, reviewCount?)`

Complete rating display object.

```typescript
formatRatingDisplay(4.5, 120);
// {
//   value: 4.5,
//   display: '4.5 (120)',
//   stars: { full: 4, half: 1, empty: 0 },
//   reviewText: '120 reviews',
//   percentage: 90,
//   color: '#4CAF50',
//   category: 'Excellent'
// }
```

### Utility Functions

- `validateReviewCount(count)` - Validates review count
- `getRatingPercentage(rating)` - Calculates percentage (0-100)
- `compareRating(rating1, rating2)` - Compares two ratings
- `isRatingInRange(rating, min, max)` - Checks if rating is in range
- `calculateAverageRating(ratings[])` - Calculates average from array
- `getRatingDistribution(ratings[])` - Gets distribution (5-star, 4-star, etc.)

---

## Usage Examples

### In Components

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import {
  normalizeProduct,
  formatPrice,
  getRatingDisplay
} from '@/utils/dataFormatters';

function ProductCard({ product }) {
  // Normalize the product data
  const normalized = normalizeProduct(product);

  // Format price
  const price = formatPrice(normalized.price.current);

  // Format rating
  const rating = getRatingDisplay(
    normalized.rating.value,
    normalized.rating.count
  );

  return (
    <View>
      <Text>{normalized.name}</Text>
      <Text>{price}</Text>
      <Text>{rating}</Text>
    </View>
  );
}
```

### In API Response Handlers

```typescript
import { normalizeProducts } from '@/utils/dataFormatters';

async function fetchProducts() {
  const response = await fetch('/api/products');
  const data = await response.json();

  // Normalize all products at once
  const normalizedProducts = normalizeProducts(data.products);

  return normalizedProducts;
}
```

### In Hooks

```typescript
import { useMemo } from 'react';
import { formatPriceDisplay, formatRatingDisplay } from '@/utils/dataFormatters';

function useProductDisplay(product) {
  const priceDisplay = useMemo(
    () => formatPriceDisplay(product.price.original, product.price.current),
    [product]
  );

  const ratingDisplay = useMemo(
    () => formatRatingDisplay(product.rating.value, product.rating.count),
    [product]
  );

  return { priceDisplay, ratingDisplay };
}
```

---

## Best Practices

### 1. Always Normalize API Data

```typescript
// ✅ Good
const products = await fetchProducts();
const normalized = normalizeProducts(products);

// ❌ Bad
const products = await fetchProducts();
// Using products directly without normalization
```

### 2. Use Validation Before Formatting

```typescript
// ✅ Good
const price = validatePrice(product.price);
if (price !== null) {
  const formatted = formatPrice(price);
}

// ❌ Bad
const formatted = formatPrice(product.price); // May return null
```

### 3. Handle Null Returns

```typescript
// ✅ Good
const formatted = formatPrice(price);
return formatted || 'Price not available';

// ❌ Bad
return formatPrice(price); // May display 'null' on screen
```

### 4. Use Memoization for Performance

```typescript
// ✅ Good
const formattedPrice = useMemo(
  () => formatPrice(product.price),
  [product.price]
);

// ❌ Bad
const formattedPrice = formatPrice(product.price); // Recalculates on every render
```

---

## Type Safety

All functions include TypeScript types and JSDoc comments for:

- IntelliSense support in IDEs
- Type checking at compile time
- Better documentation
- Fewer runtime errors

```typescript
/**
 * Formats a price value with currency symbol
 * @param price - Price value to format
 * @param currency - Currency code (default: 'INR')
 * @returns Formatted price string or null if invalid
 */
export function formatPrice(
  price: number | null | undefined,
  currency: string = 'INR'
): string | null
```

---

## Error Handling

All functions handle edge cases safely:

- ✅ Null/undefined values
- ✅ Invalid types (strings, objects, etc.)
- ✅ Out of range values
- ✅ NaN and Infinity
- ✅ Empty arrays/objects

---

## Testing

Example test cases:

```typescript
// Price validation
expect(validatePrice(100)).toBe(100);
expect(validatePrice(null)).toBe(null);
expect(validatePrice(-10)).toBe(null);

// Rating validation
expect(validateRating(4.5)).toBe(4.5);
expect(validateRating(6)).toBe(null);

// Normalization
const product = { _id: '123', price: { current: 100 } };
expect(normalizeProductId(product)).toBe('123');
```

---

## Migration Guide

### Before (Inconsistent)

```typescript
// Different price access patterns
const price1 = product.price.current;
const price2 = product.pricing.selling;
const price3 = product.sellingPrice;

// Direct formatting (no validation)
const formatted = `₹${price}`;
```

### After (Consistent)

```typescript
import { normalizeProduct, formatPrice } from '@/utils/dataFormatters';

const normalized = normalizeProduct(product);
const formatted = formatPrice(normalized.price.current);
```

---

## Performance Considerations

- All functions are pure (no side effects)
- Suitable for memoization
- Minimal computational overhead
- No external dependencies
- Tree-shakeable exports

---

## Troubleshooting

### Issue: formatPrice returns null

**Cause:** Invalid price value

**Solution:**
```typescript
const price = validatePrice(product.price);
if (price === null) {
  console.error('Invalid price:', product.price);
}
```

### Issue: Ratings showing incorrect values

**Cause:** Using wrong rating field

**Solution:**
```typescript
// Use normalization to handle all cases
const normalized = normalizeProductRating(product);
const rating = normalized.value; // Always correct
```

### Issue: Product ID undefined

**Cause:** Different ID field names

**Solution:**
```typescript
const id = normalizeProductId(product); // Handles _id, id, productId
```

---

## Summary

These utilities provide a robust, type-safe, and consistent way to handle data formatting and normalization across your application. They eliminate common bugs related to:

- Inconsistent API responses
- Missing null checks
- Different field naming conventions
- Price/rating display inconsistencies

Simply import and use the functions wherever you need them!

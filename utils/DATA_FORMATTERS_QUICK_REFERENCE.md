# Data Formatters - Quick Reference

## Import

```typescript
import {
  // Product Normalization
  normalizeProduct,
  normalizeProducts,

  // Price Formatting
  formatPrice,
  formatDiscount,

  // Rating Formatting
  formatRating,
  getRatingDisplay
} from '@/utils/dataFormatters';
```

---

## Common Use Cases

### 1. Display Product Price

```typescript
// Simple price
const price = formatPrice(product.price.current);
// '₹1,234.56'

// With discount
const { current, original, discount } = formatPriceDisplay(
  product.price.original,
  product.price.current
);
// current: '₹80.00'
// original: '₹100.00'
// discount: '20% OFF'
```

### 2. Display Product Rating

```typescript
// Simple rating
const rating = getRatingDisplay(4.5);
// '4.5'

// With review count
const rating = getRatingDisplay(4.5, 120);
// '4.5 (120)'

// Complete display
const display = formatRatingDisplay(4.5, 120);
// {
//   value: 4.5,
//   display: '4.5 (120)',
//   stars: { full: 4, half: 1, empty: 0 },
//   reviewText: '120 reviews',
//   color: '#4CAF50'
// }
```

### 3. Normalize API Response

```typescript
// Single product
const normalized = normalizeProduct(apiProduct);

// Multiple products
const normalized = normalizeProducts(apiProducts);

// Now use consistently
normalized.id           // Always string
normalized.price        // Always { current, original, discount }
normalized.rating       // Always { value, count }
normalized.images       // Always [{ url, alt }]
```

### 4. Safe Price Display

```typescript
const priceDisplay = formatPrice(product.price) || 'Price not available';
```

### 5. Safe Rating Display

```typescript
const ratingDisplay = getRatingDisplay(product.rating) || 'No rating';
```

---

## Function Cheat Sheet

### Product Normalization

| Function | Input | Output |
|----------|-------|--------|
| `normalizeProduct(product)` | Any product object | Normalized product |
| `normalizeProducts(products)` | Array of products | Array of normalized |
| `normalizeProductId(product)` | Product with _id/id | String or null |
| `normalizeProductPrice(product)` | Product with price | { current, original, discount } |
| `normalizeProductRating(product)` | Product with rating | { value, count } |
| `normalizeProductImage(product)` | Product with images | [{ url, alt }] |

### Price Formatting

| Function | Input | Output | Example |
|----------|-------|--------|---------|
| `formatPrice(price)` | number | string | '₹1,234.56' |
| `formatDiscount(orig, curr)` | numbers | number | 20 |
| `formatDiscountString(orig, curr)` | numbers | string | '20% OFF' |
| `formatSavings(orig, curr)` | numbers | string | 'Save ₹20.00' |
| `validatePrice(price)` | any | number or null | 100 or null |

### Rating Formatting

| Function | Input | Output | Example |
|----------|-------|--------|---------|
| `formatRating(rating)` | number | number | 4.5 |
| `getRatingDisplay(rating, count)` | numbers | string | '4.5 (120)' |
| `getStarDisplay(rating)` | number | object | { full: 4, half: 1, empty: 0 } |
| `formatReviewCount(count)` | number | string | '1.5K' |
| `getRatingColor(rating)` | number | string | '#4CAF50' |
| `validateRating(rating)` | any | number or null | 4.5 or null |

---

## Component Examples

### ProductCard Component

```typescript
function ProductCard({ product }) {
  const normalized = normalizeProduct(product);
  const price = formatPrice(normalized.price.current);
  const rating = getRatingDisplay(normalized.rating.value, normalized.rating.count);

  return (
    <View>
      <Text>{normalized.name}</Text>
      <Text>{price}</Text>
      <Text>{rating}</Text>
    </View>
  );
}
```

### PriceDisplay Component

```typescript
function PriceDisplay({ product }) {
  const { current, original, discount } = formatPriceDisplay(
    product.price.original,
    product.price.current
  );

  return (
    <View>
      <Text style={styles.current}>{current}</Text>
      {original && <Text style={styles.original}>{original}</Text>}
      {discount && <Text style={styles.discount}>{discount}</Text>}
    </View>
  );
}
```

### RatingDisplay Component

```typescript
function RatingDisplay({ rating, count }) {
  const { stars, color, reviewText } = formatRatingDisplay(rating, count);

  return (
    <View>
      <StarIcons {...stars} color={color} />
      <Text>{reviewText}</Text>
    </View>
  );
}
```

---

## Validation Examples

### Check if Price is Valid

```typescript
const price = validatePrice(product.price);
if (price === null) {
  console.error('Invalid price');
}
```

### Check if Rating is Valid

```typescript
const rating = validateRating(product.rating);
if (rating === null) {
  console.error('Invalid rating');
}
```

### Safe Navigation

```typescript
const price = normalizeProduct(product)?.price?.current;
const formatted = formatPrice(price) || 'N/A';
```

---

## Edge Cases Handled

✅ **Null/Undefined Values**
```typescript
formatPrice(null)        // null
formatRating(undefined)  // null
```

✅ **Invalid Types**
```typescript
formatPrice('invalid')   // null
formatRating('abc')      // null
```

✅ **Out of Range**
```typescript
formatPrice(-10)         // null (negative)
formatRating(6)          // null (max is 5)
```

✅ **Different Field Names**
```typescript
// Handles all of these
product.price.current
product.pricing.selling
product.sellingPrice
```

---

## Performance Tips

### Use Memoization

```typescript
const formattedPrice = useMemo(
  () => formatPrice(product.price),
  [product.price]
);
```

### Normalize Once

```typescript
// ✅ Good - normalize once
const normalized = normalizeProducts(products);

// ❌ Bad - normalize repeatedly
products.map(p => normalizeProduct(p))
```

---

## Common Patterns

### List Rendering

```typescript
const products = normalizeProducts(apiProducts);

products.map(product => (
  <ProductCard
    key={product.id}
    price={formatPrice(product.price.current)}
    rating={getRatingDisplay(product.rating.value, product.rating.count)}
  />
));
```

### Filtering by Price

```typescript
const inBudget = products.filter(p => {
  const price = normalizeProductPrice(p);
  return isPriceInRange(price.current, 0, 1000);
});
```

### Sorting by Rating

```typescript
const sorted = [...products].sort((a, b) => {
  const ratingA = normalizeProductRating(a).value || 0;
  const ratingB = normalizeProductRating(b).value || 0;
  return ratingB - ratingA;
});
```

---

## TypeScript Types

```typescript
// Price object
type Price = {
  current: number | null;
  original: number | null;
  discount: number | null;
}

// Rating object
type Rating = {
  value: number | null;
  count: number | null;
}

// Image object
type Image = {
  url: string;
  alt: string;
}

// Normalized product
type NormalizedProduct = {
  id: string | null;
  price: Price;
  rating: Rating;
  images: Image[];
  // ... other fields
}
```

---

## Debugging Tips

### Log Normalized Data

```typescript
const normalized = normalizeProduct(product);
console.log('Normalized:', normalized);
console.log('Price:', normalized.price);
console.log('Rating:', normalized.rating);
```

### Check Validation

```typescript
const price = validatePrice(product.price);
console.log('Valid price:', price !== null);

const rating = validateRating(product.rating);
console.log('Valid rating:', rating !== null);
```

---

## Remember

1. **Always normalize** API data before using
2. **Always validate** before formatting
3. **Always handle null** returns
4. **Use memoization** for performance
5. **Check types** with TypeScript

---

## Need More Info?

See `DATA_FORMATTERS_README.md` for detailed documentation.

# Data Formatters Migration Guide

This guide helps you migrate existing code to use the new data formatter utilities.

---

## Step-by-Step Migration

### Step 1: Install/Import

No installation needed - utilities are already in your project.

```typescript
// Add this import to files that need formatting
import {
  normalizeProduct,
  formatPrice,
  formatRating,
  getRatingDisplay
} from '@/utils/dataFormatters';
```

---

### Step 2: Identify Problem Areas

Search for these patterns in your codebase:

#### Price Access Patterns

```bash
# Search for direct price access
grep -r "\.price\." src/
grep -r "\.pricing\." src/
grep -r "sellingPrice" src/
```

#### Rating Access Patterns

```bash
# Search for direct rating access
grep -r "\.rating\." src/
grep -r "\.ratings\." src/
grep -r "ratingValue" src/
```

#### Price Formatting

```bash
# Search for manual price formatting
grep -r "₹\${" src/
grep -r "\$\${" src/
grep -r "toFixed(2)" src/
```

---

### Step 3: Replace Direct Access

#### Before: Direct Price Access

```typescript
// ❌ Old way - inconsistent, error-prone
function ProductCard({ product }) {
  const price = product.price?.current || product.pricing?.selling || 0;
  const mrp = product.price?.original || product.pricing?.mrp || 0;

  return (
    <View>
      <Text>₹{price}</Text>
      {mrp > price && <Text>₹{mrp}</Text>}
    </View>
  );
}
```

#### After: Using Normalizer + Formatter

```typescript
// ✅ New way - consistent, safe
import { normalizeProduct, formatPrice } from '@/utils/dataFormatters';

function ProductCard({ product }) {
  const normalized = normalizeProduct(product);
  const currentPrice = formatPrice(normalized.price.current);
  const originalPrice = formatPrice(normalized.price.original);

  return (
    <View>
      <Text>{currentPrice}</Text>
      {originalPrice && <Text>{originalPrice}</Text>}
    </View>
  );
}
```

---

### Step 4: Replace Rating Display

#### Before: Manual Rating Display

```typescript
// ❌ Old way
function RatingDisplay({ product }) {
  const rating = product.rating?.value || product.ratings?.average || 0;
  const count = product.rating?.count || product.ratings?.total || 0;

  return (
    <View>
      <Text>{rating.toFixed(1)}</Text>
      {count > 0 && <Text>({count})</Text>}
    </View>
  );
}
```

#### After: Using Formatter

```typescript
// ✅ New way
import { getRatingDisplay, formatReviewCount } from '@/utils/dataFormatters';

function RatingDisplay({ product }) {
  const normalized = normalizeProduct(product);
  const display = getRatingDisplay(
    normalized.rating.value,
    normalized.rating.count
  );

  return <Text>{display}</Text>;
}
```

---

### Step 5: Update API Response Handlers

#### Before: Using Raw API Data

```typescript
// ❌ Old way
async function fetchProducts() {
  const response = await fetch('/api/products');
  const data = await response.json();
  return data.products; // Raw data
}

// Used in component
const products = await fetchProducts();
products.map(p => {
  const price = p.price?.current || p.pricing?.selling;
  // Inconsistent access everywhere
});
```

#### After: Normalizing at Source

```typescript
// ✅ New way
import { normalizeProducts } from '@/utils/dataFormatters';

async function fetchProducts() {
  const response = await fetch('/api/products');
  const data = await response.json();
  return normalizeProducts(data.products); // Normalized data
}

// Used in component
const products = await fetchProducts();
products.map(p => {
  const price = formatPrice(p.price.current); // Always consistent
});
```

---

### Step 6: Update Custom Hooks

#### Before: Manual Formatting in Hooks

```typescript
// ❌ Old way
function useProductPrice(product) {
  const [price, setPrice] = useState('');

  useEffect(() => {
    const currentPrice = product.price?.current || product.pricing?.selling || 0;
    setPrice(`₹${currentPrice.toFixed(2)}`);
  }, [product]);

  return price;
}
```

#### After: Using Formatters

```typescript
// ✅ New way
import { normalizeProduct, formatPrice } from '@/utils/dataFormatters';

function useProductPrice(product) {
  return useMemo(() => {
    const normalized = normalizeProduct(product);
    return formatPrice(normalized.price.current);
  }, [product]);
}
```

---

### Step 7: Update List Components

#### Before: Inconsistent List Rendering

```typescript
// ❌ Old way
function ProductList({ products }) {
  return (
    <FlatList
      data={products}
      renderItem={({ item }) => (
        <View>
          <Text>₹{item.price?.current || 0}</Text>
          <Text>{item.rating?.value || 0} stars</Text>
        </View>
      )}
    />
  );
}
```

#### After: Normalized Data

```typescript
// ✅ New way
import { normalizeProducts, formatPrice, getRatingDisplay } from '@/utils/dataFormatters';

function ProductList({ products }) {
  const normalized = useMemo(
    () => normalizeProducts(products),
    [products]
  );

  return (
    <FlatList
      data={normalized}
      renderItem={({ item }) => (
        <View>
          <Text>{formatPrice(item.price.current)}</Text>
          <Text>{getRatingDisplay(item.rating.value, item.rating.count)}</Text>
        </View>
      )}
    />
  );
}
```

---

## Common Migration Patterns

### Pattern 1: Price Display

```typescript
// Before
const displayPrice = `₹${product.price.current}`;

// After
const displayPrice = formatPrice(normalizeProduct(product).price.current);
```

### Pattern 2: Discount Display

```typescript
// Before
const discount = ((mrp - price) / mrp * 100).toFixed(0);
const discountText = `${discount}% OFF`;

// After
const { current, original } = normalizeProduct(product).price;
const discountText = formatDiscountString(original, current);
```

### Pattern 3: Rating with Stars

```typescript
// Before
const fullStars = Math.floor(rating);
const hasHalfStar = rating % 1 >= 0.5;

// After
const { stars } = formatRatingDisplay(rating);
// { full: 4, half: 1, empty: 0 }
```

### Pattern 4: Safe Fallbacks

```typescript
// Before
const price = product.price?.current || 'N/A';

// After
const price = formatPrice(normalizeProduct(product).price.current) || 'N/A';
```

---

## Context/State Migration

### Before: Storing Raw Data

```typescript
// ❌ Old way
const ProductContext = createContext();

function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    const data = await api.getProducts();
    setProducts(data); // Raw data
  };

  return (
    <ProductContext.Provider value={{ products }}>
      {children}
    </ProductContext.Provider>
  );
}
```

### After: Storing Normalized Data

```typescript
// ✅ New way
import { normalizeProducts } from '@/utils/dataFormatters';

const ProductContext = createContext();

function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    const data = await api.getProducts();
    setProducts(normalizeProducts(data)); // Normalized data
  };

  return (
    <ProductContext.Provider value={{ products }}>
      {children}
    </ProductContext.Provider>
  );
}
```

---

## Component Library Migration

### Create Reusable Components

```typescript
// utils/components/PriceDisplay.tsx
import { formatPrice, formatDiscountString } from '@/utils/dataFormatters';

export function PriceDisplay({ current, original, currency = 'INR' }) {
  const currentPrice = formatPrice(current, currency);
  const originalPrice = formatPrice(original, currency);
  const discount = formatDiscountString(original, current);

  return (
    <View>
      <Text style={styles.current}>{currentPrice}</Text>
      {originalPrice && <Text style={styles.original}>{originalPrice}</Text>}
      {discount && <Text style={styles.discount}>{discount}</Text>}
    </View>
  );
}

// Usage
<PriceDisplay
  current={normalizeProduct(product).price.current}
  original={normalizeProduct(product).price.original}
/>
```

```typescript
// utils/components/RatingDisplay.tsx
import { formatRatingDisplay } from '@/utils/dataFormatters';

export function RatingDisplay({ rating, count }) {
  const display = formatRatingDisplay(rating, count);

  if (!display.value) return null;

  return (
    <View>
      <StarIcons {...display.stars} color={display.color} />
      <Text>{display.reviewText}</Text>
    </View>
  );
}

// Usage
<RatingDisplay
  rating={normalizeProduct(product).rating.value}
  count={normalizeProduct(product).rating.count}
/>
```

---

## Testing Migration

### Before: Testing with Mock Data

```typescript
// ❌ Old way - relies on specific structure
const mockProduct = {
  price: { current: 100 },
  rating: { value: 4.5 }
};
```

### After: Test with Different Structures

```typescript
// ✅ New way - works with any structure
import { normalizeProduct } from '@/utils/dataFormatters';

const mockProduct1 = { price: { current: 100 } };
const mockProduct2 = { pricing: { selling: 100 } };
const mockProduct3 = { sellingPrice: 100 };

// All normalize to same structure
const normalized1 = normalizeProduct(mockProduct1);
const normalized2 = normalizeProduct(mockProduct2);
const normalized3 = normalizeProduct(mockProduct3);

// All have: normalized.price.current === 100
```

---

## Gradual Migration Strategy

You don't have to migrate everything at once:

### Phase 1: New Code
- Use formatters in all new components
- Normalize data in new API handlers

### Phase 2: High-Traffic Pages
- Migrate homepage
- Migrate product listing pages
- Migrate product detail pages

### Phase 3: Low-Traffic Pages
- Migrate profile pages
- Migrate admin pages
- Migrate settings pages

### Phase 4: Cleanup
- Remove old formatting code
- Update documentation
- Add ESLint rules to prevent old patterns

---

## ESLint Rules (Optional)

Prevent old patterns:

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // Warn when accessing price/rating directly
    'no-restricted-syntax': [
      'warn',
      {
        selector: 'MemberExpression[property.name="current"][object.property.name="price"]',
        message: 'Use normalizeProduct() before accessing price.current'
      },
      {
        selector: 'MemberExpression[property.name="selling"][object.property.name="pricing"]',
        message: 'Use normalizeProduct() to handle pricing.selling'
      }
    ]
  }
};
```

---

## Quick Migration Checklist

- [ ] Import formatters in component files
- [ ] Replace direct price access with `normalizeProduct()`
- [ ] Replace manual price formatting with `formatPrice()`
- [ ] Replace rating display with `getRatingDisplay()`
- [ ] Normalize data in API response handlers
- [ ] Update context/state to store normalized data
- [ ] Create reusable display components
- [ ] Update tests to use normalizers
- [ ] Remove old formatting code
- [ ] Document changes

---

## Common Pitfalls

### ❌ Pitfall 1: Forgetting to Normalize

```typescript
// Wrong - using raw data
const price = formatPrice(product.price.current);
```

```typescript
// Correct - normalize first
const normalized = normalizeProduct(product);
const price = formatPrice(normalized.price.current);
```

### ❌ Pitfall 2: Not Handling Null Returns

```typescript
// Wrong - may display 'null'
<Text>{formatPrice(price)}</Text>
```

```typescript
// Correct - provide fallback
<Text>{formatPrice(price) || 'N/A'}</Text>
```

### ❌ Pitfall 3: Normalizing in Render

```typescript
// Wrong - normalizes on every render
return products.map(p => {
  const normalized = normalizeProduct(p); // Expensive!
  return <ProductCard {...normalized} />;
});
```

```typescript
// Correct - normalize once
const normalized = useMemo(() => normalizeProducts(products), [products]);
return normalized.map(p => <ProductCard {...p} />);
```

---

## Need Help?

1. **Read the docs**: `DATA_FORMATTERS_README.md`
2. **Check examples**: `DATA_FORMATTERS_QUICK_REFERENCE.md`
3. **Review summary**: `DATA_FORMATTERS_SUMMARY.md`
4. **Test locally**: Import and try the functions

---

## Summary

Migration is straightforward:

1. Import the utilities
2. Normalize data at the source (API handlers)
3. Use formatters for display
4. Handle null returns
5. Migrate gradually

Your code will be:
- ✅ More consistent
- ✅ More maintainable
- ✅ More type-safe
- ✅ Less error-prone

Start migrating today!

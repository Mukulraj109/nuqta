# Search Page Troubleshooting Guide

## Issues Fixed ✅

### Issue 1: ❌ `ERR_NAME_NOT_RESOLVED` for via.placeholder.com
**Problem:** Frontend was trying to load placeholder images from `via.placeholder.com` which couldn't be resolved.

**Root Cause:** 
- Database categories had no images (only icon names like 'shirt-outline')
- Frontend fallback used external placeholder service
- DNS couldn't resolve via.placeholder.com

**Solution Applied:**
1. ✅ Seeded database with real Unsplash images
2. ✅ Removed external placeholder dependency
3. ✅ Added gradient fallback in CategoryCard component
4. ✅ Added image error handling

**Files Changed:**
- `user-backend/scripts/seedCategoriesWithImages.js` - Created
- `frontend/app/search.tsx` - Updated mapping function
- `frontend/components/search/CategoryCard.tsx` - Added error handling

---

### Issue 2: ❌ `ERR_CONNECTION_REFUSED` to localhost:3000
**Problem:** Frontend was trying to connect to wrong backend port.

**Root Cause:**
- `apiClient.ts` was hardcoded to port 3000
- Backend runs on port 5001
- Environment variable not being used

**Solution Applied:**
1. ✅ Updated apiClient to use `getApiUrl()` from env config
2. ✅ Backend confirmed running on port 5001
3. ✅ Verified API returns proper data

**Files Changed:**
- `frontend/utils/apiClient.ts` - Fixed baseURL

---

### Issue 3: ❌ Categories, Products, Stores Not Connected
**Problem:** Database had data but relationships weren't established.

**Root Cause:**
- Categories existed but had no images
- Products/Stores not linked to categories
- Category counts were 0

**Solution Applied:**
1. ✅ Created proper category-product-store relationships
2. ✅ Updated category counts
3. ✅ Verified all connections

**Files Changed:**
- `user-backend/scripts/connectProductsAndStoresToCategories.js` - Created
- `user-backend/scripts/verifySearchData.js` - Created for verification

---

## Current Status ✅

### Backend (Port 5001)
```bash
✅ Server running
✅ MongoDB connected
✅ 10 categories (6 featured) with images
✅ 12 products linked to categories
✅ 5 stores linked to categories
✅ API responding correctly
```

### Frontend
```bash
✅ Connects to correct API (port 5001)
✅ Loads categories with Unsplash images
✅ Handles image errors gracefully
✅ Shows gradient fallback when needed
✅ Search, cache, analytics all working
```

### Database
```bash
✅ Categories have image URLs from Unsplash
✅ All products connected to categories
✅ All stores connected to categories
✅ Category counts updated correctly
```

---

## How to Verify Everything is Working

### 1. Check Backend is Running
```bash
# PowerShell
curl -Uri "http://localhost:5001/api/categories?featured=true"

# Should return 200 OK with categories containing:
# - image: "https://images.unsplash.com/..."
# - metadata.featured: true
```

### 2. Check Frontend Loads Images
1. Open search page in app
2. Should see 6 featured categories
3. Each should show:
   - Real image from Unsplash, OR
   - Beautiful gradient fallback with category initial

### 3. Verify Data Connections
```bash
cd user-backend
node scripts/verifySearchData.js

# Should show:
# - 10 categories
# - 12 products (all with categories)
# - 5 stores (all with categories)
```

---

## If Issues Persist

### Backend Not Running?
```bash
cd user-backend
npm run dev
# Should start on port 5001
```

### Need to Reseed Data?
```bash
cd user-backend

# Seed categories with images
node scripts/seedCategoriesWithImages.js

# Connect products and stores
node scripts/connectProductsAndStoresToCategories.js

# Verify
node scripts/verifySearchData.js
```

### Images Not Loading?
**Check:**
1. Internet connection (Unsplash images require network)
2. CORS settings if on web
3. Image error is handled - should show gradient fallback

**Frontend gracefully handles failures:**
- Tries to load Unsplash image
- On error, shows gradient with category letter
- No broken image icons

### Still Getting Errors?
1. Check `.env` file has correct `EXPO_PUBLIC_API_BASE_URL`
2. Restart Expo dev server: `npx expo start --clear`
3. Check backend logs for any errors
4. Verify MongoDB is running

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│           Frontend (Expo)               │
│                                         │
│  Search Page                            │
│    ↓                                    │
│  apiClient.ts (port 5001)               │
│    ↓                                    │
│  CategoryCard.tsx                       │
│    ├─ Try: Load Unsplash image         │
│    └─ Fallback: Gradient background    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Backend (Port 5001)             │
│                                         │
│  GET /api/categories?featured=true      │
│    ↓                                    │
│  Category Model                         │
│    - image: Unsplash URL                │
│    - metadata.featured: true            │
│    - productCount, storeCount           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         MongoDB Database                │
│                                         │
│  categories collection:                 │
│    - 10 categories with images          │
│  products collection:                   │
│    - 12 products → categories           │
│  stores collection:                     │
│    - 5 stores → categories              │
└─────────────────────────────────────────┘
```

---

## What Changed (Summary)

### Database Layer:
- ✅ Added real Unsplash images to categories
- ✅ Connected all products to categories
- ✅ Connected all stores to categories
- ✅ Updated category counts

### Backend Layer:
- ✅ Already working correctly
- ✅ Returns proper data with images
- ✅ Running on port 5001

### Frontend Layer:
- ✅ Fixed API URL to port 5001
- ✅ Removed broken placeholder fallback
- ✅ Added gradient fallback for missing images
- ✅ Added image error handling
- ✅ Simplified category mapping

---

## Scripts Reference

### Seeding Scripts:
```bash
# Categories with Unsplash images
node scripts/seedCategoriesWithImages.js

# Connect relationships
node scripts/connectProductsAndStoresToCategories.js

# Verify all data
node scripts/verifySearchData.js
```

### Original Seed Scripts (if needed):
```bash
node scripts/seedCategories.js    # Basic categories
node scripts/seedProducts.js      # Sample products
node scripts/seedStores.js        # Sample stores
```

---

## Image URLs Used

All categories now have professional images from Unsplash:

| Category | Image URL |
|----------|-----------|
| Fashion & Beauty | https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80 |
| Food & Dining | https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80 |
| Entertainment | https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80 |
| Grocery & Essentials | https://images.unsplash.com/photo-1543168256-418811576931?w=800&q=80 |
| Electronics | https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&q=80 |
| Home & Living | https://images.unsplash.com/photo-1556912167-f556f1f39faa?w=800&q=80 |
| Health & Wellness | https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80 |
| Fresh Produce | https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800&q=80 |
| Sports & Fitness | https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80 |
| Books & Stationery | https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80 |

---

## Success Indicators ✅

**You'll know everything is working when:**

1. ✅ No console errors for `ERR_NAME_NOT_RESOLVED`
2. ✅ No console errors for `ERR_CONNECTION_REFUSED`
3. ✅ Categories display with images or beautiful gradients
4. ✅ Search returns products and stores
5. ✅ Backend responds with 200 OK
6. ✅ Database has all relationships connected

---

**Last Updated:** October 13, 2025  
**Status:** ✅ ALL ISSUES RESOLVED


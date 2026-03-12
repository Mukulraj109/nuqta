# REZ App - Manual Test Checklist

Complete step-by-step test procedures for all features in the REZ application.

**Test Environment:**
- Backend URL: http://localhost:5001/api
- Frontend: Expo Web/Mobile (iOS/Android)
- Payment Gateway: Razorpay (Test Mode)
- OTP: Dev bypass may be active

---

## 1. AUTHENTICATION FLOW

### 1.1 Sign Up with Phone Number
- [ ] Open app/Navigate to sign-in screen
- [ ] Enter valid phone number (format: +91XXXXXXXXXX)
- [ ] Tap "Send OTP" button
- [ ] Verify OTP sent message appears
- [ ] Check console/logs for OTP code (if dev bypass active)
- [ ] **Expected:** OTP sent successfully, navigate to OTP screen

### 1.2 OTP Verification
- [ ] Enter received OTP (6 digits)
- [ ] Tap "Verify" button
- [ ] Verify loading state appears
- [ ] **Expected:** OTP verified, navigate to onboarding/registration screen
- [ ] **Test Invalid OTP:** Enter wrong OTP
  - [ ] **Expected:** Error message "Invalid OTP"

### 1.3 Complete Onboarding
- [ ] Fill in First Name (required)
- [ ] Fill in Last Name (optional)
- [ ] Add profile picture (optional - camera/gallery)
- [ ] Select preferences/categories (e.g., Fashion, Electronics, Food)
- [ ] Select city/location
- [ ] Accept Terms & Conditions
- [ ] Tap "Complete Registration"
- [ ] **Expected:** User profile created, navigate to home screen

### 1.4 Login with Existing Account
- [ ] Open app
- [ ] Enter registered phone number
- [ ] Request OTP
- [ ] Enter OTP
- [ ] **Expected:** Login successful, navigate to home screen

### 1.5 Logout
- [ ] Navigate to Profile screen
- [ ] Tap "Logout" button
- [ ] Confirm logout
- [ ] **Expected:** User logged out, return to sign-in screen

### 1.6 Re-login
- [ ] Login again with same credentials
- [ ] **Expected:** User data persisted, preferences saved

---

## 2. E-COMMERCE FLOW

### 2.1 Browse Homepage
- [ ] View homepage loads successfully
- [ ] Scroll through sections:
  - [ ] Categories carousel
  - [ ] Featured products
  - [ ] "Just for You" recommendations
  - [ ] New arrivals
  - [ ] Trending stores
- [ ] Tap on store card
- [ ] **Expected:** Navigate to store page

### 2.2 View Categories
- [ ] Tap "Categories" tab
- [ ] View all available categories
- [ ] Tap on category (e.g., "Food & Dining")
- [ ] **Expected:** Navigate to category page with filtered products

### 2.3 Search for Products
- [ ] Tap search bar
- [ ] Type product name (e.g., "laptop")
- [ ] View search suggestions
- [ ] Select suggestion or press search
- [ ] **Expected:** View search results with products
- [ ] Apply filters:
  - [ ] Price range
  - [ ] Category
  - [ ] Ratings
- [ ] Sort by: Price (Low to High)
- [ ] **Expected:** Results update based on filters

### 2.4 View Product Details
- [ ] Tap on product card
- [ ] View product page loads:
  - [ ] Product images (swipeable gallery)
  - [ ] Product name, price, discount
  - [ ] Store information
  - [ ] Description
  - [ ] Specifications
  - [ ] Ratings & reviews
  - [ ] Similar products
- [ ] Swipe through product images
- [ ] **Expected:** All product details displayed correctly

### 2.5 Add to Cart
- [ ] On product page, select variant (if applicable)
- [ ] Select quantity
- [ ] Tap "Add to Cart" button
- [ ] **Expected:** Success message "Added to cart"
- [ ] Cart icon shows badge count
- [ ] Tap cart icon
- [ ] **Expected:** Product appears in cart

### 2.6 Update Cart Quantities
- [ ] In cart, tap "+" to increase quantity
- [ ] **Expected:** Quantity increases, price updates
- [ ] Tap "-" to decrease quantity
- [ ] **Expected:** Quantity decreases, price updates
- [ ] Try to increase beyond stock limit
- [ ] **Expected:** Error message "Maximum stock reached"

### 2.7 Remove from Cart
- [ ] In cart, tap "Remove" on item
- [ ] Confirm removal
- [ ] **Expected:** Item removed, cart total updates

### 2.8 View Wishlist
- [ ] On product page, tap "heart" icon
- [ ] **Expected:** Product added to wishlist, icon turns filled
- [ ] Navigate to Wishlist screen
- [ ] **Expected:** Product appears in wishlist

### 2.9 Add/Remove from Wishlist
- [ ] In wishlist, tap "heart" icon again
- [ ] **Expected:** Product removed from wishlist
- [ ] Add product back to wishlist
- [ ] Tap "Add to Cart" from wishlist
- [ ] **Expected:** Product added to cart

### 2.10 Proceed to Checkout
- [ ] In cart, tap "Proceed to Checkout"
- [ ] **Expected:** Navigate to checkout screen
- [ ] View order summary:
  - [ ] Item list
  - [ ] Subtotal
  - [ ] Delivery charges
  - [ ] Tax
  - [ ] Discount (if Premium)
  - [ ] Total

### 2.11 Select Delivery Address
- [ ] View saved addresses
- [ ] Tap "Add New Address"
- [ ] Fill in:
  - [ ] Name
  - [ ] Phone
  - [ ] Address line 1
  - [ ] Address line 2
  - [ ] City
  - [ ] State
  - [ ] Pincode
  - [ ] Address type (Home/Work/Other)
- [ ] Mark as default (optional)
- [ ] Save address
- [ ] **Expected:** Address saved and selected

### 2.12 Choose Payment Method
- [ ] View payment options:
  - [ ] Razorpay (Card/UPI/Wallet)
  - [ ] Cash on Delivery (if available)
  - [ ] Wallet Balance
- [ ] Select Razorpay
- [ ] **Expected:** Payment method selected

### 2.13 Complete Payment (Razorpay Sandbox)
- [ ] Tap "Place Order"
- [ ] Razorpay payment sheet opens
- [ ] Use test credentials:
  - **Card:** 4111 1111 1111 1111
  - **CVV:** 123
  - **Expiry:** Any future date
  - **Name:** Any name
- [ ] Complete payment
- [ ] **Expected:** Payment successful message

### 2.14 View Order Confirmation
- [ ] Order confirmation screen appears
- [ ] View order details:
  - [ ] Order ID
  - [ ] Order date
  - [ ] Items
  - [ ] Delivery address
  - [ ] Payment method
  - [ ] Total amount
- [ ] Tap "View Order"
- [ ] **Expected:** Navigate to order details

### 2.15 Check Order History
- [ ] Navigate to Profile > Orders
- [ ] View list of past orders
- [ ] Tap on an order
- [ ] **Expected:** View order details, tracking status

### 2.16 Track Order in Real-time
- [ ] In order details, view tracking section
- [ ] View order status:
  - [ ] Order Placed
  - [ ] Processing
  - [ ] Out for Delivery
  - [ ] Delivered
- [ ] **Expected:** Real-time status updates (via WebSocket if implemented)

---

## 3. PHASE 3 FEATURES

### 3.1 BILL UPLOAD

#### 3.1.1 Navigate to Bill Upload
- [ ] Navigate to Profile > Upload Bill
- [ ] **Expected:** Bill upload screen loads

#### 3.1.2 Take Photo or Select from Gallery
- [ ] Tap "Take Photo" button
- [ ] Grant camera permission (if first time)
- [ ] Take photo of bill
- [ ] **Expected:** Camera opens, photo captured
- [ ] OR tap "Choose from Gallery"
- [ ] Select existing bill image
- [ ] **Expected:** Image selected

#### 3.1.3 Preview Bill Image
- [ ] View uploaded image preview
- [ ] Verify image is clear and readable
- [ ] Tap "Retake" if needed
- [ ] **Expected:** Image preview displayed

#### 3.1.4 Submit Bill
- [ ] Select merchant/store
- [ ] Enter bill amount (optional - OCR will extract)
- [ ] Enter bill date
- [ ] Add notes (optional)
- [ ] Tap "Submit Bill"
- [ ] **Expected:** Upload progress shown, bill submitted

#### 3.1.5 View OCR Extraction Results
- [ ] Wait for processing (few seconds)
- [ ] View extracted data:
  - [ ] Merchant name
  - [ ] Total amount
  - [ ] Date
  - [ ] Bill number
  - [ ] Items (if extracted)
- [ ] **Expected:** Bill status changes to "Processing" → "Approved"

#### 3.1.6 Check Cashback Credit
- [ ] View cashback amount credited
- [ ] Navigate to Wallet
- [ ] **Expected:** Wallet balance increased by cashback amount
- [ ] View transaction history
- [ ] **Expected:** Bill cashback transaction appears

#### 3.1.7 View Bill History
- [ ] Navigate to Profile > Bill History
- [ ] View list of uploaded bills
- [ ] Filter by:
  - [ ] Status (Pending/Approved/Rejected)
  - [ ] Date range
  - [ ] Merchant
- [ ] **Expected:** All bills displayed with status

---

### 3.2 PREMIUM SUBSCRIPTION

#### 3.2.1 View Subscription Plans
- [ ] Navigate to Profile > Premium Membership
- [ ] View available plans:
  - [ ] Free (Current if not subscribed)
  - [ ] Premium (₹99/month or ₹999/year)
  - [ ] VIP (₹299/month or ₹2999/year)
- [ ] **Expected:** All plans displayed with features

#### 3.2.2 Compare Plans
- [ ] View feature comparison table:
  - [ ] Cashback multiplier (1x/2x/3x)
  - [ ] Free delivery
  - [ ] Priority support
  - [ ] Exclusive deals
  - [ ] Early flash sale access
- [ ] **Expected:** Clear comparison of benefits

#### 3.2.3 Select Premium Plan
- [ ] Tap "Upgrade to Premium" (₹99/month)
- [ ] Select billing cycle:
  - [ ] Monthly (₹99)
  - [ ] Yearly (₹999 - Save 17%)
- [ ] Review benefits
- [ ] **Expected:** Subscription summary shown

#### 3.2.4 Complete Razorpay Payment
- [ ] Tap "Subscribe Now"
- [ ] Razorpay payment sheet opens
- [ ] Use test credentials
- [ ] Complete payment
- [ ] **Expected:** Subscription activated

#### 3.2.5 Verify Subscription Active
- [ ] Return to subscription screen
- [ ] View "Premium" badge on profile
- [ ] Check subscription details:
  - [ ] Plan name
  - [ ] Billing cycle
  - [ ] Next billing date
  - [ ] Auto-renew status
- [ ] **Expected:** Premium subscription active

#### 3.2.6 Check Subscription Benefits Applied
- [ ] Browse products
- [ ] Add product to cart
- [ ] Proceed to checkout
- [ ] **Expected:** 2x cashback badge shown
- [ ] **Expected:** Free delivery applied (₹0 delivery charge)

#### 3.2.7 View Subscription Usage
- [ ] Navigate to Profile > Premium Membership
- [ ] View usage stats:
  - [ ] Orders this month
  - [ ] Total savings
  - [ ] Cashback earned
  - [ ] Delivery fees saved
- [ ] **Expected:** ROI calculator shows value

#### 3.2.8 Manage Subscription
- [ ] Tap "Manage Subscription"
- [ ] Options:
  - [ ] Upgrade to VIP
  - [ ] Change billing cycle
  - [ ] Cancel subscription
  - [ ] Toggle auto-renew
- [ ] **Expected:** Subscription management options available

#### 3.2.9 Cancel Subscription (Test)
- [ ] Tap "Cancel Subscription"
- [ ] Select cancellation reason
- [ ] Provide feedback
- [ ] Confirm cancellation
- [ ] **Expected:** Subscription cancelled, benefits active until end date

---

### 3.3 GAMIFICATION

#### 3.3.1 View Daily Challenges
- [ ] Navigate to Profile > Challenges or Earn Coins
- [ ] View active daily challenges:
  - [ ] "Place 1 order today" - 50 coins
  - [ ] "Add 5 products to wishlist" - 20 coins
  - [ ] "Share app with friend" - 30 coins
  - [ ] "Complete profile" - 100 coins
  - [ ] "Login 7 days in a row" - 200 coins
- [ ] View progress bar for each challenge
- [ ] **Expected:** All challenges displayed with progress

#### 3.3.2 Complete a Challenge
- [ ] Select challenge: "Place 1 order"
- [ ] Note: Must be incomplete
- [ ] Place an order (follow checkout flow)
- [ ] **Expected:** Challenge progress updates to 1/1

#### 3.3.3 Claim Challenge Reward
- [ ] Return to challenges screen
- [ ] Challenge status: "Completed" with "Claim Reward" button
- [ ] Tap "Claim Reward"
- [ ] **Expected:** Success animation, "+50 coins" toast

#### 3.3.4 Check Coin Balance Increased
- [ ] View coin balance in header/profile
- [ ] **Expected:** Balance increased by 50 coins
- [ ] Navigate to Wallet > Coin Transactions
- [ ] **Expected:** New transaction "Challenge Reward: Place 1 order +50"

#### 3.3.5 Unlock an Achievement
- [ ] Trigger achievement condition:
  - [ ] "First Order" - Place first order
  - [ ] "Social Butterfly" - Share 10 times
  - [ ] "Big Spender" - Spend ₹10,000
  - [ ] "Review Master" - Write 10 reviews
- [ ] **Expected:** Achievement unlock animation

#### 3.3.6 See Achievement Toast Notification
- [ ] When achievement unlocked, toast appears:
  - [ ] "Achievement Unlocked: First Order"
  - [ ] "+100 coins"
  - [ ] Badge icon
- [ ] **Expected:** Toast notification displays for 3-5 seconds

#### 3.3.7 View Achievement Collection
- [ ] Navigate to Profile > Achievements
- [ ] View all achievements:
  - [ ] Unlocked (with date)
  - [ ] Locked (with unlock condition)
- [ ] Tap on achievement
- [ ] **Expected:** View achievement details, progress

#### 3.3.8 Check Leaderboard Ranking
- [ ] Navigate to Profile > Leaderboard
- [ ] View leaderboard:
  - [ ] Period: Daily/Weekly/Monthly/All-time
  - [ ] Top 50 users with coin count
  - [ ] Your rank highlighted
- [ ] **Expected:** Leaderboard loads with rankings

#### 3.3.9 Play Spin Wheel Game
- [ ] Navigate to Profile > Mini Games > Spin Wheel
- [ ] View spin wheel with prizes:
  - [ ] 10 coins
  - [ ] 20 coins
  - [ ] 50 coins
  - [ ] 100 coins
  - [ ] Better luck
- [ ] Check eligibility (daily limit)
- [ ] Tap "Spin Now"
- [ ] **Expected:** Wheel spins, lands on prize

#### 3.3.10 Win Prize from Spin Wheel
- [ ] View result animation
- [ ] Prize amount shown
- [ ] **Expected:** Coins added to balance
- [ ] View cooldown timer for next spin
- [ ] **Expected:** "Next spin in 24:00:00"

#### 3.3.11 Play Scratch Card Game
- [ ] Navigate to Profile > Mini Games > Scratch Card
- [ ] Check eligibility (requires coins or order)
- [ ] Tap "Get Scratch Card"
- [ ] **Expected:** New scratch card created
- [ ] View scratch card with hidden areas

#### 3.3.12 Reveal Scratch Card Prize
- [ ] Swipe/touch to scratch areas
- [ ] Reveal all hidden sections
- [ ] **Expected:** Prize revealed (coins, voucher, discount)
- [ ] Tap "Claim Prize"
- [ ] **Expected:** Prize credited to account

#### 3.3.13 Play Quiz Game
- [ ] Navigate to Profile > Mini Games > Quiz
- [ ] Select difficulty:
  - [ ] Easy (5 coins per correct answer)
  - [ ] Medium (10 coins)
  - [ ] Hard (20 coins)
- [ ] Tap "Start Quiz"
- [ ] **Expected:** Quiz starts with first question

#### 3.3.14 Answer Quiz Questions
- [ ] Read question
- [ ] Select answer option (A/B/C/D)
- [ ] Tap "Submit Answer"
- [ ] **Expected:** Immediate feedback (Correct/Wrong)
- [ ] View coins earned
- [ ] **Expected:** Next question loads
- [ ] Complete all 10 questions

#### 3.3.15 Check Daily Login Streak
- [ ] Navigate to Profile or Dashboard
- [ ] View login streak counter
- [ ] **Expected:** Shows current streak (e.g., "5 days in a row")
- [ ] View streak rewards:
  - [ ] Day 1: 10 coins
  - [ ] Day 3: 30 coins
  - [ ] Day 7: 100 coins
  - [ ] Day 30: 1000 coins
- [ ] Login next day
- [ ] **Expected:** Streak increases, reward claimed

---

### 3.4 REFERRAL SYSTEM

#### 3.4.1 Open Referral Modal
- [ ] Navigate to Profile > Refer & Earn
- [ ] **Expected:** Referral screen opens
- [ ] View referral stats:
  - [ ] Total referrals
  - [ ] Completed referrals
  - [ ] Pending referrals
  - [ ] Total earned

#### 3.4.2 Copy Referral Code
- [ ] View referral code (e.g., "REZ12345")
- [ ] Tap "Copy Code" button
- [ ] **Expected:** Code copied to clipboard
- [ ] Toast message: "Referral code copied"

#### 3.4.3 View QR Code
- [ ] Tap "Show QR Code"
- [ ] **Expected:** QR code displayed
- [ ] Friend can scan QR code
- [ ] **Expected:** QR code contains referral link

#### 3.4.4 Share to WhatsApp
- [ ] Tap "Share on WhatsApp" button
- [ ] **Expected:** WhatsApp opens with pre-filled message:
  - "Join REZ app using my referral code REZ12345 and get ₹100 bonus!"
  - Referral link
- [ ] Send to friend
- [ ] **Expected:** Message sent with referral link

#### 3.4.5 Track Referral Stats
- [ ] View referral dashboard:
  - [ ] Total referrals: 5
  - [ ] Completed: 3
  - [ ] Pending: 2
  - [ ] Total earned: ₹300
- [ ] View referral history:
  - [ ] Friend name (if available)
  - [ ] Status (Signed Up / Completed First Order)
  - [ ] Reward amount
  - [ ] Date
- [ ] **Expected:** All referrals tracked with status

#### 3.4.6 Check Tier Progress
- [ ] View tier system:
  - [ ] Tier 0 (0 referrals): ₹50 per referral
  - [ ] Tier 1 (5 referrals): ₹75 per referral
  - [ ] Tier 2 (10 referrals): ₹100 per referral
  - [ ] Tier 3 (20 referrals): ₹150 per referral
  - [ ] Tier 4 (50 referrals): ₹200 per referral
- [ ] View current tier and progress
- [ ] **Expected:** Progress bar shows "3/5 to Tier 1"

#### 3.4.7 See Tier Upgrade Notification
- [ ] Complete 5th referral
- [ ] **Expected:** Toast notification:
  - "Congratulations! You've reached Tier 1"
  - "You now earn ₹75 per referral"
- [ ] Confetti animation

#### 3.4.8 View Tier-Specific Rewards
- [ ] Navigate to Referral Dashboard
- [ ] View tier benefits:
  - [ ] Tier 1: +₹25 per referral, Bronze badge
  - [ ] Tier 2: +₹50 per referral, Silver badge, Exclusive vouchers
  - [ ] Tier 3: +₹100 per referral, Gold badge, Priority support
  - [ ] Tier 4: +₹150 per referral, Platinum badge, Personal manager
- [ ] **Expected:** All tier benefits displayed

---

## 4. ADDITIONAL FEATURES

### 4.1 WALLET MANAGEMENT

#### 4.1.1 View Wallet Balance
- [ ] Navigate to Profile > Wallet
- [ ] View total balance
- [ ] View breakdown:
  - [ ] Main balance
  - [ ] Cashback balance
  - [ ] Coin balance
- [ ] **Expected:** All balances displayed

#### 4.1.2 Add Money to Wallet
- [ ] Tap "Add Money"
- [ ] Enter amount (e.g., ₹500)
- [ ] Select payment method (Razorpay)
- [ ] Complete payment
- [ ] **Expected:** Balance updated

#### 4.1.3 View Transaction History
- [ ] Scroll to transaction history
- [ ] View all transactions:
  - [ ] Credits (green)
  - [ ] Debits (red)
  - [ ] Date, time, amount, description
- [ ] Filter by:
  - [ ] Date range
  - [ ] Type (Credit/Debit)
- [ ] **Expected:** All transactions listed

### 4.2 NOTIFICATIONS

#### 4.2.1 Receive Push Notification
- [ ] Place order
- [ ] **Expected:** Push notification:
  - "Order placed successfully"
  - Order ID, amount
- [ ] Tap notification
- [ ] **Expected:** Navigate to order details

#### 4.2.2 View Notification History
- [ ] Navigate to Profile > Notifications
- [ ] View all notifications:
  - [ ] Order updates
  - [ ] Offers
  - [ ] Cashback credited
  - [ ] Referral rewards
- [ ] **Expected:** All notifications listed

### 4.3 REVIEWS & RATINGS

#### 4.3.1 Write Product Review
- [ ] Navigate to Order History
- [ ] Select delivered order
- [ ] Tap "Write Review"
- [ ] Rate product (1-5 stars)
- [ ] Write review text
- [ ] Upload photos (optional)
- [ ] Submit review
- [ ] **Expected:** Review submitted

#### 4.3.2 View Product Reviews
- [ ] Navigate to product page
- [ ] Scroll to reviews section
- [ ] View all reviews:
  - [ ] Rating
  - [ ] Review text
  - [ ] Photos
  - [ ] Verified purchase badge
- [ ] **Expected:** All reviews displayed

### 4.4 OFFERS & COUPONS

#### 4.4.1 View All Offers
- [ ] Navigate to Offers tab
- [ ] View available offers:
  - [ ] Flash sales
  - [ ] Bank offers
  - [ ] Store offers
  - [ ] Cashback offers
- [ ] **Expected:** All offers displayed

#### 4.4.2 Apply Coupon at Checkout
- [ ] In cart, tap "Apply Coupon"
- [ ] View available coupons
- [ ] Select coupon or enter code
- [ ] Tap "Apply"
- [ ] **Expected:** Discount applied, total updated

---

## 5. ERROR HANDLING & EDGE CASES

### 5.1 Network Errors
- [ ] Turn off internet
- [ ] Try to browse products
- [ ] **Expected:** "No internet connection" message
- [ ] Turn on internet
- [ ] **Expected:** Auto-retry, products load

### 5.2 Invalid Input
- [ ] Enter invalid phone number (e.g., "123")
- [ ] **Expected:** Validation error "Enter valid phone number"
- [ ] Enter special characters in name
- [ ] **Expected:** Validation error or sanitized

### 5.3 Out of Stock
- [ ] Add out-of-stock product to cart
- [ ] **Expected:** Error "Product out of stock"
- [ ] Or disabled "Add to Cart" button

### 5.4 Payment Failure
- [ ] At checkout, use invalid card
- [ ] **Expected:** Payment failed message
- [ ] Order not created
- [ ] Cart preserved

### 5.5 Session Timeout
- [ ] Leave app inactive for 24+ hours
- [ ] Return to app
- [ ] **Expected:** Session expired, redirect to login

### 5.6 Concurrent Cart Updates
- [ ] Add item to cart
- [ ] On another device, update cart
- [ ] Refresh cart
- [ ] **Expected:** Latest cart state loaded

---

## 6. PLATFORM-SPECIFIC TESTS

### 6.1 iOS
- [ ] Test on iPhone/iPad
- [ ] Face ID / Touch ID for payments
- [ ] Share sheet works
- [ ] Deep links work
- [ ] Push notifications work

### 6.2 Android
- [ ] Test on various devices
- [ ] Fingerprint authentication
- [ ] Share sheet works
- [ ] Deep links work
- [ ] Push notifications work

### 6.3 Web
- [ ] Test in Chrome, Safari, Firefox
- [ ] Responsive design
- [ ] Camera upload works
- [ ] Payment gateway works

---

## 7. REGRESSION TESTS

After any code changes, run these critical paths:

- [ ] Login → Browse → Add to Cart → Checkout → Payment → Success
- [ ] Sign Up → Onboarding → Browse → Wishlist → Logout
- [ ] Upload Bill → View Cashback → Check Wallet
- [ ] Subscribe Premium → Place Order → Verify 2x Cashback
- [ ] Complete Challenge → Claim Reward → Check Coins
- [ ] Refer Friend → Track Referral → Claim Reward

---

## Test Sign-off

**Tester Name:** ___________________
**Date:** ___________________
**Environment:** ___________________
**Pass Rate:** _____ / _____ tests passed
**Issues Found:** ___________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

## Notes

- Use test credentials for Razorpay: Card 4111 1111 1111 1111, CVV 123
- Check console logs for detailed error messages
- Take screenshots of any issues found
- Report bugs with steps to reproduce

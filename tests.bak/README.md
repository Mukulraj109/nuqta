# REZ App - Test Suite Documentation

Complete testing documentation and guide for running all tests in the REZ application.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Test Categories](#test-categories)
4. [Quick Start](#quick-start)
5. [Running Tests](#running-tests)
6. [Test Scripts](#test-scripts)
7. [Configuration](#configuration)
8. [CI/CD Integration](#cicd-integration)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Overview

This test suite provides comprehensive testing coverage for the REZ app, including:

- **Manual Testing:** Step-by-step test procedures
- **API Tests:** Automated backend API testing
- **Integration Tests:** End-to-end user journey testing
- **Performance Tests:** Response time benchmarking
- **Security Tests:** Security vulnerability checks
- **Load Tests:** Concurrent user simulation

**Test Coverage:**
- Authentication & Authorization
- E-Commerce Flow (Browse → Cart → Checkout → Payment)
- Phase 3 Features (Bill Upload, Premium Subscription, Gamification, Referrals)
- Payment Integration (Razorpay)
- Wallet Management
- Notifications
- Offers & Coupons

---

## Prerequisites

### Required Software

1. **Node.js** (v16+)
   ```bash
   node --version
   ```

2. **TypeScript** (for running .ts test files)
   ```bash
   npm install -g typescript ts-node
   ```

3. **Backend Running**
   - Backend should be running at `http://localhost:5001`
   - Database seeded with test data
   - Redis running (if using cache)

4. **Environment Variables**
   ```bash
   # frontend/.env
   EXPO_PUBLIC_API_BASE_URL=http://localhost:5001/api
   ```

### Optional Tools

- **Postman** - For manual API testing
- **Burp Suite** - For security testing
- **Artillery** - For advanced load testing
- **k6** - Alternative load testing tool

---

## Test Categories

### 1. Manual Tests
**File:** `MANUAL_TEST_CHECKLIST.md`

Step-by-step manual testing procedures covering all features.

**Use When:**
- Initial feature testing
- UI/UX validation
- Platform-specific testing (iOS/Android/Web)
- User acceptance testing (UAT)

### 2. API Tests
**File:** `api-tests.ts`

Automated tests for all backend API endpoints.

**Coverage:**
- Authentication (send OTP, verify OTP, refresh token)
- Products (get all, featured, search, by ID)
- Categories & Stores
- Cart operations
- Orders
- Wishlist
- Phase 3 features (Bills, Subscriptions, Gamification, Referrals)

### 3. Integration Tests
**File:** `integration-tests.ts`

End-to-end user journey tests.

**Journeys:**
- Journey 1: New User Purchase Flow
- Journey 2: Premium Subscription & Benefits
- Journey 3: Bill Upload & Cashback
- Journey 4: Complete Challenge & Earn Coins
- Journey 5: Refer Friend & Earn Rewards
- Journey 6: Wishlist to Purchase

### 4. Performance Tests
**File:** `performance-tests.ts`

Response time benchmarking and performance analysis.

**Metrics:**
- API response times (target: < 500ms)
- Page load times (target: < 3s)
- Search performance (target: < 1s)
- Cart operations (target: < 300ms)
- Concurrent request handling

### 5. Security Tests
**File:** `SECURITY_TEST_CHECKLIST.md`

Security vulnerability assessment checklist.

**Coverage:**
- Authentication & Authorization
- Input Validation (SQL injection, XSS)
- API Security (rate limiting, CORS)
- Data Protection (PII, sensitive data)
- Payment Security
- File Upload Security

### 6. Load Tests
**File:** `load-tests.ts`

System behavior under concurrent load.

**Scenarios:**
- 10 concurrent users browsing
- 50 concurrent search requests
- 100 concurrent API requests
- Spike test (200 requests in 10s)
- Sustained load (50 users for 1 minute)

---

## Quick Start

### Run All Tests (Sequential)

```bash
# Navigate to tests directory
cd frontend/tests

# Install dependencies (if needed)
npm install

# Run API tests
npx ts-node api-tests.ts

# Run integration tests
npx ts-node integration-tests.ts

# Run performance tests
npx ts-node performance-tests.ts

# Run load tests
npx ts-node load-tests.ts
```

### Run Specific Test Category

```bash
# API tests only
npx ts-node tests/api-tests.ts

# Integration tests only
npx ts-node tests/integration-tests.ts

# Performance tests only
npx ts-node tests/performance-tests.ts

# Load tests only
npx ts-node tests/load-tests.ts
```

---

## Running Tests

### 1. Manual Testing

**Step 1:** Open `MANUAL_TEST_CHECKLIST.md`

**Step 2:** Follow step-by-step procedures

**Step 3:** Check off completed tests

**Step 4:** Document any issues found

**Example:**
```
Authentication Flow:
✓ Sign up with phone number
✓ Receive and verify OTP
✓ Complete onboarding
✗ Login with wrong OTP (Found issue: Error message unclear)
```

---

### 2. API Testing

**Step 1:** Ensure backend is running
```bash
cd user-backend
npm run dev
# Backend should start at http://localhost:5001
```

**Step 2:** Run API tests
```bash
cd frontend/tests
npx ts-node api-tests.ts
```

**Expected Output:**
```
╔════════════════════════════════════════╗
║  REZ APP - AUTOMATED API TEST SUITE   ║
╚════════════════════════════════════════╝

━━━ AUTHENTICATION ━━━

✓ Send OTP
✓ Verify OTP
✓ Get user profile
✓ Update user profile
...

TEST SUMMARY

Total Tests:  45
Passed:       43
Failed:       2
Pass Rate:    95.6%
Duration:     12.34s
```

**Step 3:** Review results and fix failures

---

### 3. Integration Testing

**Step 1:** Run integration tests
```bash
npx ts-node integration-tests.ts
```

**Expected Output:**
```
╔═══════════════════════════════════════════════════════════════╗
║  JOURNEY 1: New User Complete Purchase Flow                  ║
╚═══════════════════════════════════════════════════════════════╝

Step 1: Register new user
  ✓ User registered successfully
Step 2: Complete onboarding
  ✓ Onboarding completed
...

✓ Journey 1 completed successfully
```

---

### 4. Performance Testing

**Step 1:** Run performance tests
```bash
npx ts-node performance-tests.ts
```

**Expected Output:**
```
━━━ AUTHENTICATION PERFORMANCE ━━━

✓ Send OTP: 245ms (target: 500ms)
✓ Verify OTP: 312ms (target: 500ms)
✓ Get User Profile: 123ms (target: 500ms)

PERFORMANCE TEST SUMMARY

Total Tests:     38
Passed:          35
Failed:          3
Success Rate:    92.1%

Performance Metrics:
Average Time:    287ms
Fastest Test:    95ms
Slowest Test:    1234ms
```

---

### 5. Security Testing

**Step 1:** Open `SECURITY_TEST_CHECKLIST.md`

**Step 2:** Follow security test procedures

**Step 3:** Use tools like Postman, Burp Suite, or curl

**Example: Test JWT validation**
```bash
# Test without token (should fail)
curl http://localhost:5001/api/user/auth/me
# Expected: 401 Unauthorized

# Test with invalid token (should fail)
curl -H "Authorization: Bearer INVALID_TOKEN" http://localhost:5001/api/user/auth/me
# Expected: 401 Unauthorized

# Test with valid token (should succeed)
curl -H "Authorization: Bearer YOUR_VALID_TOKEN" http://localhost:5001/api/user/auth/me
# Expected: 200 OK with user data
```

**Step 4:** Run npm audit
```bash
cd frontend
npm audit

cd ../user-backend
npm audit
```

---

### 6. Load Testing

**Step 1:** Ensure you're testing against a **test environment**, not production!

**Step 2:** Run load tests
```bash
npx ts-node load-tests.ts
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════════╗
║  LOAD TEST 1: 10 Concurrent Users Browsing Products       ║
╚════════════════════════════════════════════════════════════╝

Load Test Results:

Total Requests:      325
Successful:          320
Failed:              5
Success Rate:        98.46%

Response Times:
  Average:           287ms
  Min:               95ms
  Max:               1234ms
  P50 (Median):      245ms
  P95:               678ms
  P99:               1050ms

Throughput:
  Requests/sec:      10.83
  Duration:          30.02s
```

---

## Test Scripts

### API Tests (`api-tests.ts`)

**Test Groups:**
- Backend Health
- Authentication
- Products
- Categories & Stores
- Cart
- Wishlist
- Orders
- Bill Upload
- Subscriptions
- Gamification
- Referrals
- Wallet
- Offers
- Reviews

**Configuration:**
```typescript
const API_BASE_URL = process.env.API_URL || 'http://localhost:5001/api';
const TEST_PHONE = '+919999999999';
const TEST_OTP = '123456';
```

**Customize:**
Edit these constants in `api-tests.ts` to match your environment.

---

### Integration Tests (`integration-tests.ts`)

**User Journeys:**
1. New User Purchase Flow
2. Premium Subscription & Enhanced Cashback
3. Bill Upload & Cashback Credit
4. Complete Challenge & Earn Coins
5. Refer Friend & Earn Rewards
6. Wishlist to Purchase

**Configuration:**
```typescript
const TEST_PHONE_1 = '+919999999991';
const TEST_PHONE_2 = '+919999999992';
```

---

### Performance Tests (`performance-tests.ts`)

**Performance Targets:**
```typescript
const TARGETS = {
  API_RESPONSE: 500,    // < 500ms
  PAGE_LOAD: 3000,      // < 3s
  SEARCH: 1000,         // < 1s
  CART_OPS: 300,        // < 300ms
};
```

**Customize Targets:**
Adjust targets in `performance-tests.ts` based on your requirements.

---

### Load Tests (`load-tests.ts`)

**Load Scenarios:**
```typescript
const LOAD_SCENARIOS = {
  light: { users: 10, duration: 30000, requestsPerSecond: 10 },
  medium: { users: 50, duration: 60000, requestsPerSecond: 50 },
  heavy: { users: 100, duration: 120000, requestsPerSecond: 100 },
  spike: { users: 200, duration: 10000, requestsPerSecond: 200 },
};
```

**Customize Scenarios:**
Edit scenarios in `load-tests.ts` to match your testing needs.

---

## Configuration

### Environment Variables

Create a `.env.test` file for test-specific configuration:

```bash
# Test Environment Configuration
API_URL=http://localhost:5001/api
TEST_PHONE_1=+919999999991
TEST_PHONE_2=+919999999992
TEST_OTP=123456

# Razorpay Test Credentials
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY
RAZORPAY_KEY_SECRET=YOUR_SECRET

# Test Database
DB_NAME=rez_app_test
```

### Test User Accounts

Create test users with known credentials:

```javascript
// Test users
const testUsers = [
  { phone: '+919999999991', otp: '123456', role: 'user' },
  { phone: '+919999999992', otp: '123456', role: 'premium' },
  { phone: '+919999999993', otp: '123456', role: 'admin' },
];
```

### Mock Data

Ensure backend is seeded with test data:

```bash
cd user-backend
npm run seed:test
```

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/tests.yml`:

```yaml
name: Run Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install backend dependencies
        run: |
          cd user-backend
          npm ci

      - name: Start backend
        run: |
          cd user-backend
          npm run dev &
          sleep 10

      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci

      - name: Run API tests
        run: |
          cd frontend/tests
          npx ts-node api-tests.ts

      - name: Run integration tests
        run: |
          cd frontend/tests
          npx ts-node integration-tests.ts

      - name: Run performance tests
        run: |
          cd frontend/tests
          npx ts-node performance-tests.ts

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: frontend/tests/results/
```

---

## Troubleshooting

### Common Issues

#### 1. Backend Not Running

**Error:**
```
✗ Backend health check
Status: 0
```

**Solution:**
```bash
cd user-backend
npm run dev
```

#### 2. Database Not Seeded

**Error:**
```
✗ Get all products
Response: {"success":false,"data":[]}
```

**Solution:**
```bash
cd user-backend
npm run seed
```

#### 3. Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5001
```

**Solution:**
```bash
# Kill process on port 5001
lsof -ti:5001 | xargs kill -9

# Or change port in .env
PORT=5002
```

#### 4. OTP Not Working

**Error:**
```
✗ Verify OTP
Response: {"success":false,"message":"Invalid OTP"}
```

**Solution:**
- Check if dev bypass is enabled in backend
- Use correct OTP: `123456` (if dev bypass enabled)
- Check OTP expiry time

#### 5. Authentication Token Expired

**Error:**
```
✗ Get user profile
Response: {"success":false,"message":"Token expired"}
```

**Solution:**
- Re-run authentication tests
- Check token expiry configuration
- Use refresh token to get new access token

#### 6. Rate Limiting

**Error:**
```
✗ API test failed
Status: 429 (Too Many Requests)
```

**Solution:**
- Wait before retrying
- Reduce concurrent requests in load tests
- Adjust rate limits in backend (for testing only)

---

## Best Practices

### Testing Workflow

1. **Start with Manual Tests**
   - Verify basic functionality manually first
   - Understand expected behavior

2. **Run API Tests**
   - Automate repetitive API testing
   - Run before every deployment

3. **Run Integration Tests**
   - Test complete user flows
   - Run for major releases

4. **Run Performance Tests**
   - Benchmark response times
   - Run weekly or before releases

5. **Run Security Tests**
   - Regular security audits
   - Run before production deployment

6. **Run Load Tests**
   - Test scalability
   - Run before expected traffic spikes

### Test Maintenance

- **Update tests** when features change
- **Keep test data** fresh and realistic
- **Document failures** with clear reproduction steps
- **Review test results** regularly
- **Automate** repetitive tests

### Writing New Tests

When adding new features, update tests:

1. Add manual test steps to `MANUAL_TEST_CHECKLIST.md`
2. Add API tests to `api-tests.ts`
3. Add user journey to `integration-tests.ts` (if applicable)
4. Update performance benchmarks in `performance-tests.ts`
5. Add security checks to `SECURITY_TEST_CHECKLIST.md`

---

## Test Results

### Interpreting Results

**API Tests:**
- **Pass Rate > 95%:** Good
- **Pass Rate 85-95%:** Acceptable, investigate failures
- **Pass Rate < 85%:** Critical issues, fix immediately

**Performance Tests:**
- **Response Time < Target:** Excellent
- **Response Time = Target:** Acceptable
- **Response Time > Target:** Needs optimization

**Load Tests:**
- **Success Rate > 99%:** Excellent
- **Success Rate 95-99%:** Good
- **Success Rate < 95%:** Poor, investigate errors

**Security Tests:**
- **Critical Issues:** 0 (must fix before deployment)
- **High Issues:** < 3
- **Medium Issues:** < 10

---

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Postman Learning Center](https://learning.postman.com/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [k6 Load Testing](https://k6.io/docs/)

---

## Support

For questions or issues:
- Check troubleshooting section above
- Review test logs for detailed error messages
- Contact development team

---

## License

These test scripts are part of the REZ App project.

---

**Happy Testing!** 🚀

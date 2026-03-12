# REZ App - Security Test Checklist

Comprehensive security testing procedures for the REZ application.

---

## 1. AUTHENTICATION & AUTHORIZATION

### 1.1 JWT Token Validation
- [ ] **Test:** Access protected endpoint without token
  - **Expected:** 401 Unauthorized error
  - **Test:** `curl http://localhost:5001/api/user/auth/me`

- [ ] **Test:** Access protected endpoint with invalid token
  - **Expected:** 401 Unauthorized error
  - **Test:** `curl -H "Authorization: Bearer INVALID_TOKEN" http://localhost:5001/api/user/auth/me`

- [ ] **Test:** Access protected endpoint with malformed token
  - **Expected:** 401 Unauthorized error
  - **Test:** `curl -H "Authorization: InvalidFormat" http://localhost:5001/api/user/auth/me`

- [ ] **Test:** Access protected endpoint with valid token
  - **Expected:** 200 OK with user data

### 1.2 Token Expiration
- [ ] **Test:** Use expired access token
  - **Expected:** 401 Unauthorized, "Token expired" message
  - **How:** Wait for token to expire (based on expiry time) or manually set expired token

- [ ] **Test:** Refresh token with valid refresh token
  - **Expected:** New access token and refresh token returned

- [ ] **Test:** Refresh token with expired refresh token
  - **Expected:** 401 Unauthorized, must re-login

- [ ] **Test:** Use old access token after refresh
  - **Expected:** 401 Unauthorized (if token rotation implemented)

### 1.3 Session Management
- [ ] **Test:** Multiple concurrent sessions from different devices
  - **Expected:** Both sessions should work (unless single-session policy enforced)

- [ ] **Test:** Logout invalidates token
  - **Expected:** Token no longer works after logout

- [ ] **Test:** Token reuse after logout
  - **Expected:** 401 Unauthorized

### 1.4 OTP Security
- [ ] **Test:** OTP brute force (try multiple wrong OTPs rapidly)
  - **Expected:** Rate limiting or account lockout after N attempts

- [ ] **Test:** OTP reuse (use same OTP twice)
  - **Expected:** OTP marked as used, second attempt fails

- [ ] **Test:** Expired OTP
  - **Expected:** OTP verification fails after expiry time

- [ ] **Test:** OTP for different phone number
  - **Expected:** OTP doesn't work for different phone

---

## 2. AUTHORIZATION & PERMISSIONS

### 2.1 User Role Authorization
- [ ] **Test:** Regular user accessing admin endpoints
  - **Expected:** 403 Forbidden

- [ ] **Test:** User accessing another user's data
  - **Expected:** 403 Forbidden or 404 Not Found
  - **Example:** GET /orders/{other_user_order_id}

- [ ] **Test:** User modifying another user's profile
  - **Expected:** 403 Forbidden

- [ ] **Test:** User accessing own data
  - **Expected:** 200 OK with data

### 2.2 Resource Ownership
- [ ] **Test:** User viewing own cart
  - **Expected:** 200 OK

- [ ] **Test:** User modifying own cart
  - **Expected:** 200 OK

- [ ] **Test:** User viewing own orders
  - **Expected:** 200 OK

- [ ] **Test:** User viewing own wallet
  - **Expected:** 200 OK

- [ ] **Test:** User claiming another user's challenge reward
  - **Expected:** 403 Forbidden

---

## 3. INPUT VALIDATION & SANITIZATION

### 3.1 SQL Injection
- [ ] **Test:** SQL injection in search query
  - **Input:** `' OR '1'='1`
  - **Expected:** Sanitized, no SQL execution

- [ ] **Test:** SQL injection in product ID
  - **Input:** `1' OR '1'='1`
  - **Expected:** Validation error or safe handling

- [ ] **Test:** SQL injection in phone number
  - **Input:** `+91999' OR '1'='1`
  - **Expected:** Validation error

### 3.2 NoSQL Injection (MongoDB)
- [ ] **Test:** NoSQL injection in user ID
  - **Input:** `{ "$ne": null }`
  - **Expected:** Validation error or safe handling

- [ ] **Test:** NoSQL injection in product filter
  - **Input:** `{ "$gt": "" }`
  - **Expected:** Sanitized or validation error

### 3.3 XSS (Cross-Site Scripting)
- [ ] **Test:** XSS in product name
  - **Input:** `<script>alert('XSS')</script>`
  - **Expected:** Escaped/sanitized output

- [ ] **Test:** XSS in review text
  - **Input:** `<img src=x onerror="alert('XSS')">`
  - **Expected:** Escaped/sanitized output

- [ ] **Test:** XSS in user profile (first name)
  - **Input:** `<script>document.location='http://evil.com'</script>`
  - **Expected:** Escaped/sanitized output

- [ ] **Test:** XSS in search query
  - **Input:** `<svg onload=alert('XSS')>`
  - **Expected:** Escaped/sanitized output

### 3.4 Command Injection
- [ ] **Test:** Command injection in file upload filename
  - **Input:** `file.jpg; rm -rf /`
  - **Expected:** Sanitized filename

- [ ] **Test:** Path traversal in file access
  - **Input:** `../../etc/passwd`
  - **Expected:** Access denied

### 3.5 Input Length Validation
- [ ] **Test:** Extremely long product name (10,000 characters)
  - **Expected:** Validation error or truncation

- [ ] **Test:** Extremely long review text (100,000 characters)
  - **Expected:** Validation error or truncation

- [ ] **Test:** Extremely long phone number (100 digits)
  - **Expected:** Validation error

---

## 4. API SECURITY

### 4.1 Rate Limiting
- [ ] **Test:** Send 100 requests in 1 second to /auth/send-otp
  - **Expected:** Rate limit error (429 Too Many Requests) after threshold

- [ ] **Test:** Send 1000 requests to /products
  - **Expected:** Rate limit error after threshold

- [ ] **Test:** Brute force login attempts
  - **Expected:** Account lockout or rate limiting

### 4.2 CORS (Cross-Origin Resource Sharing)
- [ ] **Test:** Request from unauthorized origin
  - **Expected:** CORS error (if strict CORS policy)

- [ ] **Test:** Request from authorized origin
  - **Expected:** 200 OK with proper CORS headers

### 4.3 HTTP Security Headers
- [ ] **Test:** Check for security headers in response
  - **Headers to verify:**
    - [ ] `X-Content-Type-Options: nosniff`
    - [ ] `X-Frame-Options: DENY` or `SAMEORIGIN`
    - [ ] `X-XSS-Protection: 1; mode=block`
    - [ ] `Strict-Transport-Security` (if HTTPS)
    - [ ] `Content-Security-Policy`

### 4.4 HTTPS/TLS
- [ ] **Test:** Force HTTPS (in production)
  - **Expected:** HTTP requests redirected to HTTPS

- [ ] **Test:** Check SSL certificate validity (production)
  - **Expected:** Valid certificate from trusted CA

- [ ] **Test:** Check TLS version (should be TLS 1.2+)
  - **Expected:** TLS 1.2 or 1.3

---

## 5. DATA PROTECTION

### 5.1 Sensitive Data Exposure
- [ ] **Test:** Check API response for exposed secrets
  - **Check for:**
    - [ ] Passwords (should never be in response)
    - [ ] API keys
    - [ ] Database credentials
    - [ ] Internal IPs

- [ ] **Test:** Check error messages
  - **Expected:** Generic error messages, no stack traces in production

- [ ] **Test:** Check JWT token for sensitive data
  - **Expected:** Only non-sensitive data (user ID, role), no passwords

### 5.2 Password Security (if applicable)
- [ ] **Test:** Password stored as plaintext
  - **Expected:** Passwords hashed (bcrypt, argon2, etc.)

- [ ] **Test:** Weak password acceptance
  - **Expected:** Password requirements enforced (min length, complexity)

- [ ] **Test:** Password in API response
  - **Expected:** Never returned in any response

### 5.3 PII (Personally Identifiable Information)
- [ ] **Test:** Phone number masking in public APIs
  - **Expected:** Phone shown as `+91****9999` in public contexts

- [ ] **Test:** Email masking
  - **Expected:** Email shown as `u***@example.com` in public contexts

- [ ] **Test:** Unauthorized access to user's PII
  - **Expected:** 403 Forbidden

---

## 6. PAYMENT SECURITY

### 6.1 Razorpay Integration
- [ ] **Test:** Check for exposed Razorpay secret key
  - **Expected:** Only public key in frontend, secret key only in backend

- [ ] **Test:** Payment amount tampering
  - **Expected:** Amount verified server-side before payment

- [ ] **Test:** Payment signature verification
  - **Expected:** Razorpay signature verified before order confirmation

### 6.2 Wallet Security
- [ ] **Test:** Negative amount addition to wallet
  - **Expected:** Validation error

- [ ] **Test:** SQL injection in transaction description
  - **Expected:** Sanitized

- [ ] **Test:** Unauthorized wallet access
  - **Expected:** 403 Forbidden

---

## 7. FILE UPLOAD SECURITY

### 7.1 Bill Upload
- [ ] **Test:** Upload non-image file (e.g., .exe, .sh)
  - **Expected:** File type validation error

- [ ] **Test:** Upload extremely large file (100MB+)
  - **Expected:** File size limit error

- [ ] **Test:** Upload malicious file (with embedded script)
  - **Expected:** File content validation or sandboxed storage

- [ ] **Test:** Path traversal in filename
  - **Input:** `../../evil.sh`
  - **Expected:** Sanitized filename

### 7.2 Profile Picture Upload
- [ ] **Test:** Upload non-image file
  - **Expected:** File type validation error

- [ ] **Test:** Upload SVG with embedded JavaScript
  - **Expected:** Sanitized or rejected

---

## 8. BUSINESS LOGIC SECURITY

### 8.1 Price Manipulation
- [ ] **Test:** Modify product price in cart request
  - **Expected:** Price verified server-side, manipulation ignored

- [ ] **Test:** Apply multiple coupons
  - **Expected:** Only one coupon allowed (if per policy)

- [ ] **Test:** Negative quantity in cart
  - **Expected:** Validation error

### 8.2 Referral System
- [ ] **Test:** Self-referral (user refers themselves)
  - **Expected:** Not allowed, validation error

- [ ] **Test:** Referral code reuse
  - **Expected:** Same code works for multiple referrals (as intended)

- [ ] **Test:** Claiming referral reward multiple times
  - **Expected:** Reward claimed only once per referral

### 8.3 Gamification
- [ ] **Test:** Claim challenge reward without completion
  - **Expected:** Validation error

- [ ] **Test:** Spin wheel multiple times rapidly
  - **Expected:** Cooldown enforced

- [ ] **Test:** Manipulate coin balance directly
  - **Expected:** Server-side validation, manipulation prevented

### 8.4 Subscription
- [ ] **Test:** Access Premium benefits without subscription
  - **Expected:** Benefits not applied

- [ ] **Test:** Cancel subscription but continue using benefits
  - **Expected:** Benefits revoked after subscription end date

---

## 9. API ENDPOINT ENUMERATION

### 9.1 Hidden Endpoints
- [ ] **Test:** Try common admin endpoints
  - `/api/admin/users`
  - `/api/admin/dashboard`
  - `/api/debug`
  - `/api/internal`
  - **Expected:** 404 or 403 if not authorized

- [ ] **Test:** Try backup files
  - `/api/.env`
  - `/api/config.json`
  - `/api/backup.sql`
  - **Expected:** 404 or 403

### 9.2 API Versioning
- [ ] **Test:** Access deprecated API versions
  - **Expected:** Proper versioning, deprecated endpoints clearly marked

---

## 10. THIRD-PARTY INTEGRATIONS

### 10.1 Google Maps API
- [ ] **Test:** Check for exposed API key
  - **Expected:** API key restricted by domain/IP

- [ ] **Test:** Excessive API usage
  - **Expected:** Rate limiting or quota management

### 10.2 Firebase (if used)
- [ ] **Test:** Check Firebase security rules
  - **Expected:** Proper read/write rules, not open to public

### 10.3 Cloudinary (if used)
- [ ] **Test:** Check for exposed secret
  - **Expected:** Only upload preset exposed, not API secret

---

## 11. LOGGING & MONITORING

### 11.1 Logging Security
- [ ] **Test:** Check logs for sensitive data
  - **Expected:** No passwords, tokens, or PII in logs

- [ ] **Test:** Check for detailed error logs in production
  - **Expected:** Detailed errors only in development

### 11.2 Audit Trail
- [ ] **Test:** Check if critical actions are logged
  - **Actions:** Login, logout, password change, payment, subscription
  - **Expected:** Audit logs with timestamp, user, action

---

## 12. MOBILE APP SECURITY (React Native)

### 12.1 Secure Storage
- [ ] **Test:** Check if tokens stored securely
  - **Expected:** Use Keychain (iOS) or Keystore (Android), not AsyncStorage for sensitive data

- [ ] **Test:** Check if API keys hardcoded in app
  - **Expected:** Sensitive keys in backend, not client

### 12.2 Network Security
- [ ] **Test:** SSL pinning (if implemented)
  - **Expected:** App only accepts valid SSL certificate

- [ ] **Test:** Check for insecure HTTP requests
  - **Expected:** All requests over HTTPS

### 12.3 Code Obfuscation
- [ ] **Test:** Reverse engineer APK/IPA
  - **Expected:** Code obfuscated, hard to read

---

## 13. DENIAL OF SERVICE (DoS) PREVENTION

### 13.1 Resource Exhaustion
- [ ] **Test:** Send extremely large JSON payload
  - **Expected:** Request size limit enforced

- [ ] **Test:** Send deeply nested JSON
  - **Expected:** Parsing depth limit

- [ ] **Test:** Create thousands of carts/wishlists
  - **Expected:** Rate limiting or resource quotas

### 13.2 Slowloris Attack
- [ ] **Test:** Keep connections open without completing requests
  - **Expected:** Connection timeout

---

## 14. GDPR & PRIVACY COMPLIANCE

### 14.1 Data Access
- [ ] **Test:** User can view all their data
  - **Expected:** Data export feature or comprehensive profile view

### 14.2 Data Deletion
- [ ] **Test:** User can delete their account
  - **Expected:** Account deletion with data anonymization/deletion

### 14.3 Consent Management
- [ ] **Test:** User can opt-out of marketing communications
  - **Expected:** Preference saved, no marketing emails sent

---

## 15. AUTOMATED SECURITY SCANNING

### 15.1 Dependency Vulnerabilities
- [ ] Run `npm audit` on frontend
  - **Command:** `cd frontend && npm audit`
  - **Expected:** No high/critical vulnerabilities

- [ ] Run `npm audit` on backend
  - **Command:** `cd user-backend && npm audit`
  - **Expected:** No high/critical vulnerabilities

### 15.2 Static Code Analysis
- [ ] Run ESLint security plugins
  - **Expected:** No security warnings

### 15.3 OWASP ZAP Scan (if available)
- [ ] Run automated security scan
  - **Expected:** No critical vulnerabilities

---

## Test Sign-off

**Security Tester:** ___________________
**Date:** ___________________
**Environment:** ___________________
**Critical Issues Found:** ___________________
**Status:** [ ] PASS [ ] FAIL [ ] NEEDS REMEDIATION

---

## Common Vulnerabilities Checklist (OWASP Top 10)

- [ ] **A01: Broken Access Control** - Tested authorization
- [ ] **A02: Cryptographic Failures** - Checked for exposed secrets, weak encryption
- [ ] **A03: Injection** - Tested SQL, NoSQL, command injection
- [ ] **A04: Insecure Design** - Reviewed business logic
- [ ] **A05: Security Misconfiguration** - Checked security headers, default configs
- [ ] **A06: Vulnerable Components** - Ran npm audit
- [ ] **A07: Authentication Failures** - Tested auth flows
- [ ] **A08: Data Integrity Failures** - Checked digital signatures, payment verification
- [ ] **A09: Logging Failures** - Verified audit logging
- [ ] **A10: Server-Side Request Forgery (SSRF)** - Tested URL inputs

---

## Notes

- All tests should be performed in a **test environment**, not production
- Use **burp suite**, **postman**, or **curl** for API testing
- Document all findings with steps to reproduce
- Prioritize findings: Critical → High → Medium → Low
- Re-test after fixes are applied

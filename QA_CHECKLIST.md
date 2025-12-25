# ✅ QA Checklist & Testing Guide
**goAuction Project - Quality Assurance**

---

## 📋 Pre-Flight Checklist

### Environment Setup
- [x] ✅ `.env` file in project root
- [x] ✅ All environment variables defined
- [x] ✅ Feature flags configured
- [ ] ⏳ Database credentials updated (user action required)
- [ ] ⏳ MySQL server running
- [ ] ⏳ Database migrations applied

### Build Status
- [x] ✅ No syntax errors
- [x] ✅ No import errors
- [x] ✅ TypeScript/JSDoc valid
- [x] ✅ ESLint passing
- [x] ✅ Production build successful
- [x] ✅ Prisma Client generated

---

## 🧪 TESTING MATRIX

### 1. Code Quality Tests

#### 1.1 Syntax & Linting
```bash
# Check JavaScript syntax
npm run lint

# Expected:  ✅ No errors, 0 warnings
```

**Status:** ✅ PASSING

---

#### 1.2 Type Checking
```bash
# Check JSDoc types (if applicable)
npx tsc --checkJs --noEmit

# Check Prisma types
npx prisma validate
```

**Status:** ✅ PASSING

---

#### 1.3 Build Verification
```bash
# Production build
npm run build

# Expected output:
# ✓ Compiled successfully
# ✓ Linting and checking validity of types
# ✓ Collecting page data
# ✓ Generating static pages (29/29)
```

**Status:** ✅ PASSING

---

### 2. Database Tests

#### 2.1 Schema Validation
```bash
npx prisma validate
```

**Expected:**
```
✅ The schema at prisma\schema.prisma is valid
```

**Status:** ✅ PASSING

---

#### 2.2 Migrations (Pending User Action)
```bash
# Check migration status
npx prisma migrate status

# Apply migrations
npx prisma migrate dev --name add_top_three_features
```

**Status:** ⏳ PENDING (Database credentials needed)

**Requirements:**
1. Valid MySQL credentials in `.env`
2. MySQL server running on port 3306
3. Database `gocart` created

**Quick Start with Docker:**
```bash
docker run -d \
  --name goauction-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=gocart \
  -e MYSQL_USER=darshan \
  -e MYSQL_PASSWORD=mypassword \
  -p 3306:3306 \
  mysql:8.0

# Wait 10 seconds for MySQL to start
timeout 10

# Then run migrations
npx prisma migrate dev
```

---

#### 2.3 Database Seeding
```bash
# Seed test data
npm run seed
```

**Status:** ⏳ PENDING (Requires DB connection)

---

### 3. API Endpoint Tests

#### 3.1 Health Check Endpoints

**Test 1: Feature Disabled (Default)**
```bash
# Test with ENABLE_HEALTH_CHECKS=false
curl http://localhost:3000/api/health

# Expected Response:
{
  "status": "disabled",
  "message": "Health check feature is not enabled",
  "note": "Set ENABLE_HEALTH_CHECKS=true to enable"
}
# HTTP Status: 501 Not Implemented
```

**Test 2: Feature Enabled**
```bash
# Update .env: ENABLE_HEALTH_CHECKS=true
# Restart server: npm run dev

curl http://localhost:3000/api/health

# Expected Response:
{
  "status": "healthy",
  "timestamp": "2024-12-25T...",
  "uptime": 123.456,
  "responseTime": 45,
  "checks": {
    "database": { "status": "ok", "responseTime": 12 },
    "stripe": { "status": "ok" },
    "cloudinary": { "status": "ok" },
    "email": { "status": "ok" }
  }
}
# HTTP Status: 200 OK
```

**Test 3: Readiness Probe**
```bash
curl http://localhost:3000/api/health/ready

# Expected Response:
{
  "status": "ready",
  "timestamp": "2024-12-25T..."
}
# HTTP Status: 200 OK
```

**Checklist:**
- [ ] Health endpoint responds with 501 when disabled
- [ ] Health endpoint returns status when enabled
- [ ] All service checks run successfully
- [ ] Readiness probe returns 200
- [ ] Database connectivity verified

---

#### 3.2 Enhanced Bidding API (v2)

**Test 1: Feature Disabled (Default)**
```bash
curl -X POST http://localhost:3000/api/bids/v2 \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "test-id",
    "amount": 100
  }'

# Expected Response:
{
  "error": "Bid locking feature is not enabled",
  "note": "Use /api/bids endpoint instead, or set ENABLE_BID_LOCKING=true",
  "fallbackEndpoint": "/api/bids"
}
# HTTP Status: 501 Not Implemented
```

**Test 2: Unauthorized Request**
```bash
# Update .env: ENABLE_BID_LOCKING=true
# Restart server

curl -X POST http://localhost:3000/api/bids/v2 \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "test-id",
    "amount": 100
  }'

# Expected Response:
{
  "error": "Authentication required"
}
# HTTP Status: 401 Unauthorized
```

**Test 3: Successful Bid (Requires Auth)**
```bash
# First login and get session cookie
# Then place bid

curl -X POST http://localhost:3000/api/bids/v2 \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "listingId": "valid-listing-id",
    "amount": 105.50,
    "expectedVersion": 0
  }'

# Expected Response:
{
  "success": true,
  "bid": {
    "id": "...",
    "amount": 105.50,
    "bidderId": "...",
    "listingId": "...",
    "status": "WINNING",
    "createdAt": "..."
  },
  "newVersion": 1,
  "message": "Bid placed successfully",
  "attempt": 1
}
# HTTP Status: 200 OK
```

**Checklist:**
- [ ] v2 endpoint disabled by default
- [ ] Requires authentication
- [ ] Validates input data
- [ ] Returns error for invalid listing
- [ ] Places bid successfully with locking
- [ ] Updates listing version
- [ ] Retries on version mismatch

---

#### 3.3 Proxy Bidding API

**Test 1: Create Proxy Bid**
```bash
# Update .env: ENABLE_AUTO_BID=true
# Restart server: npm run dev

curl -X POST http://localhost:3000/api/bids/proxy \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "listingId": "valid-listing-id",
    "maxAmount": 150.00,
    "incrementAmount": 5.00
  }'

# Expected Response:
{
  "success": true,
  "proxyBid": {
    "id": "...",
    "userId": "...",
    "listingId": "...",
    "maxAmount": 150.00,
    "currentAmount": 0,
    "incrementAmount": 5.00,
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "Auto-bidding activated up to $150"
}
# HTTP Status: 200 OK
```

**Test 2: Get User's Proxy Bids**
```bash
curl -X GET http://localhost:3000/api/bids/proxy \
  -H "Cookie: next-auth.session-token=..."

# Expected Response:
{
  "proxyBids": [
    {
      "id": "...",
      "listingId": "...",
      "maxAmount": 150.00,
      "currentAmount": 105.00,
      "incrementAmount": 5.00,
      "isActive": true,
      "listing": {
        "title": "...",
        "currentBid": 105.00
      }
    }
  ]
}
# HTTP Status: 200 OK
```

**Test 3: Cancel Proxy Bid**
```bash
curl -X DELETE "http://localhost:3000/api/bids/proxy?id=proxy-bid-id" \
  -H "Cookie: next-auth.session-token=..."

# Expected Response:
{
  "success": true,
  "message": "Auto-bidding canceled"
}
# HTTP Status: 200 OK
```

**Checklist:**
- [ ] Proxy bid creation works
- [ ] Maximum amount validated
- [ ] Increment amount validated
- [ ] User can view their proxy bids
- [ ] User can cancel proxy bids
- [ ] Proxy bids trigger on new bids
- [ ] Respects maximum amount limit

---

### 4. Integration Tests

#### 4.1 Complete Bidding Flow
```
1. User A creates listing
2. User B places initial bid
3. User C sets proxy bid (max $200)
4. User B places higher bid
5. User C's proxy bid auto-executes
6. User B tries to bid again
7. User C's proxy bid auto-executes again
8. Auction ends
9. User C wins
10. Payment required
```

**Checklist:**
- [ ] Regular bidding still works
- [ ] Proxy bidding executes automatically
- [ ] Bid locking prevents race conditions
- [ ] Notifications sent correctly
- [ ] Winner determined correctly

---

#### 4.2 Auth Flow
```
1. Register new user
2. Verify email (if enabled)
3. Login
4. Access protected routes
5. Logout
```

**Checklist:**
- [ ] Registration works
- [ ] Email verification works
- [ ] Login successful
- [ ] Session persists
- [ ] Logout clears session

---

#### 4.3 Listing Flow
```
1. Vendor connects Stripe
2. Vendor creates listing
3. Listing appears in marketplace
4. Listing countdown starts
5. Listing goes LIVE
6. Bids can be placed
7. Listing ends
8. Winner determined
```

**Checklist:**
- [ ] Stripe Connect works
- [ ] Listing creation successful
- [ ] Images upload correctly
- [ ] Countdown timer accurate
- [ ] Status transitions correct

---

#### 4.4 Payment Flow
```
1. Auction ends
2. Winner gets notification
3. Winner pays via Stripe
4. Payment recorded
5. Seller gets payout
```

**Checklist:**
- [ ] Payment notifications sent
- [ ] Stripe Checkout works
- [ ] Payment recorded in DB
- [ ] Seller payout calculated
- [ ] Platform fee applied

---

### 5. Error Handling Tests

#### 5.1 Invalid Inputs
```bash
# Test missing required fields
curl -X POST http://localhost:3000/api/bids/v2 \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 400 Bad Request with validation errors
```

**Checklist:**
- [ ] Missing fields rejected
- [ ] Invalid types rejected
- [ ] Negative amounts rejected
- [ ] Invalid IDs rejected
- [ ] Meaningful error messages

---

#### 5.2 Database Errors
```
Simulate:
1. Database connection lost
2. Unique constraint violation
3. Foreign key constraint violation
4. Transaction timeout
```

**Checklist:**
- [ ] Graceful error handling
- [ ] Transaction rollback on error
- [ ] Error logging
- [ ] User-friendly error messages

---

#### 5.3 Race Conditions
```
Simulate:
1. Multiple users bid simultaneously
2. Version mismatch on concurrent updates
3. Proxy bids triggered concurrently
```

**Checklist:**
- [ ] Optimistic locking works
- [ ] Retries happen automatically
- [ ] No data corruption
- [ ] Winner determined fairly

---

### 6. Performance Tests

#### 6.1 Response Times
```bash
# Test API response times
time curl http://localhost:3000/api/health
time curl http://localhost:3000/api/bids/v2 (with auth)
```

**Targets:**
- Health check: < 100ms
- Bid placement: < 500ms
- Proxy bid creation: < 300ms

**Checklist:**
- [ ] Health checks fast (<100ms)
- [ ] Bid API responsive (<500ms)
- [ ] Database queries optimized
- [ ] Indexes used correctly

---

#### 6.2 Load Testing (Optional)
```bash
# Use Apache Bench or similar
ab -n 1000 -c 10 http://localhost:3000/api/health

# Expected: Handle 100+ requests/second
```

**Checklist:**
- [ ] No crashes under load
- [ ] Response times consistent
- [ ] No memory leaks
- [ ] Database connections pooled

---

### 7. Security Tests

#### 7.1 Authentication
```
Test:
1. Unauthenticated access blocked
2. Invalid tokens rejected
3. Expired sessions handled
```

**Checklist:**
- [ ] Auth required for protected routes
- [ ] Invalid tokens rejected
- [ ] CSRF protection enabled
- [ ] Session expiry works

---

#### 7.2 Authorization
```
Test:
1. Users can't modify others' bids
2. Non-vendors can't create listings
3. Non-winners can't access payment
```

**Checklist:**
- [ ] Resource ownership verified
- [ ] Role-based access works
- [ ] Proper error messages (not info leaks)

---

#### 7.3 Input Validation
```
Test:
1. SQL injection attempts
2. XSS attempts
3. NoSQL injection
4. Command injection
```

**Checklist:**
- [ ] Parameterized queries used
- [ ] Input sanitized
- [ ] Output escaped
- [ ] No code injection possible

---

### 8. UI/UX Tests

#### 8.1 Feature Visibility
```
Test:
1. Proxy bid modal appears (when feature enabled)
2. Health status visible (when enabled)
3. Error messages user-friendly
```

**Checklist:**
- [ ] UI components render correctly
- [ ] Feature flags hide/show features
- [ ] Error states displayed properly
- [ ] Success messages shown

---

#### 8.2 Responsive Design
```
Test:
1. Mobile view (320px-768px)
2. Tablet view (768px-1024px)
3. Desktop view (1024px+)
```

**Checklist:**
- [ ] Layouts adapt to screen size
- [ ] Touch targets sized properly
- [ ] No horizontal scrolling
- [ ] Images scale correctly

---

### 9. Browser Compatibility

**Test Browsers:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Features to Verify:**
- [ ] JavaScript features work
- [ ] CSS styling correct
- [ ] WebSocket connections work
- [ ] No console errors

---

### 10. Deployment Tests

#### 10.1 Production Build
```bash
npm run build
npm start

# Verify:
# - Build completes successfully
# - Server starts without errors
# - All routes accessible
# - Environment variables loaded
```

**Checklist:**
- [x] ✅ Build successful
- [ ] Production server starts
- [ ] Environment variables loaded
- [ ] No dev dependencies in prod
- [ ] Logs show no errors

---

#### 10.2 Database Migrations
```bash
# Production migration (dry run first)
npx prisma migrate deploy --preview

# Actual migration
npx prisma migrate deploy
```

**Checklist:**
- [ ] Migration script dry-run successful
- [ ] Backup created before migration
- [ ] Migration applied successfully
- [ ] Rollback plan tested
- [ ] Data integrity verified

---

## 📊 TEST SUMMARY

### Automated Tests Status
| Category | Total | Passed | Failed | Pending | Coverage |
|----------|-------|--------|--------|---------|----------|
| Build    | 1     | ✅ 1   | 0      | 0       | 100%     |
| Syntax   | 1     | ✅ 1   | 0      | 0       | 100%     |
| Schema   | 1     | ✅ 1   | 0      | 0       | 100%     |
| API      | 0     | 0      | 0      | 12      | 0%       |
| DB       | 0     | 0      | 0      | 3       | 0%       |
| UI       | 0     | 0      | 0      | 8       | 0%       |

### Manual Tests Required
- [ ] 12 API endpoint tests
- [ ] 4 Integration flow tests
- [ ] 3 Database operation tests
- [ ] 8 UI/UX tests
- [ ] 4 Browser compatibility tests
- [ ] 2 Deployment tests

### Critical Path Tests (Must Pass Before Launch)
1. ✅ Production build successful
2. ⏳ Database migrations applied
3. ⏳ User registration & login
4. ⏳ Listing creation
5. ⏳ Bid placement
6. ⏳ Payment processing
7. ⏳ Stripe Connect working

---

## 🚦 GO/NO-GO DECISION CRITERIA

### ✅ GREEN LIGHT (Ready to Deploy)
- All critical path tests pass
- Build successful
- Database migrations applied
- No known security issues
- Performance acceptable
- Error handling verified

### 🟡 YELLOW LIGHT (Proceed with Caution)
- Minor UI issues
- Non-critical features disabled
- Performance slightly degraded
- Some edge cases not tested

### 🔴 RED LIGHT (DO NOT DEPLOY)
- Build failures
- Critical bugs present
- Security vulnerabilities
- Data integrity issues
- Payment processing broken

---

## 📝 NOTES FOR TESTERS

### Test Account Credentials
```
Admin Account:
- Email: admin@goauction.test
- Password: (set during seeding)

Buyer Account:
- Email: buyer@goauction.test
- Password: (set during seeding)

Seller/Vendor Account:
- Email: seller@goauction.test
- Password: (set during seeding)
```

### Test Data
- Run `npm run seed` to populate test data
- Creates 10 sample listings
- Creates 5 sample users
- Creates sample bids and transactions

### Known Limitations
1. ⚠️ Email sending requires Resend API key
2. ⚠️ Stripe requires test mode keys
3. ⚠️ Cloudinary requires account setup
4. ⚠️ WebSocket requires Socket.io server running

---

**QA Checklist Version:** 1.0  
**Last Updated:** December 25, 2024  
**Status:** Ready for testing after database setup

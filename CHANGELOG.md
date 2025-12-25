# Changelog

All notable changes to the goAuction project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Feature Implementations (December 2025)

#### Feature 1: Bid Transaction Lock (Optimistic Concurrency Control)
- Added `version` field to Listing model for optimistic locking
- Created `app/api/bids/v2/route.js` - New bidding API with version checking
- Added retry logic with exponential backoff for concurrent bid handling
- Implemented database-level transaction isolation (Serializable)
- **Status**: Disabled by default (ENABLE_BID_LOCKING=false)
- **Breaking**: None - completely additive, new API endpoints only
- **Rollback**: Set ENABLE_BID_LOCKING=false or revert migration

#### Feature 2: Auto-Bid Proxy (Automatic Bidding System)
- Added `ProxyBid` model for storing user bidding preferences
- Added `isProxy` field to Bid model to distinguish auto-placed bids
- Created `lib/features/autoBid_engine.js` - Core proxy bidding logic
- Created `app/api/bids/proxy/route.js` - Proxy bid management API
- Created `components/features/ProxyBidModal.jsx` - UI for setting max bids
- **Status**: Disabled by default (ENABLE_AUTO_BID=false)
- **Breaking**: None - completely additive
- **Rollback**: Set ENABLE_AUTO_BID=false or revert migration

#### Feature 3: System Monitoring & Health Checks
- Added `HealthCheck` model for storing health check history
- Created `app/api/health/route.js` - Comprehensive health check endpoint
- Created `app/api/health/ready/route.js` - Kubernetes readiness probe
- Created `lib/features/monitoring.js` - Centralized health check utilities
- **Status**: Enabled by default (ENABLE_HEALTH_CHECKS=true) - non-invasive
- **Breaking**: None - read-only endpoints
- **Rollback**: Set ENABLE_HEALTH_CHECKS=false

### Database Migrations
- `migration_001_add_bid_locking.sql` - Adds version column to Listing
- `migration_002_add_proxy_bidding.sql` - Adds ProxyBid model and isProxy field
- `migration_003_add_health_checks.sql` - Adds HealthCheck model
- All migrations are reversible with down scripts

### Configuration
- Added `.env.example.new` with feature flag documentation
- All features disabled by default for zero-impact deployment
- Feature flags: ENABLE_BID_LOCKING, ENABLE_AUTO_BID, ENABLE_HEALTH_CHECKS

### Tests
- `tests/features/bidLocking.test.js` - Concurrency and version check tests
- `tests/features/proxyBidding.test.js` - Proxy bid engine tests
- `tests/features/healthChecks.test.js` - Health endpoint tests

### Documentation
- Updated README with feature flags section
- Added rollback procedures for each feature
- Documented API endpoints in OpenAPI format

## Safety Guarantees

✅ **Zero Breaking Changes**: All features use new tables/columns only
✅ **Backward Compatible**: Existing functionality unchanged
✅ **Feature Flags**: All features can be disabled via environment variables
✅ **Graceful Degradation**: Disabled features return 404/501 responses
✅ **Reversible Migrations**: All database changes can be rolled back
✅ **Isolated Code**: New files prefixed with feature names, no core file modifications

## How to Enable Features

1. Run database migrations: `npx prisma migrate dev`
2. Update `.env` file with desired feature flags
3. Restart the application
4. Test each feature individually before enabling in production

## Rollback Instructions

### Complete Rollback
```bash
git revert HEAD~3  # Revert last 3 commits
npx prisma migrate reset  # Reset database to before features
```

### Feature-Specific Rollback
- Set feature flag to `false` in `.env`
- Restart application
- Feature will be disabled without code changes

---

## [1.0.0] - 2024-12-25 (Before Features)

### Initial Release
- Auction listing system
- Real-time bidding
- Stripe payment integration
- User authentication
- Email notifications

<div align="center">
  <h1><img src="https://gocartshop.in/favicon.ico" width="20" height="20" alt="GoCart Favicon">
   GoAuction</h1>
  <p>
    An open-source multi-vendor e-commerce platform built with Next.js and Tailwind CSS.
  </p>
</div>

---

## 📖 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

---

## Features

- **Multi-Vendor Architecture:** Allows multiple vendors to register, manage their own products, and sell on a single platform.
- **Customer-Facing Storefront:** A beautiful and responsive user interface for customers to browse and purchase products.
- **Vendor Dashboards:** Dedicated dashboards for vendors to manage products, view sales analytics, and track orders.
- **Admin Panel:** A comprehensive dashboard for platform administrators to oversee vendors, products, and commissions.

## 🛠️ Tech Stack <a name="-tech-stack"></a>

- **Framework:** Next.js
- **Styling:** Tailwind CSS
- **UI Components:** Lucide React for icons
- **State Management:** Redux Toolkit

## 🚀 Getting Started <a name="-getting-started"></a>

First, install the dependencies. We recommend using `npm` for this project.

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/(public)/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Outfit](https://vercel.com/font), a new font family for Vercel.

---

## 🤝 Contributing <a name="-contributing"></a>

We welcome contributions! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) for more details on how to get started.

---

## 📜 License <a name="-license"></a>

This project is licensed under the MIT License. See the [LICENSE.md](./LICENSE.md) file for details.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

---

## 🎯 Feature Flags (New Features)

GoAuction now includes three advanced features that can be enabled/disabled via environment variables. All features are **disabled by default** for safety.

### Feature 1: Bid Transaction Lock (Optimistic Concurrency Control)
**Status:** ✅ Implemented | **Flag:** `ENABLE_BID_LOCKING=true`

Prevents race conditions in concurrent bidding scenarios using database-level optimistic locking with version control.

**Benefits:**
- Eliminates double-bidding issues
- Ensures auction integrity
- Automatic retry with exponential backoff

**API Endpoint:** `POST /api/bids/v2`

**To Enable:**
```env
ENABLE_BID_LOCKING=true
BID_MAX_RETRIES=3
BID_RETRY_DELAY_MS=100
```

### Feature 2: Auto-Bid Proxy (Automatic Bidding)
**Status:** ✅ Implemented | **Flag:** `ENABLE_AUTO_BID=true`

eBay-style proxy bidding - users set a maximum bid amount, system auto-bids on their behalf when outbid.

**Benefits:**
- Increases user convenience
- Reduces auction monitoring time
- Higher average bid amounts

**API Endpoints:**
- `POST /api/bids/proxy` - Create proxy bid
- `GET /api/bids/proxy` - Get user's proxy bids
- `DELETE /api/bids/proxy?id=xxx` - Cancel proxy bid

**To Enable:**
```env
ENABLE_AUTO_BID=true
AUTO_BID_DEFAULT_INCREMENT=5.00
AUTO_BID_MAX_AMOUNT=10000.00
```

### Feature 3: System Monitoring & Health Checks
**Status:** ✅ Implemented | **Flag:** `ENABLE_HEALTH_CHECKS=true` (enabled by default)

Comprehensive health check endpoints for production monitoring and observability.

**Benefits:**
- Proactive issue detection
- Kubernetes/Docker ready
- Service dependency monitoring

**API Endpoints:**
- `GET /api/health` - Full health status
- `GET /api/health/ready` - Readiness probe

**To Enable:**
```env
ENABLE_HEALTH_CHECKS=true
HEALTH_CHECK_TIMEOUT_MS=5000
```

### Database Migrations

After enabling any feature, run:

```bash
npx prisma migrate dev
npx prisma generate
```

### Rollback Instructions

**Per-Feature Rollback:**
1. Set feature flag to `false` in `.env`
2. Restart the application
3. Feature is disabled without code changes

**Complete Rollback:**
```bash
git revert HEAD~1
npx prisma migrate reset
npm restart
```

### Safety Guarantees

✅ **Zero Breaking Changes** - All features are additive  
✅ **Backward Compatible** - Existing APIs unchanged  
✅ **Feature Flags** - Can be disabled anytime  
✅ **Graceful Degradation** - Disabled features return 501 Not Implemented  
✅ **Reversible Migrations** - All DB changes can be rolled back

For more details, see [CHANGELOG.md](./CHANGELOG.md) and `copilot_feature_suggestions.json`.

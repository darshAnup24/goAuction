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

### Prerequisites

Before running this project on a new device, ensure you have:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **MySQL** 8.0 or higher ([Download](https://dev.mysql.com/downloads/mysql/))
- **Git** ([Download](https://git-scm.com/))
- **Stripe Account** (for payments) - [Sign up](https://dashboard.stripe.com/register)
- **Cloudinary Account** (for image uploads) - [Sign up](https://cloudinary.com/users/register/free)
- **Resend Account** (for emails) - [Sign up](https://resend.com/signup)

### 📥 Step 1: Clone the Repository

```bash
# Clone from GitHub
git clone https://github.com/darshAnup24/goAuction.git

# Navigate to project directory
cd goAuction
```

### 📦 Step 2: Install Dependencies

```bash
npm install
```

### ⚙️ Step 3: Environment Configuration

Create a `.env` file in the **root directory** (copy from `.env.example.new`):

```bash
# On Windows
copy .env.example.new .env

# On Mac/Linux
cp .env.example.new .env
```

Edit `.env` and configure the following:

#### **Required Configuration:**

```env
# Database (MySQL)
DATABASE_URL="mysql://USERNAME:PASSWORD@localhost:3306/goauction"

# NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (Get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Cloudinary (Get from https://console.cloudinary.com/)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Resend (Get from https://resend.com/api-keys)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="GoAuction <onboarding@resend.dev>"
```

#### **Optional - Feature Flags (Disabled by Default):**

```env
# Advanced Features (See Feature Flags section below)
ENABLE_BID_LOCKING=false
ENABLE_AUTO_BID=false
ENABLE_HEALTH_CHECKS=false
```

### 🗄️ Step 4: Database Setup

#### **Option A: Local MySQL**

```bash
# Create database
mysql -u root -p
CREATE DATABASE goauction;
EXIT;

# Run migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# (Optional) Seed test data
npx prisma db seed
```

#### **Option B: Docker MySQL**

```bash
# Start MySQL in Docker
docker run -d \
  --name goauction-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=goauction \
  -e MYSQL_USER=admin \
  -e MYSQL_PASSWORD=password \
  -p 3306:3306 \
  mysql:8.0

# Wait 10 seconds for MySQL to start
# Then update .env with: DATABASE_URL="mysql://admin:password@localhost:3306/goauction"

# Run migrations
npx prisma migrate dev
npx prisma generate
```

### 🚀 Step 5: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 🏗️ Step 6: Build for Production (Optional)

```bash
# Build the application
npm run build

# Start production server
npm start
```

---

## 🔧 Troubleshooting

### Common Issues

**Issue: "Prisma Client did not initialize"**
```bash
npx prisma generate
```

**Issue: "Database connection failed"**
- Verify MySQL is running
- Check DATABASE_URL in `.env`
- Ensure database exists

**Issue: "Module not found" errors**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Issue: "Port 3000 already in use"**
```bash
# Change port in package.json dev script
"dev": "next dev -p 3001"
```

---

## 📱 Running on Different Devices

### Same Network (Local Testing)

1. **Find your IP address:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. **Update `.env`:**
   ```env
   NEXTAUTH_URL="http://YOUR_IP:3000"
   ```

3. **Start server:**
   ```bash
   npm run dev
   ```

4. **Access from other devices:**
   ```
   http://YOUR_IP:3000
   ```

### Remote Server Deployment

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed deployment instructions.

---

## 🎨 Default Credentials (After Seeding)

```
Admin: admin@goauction.com / admin123
Buyer: buyer@goauction.com / buyer123
Seller: seller@goauction.com / seller123
```

---

## 📚 Additional Documentation

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup instructions
- [CHANGELOG.md](./CHANGELOG.md) - Recent changes and features
- [BUG_REPORT.md](./BUG_REPORT.md) - Known issues and fixes
- [QA_CHECKLIST.md](./QA_CHECKLIST.md) - Testing checklist

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

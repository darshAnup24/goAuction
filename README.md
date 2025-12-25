<div align="center">
  <h1>🛒 GoCart</h1>
  <p>
    An open-source multi-vendor auction e-commerce platform with real-time bidding, built with Next.js 15, Prisma, and Socket.io.
  </p>
  <p>
    <a href="https://github.com/GreatStackDev/goCart/blob/main/LICENSE.md"><img src="https://img.shields.io/github/license/GreatStackDev/goCart?style=for-the-badge" alt="License"></a>
    <a href="https://github.com/GreatStackDev/goCart/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge" alt="PRs Welcome"></a>
    <a href="https://github.com/GreatStackDev/goCart/issues"><img src="https://img.shields.io/github/issues/GreatStackDev/goCart?style=for-the-badge" alt="GitHub issues"></a>
  </p>
</div>

---

## 📖 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Environment Variables](#️-environment-variables)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

---

## ✨ Features

- **Real-Time Auction Bidding:** Live bidding system powered by Socket.io with instant updates across all connected clients.
- **Multi-Vendor Architecture:** Vendors can register, manage their auction listings, and track sales on a single platform.
- **Customer-Facing Storefront:** Beautiful, responsive UI for browsing auctions, placing bids, and purchasing products.
- **Vendor Dashboards:** Dedicated dashboards for vendors to manage listings, view sales analytics, and track orders.
- **Stripe Payments:** Integrated Stripe Connect for secure vendor payouts and customer payments.
- **Email Notifications:** Transactional emails for auction wins, outbids, payments, and more using React Email + Resend.
- **Real-Time Notifications:** In-app notification system with bell icon and live updates.
- **Image Uploads:** Cloudinary integration for product image management.
- **Countdown Timers:** Live auction countdown timers with automatic status updates.
- **Rating System:** Customers can rate vendors and products after purchase.

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Runtime** | React 19 |
| **Database** | Prisma ORM |
| **Authentication** | NextAuth.js v5 |
| **Real-Time** | Socket.io |
| **Styling** | Tailwind CSS 4 |
| **State Management** | Redux Toolkit |
| **Payments** | Stripe + Stripe Connect |
| **Emails** | React Email + Resend |
| **Image Storage** | Cloudinary |
| **Icons** | Lucide React |
| **Forms** | React Hook Form + Zod |
| **Charts** | Recharts |
| **Scheduling** | node-cron |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (or any Prisma-supported database)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/GreatStackDev/goCart.git
   cd goCart
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Fill in your environment variables (see [Environment Variables](#️-environment-variables) section).

4. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Seed the database (optional):**
   ```bash
   npm run seed
   ```

6. **Run the development server:**
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="your-database-url"

# NextAuth
AUTH_SECRET="your-auth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Resend (Email)
RESEND_API_KEY="re_..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) for more details on how to get started.

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE.md](./LICENSE.md) file for details.

---

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API.
- [Prisma Documentation](https://www.prisma.io/docs) - Learn about Prisma ORM.
- [Socket.io Documentation](https://socket.io/docs) - Learn about real-time communication.
- [Stripe Documentation](https://stripe.com/docs) - Learn about payment integration.

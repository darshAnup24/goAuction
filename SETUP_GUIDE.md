# Step-by-Step Setup Guide

This guide will walk you through setting up and running the GoAuction platform on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **npm** (comes with Node.js) or **yarn** or **pnpm**
3. **MySQL Database** (v8.0 or higher) - [Download here](https://dev.mysql.com/downloads/mysql/)
4. **Git** (optional, for version control)

---

## Step 1: Install Node.js Dependencies

1. Open your terminal/command prompt
2. Navigate to the project directory:
   ```bash
   cd goAuction
   ```

3. Install all required packages:
   ```bash
   npm install
   ```
   
   This will install all dependencies listed in `package.json`. Wait for the installation to complete.

---

## Step 2: Set Up MySQL Database

1. **Start MySQL Server**
   - On Windows: Start MySQL from Services or use MySQL Workbench
   - On Mac/Linux: `sudo service mysql start` or `brew services start mysql`

2. **Create a Database**
   - Open MySQL command line or MySQL Workbench
   - Create a new database:
     ```sql
     CREATE DATABASE goauction_db;
     ```
   - Note the database name for the next step

3. **Get Your Database Connection String**
   - Format: `mysql://username:password@localhost:3306/database_name`
   - Example: `mysql://root:yourpassword@localhost:3306/goauction_db`

---

## Step 3: Configure Environment Variables

1. **Create a `.env` file** in the `goAuction` directory (same level as `package.json`)

2. **Add the following environment variables** to your `.env` file:

   ```env
   # Database
   DATABASE_URL="mysql://username:password@localhost:3306/goauction_db"

   # NextAuth.js (Authentication)
   NEXTAUTH_SECRET="your-random-secret-key-here-minimum-32-characters"
   NEXTAUTH_URL="http://localhost:3000"

   # Application URL
   NEXT_PUBLIC_APP_URL="http://localhost:3000"

   # Stripe (Payment Processing) - Get from https://dashboard.stripe.com/apikeys
   STRIPE_SECRET_KEY="sk_test_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..." # Optional for local development

   # Resend (Email Service) - Get from https://resend.com/api-keys
   RESEND_API_KEY="re_..."
   RESEND_FROM_EMAIL="GoAuction <noreply@yourdomain.com>"

   # Cron Job Secret (for scheduled tasks)
   CRON_SECRET="your-cron-secret-key"

   # Optional: Server Configuration
   PORT=3000
   HOSTNAME=localhost
   NODE_ENV=development
   ```

3. **Generate Secrets:**
   - For `NEXTAUTH_SECRET`: Run `openssl rand -base64 32` in terminal, or use an online generator
   - For `CRON_SECRET`: Use any random string (e.g., "my-secret-cron-key-123")

4. **Get API Keys:**
   - **Stripe**: Sign up at https://stripe.com and get test keys from Dashboard → Developers → API keys
   - **Resend**: Sign up at https://resend.com and create an API key from the dashboard

---

## Step 4: Set Up Prisma (Database ORM)

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```
   This creates the Prisma Client based on your schema.

2. **Run Database Migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```
   This creates all the database tables according to `prisma/schema.prisma`.

3. **Seed the Database (Optional but Recommended):**
   ```bash
   npm run seed
   ```
   This populates your database with sample data including:
   - Test users (vendors and buyers)
   - Sample auction listings
   - Test bids

   **Default Login Credentials** (from seed):
   - Admin: `admin@goauction.com` / `password123`
   - Vendor: `alice@vendor.com` / `password123`
   - Buyer: `charlie@buyer.com` / `password123`

---

## Step 5: Start the Development Server

1. **Run the development server:**
   ```bash
   npm run dev
   ```

   This starts:
   - Next.js application on port 3000
   - Socket.IO server for real-time updates
   - Cron jobs for scheduled tasks

2. **You should see output like:**
   ```
   🚀 Server ready on http://localhost:3000
   🔌 Socket.IO ready for real-time updates
   ⏰ Cron jobs initialized (self-hosted mode)
   ```

3. **Open your browser** and navigate to:
   ```
   http://localhost:3000
   ```

---

## Step 6: Verify Everything Works

1. **Check the Homepage**: You should see the GoAuction landing page
2. **Test Login**: Try logging in with seeded credentials
3. **Check Database**: Verify data exists in your MySQL database
4. **Test Real-time Features**: Open multiple browser tabs to test Socket.IO

---

## Troubleshooting

### Issue: "Cannot connect to database"
- **Solution**: Check your `DATABASE_URL` in `.env` file
- Verify MySQL is running: `mysql -u root -p`
- Test connection: `mysql -u username -p -h localhost database_name`

### Issue: "Prisma Client not generated"
- **Solution**: Run `npx prisma generate` again

### Issue: "Port 3000 already in use"
- **Solution**: Change `PORT=3000` to another port (e.g., `PORT=3001`) in `.env`
- Or stop the process using port 3000

### Issue: "Module not found" errors
- **Solution**: Delete `node_modules` and `package-lock.json`, then run `npm install` again

### Issue: "NEXTAUTH_SECRET is missing"
- **Solution**: Make sure `.env` file exists and contains `NEXTAUTH_SECRET`

### Issue: Stripe/Resend errors
- **Solution**: These are optional for basic functionality. You can test the app without them, but payment and email features won't work.

---

## Additional Commands

- **Build for Production:**
  ```bash
  npm run build
  ```

- **Start Production Server:**
  ```bash
  npm start
  ```

- **View Database in Prisma Studio:**
  ```bash
  npx prisma studio
  ```
  Opens a GUI to view/edit your database at `http://localhost:5555`

- **Reset Database:**
  ```bash
  npx prisma migrate reset
  npm run seed
  ```

- **Check Stripe Setup:**
  ```bash
  node scripts/check-stripe-setup.js
  ```

---

## Project Structure

- `app/` - Next.js App Router pages and API routes
- `components/` - React components
- `lib/` - Utility functions and configurations
- `prisma/` - Database schema and migrations
- `server.js` - Custom server with Socket.IO
- `public/` - Static assets

---

## Next Steps

1. Explore the application features
2. Create your own user account
3. Test the auction bidding system
4. Check out the vendor dashboard
5. Review the admin panel

---

## Need Help?

- Check the main `README.md` for more information
- Review the Prisma schema in `prisma/schema.prisma`
- Check API routes in `app/api/` directory

---

**Happy Coding! 🚀**


/**
 * Cron Job Scheduler for Self-Hosted Deployments
 * 
 * This file sets up cron jobs using node-cron for environments
 * where Vercel Cron is not available (e.g., self-hosted, VPS, Docker).
 * 
 * Usage:
 * - Import this in server.js
 * - Cron jobs will run automatically when server starts
 */

const cron = require("node-cron");

let isInitialized = false;

/**
 * Initialize cron jobs
 */
function initCronJobs() {
  if (isInitialized) {
    console.log("⚠️  Cron jobs already initialized");
    return;
  }

  console.log("🕐 Initializing cron jobs...");

  // Expire auctions every minute
  cron.schedule("* * * * *", async () => {
    try {
      console.log("🕐 Running auction expiration check...");
      
      const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/cron/expire-auctions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.CRON_SECRET || "local-dev-secret"}`,
        },
      });

      const result = await response.json();
      
      if (result.success) {
        if (result.processed > 0) {
          console.log(`✅ Expired ${result.processed} auctions (${result.results.sold} sold, ${result.results.unsold} unsold)`);
        }
      } else {
        console.error("❌ Cron job failed:", result.error);
      }
    } catch (error) {
      console.error("❌ Cron job error:", error.message);
    }
  });

  // Send "ending soon" notifications (5 minutes before auction ends)
  cron.schedule("* * * * *", async () => {
    try {
      await checkEndingSoonAuctions();
    } catch (error) {
      console.error("❌ Ending soon check error:", error.message);
    }
  });

  // Daily cleanup job (runs at midnight)
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("🧹 Running daily cleanup...");
      await cleanupOldData();
    } catch (error) {
      console.error("❌ Cleanup error:", error.message);
    }
  });

  isInitialized = true;
  console.log("✅ Cron jobs initialized successfully");
}

/**
 * Check for auctions ending soon and send notifications
 */
async function checkEndingSoonAuctions() {
  const prisma = require("./prisma").default;
  const { getSocket } = require("./socket");

  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
  const now = new Date();

  // Find auctions ending in the next 5 minutes
  const endingSoon = await prisma.listing.findMany({
    where: {
      type: "AUCTION",
      status: "LIVE",
      endTime: {
        gte: now,
        lte: fiveMinutesFromNow,
      },
      // Add a flag to prevent duplicate notifications
      endingSoonNotificationSent: { not: true },
    },
  });

  if (endingSoon.length === 0) return;

  console.log(`⏰ Found ${endingSoon.length} auctions ending soon`);

  for (const auction of endingSoon) {
    try {
      // Emit Socket.IO event
      const io = getSocket();
      if (io) {
        const timeRemaining = auction.endTime - now;
        io.to(`listing:${auction.id}`).emit("auction:ending-soon", {
          listingId: auction.id,
          timeRemaining,
          message: "Auction ending soon! Place your bid now.",
          timestamp: new Date().toISOString(),
        });
      }

      // Mark notification as sent
      await prisma.listing.update({
        where: { id: auction.id },
        data: { endingSoonNotificationSent: true },
      });

      console.log(`⏰ Sent ending soon notification for: ${auction.title}`);
    } catch (error) {
      console.error(`⚠️  Error sending notification for ${auction.id}:`, error);
    }
  }
}

/**
 * Cleanup old data (optional)
 */
async function cleanupOldData() {
  const prisma = require("./prisma").default;

  // Example: Delete old notifications (older than 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // const deleted = await prisma.notification.deleteMany({
  //   where: {
  //     createdAt: { lt: thirtyDaysAgo },
  //     read: true,
  //   },
  // });

  // console.log(`🧹 Cleaned up ${deleted.count} old notifications`);
  console.log("🧹 Cleanup completed");
}

/**
 * Stop all cron jobs (for graceful shutdown)
 */
function stopCronJobs() {
  console.log("🛑 Stopping cron jobs...");
  cron.getTasks().forEach((task) => task.stop());
  isInitialized = false;
  console.log("✅ Cron jobs stopped");
}

module.exports = {
  initCronJobs,
  stopCronJobs,
};

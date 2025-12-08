#!/usr/bin/env node

/**
 * Test Script: Create Expired Auction
 * 
 * This script creates a test auction that has already expired,
 * so you can see the cron job in action.
 * 
 * Usage:
 *   node scripts/test-cron.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Creating test expired auction...\n");

  try {
    // Get or create a test user
    let seller = await prisma.user.findFirst({
      where: { email: "seller@test.com" },
    });

    if (!seller) {
      console.log("Creating test seller...");
      seller = await prisma.user.create({
        data: {
          email: "seller@test.com",
          username: "test_seller",
          password: "hashed_password",
          fullName: "Test Seller",
          isVendor: true,
        },
      });
    }

    console.log(`✅ Seller: ${seller.username} (${seller.id})`);

    // Get or create a test bidder
    let bidder = await prisma.user.findFirst({
      where: { email: "bidder@test.com" },
    });

    if (!bidder) {
      console.log("Creating test bidder...");
      bidder = await prisma.user.create({
        data: {
          email: "bidder@test.com",
          username: "test_bidder",
          password: "hashed_password",
          fullName: "Test Bidder",
        },
      });
    }

    console.log(`✅ Bidder: ${bidder.username} (${bidder.id})\n`);

    // Create expired auction
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const listing = await prisma.listing.create({
      data: {
        title: "Test Vintage Watch - EXPIRED",
        description: "This is a test auction that has already expired. The cron job should process it within 1 minute.",
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1523170335258-f5ed11844a49"
        ]),
        startingPrice: 50.0,
        reservePrice: 100.0,
        currentBid: 150.0,
        startTime: oneHourAgo,
        endTime: twoMinutesAgo, // Expired 2 minutes ago
        status: "LIVE",
        category: "Electronics",
        type: "AUCTION",
        sellerId: seller.id,
        bidCount: 1,
      },
    });

    console.log(`✅ Created expired auction:`);
    console.log(`   ID: ${listing.id}`);
    console.log(`   Title: ${listing.title}`);
    console.log(`   Current Bid: $${listing.currentBid}`);
    console.log(`   Status: ${listing.status}`);
    console.log(`   End Time: ${listing.endTime.toISOString()}`);
    console.log(`   (Expired ${Math.floor((now - listing.endTime) / 1000)} seconds ago)\n`);

    // Create winning bid
    const bid = await prisma.bid.create({
      data: {
        amount: 150.0,
        bidderId: bidder.id,
        listingId: listing.id,
        status: "WINNING",
      },
    });

    console.log(`✅ Created winning bid:`);
    console.log(`   ID: ${bid.id}`);
    console.log(`   Amount: $${bid.amount}`);
    console.log(`   Bidder: ${bidder.username}`);
    console.log(`   Status: ${bid.status}\n`);

    console.log("─────────────────────────────────────────");
    console.log("🕐 Waiting for cron job to process...");
    console.log("─────────────────────────────────────────");
    console.log("\nThe cron job runs every minute.");
    console.log("Wait up to 60 seconds and check the console logs.\n");
    console.log("You should see:");
    console.log('  ✅ Auction SOLD: "Test Vintage Watch - EXPIRED"');
    console.log(`     - Winner: ${bidder.username}`);
    console.log(`     - Final Price: $${listing.currentBid}\n`);

    console.log("Then check the database:");
    console.log("  - Listing status should be SOLD");
    console.log("  - Listing winnerId should be set");
    console.log(`  - Bid status should be WON\n`);

    console.log("Run this to verify:");
    console.log(`  npx prisma studio\n`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

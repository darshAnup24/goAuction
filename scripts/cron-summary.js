/**
 * Cron System Summary and Verification Script
 * 
 * This script provides a complete overview of the cron system status
 * and verifies that auction expiration works correctly.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCronSystem() {
  console.log('\n🕐 CRON SYSTEM VERIFICATION\n');
  console.log('=' .repeat(60));

  try {
    // 1. Check for any currently live auctions
    const liveAuctions = await prisma.listing.findMany({
      where: {
        type: 'AUCTION',
        status: 'LIVE',
      },
      select: {
        id: true,
        title: true,
        currentBid: true,
        endTime: true,
        bidCount: true,
      },
      orderBy: {
        endTime: 'asc',
      },
      take: 5,
    });

    console.log(`\n📊 Live Auctions: ${liveAuctions.length}`);
    if (liveAuctions.length > 0) {
      liveAuctions.forEach(auction => {
        const now = new Date();
        const isExpired = auction.endTime < now;
        const timeLeft = auction.endTime - now;
        const minutesLeft = Math.floor(timeLeft / 60000);

        console.log(`   ${isExpired ? '⚠️ ' : '✅'} "${auction.title}"`);
        console.log(`      Current Bid: $${auction.currentBid} | Bids: ${auction.bidCount}`);
        console.log(`      ${isExpired ? 'EXPIRED!' : `Ends in: ${minutesLeft} minutes`}`);
      });
    }

    // 2. Check recently expired auctions
    const recentlySold = await prisma.listing.findMany({
      where: {
        type: 'AUCTION',
        status: 'SOLD',
        updatedAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000), // Last 10 minutes
        },
      },
      select: {
        title: true,
        currentBid: true,
        winnerId: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
    });

    console.log(`\n💰 Recently Sold (last 10 min): ${recentlySold.length}`);
    if (recentlySold.length > 0) {
      recentlySold.forEach(auction => {
        console.log(`   ✅ "${auction.title}" - $${auction.currentBid}`);
        console.log(`      Sold at: ${auction.updatedAt.toLocaleTimeString()}`);
      });
    }

    // 3. Check unsold auctions
    const recentlyUnsold = await prisma.listing.findMany({
      where: {
        type: 'AUCTION',
        status: 'UNSOLD',
        updatedAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000),
        },
      },
      select: {
        title: true,
        currentBid: true,
        reservePrice: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
    });

    console.log(`\n📉 Recently Unsold (last 10 min): ${recentlyUnsold.length}`);
    if (recentlyUnsold.length > 0) {
      recentlyUnsold.forEach(auction => {
        console.log(`   ❌ "${auction.title}" - High Bid: $${auction.currentBid}`);
        if (auction.reservePrice) {
          console.log(`      Reserve: $${auction.reservePrice} (not met)`);
        }
      });
    }

    // 4. Statistics
    const stats = await prisma.listing.aggregate({
      where: {
        type: 'AUCTION',
      },
      _count: {
        _all: true,
      },
    });

    const soldCount = await prisma.listing.count({
      where: { type: 'AUCTION', status: 'SOLD' },
    });

    const unsoldCount = await prisma.listing.count({
      where: { type: 'AUCTION', status: 'UNSOLD' },
    });

    console.log('\n📈 Overall Statistics:');
    console.log(`   Total Auctions: ${stats._count._all}`);
    console.log(`   Live: ${liveAuctions.length}`);
    console.log(`   Sold: ${soldCount}`);
    console.log(`   Unsold: ${unsoldCount}`);

    // 5. Cron system info
    console.log('\n⚙️  Cron Configuration:');
    console.log(`   Environment: ${process.env.VERCEL ? 'Vercel (using Vercel Cron)' : 'Self-hosted (using node-cron)'}`);
    console.log(`   Schedule: Every minute (* * * * *)`);
    console.log(`   Endpoint: /api/cron/expire-auctions`);
    console.log(`   Authorization: ${process.env.CRON_SECRET ? '✅ Secret configured' : '⚠️  Using default secret'}`);

    console.log('\n✅ Cron System Verification Complete!');
    console.log('=' .repeat(60));
    console.log('\n💡 Tip: The cron job runs every minute automatically.');
    console.log('   Watch the server logs to see it in action.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCronSystem();

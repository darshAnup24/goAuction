const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAuction() {
  const auction = await prisma.listing.findUnique({
    where: { id: 'cmijqh2fn0001ijzmyyh8t9cc' },
    include: {
      bids: true
    }
  });

  if (!auction) {
    console.log('❌ Auction not found');
    return;
  }

  console.log('\n📊 Auction Status:');
  console.log(`   Title: ${auction.title}`);
  console.log(`   Status: ${auction.status}`);
  console.log(`   Current Bid: $${auction.currentBid}`);
  console.log(`   Winner ID: ${auction.winnerId || 'None'}`);
  console.log(`\n📋 Bids:`);
  auction.bids.forEach(bid => {
    console.log(`   - $${bid.amount} (${bid.status}) - Bidder: ${bid.bidderId}`);
  });

  await prisma.$disconnect();
}

checkAuction();

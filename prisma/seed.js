const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data
  await prisma.bid.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.rating.deleteMany()
  await prisma.listing.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Cleared existing data')

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Create Users (2 vendors, 3 buyers)
  const users = await Promise.all([
    // Vendors
    prisma.user.create({
      data: {
        email: 'alice@vendor.com',
        username: 'alice_tech',
        password: hashedPassword,
        fullName: 'Alice Johnson',
        phone: '+1-555-0101',
        address: '123 Tech Street, San Francisco, CA 94102',
        avatar: 'https://i.pravatar.cc/150?img=1',
        role: 'SELLER',
        isVendor: true,
        stripeAccountId: 'acct_alice_tech_001',
        emailVerified: new Date(),
        ratingAsSeller: 4.8,
        totalRatings: 45,
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob@vintage.com',
        username: 'bob_vintage',
        password: hashedPassword,
        fullName: 'Bob Martinez',
        phone: '+1-555-0102',
        address: '456 Art Avenue, New York, NY 10001',
        avatar: 'https://i.pravatar.cc/150?img=2',
        role: 'SELLER',
        isVendor: true,
        stripeAccountId: 'acct_bob_vintage_002',
        emailVerified: new Date(),
        ratingAsSeller: 4.6,
        totalRatings: 32,
      },
    }),
    // Buyers
    prisma.user.create({
      data: {
        email: 'charlie@buyer.com',
        username: 'charlie_b',
        password: hashedPassword,
        fullName: 'Charlie Brown',
        phone: '+1-555-0103',
        address: '789 Main Street, Austin, TX 78701',
        avatar: 'https://i.pravatar.cc/150?img=3',
        role: 'BUYER',
        emailVerified: new Date(),
        ratingAsBuyer: 4.9,
        totalRatings: 28,
      },
    }),
    prisma.user.create({
      data: {
        email: 'diana@buyer.com',
        username: 'diana_d',
        password: hashedPassword,
        fullName: 'Diana Prince',
        phone: '+1-555-0104',
        address: '321 Oak Drive, Seattle, WA 98101',
        avatar: 'https://i.pravatar.cc/150?img=4',
        role: 'BUYER',
        emailVerified: new Date(),
        ratingAsBuyer: 4.7,
        totalRatings: 15,
      },
    }),
    prisma.user.create({
      data: {
        email: 'edward@buyer.com',
        username: 'edward_e',
        password: hashedPassword,
        fullName: 'Edward Smith',
        phone: '+1-555-0105',
        address: '654 Pine Lane, Miami, FL 33101',
        avatar: 'https://i.pravatar.cc/150?img=5',
        role: 'BUYER',
        emailVerified: new Date(),
        ratingAsBuyer: 4.5,
        totalRatings: 22,
      },
    }),
  ])

  console.log('✅ Created 5 users (2 vendors, 3 buyers)')

  const [alice, bob, charlie, diana, edward] = users

  // Helper function to get date offsets
  const now = new Date()
  const getDate = (hoursOffset) => new Date(now.getTime() + hoursOffset * 60 * 60 * 1000)

  // Create 10 Auction Listings
  const listings = await Promise.all([
    // LIVE auctions (ending soon)
    prisma.listing.create({
      data: {
        title: 'iPhone 15 Pro Max 256GB - Titanium Blue',
        description: 'Brand new sealed iPhone 15 Pro Max in Titanium Blue. Full warranty included. Never opened, perfect condition.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1696446702721-306b4f082dc6?w=500',
          'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500',
        ]),
        startingPrice: 800,
        reservePrice: 1000,
        currentBid: 950,
        startTime: getDate(-48),
        endTime: getDate(2), // Ends in 2 hours
        status: 'LIVE',
        category: 'Electronics',
        sellerId: alice.id,
        viewCount: 145,
        bidCount: 8,
      },
    }),
    prisma.listing.create({
      data: {
        title: 'Vintage Rolex Submariner Watch (1980s)',
        description: 'Authentic vintage Rolex Submariner from the 1980s. Serviced and in excellent working condition. Comes with original box and papers.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500',
          'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500',
        ]),
        startingPrice: 5000,
        reservePrice: 7500,
        currentBid: 7200,
        startTime: getDate(-72),
        endTime: getDate(6), // Ends in 6 hours
        status: 'LIVE',
        category: 'Fashion',
        sellerId: bob.id,
        viewCount: 289,
        bidCount: 15,
      },
    }),
    prisma.listing.create({
      data: {
        title: 'Gaming PC - RTX 4090, i9-13900K, 64GB RAM',
        description: 'High-end custom gaming PC. RTX 4090, Intel i9-13900K, 64GB DDR5 RAM, 2TB NVMe SSD. Built 3 months ago, like new.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=500',
          'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=500',
        ]),
        startingPrice: 2000,
        reservePrice: 2800,
        currentBid: 2650,
        startTime: getDate(-24),
        endTime: getDate(12), // Ends in 12 hours
        status: 'LIVE',
        category: 'Electronics',
        sellerId: alice.id,
        viewCount: 203,
        bidCount: 12,
      },
    }),
    prisma.listing.create({
      data: {
        title: 'Original Oil Painting - "Sunset Dreams"',
        description: 'Original oil painting on canvas by emerging artist. 24x36 inches. Modern abstract style with warm colors.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500',
        ]),
        startingPrice: 300,
        reservePrice: 500,
        currentBid: 480,
        startTime: getDate(-36),
        endTime: getDate(4), // Ends in 4 hours
        status: 'LIVE',
        category: 'Art',
        sellerId: bob.id,
        viewCount: 92,
        bidCount: 9,
      },
    }),

    // UPCOMING auctions
    prisma.listing.create({
      data: {
        title: 'MacBook Pro M3 Max 16" - Space Black',
        description: 'Latest MacBook Pro with M3 Max chip, 16GB RAM, 512GB SSD. Brand new, sealed in box with full Apple warranty.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
        ]),
        startingPrice: 2000,
        reservePrice: 2500,
        currentBid: 0,
        startTime: getDate(12), // Starts in 12 hours
        endTime: getDate(84), // Ends in 3.5 days
        status: 'UPCOMING',
        category: 'Electronics',
        sellerId: alice.id,
        viewCount: 45,
        bidCount: 0,
      },
    }),
    prisma.listing.create({
      data: {
        title: 'Designer Leather Handbag - Limited Edition',
        description: 'Authentic designer leather handbag, limited edition from 2024 collection. Never used, comes with dust bag and authenticity card.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500',
        ]),
        startingPrice: 800,
        reservePrice: 1200,
        currentBid: 0,
        startTime: getDate(24), // Starts in 1 day
        endTime: getDate(96), // Ends in 4 days
        status: 'UPCOMING',
        category: 'Fashion',
        sellerId: bob.id,
        viewCount: 67,
        bidCount: 0,
      },
    }),

    // ENDED auctions (some sold, some unsold)
    prisma.listing.create({
      data: {
        title: 'Sony A7 IV Camera Body + 24-70mm Lens',
        description: 'Professional mirrorless camera with versatile zoom lens. Excellent condition, low shutter count (2,500). Includes all accessories.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500',
        ]),
        startingPrice: 1500,
        reservePrice: 2000,
        currentBid: 2100,
        startTime: getDate(-168), // Started 7 days ago
        endTime: getDate(-12), // Ended 12 hours ago
        status: 'SOLD',
        category: 'Electronics',
        sellerId: alice.id,
        winnerId: charlie.id,
        viewCount: 178,
        bidCount: 14,
      },
    }),
    prisma.listing.create({
      data: {
        title: 'Antique Wooden Chess Set',
        description: 'Beautiful hand-carved wooden chess set from the 1950s. All pieces intact, solid wood board. Great collector item.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=500',
        ]),
        startingPrice: 200,
        reservePrice: 350,
        currentBid: 380,
        startTime: getDate(-120),
        endTime: getDate(-24), // Ended 1 day ago
        status: 'SOLD',
        category: 'Collectibles',
        sellerId: bob.id,
        winnerId: diana.id,
        viewCount: 89,
        bidCount: 11,
      },
    }),
    prisma.listing.create({
      data: {
        title: 'Acoustic Guitar - Martin D-28',
        description: 'Classic Martin D-28 acoustic guitar. Some signs of use but plays beautifully. Comes with hard case.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=500',
        ]),
        startingPrice: 1000,
        reservePrice: 1500,
        currentBid: 1200,
        startTime: getDate(-96),
        endTime: getDate(-6), // Ended 6 hours ago
        status: 'UNSOLD', // Didn't meet reserve
        category: 'Music',
        sellerId: bob.id,
        viewCount: 112,
        bidCount: 7,
      },
    }),
    prisma.listing.create({
      data: {
        title: 'Nike Air Jordan 1 Retro - Size 10',
        description: 'Limited edition Air Jordan 1 Retro in excellent condition. Worn only twice, almost like new. Original box included.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        ]),
        startingPrice: 150,
        reservePrice: 250,
        currentBid: 285,
        startTime: getDate(-144),
        endTime: getDate(-48), // Ended 2 days ago
        status: 'SOLD',
        category: 'Fashion',
        sellerId: alice.id,
        winnerId: edward.id,
        viewCount: 156,
        bidCount: 13,
      },
    }),
  ])

  console.log('✅ Created 10 auction listings')

  // Create Bids (20-30 bids across different listings)
  const bids = []

  // Bids for iPhone (listing 0) - LIVE
  bids.push(
    await prisma.bid.create({
      data: {
        amount: 820,
        bidderId: charlie.id,
        listingId: listings[0].id,
        status: 'OUTBID',
        createdAt: getDate(-46),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 850,
        bidderId: diana.id,
        listingId: listings[0].id,
        status: 'OUTBID',
        createdAt: getDate(-44),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 880,
        bidderId: edward.id,
        listingId: listings[0].id,
        status: 'OUTBID',
        createdAt: getDate(-42),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 900,
        bidderId: charlie.id,
        listingId: listings[0].id,
        status: 'OUTBID',
        createdAt: getDate(-38),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 920,
        bidderId: diana.id,
        listingId: listings[0].id,
        status: 'OUTBID',
        createdAt: getDate(-24),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 950,
        bidderId: edward.id,
        listingId: listings[0].id,
        status: 'WINNING',
        createdAt: getDate(-12),
      },
    })
  )

  // Bids for Rolex (listing 1) - LIVE
  bids.push(
    await prisma.bid.create({
      data: {
        amount: 5200,
        bidderId: charlie.id,
        listingId: listings[1].id,
        status: 'OUTBID',
        createdAt: getDate(-70),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 5500,
        bidderId: edward.id,
        listingId: listings[1].id,
        status: 'OUTBID',
        createdAt: getDate(-68),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 6000,
        bidderId: charlie.id,
        listingId: listings[1].id,
        status: 'OUTBID',
        createdAt: getDate(-64),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 6500,
        bidderId: edward.id,
        listingId: listings[1].id,
        status: 'OUTBID',
        createdAt: getDate(-48),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 7000,
        bidderId: charlie.id,
        listingId: listings[1].id,
        status: 'OUTBID',
        createdAt: getDate(-36),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 7200,
        bidderId: edward.id,
        listingId: listings[1].id,
        status: 'WINNING',
        createdAt: getDate(-18),
      },
    })
  )

  // Bids for Gaming PC (listing 2) - LIVE
  bids.push(
    await prisma.bid.create({
      data: {
        amount: 2100,
        bidderId: charlie.id,
        listingId: listings[2].id,
        status: 'OUTBID',
        createdAt: getDate(-22),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 2300,
        bidderId: diana.id,
        listingId: listings[2].id,
        status: 'OUTBID',
        createdAt: getDate(-20),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 2500,
        bidderId: charlie.id,
        listingId: listings[2].id,
        status: 'OUTBID',
        createdAt: getDate(-16),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 2650,
        bidderId: diana.id,
        listingId: listings[2].id,
        status: 'WINNING',
        createdAt: getDate(-8),
      },
    })
  )

  // Bids for Oil Painting (listing 3) - LIVE
  bids.push(
    await prisma.bid.create({
      data: {
        amount: 320,
        bidderId: edward.id,
        listingId: listings[3].id,
        status: 'OUTBID',
        createdAt: getDate(-34),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 380,
        bidderId: diana.id,
        listingId: listings[3].id,
        status: 'OUTBID',
        createdAt: getDate(-28),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 420,
        bidderId: edward.id,
        listingId: listings[3].id,
        status: 'OUTBID',
        createdAt: getDate(-20),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 480,
        bidderId: diana.id,
        listingId: listings[3].id,
        status: 'WINNING',
        createdAt: getDate(-14),
      },
    })
  )

  // Bids for Sony Camera (listing 6) - SOLD
  bids.push(
    await prisma.bid.create({
      data: {
        amount: 1600,
        bidderId: charlie.id,
        listingId: listings[6].id,
        status: 'LOST',
        createdAt: getDate(-160),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 1800,
        bidderId: diana.id,
        listingId: listings[6].id,
        status: 'LOST',
        createdAt: getDate(-140),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 2000,
        bidderId: charlie.id,
        listingId: listings[6].id,
        status: 'LOST',
        createdAt: getDate(-100),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 2100,
        bidderId: charlie.id,
        listingId: listings[6].id,
        status: 'WINNING',
        createdAt: getDate(-36),
      },
    })
  )

  // Bids for Chess Set (listing 7) - SOLD
  bids.push(
    await prisma.bid.create({
      data: {
        amount: 220,
        bidderId: charlie.id,
        listingId: listings[7].id,
        status: 'LOST',
        createdAt: getDate(-118),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 280,
        bidderId: edward.id,
        listingId: listings[7].id,
        status: 'LOST',
        createdAt: getDate(-96),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 350,
        bidderId: diana.id,
        listingId: listings[7].id,
        status: 'LOST',
        createdAt: getDate(-72),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 380,
        bidderId: diana.id,
        listingId: listings[7].id,
        status: 'WINNING',
        createdAt: getDate(-48),
      },
    })
  )

  // Bids for Guitar (listing 8) - UNSOLD
  bids.push(
    await prisma.bid.create({
      data: {
        amount: 1050,
        bidderId: edward.id,
        listingId: listings[8].id,
        status: 'LOST',
        createdAt: getDate(-94),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 1150,
        bidderId: charlie.id,
        listingId: listings[8].id,
        status: 'LOST',
        createdAt: getDate(-72),
      },
    }),
    await prisma.bid.create({
      data: {
        amount: 1200,
        bidderId: edward.id,
        listingId: listings[8].id,
        status: 'LOST',
        createdAt: getDate(-30),
      },
    })
  )

  console.log(`✅ Created ${bids.length} bids across listings`)

  // Create sample notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: charlie.id,
        type: 'BID_OUTBID',
        message: 'You have been outbid on iPhone 15 Pro Max',
        link: `/listing/${listings[0].id}`,
        isRead: false,
      },
      {
        userId: edward.id,
        type: 'BID_PLACED',
        message: 'Your bid of $7,200 has been placed on Vintage Rolex',
        link: `/listing/${listings[1].id}`,
        isRead: true,
      },
      {
        userId: charlie.id,
        type: 'AUCTION_WON',
        message: 'Congratulations! You won Sony A7 IV Camera',
        link: `/listing/${listings[6].id}`,
        isRead: true,
      },
      {
        userId: diana.id,
        type: 'AUCTION_ENDING',
        message: 'Auction ending in 4 hours: Original Oil Painting',
        link: `/listing/${listings[3].id}`,
        isRead: false,
      },
    ],
  })

  console.log('✅ Created sample notifications')

  console.log('\n🎉 Database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - Users: 5 (2 vendors, 3 buyers)`)
  console.log(`   - Listings: 10 (4 LIVE, 2 UPCOMING, 4 ENDED)`)
  console.log(`   - Bids: ${bids.length}`)
  console.log(`   - Categories: Electronics, Fashion, Art, Collectibles, Music`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

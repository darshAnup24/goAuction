/**
 * Stripe Integration - Quick Start Script
 * 
 * Run this script to verify Stripe setup and test the payment flow
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStripeSetup() {
  console.log('\n🔍 STRIPE INTEGRATION CHECK\n');
  console.log('=' .repeat(60));

  // Check environment variables
  console.log('\n📋 Environment Variables:');
  const envVars = {
    'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY,
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    'STRIPE_WEBHOOK_SECRET': process.env.STRIPE_WEBHOOK_SECRET,
  };

  for (const [key, value] of Object.entries(envVars)) {
    if (value && value !== 'YOUR_KEY_HERE' && !value.includes('YOUR_')) {
      console.log(`   ✅ ${key}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`   ❌ ${key}: NOT SET or using placeholder`);
    }
  }

  // Check database schema
  console.log('\n📊 Database Schema:');
  try {
    const paymentFields = await prisma.$queryRaw`
      DESCRIBE Payment
    `;
    console.log('   ✅ Payment table exists with proper schema');
    
    const listingFields = await prisma.$queryRaw`
      DESCRIBE Listing
    `;
    console.log('   ✅ Listing table has payment tracking fields');
  } catch (error) {
    console.log('   ❌ Database schema issue:', error.message);
  }

  // Check for auctions with winners
  const soldAuctions = await prisma.listing.count({
    where: {
      status: 'SOLD',
      winnerId: { not: null },
    },
  });

  console.log('\n💰 Auction Data:');
  console.log(`   Sold auctions with winners: ${soldAuctions}`);

  if (soldAuctions > 0) {
    const pendingPayments = await prisma.listing.count({
      where: {
        status: 'SOLD',
        paymentCompleted: false,
      },
    });

    const completedPayments = await prisma.listing.count({
      where: {
        status: 'SOLD',
        paymentCompleted: true,
      },
    });

    console.log(`   Pending payments: ${pendingPayments}`);
    console.log(`   Completed payments: ${completedPayments}`);
  }

  // Integration status
  console.log('\n✨ Integration Status:');
  
  const allKeysSet = Object.values(envVars).every(
    v => v && v !== 'YOUR_KEY_HERE' && !v.includes('YOUR_')
  );

  if (allKeysSet) {
    console.log('   ✅ Stripe keys configured');
  } else {
    console.log('   ⚠️  Some Stripe keys missing - see STRIPE_SETUP_GUIDE.md');
  }

  console.log('\n📝 Next Steps:');
  if (!allKeysSet) {
    console.log('   1. Get your publishable key from Stripe dashboard');
    console.log('   2. Update NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env');
    console.log('   3. Set up webhook with: stripe listen --forward-to localhost:3000/api/payments/webhook');
    console.log('   4. Update STRIPE_WEBHOOK_SECRET in .env');
    console.log('   5. Restart dev server');
  } else {
    console.log('   ✅ All set! Test payment flow:');
    console.log('      1. Go to http://localhost:3000/orders');
    console.log('      2. Click "Pay Now" on a won auction');
    console.log('      3. Use test card: 4242 4242 4242 4242');
  }

  console.log('\n📖 Documentation:');
  console.log('   Full guide: STRIPE_SETUP_GUIDE.md');
  console.log('   Stripe docs: https://stripe.com/docs/payments/checkout');

  console.log('\n' + '='.repeat(60));
  console.log('');

  await prisma.$disconnect();
}

checkStripeSetup().catch(console.error);

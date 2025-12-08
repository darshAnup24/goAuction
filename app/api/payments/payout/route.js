import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/payments/payout
 * Manually trigger a payout to a vendor's connected account
 * Used when:
 * 1. Seller connects Stripe account after auction already paid
 * 2. Admin wants to manually release funds
 * 3. Testing payout functionality
 */
export async function POST(req) {
  try {
    // Authenticate user
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { paymentId, amount, currency = 'usd' } = body;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        auction: {
          include: {
            product: {
              include: {
                seller: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    const seller = payment.auction.product.seller;

    // Verify seller has connected account
    if (!seller.stripeConnectedAccountId) {
      return NextResponse.json(
        { error: 'Seller does not have a connected Stripe account' },
        { status: 400 }
      );
    }

    if (!seller.stripeChargesEnabled) {
      return NextResponse.json(
        { error: 'Seller account is not enabled for charges' },
        { status: 400 }
      );
    }

    // Check if payout already processed
    if (payment.payoutStatus === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Payout already completed for this payment' },
        { status: 400 }
      );
    }

    // Calculate payout amount (if not provided)
    const payoutAmount = amount || payment.sellerPayout;
    
    if (payoutAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid payout amount' },
        { status: 400 }
      );
    }

    // Format amount for Stripe (cents)
    const amountInCents = Math.round(payoutAmount * 100);

    console.log(`🔄 Initiating payout for Payment ${paymentId}:`, {
      seller: seller.username,
      connectedAccountId: seller.stripeConnectedAccountId,
      amount: payoutAmount,
      amountInCents,
      currency
    });

    // Create transfer to connected account
    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency: currency,
      destination: seller.stripeConnectedAccountId,
      transfer_group: payment.stripeSessionId, // Group related transfers
      metadata: {
        paymentId: payment.id,
        auctionId: payment.auctionId,
        productId: payment.auction.product.id,
        sellerId: seller.id,
        sellerUsername: seller.username,
        type: 'manual_payout'
      }
    });

    console.log('✅ Transfer created:', {
      transferId: transfer.id,
      amount: transfer.amount,
      destination: transfer.destination,
      status: transfer.object
    });

    // Update payment record
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        payoutStatus: 'COMPLETED',
        stripeTransferId: transfer.id
      }
    });

    // Create notification for seller
    await prisma.notification.create({
      data: {
        userId: seller.id,
        message: `Payout of $${payoutAmount.toFixed(2)} has been transferred to your Stripe account`,
        type: 'payout',
        link: `/vendor/dashboard/earnings`,
        read: false
      }
    });

    // Emit Socket.IO event if available
    try {
      const io = (await import('@/server')).io;
      if (io) {
        io.to(`user:${seller.id}`).emit('payout:completed', {
          paymentId: payment.id,
          transferId: transfer.id,
          amount: payoutAmount
        });
      }
    } catch (error) {
      console.error('Socket.IO emit error:', error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Payout completed successfully',
      transfer: {
        id: transfer.id,
        amount: payoutAmount,
        currency,
        destination: seller.stripeConnectedAccountId,
        created: transfer.created
      },
      payment: {
        id: payment.id,
        payoutStatus: 'COMPLETED'
      }
    });

  } catch (error) {
    console.error('❌ Payout error:', error);

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process payout', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/payout?paymentId=xxx
 * Check payout status for a payment
 */
export async function GET(req) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        auction: {
          include: {
            product: {
              include: {
                seller: {
                  select: {
                    id: true,
                    username: true,
                    stripeConnectedAccountId: true,
                    stripeChargesEnabled: true,
                    stripePayoutsEnabled: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check authorization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    const isAdmin = user.role === 'ADMIN';
    const isSeller = payment.auction.product.sellerId === session.user.id;
    const isBuyer = payment.auction.winnerId === session.user.id;

    if (!isAdmin && !isSeller && !isBuyer) {
      return NextResponse.json(
        { error: 'Not authorized to view this payout' },
        { status: 403 }
      );
    }

    const seller = payment.auction.product.seller;

    // Get transfer details if available
    let transferDetails = null;
    if (payment.stripeTransferId) {
      try {
        const transfer = await stripe.transfers.retrieve(payment.stripeTransferId);
        transferDetails = {
          id: transfer.id,
          amount: transfer.amount / 100,
          currency: transfer.currency,
          created: transfer.created,
          destination: transfer.destination,
          status: transfer.object
        };
      } catch (error) {
        console.error('Failed to retrieve transfer:', error.message);
      }
    }

    return NextResponse.json({
      payment: {
        id: payment.id,
        amount: payment.amount,
        platformFee: payment.platformFee,
        sellerPayout: payment.sellerPayout,
        payoutStatus: payment.payoutStatus,
        stripeTransferId: payment.stripeTransferId,
        createdAt: payment.createdAt
      },
      seller: {
        id: seller.id,
        username: seller.username,
        hasConnectedAccount: !!seller.stripeConnectedAccountId,
        chargesEnabled: seller.stripeChargesEnabled,
        payoutsEnabled: seller.stripePayoutsEnabled
      },
      transfer: transferDetails,
      canPayout: isAdmin && 
        payment.payoutStatus !== 'COMPLETED' && 
        seller.stripeConnectedAccountId && 
        seller.stripeChargesEnabled
    });

  } catch (error) {
    console.error('❌ Get payout status error:', error);
    return NextResponse.json(
      { error: 'Failed to get payout status', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Create Stripe Checkout Session API Route
 * 
 * POST /api/payments/create-checkout
 * 
 * Creates a Stripe Checkout session for auction winners to complete payment
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  stripe,
  formatAmountForStripe,
  calculatePlatformFee,
  calculateSellerPayout,
} from "@/lib/stripe";

export async function POST(request) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { listingId } = await request.json();

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing ID is required" },
        { status: 400 }
      );
    }

    // Get listing details
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        bids: {
          where: { status: "WON" },
          orderBy: { amount: "desc" },
          take: 1,
          include: {
            bidder: true,
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    // Verify user is the winner
    if (listing.winnerId !== session.user.id) {
      return NextResponse.json(
        { error: "You are not the winner of this auction" },
        { status: 403 }
      );
    }

    // Check if auction is sold
    if (listing.status !== "SOLD") {
      return NextResponse.json(
        { error: "This auction has not been completed yet" },
        { status: 400 }
      );
    }

    // Check if already paid
    if (listing.paymentCompleted) {
      return NextResponse.json(
        { error: "Payment already completed for this auction" },
        { status: 400 }
      );
    }

    const SHIPPING_CHARGE = 1.00; // $1 shipping fee
    const amount = listing.currentBid;
    const totalAmount = amount + SHIPPING_CHARGE;
    const platformFee = calculatePlatformFee(amount);
    const sellerPayout = calculateSellerPayout(amount);

    // Create or get existing payment record
    let payment = await prisma.payment.findFirst({
      where: {
        listingId: listing.id,
        buyerId: session.user.id,
        status: "PENDING",
      },
    });

    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          amount: amount,
          shippingCharge: SHIPPING_CHARGE,
          totalAmount: totalAmount,
          buyerId: session.user.id,
          sellerId: listing.sellerId,
          listingId: listing.id,
          status: "PENDING",
          platformFee: platformFee,
          sellerPayout: sellerPayout,
          currency: "usd",
          isTestPayment: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false,
        },
      });
    } else {
      // Update existing payment with shipping
      payment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          shippingCharge: SHIPPING_CHARGE,
          totalAmount: totalAmount,
        },
      });
    }

    // Check if seller has connected Stripe account
    const seller = await prisma.user.findUnique({
      where: { id: listing.sellerId },
      select: {
        stripeConnectedAccountId: true,
        stripeChargesEnabled: true,
        fullName: true,
      },
    });

    // Prepare checkout session configuration with item + shipping
    const sessionConfig = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: listing.title,
              description: `Winning bid for auction: ${listing.title}`,
              images: Array.isArray(listing.images) ? listing.images : [],
            },
            unit_amount: formatAmountForStripe(amount),
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Shipping & Handling",
              description: "Standard shipping fee",
            },
            unit_amount: formatAmountForStripe(SHIPPING_CHARGE),
          },
          quantity: 1,
        },
      ],
      metadata: {
        listingId: listing.id,
        paymentId: payment.id,
        buyerId: session.user.id,
        sellerId: listing.sellerId,
        itemAmount: amount.toString(),
        shippingCharge: SHIPPING_CHARGE.toString(),
        totalAmount: totalAmount.toString(),
        platformFee: platformFee.toString(),
        sellerPayout: sellerPayout.toString(),
        connectAccountId: seller?.stripeConnectedAccountId || "none",
      },
      customer_email: session.user.email,
      success_url: `${process.env.NEXTAUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/payment/cancel?listing_id=${listingId}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
    };

    // If seller has Stripe Connect account, use destination charges
    if (seller?.stripeConnectedAccountId && seller.stripeChargesEnabled) {
      sessionConfig.payment_intent_data = {
        application_fee_amount: formatAmountForStripe(platformFee + SHIPPING_CHARGE), // Platform keeps shipping + fee
        transfer_data: {
          destination: seller.stripeConnectedAccountId,
        },
      };

      console.log(`💰 Using Stripe Connect for seller: ${seller.fullName} (${seller.stripeConnectedAccountId})`);
      console.log(`   Item: $${amount} | Shipping: $${SHIPPING_CHARGE} | Total: $${totalAmount}`);
      console.log(`   Platform fee: $${platformFee} | Seller payout: $${sellerPayout}`);
    } else {
      console.log(`⚠️  Seller doesn't have Stripe Connect - using standard payment`);
      console.log(`   Item: $${amount} | Shipping: $${SHIPPING_CHARGE} | Total: $${totalAmount}`);
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create(sessionConfig);

    // Update payment record with checkout session ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        stripeCheckoutSession: checkoutSession.id,
      },
    });

    console.log(`✅ Checkout session created for listing ${listing.id}: ${checkoutSession.id}`);

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error) {
    console.error("❌ Error creating checkout session:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create checkout session",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

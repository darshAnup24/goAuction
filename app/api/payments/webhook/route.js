/**
 * Stripe Webhook Handler
 * 
 * POST /api/payments/webhook
 * 
 * Handles Stripe webhook events for payment processing
 * Key events: checkout.session.completed, payment_intent.succeeded
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { stripe, formatAmountFromStripe } from "@/lib/stripe";
import { getSocket } from "@/lib/socket";

// Disable body parsing for webhook
export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    console.error("❌ No Stripe signature found");
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
  }

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  console.log(`🔔 Stripe webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object);
        break;

      // Stripe Connect events
      case "account.updated":
        await handleAccountUpdated(event.data.object);
        break;

      case "account.application.authorized":
        await handleAccountAuthorized(event.data.object);
        break;

      case "account.application.deauthorized":
        await handleAccountDeauthorized(event.data.object);
        break;

      default:
        console.log(`⚠️  Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error(`❌ Error processing webhook ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session) {
  const { listingId, paymentId, buyerId, sellerId } = session.metadata;

  console.log(`✅ Checkout completed for listing ${listingId}`);

  // Update payment record
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "COMPLETED",
      stripePaymentId: session.payment_intent,
      paymentMethod: session.payment_method_types?.[0] || "card",
    },
    include: {
      listing: {
        include: {
          seller: true,
        },
      },
      buyer: true,
    },
  });

  // Update listing
  await prisma.listing.update({
    where: { id: listingId },
    data: {
      paymentCompleted: true,
    },
  });

  // Create notifications
  await Promise.all([
    // Notify seller
    prisma.notification.create({
      data: {
        userId: sellerId,
        type: "PAYMENT_RECEIVED",
        message: `Payment received for "${payment.listing.title}" - $${payment.amount}`,
        link: `/dashboard/sales/${listingId}`,
      },
    }),
    // Notify buyer
    prisma.notification.create({
      data: {
        userId: buyerId,
        type: "PAYMENT_SENT",
        message: `Payment confirmed for "${payment.listing.title}"`,
        link: `/orders/${listingId}`,
      },
    }),
  ]);

  // Emit Socket.IO event
  const io = getSocket();
  if (io) {
    io.to(`user:${sellerId}`).emit("payment:received", {
      listingId,
      amount: payment.amount,
      buyerName: payment.buyer.fullName,
    });

    io.to(`user:${buyerId}`).emit("payment:completed", {
      listingId,
      amount: payment.amount,
      sellerName: payment.listing.seller.fullName,
    });
  }

  console.log(`✅ Payment completed: ${paymentId} - $${payment.amount}`);
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log(`✅ Payment intent succeeded: ${paymentIntent.id}`);

  // Update payment with receipt URL if available
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentId: paymentIntent.id },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        receiptUrl: paymentIntent.charges?.data[0]?.receipt_url || null,
      },
    });
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent) {
  console.log(`❌ Payment intent failed: ${paymentIntent.id}`);

  const payment = await prisma.payment.findFirst({
    where: { stripePaymentId: paymentIntent.id },
    include: {
      buyer: true,
      listing: true,
    },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
      },
    });

    // Notify buyer
    await prisma.notification.create({
      data: {
        userId: payment.buyerId,
        type: "PAYMENT_SENT",
        message: `Payment failed for "${payment.listing.title}". Please try again.`,
        link: `/orders/${payment.listingId}`,
      },
    });

    // Emit Socket.IO event
    const io = getSocket();
    if (io) {
      io.to(`user:${payment.buyerId}`).emit("payment:failed", {
        listingId: payment.listingId,
        error: paymentIntent.last_payment_error?.message || "Payment failed",
      });
    }
  }
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge) {
  console.log(`💰 Charge refunded: ${charge.id}`);

  const payment = await prisma.payment.findFirst({
    where: { stripePaymentId: charge.payment_intent },
    include: {
      buyer: true,
      seller: true,
      listing: true,
    },
  });

  if (payment) {
    const refundAmount = formatAmountFromStripe(charge.amount_refunded);

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "REFUNDED",
        refundReason: charge.refunds?.data[0]?.reason || "Refund processed",
      },
    });

    // Notify both parties
    await Promise.all([
      prisma.notification.create({
        data: {
          userId: payment.buyerId,
          type: "PAYMENT_SENT",
          message: `Refund processed for "${payment.listing.title}" - $${refundAmount}`,
          link: `/orders/${payment.listingId}`,
        },
      }),
      prisma.notification.create({
        data: {
          userId: payment.sellerId,
          type: "PAYMENT_RECEIVED",
          message: `Payment refunded for "${payment.listing.title}" - $${refundAmount}`,
          link: `/dashboard/sales/${payment.listingId}`,
        },
      }),
    ]);

    // Emit Socket.IO events
    const io = getSocket();
    if (io) {
      io.to(`user:${payment.buyerId}`).emit("payment:refunded", {
        listingId: payment.listingId,
        amount: refundAmount,
      });
      io.to(`user:${payment.sellerId}`).emit("payment:refunded", {
        listingId: payment.listingId,
        amount: refundAmount,
      });
    }
  }
}

/**
 * Handle Stripe Connect account updated
 */
async function handleAccountUpdated(account) {
  console.log(`🔄 Account updated: ${account.id}`);

  // Find user with this connected account
  const user = await prisma.user.findFirst({
    where: { stripeConnectedAccountId: account.id },
  });

  if (user) {
    // Update user record with latest account status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeDetailsSubmitted: account.details_submitted,
        stripeChargesEnabled: account.charges_enabled,
        stripePayoutsEnabled: account.payouts_enabled,
        stripeOnboardingComplete: account.details_submitted && account.charges_enabled,
      },
    });

    console.log(`✅ Updated account status for user ${user.email}`);

    // If account is now fully enabled, send notification
    if (account.charges_enabled && account.payouts_enabled) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "PAYMENT_RECEIVED",
          message: "Your Stripe account is now active! You can receive payments.",
          link: "/dashboard",
        },
      });

      // Emit Socket.IO event
      const io = getSocket();
      if (io) {
        io.to(`user:${user.id}`).emit("stripe:account:active", {
          chargesEnabled: true,
          payoutsEnabled: true,
        });
      }
    }
  }
}

/**
 * Handle Stripe Connect account authorized
 */
async function handleAccountAuthorized(authorization) {
  console.log(`✅ Account authorized: ${authorization.account}`);

  // This event is fired when a user authorizes your platform to access their account
  const user = await prisma.user.findFirst({
    where: { stripeConnectedAccountId: authorization.account },
  });

  if (user) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "PAYMENT_RECEIVED",
        message: "Stripe account successfully connected!",
        link: "/dashboard",
      },
    });
  }
}

/**
 * Handle Stripe Connect account deauthorized
 */
async function handleAccountDeauthorized(deauthorization) {
  console.log(`⚠️  Account deauthorized: ${deauthorization.account}`);

  // User has disconnected their account
  const user = await prisma.user.findFirst({
    where: { stripeConnectedAccountId: deauthorization.account },
  });

  if (user) {
    // Clear Stripe Connect info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeConnectedAccountId: null,
        stripeOnboardingComplete: false,
        stripeDetailsSubmitted: false,
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
      },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "PAYMENT_RECEIVED",
        message: "Your Stripe account has been disconnected.",
        link: "/dashboard/connect-stripe",
      },
    });

    console.log(`✅ Cleared Stripe account for user ${user.email}`);
  }
}

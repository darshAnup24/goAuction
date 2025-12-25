/**
 * Test/Demo Payment Checkout API Route
 * 
 * POST /api/payments/test-checkout
 * 
 * Creates a test payment record for auction winners (no real Stripe charge)
 * Includes $1 shipping charge
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

const SHIPPING_CHARGE = 1.00; // $1 shipping
const PLATFORM_FEE_PERCENT = 0.05; // 5% platform fee

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

    // Calculate amounts
    const itemAmount = listing.currentBid;
    const totalAmount = itemAmount + SHIPPING_CHARGE;
    const platformFee = itemAmount * PLATFORM_FEE_PERCENT;
    const sellerPayout = itemAmount - platformFee;

    // Check for existing pending payment
    let payment = await prisma.payment.findFirst({
      where: {
        listingId: listing.id,
        buyerId: session.user.id,
        status: "PENDING",
      },
    });

    if (payment) {
      // Update existing payment
      payment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          amount: itemAmount,
          shippingCharge: SHIPPING_CHARGE,
          totalAmount: totalAmount,
          platformFee: platformFee,
          sellerPayout: sellerPayout,
        },
      });
    } else {
      // Create new payment record
      payment = await prisma.payment.create({
        data: {
          amount: itemAmount,
          shippingCharge: SHIPPING_CHARGE,
          totalAmount: totalAmount,
          buyerId: session.user.id,
          sellerId: listing.sellerId,
          listingId: listing.id,
          status: "PENDING",
          platformFee: platformFee,
          sellerPayout: sellerPayout,
          isTestPayment: true,
          paymentMethod: "test_payment",
        },
      });
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      breakdown: {
        itemAmount: itemAmount,
        shippingCharge: SHIPPING_CHARGE,
        totalAmount: totalAmount,
        platformFee: platformFee,
        sellerPayout: sellerPayout,
      },
      listing: {
        id: listing.id,
        title: listing.title,
        images: listing.images,
      },
      seller: listing.seller,
    });

  } catch (error) {
    console.error("Test checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create test checkout" },
      { status: 500 }
    );
  }
}

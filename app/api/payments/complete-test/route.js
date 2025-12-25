/**
 * Complete Test Payment API Route
 * 
 * POST /api/payments/complete-test
 * 
 * Completes a test/demo payment (simulates successful payment)
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

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

    const { paymentId, cardDetails } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Get payment record
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        listing: true,
        seller: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // Verify user is the buyer
    if (payment.buyerId !== session.user.id) {
      return NextResponse.json(
        { error: "You are not authorized to complete this payment" },
        { status: 403 }
      );
    }

    // Check if already completed
    if (payment.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Payment already completed" },
        { status: 400 }
      );
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate a fake transaction ID
    const testTransactionId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Update payment as completed
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "COMPLETED",
        stripePaymentId: testTransactionId,
        paymentMethod: cardDetails?.cardType || "test_card",
        receiptUrl: `/payment/receipt/${paymentId}`,
      },
    });

    // Update listing as payment completed
    await prisma.listing.update({
      where: { id: payment.listingId },
      data: {
        paymentCompleted: true,
      },
    });

    // Create notification for seller
    await prisma.notification.create({
      data: {
        userId: payment.sellerId,
        type: "PAYMENT_RECEIVED",
        message: `Payment of $${payment.totalAmount.toFixed(2)} received for "${payment.listing.title}"`,
        link: `/dashboard/sales`,
      },
    });

    // Create notification for buyer
    await prisma.notification.create({
      data: {
        userId: payment.buyerId,
        type: "PAYMENT_SENT",
        message: `Your payment of $${payment.totalAmount.toFixed(2)} for "${payment.listing.title}" was successful`,
        link: `/orders`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment completed successfully",
      payment: {
        id: updatedPayment.id,
        transactionId: testTransactionId,
        amount: updatedPayment.amount,
        shippingCharge: updatedPayment.shippingCharge,
        totalAmount: updatedPayment.totalAmount,
        status: updatedPayment.status,
      },
      listing: {
        id: payment.listing.id,
        title: payment.listing.title,
      },
    });

  } catch (error) {
    console.error("Complete test payment error:", error);
    return NextResponse.json(
      { error: "Failed to complete payment" },
      { status: 500 }
    );
  }
}

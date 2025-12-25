/**
 * Payment Success Page
 * 
 * Displays success message after Stripe payment completion
 * /payment/success?session_id=cs_xxx
 * 
 * Also updates payment status for local dev (without webhooks)
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import Link from "next/link";

async function getPaymentDetails(sessionId) {
  try {
    // Get session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return null;
    }

    // Get paymentId from session metadata
    const { paymentId, listingId, buyerId, sellerId } = session.metadata || {};

    if (!paymentId) {
      console.error("No paymentId in session metadata");
      return null;
    }

    // Check if payment is already completed
    let payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
        seller: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      console.error("Payment not found:", paymentId);
      return null;
    }

    // If payment is still pending and Stripe says it's complete, update it
    // This handles the case where webhooks don't work (local dev)
    if (payment.status === "PENDING" && session.payment_status === "paid") {
      console.log("Updating payment status from success page (webhook fallback)");
      
      payment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "COMPLETED",
          stripePaymentId: session.payment_intent,
          stripeCheckoutSession: sessionId,
          paymentMethod: session.payment_method_types?.[0] || "card",
        },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              images: true,
            },
          },
          seller: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      });

      // Update listing as payment completed
      await prisma.listing.update({
        where: { id: listingId },
        data: {
          paymentCompleted: true,
        },
      });

      // Create notifications
      await Promise.all([
        prisma.notification.create({
          data: {
            userId: sellerId,
            type: "PAYMENT_RECEIVED",
            message: `Payment of $${payment.totalAmount?.toFixed(2) || payment.amount.toFixed(2)} received for "${payment.listing.title}"`,
            link: `/dashboard/sales`,
          },
        }),
        prisma.notification.create({
          data: {
            userId: buyerId,
            type: "PAYMENT_SENT",
            message: `Your payment for "${payment.listing.title}" was successful`,
            link: `/orders`,
          },
        }),
      ]);

      console.log("Payment completed successfully:", paymentId);
    }

    return {
      session,
      payment,
    };
  } catch (error) {
    console.error("Error fetching payment details:", error);
    return null;
  }
}

async function SuccessContent({ searchParams }) {
  const sessionId = searchParams.session_id;

  if (!sessionId) {
    redirect("/");
  }

  const data = await getPaymentDetails(sessionId);

  if (!data?.payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            We couldn't find details for this payment session.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const { payment, session } = data;
  const listingImage = Array.isArray(payment.listing.images)
    ? payment.listing.images[0]
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-green-100 text-lg">
              Your payment has been processed successfully
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Listing Info */}
            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
              {listingImage && (
                <img
                  src={listingImage}
                  alt={payment.listing.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {payment.listing.title}
                </h2>
                <p className="text-gray-600">
                  Sold by: {payment.seller.fullName}
                </p>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${payment.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Payment Method:</span>
                <span className="text-gray-900 capitalize">
                  {payment.paymentMethod || "Card"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="text-gray-900 font-mono text-xs">
                  {sessionId.slice(0, 20)}...
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Status:</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Completed
                </span>
              </div>
            </div>

            {/* What's Next */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                What's Next?
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>The seller has been notified of your payment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>You'll receive shipping details via email</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">✓</span>
                  <span>Track your order from your dashboard</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/orders"
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl text-center flex items-center justify-center gap-2"
              >
                <span>View My Orders</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/"
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center"
              >
                Continue Shopping
              </Link>
            </div>

            {/* Receipt */}
            {payment.receiptUrl && (
              <div className="mt-4 text-center">
                <a
                  href={payment.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Download Receipt
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Support */}
        <p className="text-center text-gray-600 mt-6 text-sm">
          Need help?{" "}
          <Link href="/support" className="text-blue-600 hover:text-blue-700 underline">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage({ searchParams }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment details...</p>
          </div>
        </div>
      }
    >
      <SuccessContent searchParams={searchParams} />
    </Suspense>
  );
}

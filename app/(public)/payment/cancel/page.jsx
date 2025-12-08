/**
 * Payment Cancelled Page
 * 
 * Displays when user cancels payment at Stripe Checkout
 * /payment/cancel?listing_id=xxx
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";

async function getListingDetails(listingId) {
  if (!listingId) return null;

  try {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        title: true,
        currentBid: true,
        images: true,
        seller: {
          select: {
            fullName: true,
          },
        },
      },
    });

    return listing;
  } catch (error) {
    console.error("Error fetching listing:", error);
    return null;
  }
}

async function CancelContent({ searchParams }) {
  const listingId = searchParams.listing_id;

  if (!listingId) {
    redirect("/");
  }

  const listing = await getListingDetails(listingId);

  if (!listing) {
    redirect("/");
  }

  const listingImage = Array.isArray(listing.images) ? listing.images[0] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Cancel Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-12 h-12 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Payment Cancelled</h1>
            <p className="text-orange-100 text-lg">
              Your payment was not completed
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Listing Info */}
            <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-200">
              {listingImage && (
                <img
                  src={listingImage}
                  alt={listing.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  {listing.title}
                </h2>
                <p className="text-gray-600">
                  Sold by: {listing.seller.fullName}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ${listing.currentBid.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                What happened?
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                You cancelled the payment process. Your auction win is still valid,
                but payment is required to complete the purchase.
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">⚠</span>
                  <span>Payment must be completed within the deadline</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">⚠</span>
                  <span>
                    Failure to pay may result in account restrictions
                  </span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href={`/product/${listing.id}`}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl text-center flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                <span>Try Payment Again</span>
              </Link>

              <Link
                href="/orders"
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>View My Orders</span>
              </Link>
            </div>

            {/* Help Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">
                Having trouble with payment?
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Check if your card has sufficient funds</p>
                <p>• Verify your billing information is correct</p>
                <p>• Try a different payment method</p>
                <p>
                  • Contact{" "}
                  <Link href="/support" className="text-blue-600 hover:text-blue-700 underline">
                    customer support
                  </Link>{" "}
                  for assistance
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Link */}
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

export default function PaymentCancelPage({ searchParams }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <CancelContent searchParams={searchParams} />
    </Suspense>
  );
}

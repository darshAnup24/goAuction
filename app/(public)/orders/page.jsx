/**
 * Orders Page
 * 
 * Shows user's won auctions and allows payment
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Clock, CheckCircle, XCircle, Package } from "lucide-react";
import PayNowButton from "@/components/PayNowButton";
import PageTitle from "@/components/PageTitle";

async function getWonAuctions(userId) {
  const auctions = await prisma.listing.findMany({
    where: {
      winnerId: userId,
      status: {
        in: ["SOLD"],
      },
    },
    include: {
      seller: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      payments: {
        where: {
          buyerId: userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      endTime: "desc",
    },
  });

  return auctions;
}

async function getOrderHistory(userId) {
  const completedOrders = await prisma.listing.findMany({
    where: {
      winnerId: userId,
      paymentCompleted: true,
    },
    include: {
      seller: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      payments: {
        where: {
          buyerId: userId,
          status: "COMPLETED",
        },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return completedOrders;
}

function OrderCard({ auction, isPending = false }) {
  const listingImage = Array.isArray(auction.images) ? auction.images[0] : null;
  const payment = auction.payments?.[0];
  const daysUntilDue = auction.paymentDueDate
    ? Math.ceil((new Date(auction.paymentDueDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-200">
      <div className="md:flex">
        {/* Image */}
        <div className="md:w-48 h-48 md:h-auto">
          {listingImage ? (
            <img
              src={listingImage}
              alt={auction.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            {/* Left side */}
            <div className="flex-1">
              <Link
                href={`/product/${auction.id}`}
                className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {auction.title}
              </Link>
              <p className="text-gray-600 mt-1">
                Seller: {auction.seller.fullName}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div>
                  <span className="text-sm text-gray-500">Winning Bid:</span>
                  <p className="text-2xl font-bold text-green-600">
                    ${auction.currentBid.toFixed(2)}
                  </p>
                </div>
                {isPending && daysUntilDue && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-700">
                      Pay within{" "}
                      <span className="font-semibold text-orange-600">
                        {daysUntilDue} days
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="mt-3">
                {isPending ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <Clock className="w-4 h-4 mr-1" />
                    Payment Pending
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Paid
                  </span>
                )}
              </div>
            </div>

            {/* Right side - Action */}
            <div className="md:w-64">
              {isPending ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <PayNowButton
                    listingId={auction.id}
                    amount={auction.currentBid}
                    listingTitle={auction.title}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href={`/product/${auction.id}`}
                    className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </Link>
                  {payment?.receiptUrl && (
                    <a
                      href={payment.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
                    >
                      Download Receipt
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const [pendingAuctions, completedOrders] = await Promise.all([
    getWonAuctions(session.user.id),
    getOrderHistory(session.user.id),
  ]);

  const pendingPayments = pendingAuctions.filter((a) => !a.paymentCompleted);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <PageTitle
          title="My Orders"
          description="View and manage your auction wins"
        />

        {/* Pending Payments Section */}
        {pendingPayments.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-4 mb-4">
              <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Action Required: {pendingPayments.length} Payment
                {pendingPayments.length !== 1 ? "s" : ""} Pending
              </h2>
              <p className="text-orange-100">
                Complete your payment to secure your items
              </p>
            </div>

            <div className="space-y-4">
              {pendingPayments.map((auction) => (
                <OrderCard key={auction.id} auction={auction} isPending={true} />
              ))}
            </div>
          </div>
        )}

        {/* Completed Orders Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Order History
          </h2>

          {completedOrders.length > 0 ? (
            <div className="space-y-4">
              {completedOrders.map((auction) => (
                <OrderCard key={auction.id} auction={auction} isPending={false} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No completed orders yet
              </h3>
              <p className="text-gray-600 mb-6">
                Your completed purchases will appear here
              </p>
              <Link
                href="/"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Browse Auctions
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
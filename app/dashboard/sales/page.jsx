import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { 
  DollarSign, 
  Package, 
  User, 
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Download
} from "lucide-react";

/**
 * Sales History Page
 */
export default async function SalesHistoryPage() {
  const session = await auth();
  const userId = session?.user?.id;

  // Fetch sold auctions
  const soldListings = await prisma.listing.findMany({
    where: {
      sellerId: userId,
      status: "SOLD",
    },
    include: {
      bids: {
        where: { status: "WON" },
        take: 1,
        include: {
          bidder: {
            select: {
              id: true,
              username: true,
              fullName: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Calculate total revenue
  const totalRevenue = soldListings.reduce(
    (sum, listing) => sum + listing.currentBid,
    0
  );

  // Calculate pending payouts (mock - implement based on your payment system)
  const pendingPayouts = soldListings.length * 0.3; // Example: 30% pending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sales History</h1>
        <p className="text-gray-600 mt-1">Track your auction sales and payouts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Sales"
          value={soldListings.length}
          icon={Package}
          color="blue"
        />
        <SummaryCard
          title="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="green"
        />
        <SummaryCard
          title="Paid Out"
          value={`$${((1 - pendingPayouts) * totalRevenue).toFixed(2)}`}
          icon={CheckCircle}
          color="purple"
        />
        <SummaryCard
          title="Pending"
          value={`$${(pendingPayouts * totalRevenue).toFixed(2)}`}
          icon={Clock}
          color="orange"
        />
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Recent Sales</h2>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {soldListings.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No sales yet
            </h3>
            <p className="text-gray-600 mb-6">
              Your sold auctions will appear here
            </p>
            <Link
              href="/listings/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Package className="w-5 h-5" />
              Create Auction
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Buyer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Sale Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date Sold
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {soldListings.map((listing) => {
                    const winner = listing.bids[0];
                    return (
                      <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                        {/* Item */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                              {listing.images && listing.images[0] ? (
                                <img
                                  src={listing.images[0]}
                                  alt={listing.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                                  <Package className="w-6 h-6 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {listing.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                ID: {listing.id.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Buyer */}
                        <td className="px-6 py-4">
                          {winner && (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {winner.bidder.username?.[0]?.toUpperCase() || "B"}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {winner.bidder.fullName || winner.bidder.username}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {winner.bidder.email}
                                </p>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Sale Price */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-bold text-gray-900">
                              ${listing.currentBid.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {listing.bidCount} bids
                          </p>
                        </td>

                        {/* Date Sold */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">
                              {new Date(listing.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(listing.updatedAt).toLocaleTimeString()}
                          </p>
                        </td>

                        {/* Payment Status */}
                        <td className="px-6 py-4">
                          <PaymentStatusBadge status="completed" />
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/product/${listing.id}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-200">
              {soldListings.map((listing) => {
                const winner = listing.bids[0];
                return (
                  <div key={listing.id} className="p-4">
                    <div className="flex gap-3 mb-3">
                      <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                        {listing.images && listing.images[0] ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                            <Package className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {listing.title}
                        </h3>
                        <p className="text-lg font-bold text-green-600 mt-1">
                          ${listing.currentBid.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {winner && (
                      <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{winner.bidder.fullName || winner.bidder.username}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Sold on {new Date(listing.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <PaymentStatusBadge status="completed" />
                      <Link
                        href={`/product/${listing.id}`}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Summary Card Component
 */
function SummaryCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

/**
 * Payment Status Badge Component
 */
function PaymentStatusBadge({ status }) {
  const styles = {
    completed: "bg-green-100 text-green-800 border-green-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    processing: "bg-blue-100 text-blue-800 border-blue-200",
    failed: "bg-red-100 text-red-800 border-red-200",
  };

  const icons = {
    completed: CheckCircle,
    pending: Clock,
    processing: Clock,
    failed: Clock,
  };

  const Icon = icons[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { 
  Package, 
  TrendingUp, 
  DollarSign, 
  Clock,
  Eye,
  Gavel,
  Calendar,
  AlertCircle,
  Plus
} from "lucide-react";

/**
 * Vendor Dashboard Overview Page
 */
export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  // Fetch dashboard statistics
  const [
    activeAuctions,
    totalBids,
    recentNotifications,
    upcomingEndings,
    monthlyRevenue
  ] = await Promise.all([
    // Active auctions count
    prisma.listing.count({
      where: {
        sellerId: userId,
        status: "LIVE",
        type: "AUCTION",
      },
    }),

    // Total bids received
    prisma.bid.count({
      where: {
        listing: {
          sellerId: userId,
        },
      },
    }),

    // Recent notifications (placeholder - implement based on your notification system)
    prisma.listing.findMany({
      where: {
        sellerId: userId,
        status: "LIVE",
      },
      include: {
        bids: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            bidder: {
              select: { username: true, fullName: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),

    // Auctions ending soon (within 24 hours)
    prisma.listing.findMany({
      where: {
        sellerId: userId,
        status: "LIVE",
        type: "AUCTION",
        endTime: {
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          gte: new Date(),
        },
      },
      orderBy: { endTime: "asc" },
      take: 5,
      include: {
        _count: {
          select: { bids: true },
        },
      },
    }),

    // Monthly revenue (sold auctions this month)
    prisma.listing.aggregate({
      where: {
        sellerId: userId,
        status: "SOLD",
        updatedAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: {
        currentBid: true,
      },
    }),
  ]);

  const revenue = monthlyRevenue._sum.currentBid || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back, {session.user.name || "Vendor"}!</p>
        </div>
        <Link
          href="/listings/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Create Auction
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Auctions"
          value={activeAuctions}
          icon={Package}
          color="blue"
          href="/dashboard/listings"
        />
        <StatCard
          title="Total Bids"
          value={totalBids}
          icon={Gavel}
          color="purple"
        />
        <StatCard
          title="Revenue This Month"
          value={`$${revenue.toFixed(2)}`}
          icon={DollarSign}
          color="green"
          href="/dashboard/sales"
        />
        <StatCard
          title="Ending Soon"
          value={upcomingEndings.length}
          icon={Clock}
          color="orange"
          alert={upcomingEndings.length > 0}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Recent Activity
            </h2>
            <Link
              href="/dashboard/notifications"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentNotifications.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No recent activity</p>
              </div>
            ) : (
              recentNotifications.map((listing) => (
                <div key={listing.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Gavel className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {listing.bids[0] ? (
                          <>New bid on <strong>{listing.title}</strong></>
                        ) : (
                          <>{listing.title} updated</>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {listing.bids[0] ? (
                          <>
                            {listing.bids[0].bidder.fullName || listing.bids[0].bidder.username} bid ${listing.currentBid.toFixed(2)}
                          </>
                        ) : (
                          <>Current bid: ${listing.currentBid.toFixed(2)}</>
                        )}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(listing.updatedAt)}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/listings`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Auctions Ending Soon */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Ending Soon
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingEndings.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No auctions ending soon</p>
              </div>
            ) : (
              upcomingEndings.map((listing) => (
                <div key={listing.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {listing.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {listing._count.bids} bids
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs font-semibold text-orange-600">
                          Ends {formatTimeRemaining(listing.endTime)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-green-600 mt-1">
                        Current: ${listing.currentBid.toFixed(2)}
                      </p>
                    </div>
                    <Link
                      href={`/product/${listing.id}`}
                      className="text-blue-600 hover:text-blue-700"
                      target="_blank"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction href="/listings/create" icon={Plus}>
            Create Auction
          </QuickAction>
          <QuickAction href="/dashboard/listings" icon={Package}>
            View Listings
          </QuickAction>
          <QuickAction href="/dashboard/sales" icon={DollarSign}>
            Sales History
          </QuickAction>
          <QuickAction href="/dashboard/analytics" icon={TrendingUp}>
            View Analytics
          </QuickAction>
        </div>
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({ title, value, icon: Icon, color, href, alert }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
  };

  const content = (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {alert && (
        <div className="mt-3 flex items-center gap-1 text-orange-600 text-xs font-semibold">
          <AlertCircle className="w-3 h-3" />
          <span>Requires attention</span>
        </div>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

/**
 * Quick Action Button
 */
function QuickAction({ href, icon: Icon, children }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-colors"
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{children}</span>
    </Link>
  );
}

/**
 * Format time ago
 */
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Format time remaining
 */
function formatTimeRemaining(endTime) {
  const ms = new Date(endTime) - new Date();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
}

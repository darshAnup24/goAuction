import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { 
  Bell, 
  Gavel, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Eye
} from "lucide-react";

/**
 * Notifications Page
 */
export default async function NotificationsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  // Fetch notifications data
  const [recentBids, endingSoon, recentlySold] = await Promise.all([
    // Recent bids on user's auctions
    prisma.bid.findMany({
      where: {
        listing: {
          sellerId: userId,
          status: "LIVE",
        },
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
        bidder: {
          select: {
            username: true,
            fullName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),

    // Auctions ending soon (within 24 hours)
    prisma.listing.findMany({
      where: {
        sellerId: userId,
        status: "LIVE",
        endTime: {
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
      orderBy: { endTime: "asc" },
      take: 10,
    }),

    // Recently sold auctions
    prisma.listing.findMany({
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
                username: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  // Combine and sort notifications
  const notifications = [
    ...recentBids.map((bid) => ({
      id: bid.id,
      type: "new_bid",
      timestamp: bid.createdAt,
      data: bid,
    })),
    ...endingSoon.map((listing) => ({
      id: listing.id,
      type: "ending_soon",
      timestamp: listing.endTime,
      data: listing,
    })),
    ...recentlySold.map((listing) => ({
      id: listing.id,
      type: "sold",
      timestamp: listing.updatedAt,
      data: listing,
    })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600 mt-1">
          Stay updated with your auction activity
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title="New Bids"
          value={recentBids.length}
          icon={Gavel}
          color="blue"
        />
        <StatCard
          title="Ending Soon"
          value={endingSoon.length}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Recently Sold"
          value={recentlySold.length}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            All Notifications
          </h2>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Mark all as read
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No notifications yet
            </h3>
            <p className="text-gray-600">
              You'll see updates about your auctions here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <NotificationItem
                key={`${notification.type}-${notification.id}`}
                notification={notification}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    orange: "from-orange-500 to-orange-600",
    green: "from-green-500 to-green-600",
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
 * Notification Item Component
 */
function NotificationItem({ notification }) {
  const { type, timestamp, data } = notification;

  let icon, iconColor, bgColor, title, description, link;

  switch (type) {
    case "new_bid":
      icon = Gavel;
      iconColor = "text-blue-600";
      bgColor = "bg-blue-100";
      title = `New bid on ${data.listing.title}`;
      description = `${data.bidder.fullName || data.bidder.username} bid $${data.amount.toFixed(2)}`;
      link = `/product/${data.listing.id}`;
      break;

    case "ending_soon":
      icon = Clock;
      iconColor = "text-orange-600";
      bgColor = "bg-orange-100";
      title = `Auction ending soon: ${data.title}`;
      description = `Ends ${formatTimeRemaining(data.endTime)}`;
      link = `/product/${data.id}`;
      break;

    case "sold":
      icon = CheckCircle;
      iconColor = "text-green-600";
      bgColor = "bg-green-100";
      const winner = data.bids[0];
      title = `Auction sold: ${data.title}`;
      description = winner
        ? `Sold to ${winner.bidder.fullName || winner.bidder.username} for $${data.currentBid.toFixed(2)}`
        : `Sold for $${data.currentBid.toFixed(2)}`;
      link = `/product/${data.id}`;
      break;

    default:
      icon = Bell;
      iconColor = "text-gray-600";
      bgColor = "bg-gray-100";
      title = "Notification";
      description = "";
      link = "/dashboard";
  }

  const Icon = icon;

  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          <p className="text-xs text-gray-400 mt-2">
            {formatTimeAgo(timestamp)}
          </p>
        </div>

        {/* Action */}
        <Link
          href={link}
          className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Eye className="w-5 h-5" />
        </Link>
      </div>
    </div>
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
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
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

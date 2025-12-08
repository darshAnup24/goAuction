import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import ListingsTable from "@/components/dashboard/ListingsTable";

/**
 * My Auctions Page - Dashboard Listings
 */
export default async function MyAuctionsPage({ searchParams }) {
  const session = await auth();
  const userId = session?.user?.id;
  
  const tab = searchParams?.tab || "active";

  // Fetch listings based on active tab
  const whereConditions = {
    sellerId: userId,
    type: "AUCTION",
  };

  if (tab === "active") {
    whereConditions.status = "LIVE";
  } else if (tab === "upcoming") {
    whereConditions.status = "UPCOMING";
  } else if (tab === "ended") {
    whereConditions.status = { in: ["ENDED", "SOLD", "UNSOLD"] };
  }

  const listings = await prisma.listing.findMany({
    where: whereConditions,
    include: {
      _count: {
        select: { bids: true },
      },
    },
    orderBy: [
      { endTime: tab === "active" ? "asc" : "desc" },
      { createdAt: "desc" },
    ],
  });

  // Get counts for tabs
  const [activeCount, upcomingCount, endedCount] = await Promise.all([
    prisma.listing.count({
      where: { sellerId: userId, type: "AUCTION", status: "LIVE" },
    }),
    prisma.listing.count({
      where: { sellerId: userId, type: "AUCTION", status: "UPCOMING" },
    }),
    prisma.listing.count({
      where: {
        sellerId: userId,
        type: "AUCTION",
        status: { in: ["ENDED", "SOLD", "UNSOLD"] },
      },
    }),
  ]);

  // Map listings to include bidCount
  const listingsWithCounts = listings.map(listing => ({
    ...listing,
    bidCount: listing._count.bids,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Auctions</h1>
          <p className="text-gray-600 mt-1">
            Manage your auction listings
          </p>
        </div>
        <Link
          href="/listings/create"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          Create New Auction
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <TabLink
              href="/dashboard/listings?tab=active"
              active={tab === "active"}
              count={activeCount}
            >
              Active
            </TabLink>
            <TabLink
              href="/dashboard/listings?tab=upcoming"
              active={tab === "upcoming"}
              count={upcomingCount}
            >
              Upcoming
            </TabLink>
            <TabLink
              href="/dashboard/listings?tab=ended"
              active={tab === "ended"}
              count={endedCount}
            >
              Ended
            </TabLink>
          </nav>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search auctions..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Listings Table */}
      <ListingsTable 
        listings={listingsWithCounts} 
        activeTab={tab === "active" ? "Active" : tab === "upcoming" ? "Upcoming" : "Ended"}
      />
    </div>
  );
}

/**
 * Tab Link Component
 */
function TabLink({ href, active, count, children }) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-colors
        ${active 
          ? "border-blue-600 text-blue-600" 
          : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
        }
      `}
    >
      <span>{children}</span>
      <span className={`
        px-2 py-0.5 rounded-full text-xs font-bold
        ${active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}
      `}>
        {count}
      </span>
    </Link>
  );
}

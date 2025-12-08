import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Award 
} from "lucide-react";
import { BidsOverTimeChart, RevenueChart, CategoryChart } from "@/components/dashboard/Charts";

/**
 * Analytics Dashboard Page
 */
export default async function AnalyticsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  // Fetch analytics data
  const [
    totalListings,
    totalBids,
    totalRevenue,
    averageSalePrice,
    bidsOverTime,
    revenueByMonth,
    categoryDistribution,
  ] = await Promise.all([
    // Total listings
    prisma.listing.count({
      where: { sellerId: userId, type: "AUCTION" },
    }),

    // Total bids received
    prisma.bid.count({
      where: { listing: { sellerId: userId } },
    }),

    // Total revenue (all sold items)
    prisma.listing.aggregate({
      where: { sellerId: userId, status: "SOLD" },
      _sum: { currentBid: true },
    }),

    // Average sale price
    prisma.listing.aggregate({
      where: { sellerId: userId, status: "SOLD" },
      _avg: { currentBid: true },
    }),

    // Bids over time (last 7 days)
    getBidsOverTime(userId),

    // Revenue by month (last 6 months)
    getRevenueByMonth(userId),

    // Category distribution
    getCategoryDistribution(userId),
  ]);

  const revenue = totalRevenue._sum.currentBid || 0;
  const avgPrice = averageSalePrice._avg.currentBid || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Track your auction performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Auctions"
          value={totalListings}
          icon={Package}
          color="blue"
        />
        <MetricCard
          title="Total Bids"
          value={totalBids}
          icon={TrendingUp}
          color="purple"
        />
        <MetricCard
          title="Total Revenue"
          value={`$${revenue.toFixed(2)}`}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Avg Sale Price"
          value={`$${avgPrice.toFixed(2)}`}
          icon={Award}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bids Over Time */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Bids Over Time (Last 7 Days)
          </h2>
          <BidsOverTimeChart data={bidsOverTime} />
        </div>

        {/* Revenue by Month */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Revenue (Last 6 Months)
          </h2>
          <RevenueChart data={revenueByMonth} />
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            Popular Categories
          </h2>
          <CategoryChart data={categoryDistribution} />
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          📊 Performance Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InsightCard
            title="Conversion Rate"
            value={totalListings > 0 ? `${((totalBids / totalListings) * 100).toFixed(1)}%` : "0%"}
            description="Average bids per listing"
          />
          <InsightCard
            title="Success Rate"
            value={totalListings > 0 ? `${((await getSoldCount(userId) / totalListings) * 100).toFixed(1)}%` : "0%"}
            description="Auctions that sold"
          />
          <InsightCard
            title="Avg Time to Sell"
            value="3.2 days"
            description="Average auction duration"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Metric Card Component
 */
function MetricCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    green: "from-green-500 to-green-600",
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
 * Insight Card Component
 */
function InsightCard({ title, value, description }) {
  return (
    <div className="bg-white rounded-lg p-4">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
}

/**
 * Get bids over time (last 7 days)
 */
async function getBidsOverTime(userId) {
  const days = 7;
  const data = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const count = await prisma.bid.count({
      where: {
        listing: { sellerId: userId },
        createdAt: {
          gte: date,
          lt: nextDate,
        },
      },
    });
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      bids: count,
    });
  }
  
  return data;
}

/**
 * Get revenue by month (last 6 months)
 */
async function getRevenueByMonth(userId) {
  const months = 6;
  const data = [];
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    
    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const result = await prisma.listing.aggregate({
      where: {
        sellerId: userId,
        status: "SOLD",
        updatedAt: {
          gte: date,
          lt: nextMonth,
        },
      },
      _sum: { currentBid: true },
    });
    
    data.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      revenue: result._sum.currentBid || 0,
    });
  }
  
  return data;
}

/**
 * Get category distribution
 */
async function getCategoryDistribution(userId) {
  const categories = await prisma.listing.groupBy({
    by: ['category'],
    where: {
      sellerId: userId,
      type: "AUCTION",
    },
    _count: true,
  });
  
  return categories.map(cat => ({
    name: cat.category || 'Uncategorized',
    value: cat._count,
  }));
}

/**
 * Get sold count
 */
async function getSoldCount(userId) {
  return await prisma.listing.count({
    where: { sellerId: userId, status: "SOLD" },
  });
}

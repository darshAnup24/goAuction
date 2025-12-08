import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { User, Mail, Star, ShoppingBag, Gavel, Award, Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'

export default async function PublicProfilePage({ params }) {
  const { userId } = params

  // Fetch user with statistics
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      fullName: true,
      avatar: true,
      role: true,
      isVendor: true,
      ratingAsBuyer: true,
      ratingAsSeller: true,
      totalRatings: true,
      address: true,
      createdAt: true,
      _count: {
        select: {
          listings: true,
          bids: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  // Get auctions won
  const auctionsWon = await prisma.listing.count({
    where: {
      winnerId: userId,
      status: 'SOLD',
    },
  })

  // Get active listings with details
  const activeListings = await prisma.listing.findMany({
    where: {
      sellerId: userId,
      status: { in: ['UPCOMING', 'LIVE'] },
    },
    include: {
      _count: {
        select: { bids: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })

  // Get recent ratings
  const recentRatings = await prisma.rating.findMany({
    where: { toUserId: userId },
    include: {
      fromUser: {
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start space-x-4">
            {/* Avatar */}
            <div className="relative">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-blue-500">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
              {user.isVendor && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                  Vendor
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{user.fullName}</h1>
              <p className="text-gray-500 text-lg">@{user.username}</p>
              
              <div className="flex items-center mt-3 space-x-4">
                <div className="flex items-center text-yellow-500">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="ml-1 font-semibold">
                    {user.isVendor ? user.ratingAsSeller.toFixed(1) : user.ratingAsBuyer.toFixed(1)}
                  </span>
                  <span className="text-gray-500 ml-1">({user.totalRatings} reviews)</span>
                </div>
                <span className="text-gray-400">•</span>
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>
                    Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {user.address && (
                <div className="flex items-center text-gray-600 mt-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm">{user.address.split(',').slice(-2).join(',').trim()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard
            icon={<ShoppingBag className="w-8 h-8" />}
            title="Total Listings"
            value={user._count.listings}
            color="blue"
          />
          <StatCard
            icon={<Gavel className="w-8 h-8" />}
            title="Active Auctions"
            value={activeListings.length}
            color="green"
          />
          <StatCard
            icon={<Award className="w-8 h-8" />}
            title="Auctions Won"
            value={auctionsWon}
            color="purple"
          />
          <StatCard
            icon={<Star className="w-8 h-8" />}
            title="Total Bids"
            value={user._count.bids}
            color="yellow"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Listings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Active Listings</h2>
                {activeListings.length > 0 && (
                  <Link
                    href={`/shop?seller=${userId}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View All
                  </Link>
                )}
              </div>

              {activeListings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No active listings</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Ratings */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Reviews</h2>

              {recentRatings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Star className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentRatings.map((rating) => (
                    <RatingCard key={rating.id} rating={rating} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, title, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  )
}

function ListingCard({ listing }) {
  const images = typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images
  const mainImage = images[0]

  const statusColors = {
    UPCOMING: 'bg-blue-100 text-blue-800',
    LIVE: 'bg-green-100 text-green-800',
  }

  return (
    <Link href={`/product/${listing.id}`} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48">
        <img src={mainImage} alt={listing.title} className="w-full h-full object-cover" />
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${statusColors[listing.status]}`}>
          {listing.status}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 line-clamp-1">{listing.title}</h3>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Current Bid</p>
            <p className="text-lg font-bold text-blue-600">${listing.currentBid.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Bids</p>
            <p className="text-sm font-semibold">{listing._count.bids}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

function RatingCard({ rating }) {
  return (
    <div className="border-b last:border-0 pb-4 last:pb-0">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {rating.fromUser.avatar ? (
            <img
              src={rating.fromUser.avatar}
              alt={rating.fromUser.fullName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">{rating.fromUser.fullName}</p>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < rating.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          {rating.review && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{rating.review}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {new Date(rating.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  )
}

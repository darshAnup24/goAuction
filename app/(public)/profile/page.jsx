import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { User, Mail, Phone, MapPin, Star, ShoppingBag, Gavel, Award } from 'lucide-react'

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // Fetch full user data with statistics
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: {
          listings: true,
          bids: true,
          ratingsReceived: true,
        },
      },
    },
  })

  if (!user) {
    redirect('/login')
  }

  // Get auctions won
  const auctionsWon = await prisma.listing.count({
    where: {
      winnerId: user.id,
      status: 'SOLD',
    },
  })

  // Get active listings
  const activeListings = await prisma.listing.count({
    where: {
      sellerId: user.id,
      status: { in: ['UPCOMING', 'LIVE'] },
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
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
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{user.fullName}</h1>
                <p className="text-gray-500 text-lg">@{user.username}</p>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="flex items-center text-yellow-500">
                    <Star className="w-5 h-5 fill-current" />
                    <span className="ml-1 font-semibold">
                      {user.isVendor ? user.ratingAsSeller.toFixed(1) : user.ratingAsBuyer.toFixed(1)}
                    </span>
                    <span className="text-gray-500 ml-1">({user.totalRatings} reviews)</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">
                    Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <Link
              href="/profile/edit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Edit Profile
            </Link>
          </div>

          {/* Contact Info */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center text-gray-700">
              <Mail className="w-5 h-5 mr-2 text-blue-600" />
              <span>{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center text-gray-700">
                <Phone className="w-5 h-5 mr-2 text-blue-600" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.address && (
              <div className="flex items-center text-gray-700">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                <span className="truncate">{user.address}</span>
              </div>
            )}
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
            value={activeListings}
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

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/shop"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-center"
            >
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Browse Auctions</h3>
              <p className="text-sm text-gray-500">Find items to bid on</p>
            </Link>
            
            {user.isVendor && (
              <Link
                href="/store/add-product"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-center"
              >
                <Gavel className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Create Listing</h3>
                <p className="text-sm text-gray-500">List a new auction</p>
              </Link>
            )}
            
            <Link
              href="/orders"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-center"
            >
              <Award className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold text-gray-900">My Orders</h3>
              <p className="text-sm text-gray-500">View purchase history</p>
            </Link>
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

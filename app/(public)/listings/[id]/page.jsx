import { notFound } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import ImageGallery from '@/components/listings/ImageGallery'
import CountdownTimer from '@/components/listings/CountdownTimer'
import BidSection from '@/components/listings/BidSection'
import ListingCard from '@/components/listings/ListingCard'
import { 
  Eye, 
  Gavel, 
  Calendar, 
  MapPin, 
  Star, 
  User,
  Clock,
  TrendingUp
} from 'lucide-react'

export async function generateMetadata({ params }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { title: true, description: true },
  })

  if (!listing) {
    return { title: 'Listing Not Found - GoCart' }
  }

  return {
    title: `${listing.title} - GoCart Auction`,
    description: listing.description.substring(0, 160),
  }
}

export default async function ListingDetailPage({ params }) {
  const { id } = params

  // Fetch listing with full details
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      seller: {
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
          phone: true,
          address: true,
          ratingAsSeller: true,
          totalRatings: true,
          isVendor: true,
          createdAt: true,
        },
      },
      bids: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          bidder: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
        },
      },
    },
  })

  if (!listing) {
    notFound()
  }

  // Increment view count (async, don't wait)
  prisma.listing.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  }).catch(err => console.error('Error updating view count:', err))

  // Get related listings
  const relatedListings = await prisma.listing.findMany({
    where: {
      category: listing.category,
      status: { in: ['LIVE', 'UPCOMING'] },
      id: { not: id },
    },
    include: {
      seller: {
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
          ratingAsSeller: true,
          totalRatings: true,
        },
      },
    },
    take: 3,
    orderBy: { createdAt: 'desc' },
  })

  const isActive = listing.status === 'LIVE' && new Date(listing.endTime) > new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/listings" className="hover:text-blue-600">
            Auctions
          </Link>
          <span>/</span>
          <span className="text-gray-900">{listing.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <ImageGallery images={listing.images} />

            {/* Listing Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-blue-600 font-semibold mb-2 uppercase tracking-wide">
                    {listing.category}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {listing.title}
                  </h1>
                </div>
                <div className={`
                  px-4 py-2 rounded-full text-sm font-semibold
                  ${listing.status === 'LIVE' ? 'bg-green-100 text-green-800' : ''}
                  ${listing.status === 'UPCOMING' ? 'bg-blue-100 text-blue-800' : ''}
                  ${listing.status === 'ENDED' ? 'bg-gray-100 text-gray-800' : ''}
                  ${listing.status === 'SOLD' ? 'bg-purple-100 text-purple-800' : ''}
                `}>
                  {listing.status}
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-6 py-4 border-y border-gray-200 mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <Eye className="w-5 h-5" />
                  <span className="text-sm">{listing.viewCount} views</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Gavel className="w-5 h-5" />
                  <span className="text-sm">{listing.bids.length} bids</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm">
                    Listed {(() => {
                      const d = new Date(listing.createdAt);
                      const day = String(d.getDate()).padStart(2, '0');
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const year = d.getFullYear();
                      return `${day}-${month}-${year}`;
                    })()}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {listing.description}
                </p>
              </div>

              {/* Auction Details */}
              <div className="mt-6 pt-6 border-t space-y-3">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Auction Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Starting Price:</span>
                    <p className="font-semibold text-gray-900">
                      ${listing.startingPrice.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Bid:</span>
                    <p className="font-semibold text-gray-900">
                      ${listing.currentBid.toFixed(2)}
                    </p>
                  </div>
                  {listing.reservePrice && (
                    <div>
                      <span className="text-gray-600">Reserve Price:</span>
                      <p className="font-semibold text-gray-900">
                        ${listing.reservePrice.toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Start Time:</span>
                    <p className="font-semibold text-gray-900">
                      {(() => {
                        const d = new Date(listing.startTime);
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        const hours = String(d.getHours()).padStart(2, '0');
                        const minutes = String(d.getMinutes()).padStart(2, '0');
                        return `${day}-${month}-${year} ${hours}:${minutes}`;
                      })()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">End Time:</span>
                    <p className="font-semibold text-gray-900">
                      {(() => {
                        const d = new Date(listing.endTime);
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        const hours = String(d.getHours()).padStart(2, '0');
                        const minutes = String(d.getMinutes()).padStart(2, '0');
                        return `${day}-${month}-${year} ${hours}:${minutes}`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bid History */}
            {listing.bids.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Bid History</h2>
                <div className="space-y-3">
                  {listing.bids.map((bid, index) => (
                    <div
                      key={bid.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {bid.bidder.avatar ? (
                          <img
                            src={bid.bidder.avatar}
                            alt={bid.bidder.fullName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">
                            {bid.bidder.username}
                            {index === 0 && (
                              <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                                Highest Bid
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-600">
                            {(() => {
                              const d = new Date(bid.createdAt);
                              const day = String(d.getDate()).padStart(2, '0');
                              const month = String(d.getMonth() + 1).padStart(2, '0');
                              const year = d.getFullYear();
                              const hours = String(d.getHours()).padStart(2, '0');
                              const minutes = String(d.getMinutes()).padStart(2, '0');
                              return `${day}-${month}-${year} ${hours}:${minutes}`;
                            })()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ${bid.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Bid Section & Seller Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Countdown Timer */}
            {isActive && (
              <CountdownTimer endTime={listing.endTime} />
            )}

            {/* Bid Section */}
            <BidSection listing={listing} />

            {/* Seller Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Seller Information</h3>
              
              <Link 
                href={`/profile/${listing.seller.id}`}
                className="flex items-center gap-3 mb-4 hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                {listing.seller.avatar ? (
                  <img
                    src={listing.seller.avatar}
                    alt={listing.seller.fullName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{listing.seller.fullName}</p>
                  <p className="text-sm text-gray-600">@{listing.seller.username}</p>
                </div>
              </Link>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <span className="font-semibold">{listing.seller.ratingAsSeller.toFixed(1)}</span>
                  <span className="text-gray-600">
                    ({listing.seller.totalRatings} reviews)
                  </span>
                </div>

                {listing.seller.address && (
                  <div className="flex items-start gap-2 text-gray-700">
                    <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{listing.seller.address.split(',').slice(-2).join(',').trim()}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5" />
                  <span>
                    Member since {new Date(listing.seller.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {listing.seller.isVendor && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg flex items-center gap-2 text-blue-700">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-semibold">Verified Vendor</span>
                  </div>
                )}
              </div>

              <Link
                href={`/profile/${listing.seller.id}`}
                className="mt-4 block w-full text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                View Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Related Auctions */}
        {relatedListings.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Auctions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedListings.map((relatedListing) => (
                <ListingCard key={relatedListing.id} listing={relatedListing} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

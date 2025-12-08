// Example: Using BiddingPanel in a listing detail page

import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import BiddingPanelClient from './BiddingPanelClient'
import ImageGallery from '@/components/listings/ImageGallery'
import CountdownTimer from '@/components/listings/CountdownTimer'

/**
 * Server Component - Listing Detail Page
 * Fetches listing data and passes to client components
 */
export async function generateMetadata({ params }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { title: true, description: true, images: true },
  })

  if (!listing) return { title: 'Listing Not Found' }

  const images = typeof listing.images === 'string' 
    ? JSON.parse(listing.images) 
    : listing.images

  return {
    title: `${listing.title} - GoCart Auctions`,
    description: listing.description.substring(0, 155),
    openGraph: {
      title: listing.title,
      description: listing.description,
      images: [{ url: images[0] }],
    },
  }
}

export default async function ListingDetailPage({ params }) {
  // Fetch listing with all related data
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      seller: {
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
          ratingAsSeller: true,
          isVendor: true,
        },
      },
      bids: {
        take: 10,
        orderBy: [
          { amount: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          bidder: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              ratingAsBuyer: true,
            },
          },
        },
      },
    },
  })

  if (!listing) {
    notFound()
  }

  // Increment view count (fire and forget)
  prisma.listing.update({
    where: { id: params.id },
    data: { viewCount: { increment: 1 } },
  }).catch(console.error)

  // Parse images
  const images = typeof listing.images === 'string' 
    ? JSON.parse(listing.images) 
    : listing.images

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-sm text-gray-600">
          <a href="/" className="hover:text-blue-600">Home</a>
          <span className="mx-2">/</span>
          <a href="/listings" className="hover:text-blue-600">Auctions</a>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-semibold">{listing.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <ImageGallery images={images} title={listing.title} />
            </div>

            {/* Listing Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded-full uppercase">
                      {listing.category}
                    </span>
                    <span className={`
                      px-3 py-1 text-sm font-bold rounded-full
                      ${listing.status === 'LIVE' ? 'bg-green-100 text-green-800' : ''}
                      ${listing.status === 'ENDED' ? 'bg-gray-100 text-gray-800' : ''}
                      ${listing.status === 'SOLD' ? 'bg-purple-100 text-purple-800' : ''}
                    `}>
                      {listing.status}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {listing.title}
                  </h1>
                </div>
              </div>

              {/* Countdown Timer */}
              {listing.status === 'LIVE' && (
                <div className="mb-6">
                  <CountdownTimer 
                    endTime={listing.endTime}
                    onExpire={() => {
                      // Optionally refresh page or show notification
                      console.log('Auction ended')
                    }}
                  />
                </div>
              )}

              {/* Description */}
              <div className="prose max-w-none">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {listing.description}
                </p>
              </div>

              {/* Seller Information */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Seller Information</h3>
                <div className="flex items-center gap-4">
                  {listing.seller.avatar ? (
                    <img
                      src={listing.seller.avatar}
                      alt={listing.seller.username}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                      {listing.seller.username[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 text-lg">
                        {listing.seller.username}
                      </p>
                      {listing.seller.isVendor && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                          Verified Seller
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{listing.seller.fullName}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm font-semibold text-gray-700">
                        {listing.seller.ratingAsSeller.toFixed(1)} rating
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Listing Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{listing.viewCount}</p>
                  <p className="text-sm text-gray-600">Views</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{listing.bidCount}</p>
                  <p className="text-sm text-gray-600">Bids</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {new Set(listing.bids.map(b => b.bidderId)).size}
                  </p>
                  <p className="text-sm text-gray-600">Bidders</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bidding Panel (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <BiddingPanelClient
                listingId={listing.id}
                currentBid={listing.currentBid}
                startingPrice={listing.startingPrice}
                bidCount={listing.bidCount}
                status={listing.status}
                endTime={listing.endTime}
                sellerId={listing.seller.id}
                initialBids={listing.bids}
              />

              {/* Additional Info Card */}
              <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4">Auction Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Starting Price:</span>
                    <span className="font-semibold text-gray-900">
                      ${listing.startingPrice.toFixed(2)}
                    </span>
                  </div>
                  {listing.reservePrice && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reserve Price:</span>
                      <span className="font-semibold text-gray-900">
                        ${listing.reservePrice.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Started:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(listing.startTime).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ends:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(listing.endTime).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Condition:</span>
                    <span className="font-semibold text-gray-900">New</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Listings */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Auctions</h2>
          {/* Add AuctionCard grid here */}
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Clock, Gavel, Eye, TrendingUp } from 'lucide-react'

export default function ListingCard({ listing, showSeller = true }) {
  const images = typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images
  const mainImage = images?.[0] || '/placeholder-auction.jpg'
  
  const timeRemaining = new Date(listing.endTime) - new Date()
  const isActive = listing.status === 'LIVE' && timeRemaining > 0
  
  const formatTimeRemaining = (ms) => {
    if (ms <= 0) return 'Ended'
    
    const days = Math.floor(ms / (1000 * 60 * 60 * 24))
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const statusColors = {
    UPCOMING: 'bg-blue-100 text-blue-800 border-blue-200',
    LIVE: 'bg-green-100 text-green-800 border-green-200',
    ENDED: 'bg-gray-100 text-gray-800 border-gray-200',
    SOLD: 'bg-purple-100 text-purple-800 border-purple-200',
    UNSOLD: 'bg-orange-100 text-orange-800 border-orange-200',
  }

  return (
    <Link 
      href={`/listings/${listing.id}`}
      className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative h-56 bg-gray-200 overflow-hidden">
        <img 
          src={mainImage} 
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        
        {/* Status Badge */}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[listing.status]}`}>
          {listing.status}
        </div>

        {/* View Count */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {listing.viewCount}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <div className="text-xs text-blue-600 font-medium mb-1 uppercase tracking-wide">
          {listing.category}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {listing.title}
        </h3>

        {/* Seller Info */}
        {showSeller && listing.seller && (
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
            {listing.seller.avatar ? (
              <img 
                src={listing.seller.avatar} 
                alt={listing.seller.fullName}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
            )}
            <span className="truncate">{listing.seller.username}</span>
          </div>
        )}

        {/* Price Section */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Current Bid</p>
            <p className="text-2xl font-bold text-gray-900">
              ${listing.currentBid?.toFixed(2) || listing.startingPrice?.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Bids</p>
            <div className="flex items-center gap-1 text-lg font-semibold text-blue-600">
              <Gavel className="w-4 h-4" />
              {listing.bidCount || listing._count?.bids || 0}
            </div>
          </div>
        </div>

        {/* Time Remaining */}
        {isActive && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="font-medium">
              {formatTimeRemaining(timeRemaining)} remaining
            </span>
          </div>
        )}

        {/* Starting Soon */}
        {listing.status === 'UPCOMING' && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">
              Starts {(() => {
                const d = new Date(listing.startTime);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                return `${day}-${month}-${year}`;
              })()}
            </span>
          </div>
        )}

        {/* Ended */}
        {!isActive && listing.status === 'ENDED' && (
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 text-center font-medium">
            Auction Ended
          </div>
        )}
      </div>
    </Link>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Clock, 
  Gavel, 
  Eye, 
  TrendingUp, 
  Zap,
  Trophy,
  User,
  AlertCircle
} from 'lucide-react'

/**
 * @typedef {Object} Listing
 * @property {string} id - Unique listing identifier
 * @property {string} title - Listing title
 * @property {string | string[]} images - Image URLs (JSON or array)
 * @property {number} currentBid - Current highest bid
 * @property {number} startingPrice - Starting bid price
 * @property {number} bidCount - Total number of bids
 * @property {string} status - Listing status (LIVE, UPCOMING, ENDED, SOLD, UNSOLD)
 * @property {Date | string} endTime - Auction end time
 * @property {Date | string} startTime - Auction start time
 * @property {number} viewCount - Number of views
 * @property {string} category - Item category
 * @property {Object} [seller] - Seller information
 * @property {string} [winnerId] - Winner user ID (if sold)
 * @property {Object} [_count] - Prisma count aggregation
 */

/**
 * @typedef {Object} AuctionCardProps
 * @property {Listing} listing - Auction listing data
 * @property {'grid' | 'list'} [variant='grid'] - Display variant
 * @property {boolean} [showSeller=true] - Show seller information
 * @property {boolean} [loading=false] - Show loading skeleton
 */

/**
 * AuctionCard Component
 * A reusable card component for displaying auction listings in grid or list format
 * 
 * @param {AuctionCardProps} props
 */
export default function AuctionCard({ 
  listing, 
  variant = 'grid',
  showSeller = true,
  loading = false 
}) {
  const router = useRouter()
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [isHovered, setIsHovered] = useState(false)

  // Parse images
  const images = typeof listing?.images === 'string' 
    ? JSON.parse(listing.images) 
    : listing?.images || []
  const mainImage = images[0] || '/placeholder-auction.jpg'

  // Calculate time remaining
  useEffect(() => {
    if (!listing?.endTime) return

    const calculateTime = () => {
      const now = new Date().getTime()
      const end = new Date(listing.endTime).getTime()
      const diff = end - now

      if (diff <= 0) {
        setTimeRemaining({ expired: true })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining({ days, hours, minutes, seconds, diff })
    }

    calculateTime()
    const interval = setInterval(calculateTime, 1000)

    return () => clearInterval(interval)
  }, [listing?.endTime])

  // Format time remaining
  const formatTimeRemaining = () => {
    if (!timeRemaining || timeRemaining.expired) return 'Ended'
    
    const { days, hours, minutes } = timeRemaining
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  // Determine status and urgency
  const getStatus = () => {
    if (!listing) return { label: 'Unknown', color: 'gray', urgent: false }

    const now = new Date()
    const endTime = new Date(listing.endTime)
    const startTime = new Date(listing.startTime)
    const diff = endTime - now
    const oneHour = 60 * 60 * 1000

    if (listing.status === 'SOLD') {
      return { label: 'Sold', color: 'purple', urgent: false, icon: Trophy }
    }

    if (listing.status === 'UNSOLD') {
      return { label: 'Unsold', color: 'orange', urgent: false }
    }

    if (listing.status === 'ENDED' || diff <= 0) {
      return { label: 'Ended', color: 'gray', urgent: false }
    }

    if (listing.status === 'UPCOMING' || startTime > now) {
      return { label: 'Upcoming', color: 'blue', urgent: false }
    }

    if (diff <= oneHour && diff > 0) {
      return { label: 'Ending Soon', color: 'red', urgent: true, icon: Zap }
    }

    return { label: 'Live', color: 'green', urgent: false }
  }

  const status = getStatus()

  // Handle bid action
  const handleBidClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/listings/${listing.id}?action=bid`)
  }

  // Handle quick view
  const handleQuickView = (e) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/listings/${listing.id}`)
  }

  if (loading) {
    return <SkeletonCard variant={variant} />
  }

  if (!listing) {
    return null
  }

  // Status color classes
  const statusColors = {
    green: 'bg-green-100 text-green-800 border-green-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
  }

  const isEnded = status.label === 'Ended' || status.label === 'Sold' || status.label === 'Unsold'

  // Grid variant (default)
  if (variant === 'grid') {
    return (
      <Link 
        href={`/listings/${listing.id}`}
        className={`
          group bg-white rounded-xl shadow-md overflow-hidden 
          transition-all duration-300 transform
          ${isEnded ? 'opacity-75' : 'hover:shadow-2xl hover:-translate-y-2'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Section */}
        <div className="relative h-56 bg-gray-200 overflow-hidden">
          <img 
            src={mainImage} 
            alt={listing.title}
            className={`
              w-full h-full object-cover transition-transform duration-300
              ${isEnded ? 'grayscale' : 'group-hover:scale-110'}
            `}
          />
          
          {/* Overlay gradient on hover */}
          {!isEnded && isHovered && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300" />
          )}

          {/* Status Badge */}
          <div className={`
            absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold border-2
            ${statusColors[status.color]} backdrop-blur-sm
            ${status.urgent ? 'animate-pulse' : ''}
          `}>
            <div className="flex items-center gap-1.5">
              {status.icon && <status.icon className="w-3.5 h-3.5" />}
              {status.label}
            </div>
          </div>

          {/* View Count */}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            {listing.viewCount || 0}
          </div>

          {/* Winner Badge (if sold) */}
          {listing.status === 'SOLD' && (
            <div className="absolute bottom-3 left-3 right-3 bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Auction Won
            </div>
          )}

          {/* Action Buttons on Hover */}
          {!isEnded && isHovered && (
            <div className="absolute bottom-3 left-3 right-3 flex gap-2 animate-fade-in">
              <button
                onClick={handleQuickView}
                className="flex-1 bg-white hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Quick View
              </button>
              <button
                onClick={handleBidClick}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Gavel className="w-4 h-4" />
                Place Bid
              </button>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5">
          {/* Category */}
          <div className="text-xs text-blue-600 font-bold mb-2 uppercase tracking-wider">
            {listing.category}
          </div>

          {/* Title */}
          <h3 className={`
            text-lg font-bold mb-3 line-clamp-2 min-h-[3.5rem]
            ${isEnded ? 'text-gray-600' : 'text-gray-900 group-hover:text-blue-600'}
            transition-colors
          `}>
            {listing.title}
          </h3>

          {/* Seller Info */}
          {showSeller && listing.seller && (
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
              {listing.seller.avatar ? (
                <img 
                  src={listing.seller.avatar} 
                  alt={listing.seller.fullName}
                  className="w-6 h-6 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="truncate font-medium">{listing.seller.username}</span>
              {listing.seller.isVendor && (
                <div className="flex items-center gap-1 text-blue-600">
                  <TrendingUp className="w-3 h-3" />
                </div>
              )}
            </div>
          )}

          {/* Price & Bid Section */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {listing.bidCount > 0 ? 'Current Bid' : 'Starting Price'}
              </p>
              <p className={`
                text-2xl font-bold
                ${isEnded ? 'text-gray-600' : 'text-gray-900'}
              `}>
                ${(listing.currentBid || listing.startingPrice)?.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Bids</p>
              <div className="flex items-center gap-1.5">
                <Gavel className="w-4 h-4 text-blue-600" />
                <span className="text-lg font-bold text-gray-900">
                  {listing.bidCount || listing._count?.bids || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Time Remaining */}
          {!isEnded && status.label !== 'Upcoming' && (
            <div className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
              ${status.urgent 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-gray-50 text-gray-700'
              }
            `}>
              <Clock className={`w-4 h-4 ${status.urgent ? 'animate-pulse' : ''}`} />
              <span>{formatTimeRemaining()} remaining</span>
            </div>
          )}

          {/* Upcoming */}
          {status.label === 'Upcoming' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <TrendingUp className="w-4 h-4" />
              <span>Starts {new Date(listing.startTime).toLocaleDateString()}</span>
            </div>
          )}

          {/* Ended */}
          {isEnded && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
              <AlertCircle className="w-4 h-4" />
              <span>
                {listing.status === 'SOLD' ? 'Auction Completed' : 'Auction Ended'}
              </span>
            </div>
          )}
        </div>
      </Link>
    )
  }

  // List variant
  return (
    <Link 
      href={`/listings/${listing.id}`}
      className={`
        group bg-white rounded-xl shadow-md overflow-hidden 
        transition-all duration-300
        ${isEnded ? 'opacity-75' : 'hover:shadow-xl'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image Section */}
        <div className="relative sm:w-72 h-56 sm:h-auto bg-gray-200 overflow-hidden flex-shrink-0">
          <img 
            src={mainImage} 
            alt={listing.title}
            className={`
              w-full h-full object-cover transition-transform duration-300
              ${isEnded ? 'grayscale' : 'group-hover:scale-105'}
            `}
          />
          
          {/* Status Badge */}
          <div className={`
            absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold border-2
            ${statusColors[status.color]} backdrop-blur-sm
            ${status.urgent ? 'animate-pulse' : ''}
          `}>
            <div className="flex items-center gap-1.5">
              {status.icon && <status.icon className="w-3.5 h-3.5" />}
              {status.label}
            </div>
          </div>

          {/* View Count */}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            {listing.viewCount || 0}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-6 flex flex-col justify-between">
          <div>
            {/* Category & Seller */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">
                {listing.category}
              </span>
              {showSeller && listing.seller && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {listing.seller.avatar ? (
                    <img 
                      src={listing.seller.avatar} 
                      alt={listing.seller.fullName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                  )}
                  <span className="font-medium">{listing.seller.username}</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className={`
              text-xl font-bold mb-2 line-clamp-2
              ${isEnded ? 'text-gray-600' : 'text-gray-900 group-hover:text-blue-600'}
              transition-colors
            `}>
              {listing.title}
            </h3>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            {/* Price */}
            <div>
              <p className="text-xs text-gray-500 mb-1">
                {listing.bidCount > 0 ? 'Current Bid' : 'Starting Price'}
              </p>
              <p className={`
                text-3xl font-bold
                ${isEnded ? 'text-gray-600' : 'text-gray-900'}
              `}>
                ${(listing.currentBid || listing.startingPrice)?.toFixed(2)}
              </p>
            </div>

            {/* Stats & Actions */}
            <div className="flex items-center gap-4">
              {/* Bid Count */}
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Bids</p>
                <div className="flex items-center gap-1">
                  <Gavel className="w-4 h-4 text-blue-600" />
                  <span className="text-lg font-bold text-gray-900">
                    {listing.bidCount || listing._count?.bids || 0}
                  </span>
                </div>
              </div>

              {/* Time */}
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Time</p>
                <span className={`text-sm font-bold ${status.urgent ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatTimeRemaining()}
                </span>
              </div>

              {/* Actions */}
              {!isEnded && (
                <div className="flex gap-2">
                  <button
                    onClick={handleQuickView}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={handleBidClick}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                  >
                    <Gavel className="w-4 h-4" />
                    Bid
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// Loading Skeleton Component
function SkeletonCard({ variant = 'grid' }) {
  if (variant === 'grid') {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
        <div className="h-56 bg-gray-300" />
        <div className="p-5">
          <div className="h-3 w-20 bg-gray-300 rounded mb-3" />
          <div className="h-5 bg-gray-300 rounded mb-2" />
          <div className="h-5 w-3/4 bg-gray-300 rounded mb-4" />
          <div className="flex justify-between mb-4">
            <div className="h-8 w-24 bg-gray-300 rounded" />
            <div className="h-8 w-16 bg-gray-300 rounded" />
          </div>
          <div className="h-10 bg-gray-300 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
      <div className="flex">
        <div className="w-72 h-48 bg-gray-300 flex-shrink-0" />
        <div className="flex-1 p-6">
          <div className="h-3 w-24 bg-gray-300 rounded mb-3" />
          <div className="h-6 bg-gray-300 rounded mb-2" />
          <div className="h-6 w-2/3 bg-gray-300 rounded mb-6" />
          <div className="flex justify-between">
            <div className="h-10 w-32 bg-gray-300 rounded" />
            <div className="h-10 w-48 bg-gray-300 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

// CSS for fade-in animation (add to globals.css)
const styles = `
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
`

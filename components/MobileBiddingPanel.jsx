'use client'
import { useState } from 'react'
import { Gavel, TrendingUp, X } from 'lucide-react'

/**
 * MobileBiddingPanel Component
 * Sticky bottom bidding panel for mobile devices
 * 
 * Props:
 * @param {Object} listing - Auction listing data
 * @param {Function} onPlaceBid - Callback for placing bid
 * @param {Boolean} isActive - Whether auction is active
 * @param {Boolean} disabled - Disable bidding
 */
export default function MobileBiddingPanel({ listing, onPlaceBid, isActive = true, disabled = false }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [bidAmount, setBidAmount] = useState('')

  const minimumBid = listing.currentBid > 0 
    ? (listing.currentBid + 1).toFixed(2)
    : listing.startingPrice.toFixed(2)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onPlaceBid && bidAmount) {
      onPlaceBid(parseFloat(bidAmount))
      setBidAmount('')
      setIsExpanded(false)
    }
  }

  // Calculate time remaining
  const getTimeRemaining = () => {
    const now = new Date()
    const end = new Date(listing.endTime)
    const diff = end - now
    
    if (diff <= 0) return 'Ended'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (!isActive) return null

  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Sticky Bottom Panel */}
      <div className={`
        fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50 lg:hidden
        transition-all duration-300 ease-in-out
        ${isExpanded ? 'translate-y-0' : ''}
      `}>
        {/* Collapsed View */}
        {!isExpanded && (
          <div 
            onClick={() => setIsExpanded(true)}
            className="px-4 py-3 flex items-center justify-between cursor-pointer active:bg-gray-50"
          >
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-0.5">Current Bid</div>
              <div className="text-xl font-bold text-gray-900">
                ${listing.currentBid > 0 ? listing.currentBid.toFixed(2) : listing.startingPrice.toFixed(2)}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-gray-500">Time Left</div>
                <div className="text-sm font-semibold text-gray-900">{getTimeRemaining()}</div>
              </div>
              
              <button 
                disabled={disabled}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg font-semibold shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Gavel size={18} />
                <span>Bid</span>
              </button>
            </div>
          </div>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <div className="px-4 py-4 max-h-[70vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Place Your Bid</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Current Bid Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm text-gray-600">Current Bid</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${listing.currentBid > 0 ? listing.currentBid.toFixed(2) : listing.startingPrice.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Time Remaining</div>
                  <div className="text-lg font-semibold text-green-600">{getTimeRemaining()}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Gavel size={16} />
                  <span>{listing.bids?.length || 0} bids</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp size={16} />
                  <span>Min: ${minimumBid}</span>
                </div>
              </div>
            </div>

            {/* Bid Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Bid Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-semibold">
                    $
                  </span>
                  <input
                    id="bidAmount"
                    type="number"
                    step="0.01"
                    min={minimumBid}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={minimumBid}
                    className="w-full pl-8 pr-4 py-4 text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                    required
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Minimum bid: ${minimumBid}
                </p>
              </div>

              {/* Quick Bid Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 25].map((increment) => (
                  <button
                    key={increment}
                    type="button"
                    onClick={() => setBidAmount((parseFloat(minimumBid) + increment).toFixed(2))}
                    className="py-2 px-3 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                  >
                    +${increment}
                  </button>
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={disabled || !bidAmount || parseFloat(bidAmount) < parseFloat(minimumBid)}
                className="w-full py-4 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-400 text-white rounded-lg font-bold text-lg shadow-lg disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Gavel size={20} />
                <span>Place Bid ${bidAmount || '0.00'}</span>
              </button>

              <p className="text-xs text-center text-gray-500">
                By placing a bid, you agree to the auction terms and conditions
              </p>
            </form>
          </div>
        )}
      </div>

      {/* Spacer to prevent content from being hidden */}
      <div className="h-20 lg:hidden" />
    </>
  )
}

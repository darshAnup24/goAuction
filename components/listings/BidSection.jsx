'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Gavel, TrendingUp, AlertCircle } from 'lucide-react'

export default function BidSection({ listing, onBidPlaced }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [bidAmount, setBidAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isActive = listing.status === 'LIVE' && new Date(listing.endTime) > new Date()
  const isOwner = session?.user?.id === listing.sellerId
  const minBidAmount = listing.currentBid + 1

  const handlePlaceBid = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!session) {
      router.push(`/login?callbackUrl=/listings/${listing.id}`)
      return
    }

    if (isOwner) {
      setError('You cannot bid on your own listing')
      return
    }

    const amount = parseFloat(bidAmount)

    if (isNaN(amount) || amount < minBidAmount) {
      setError(`Bid must be at least $${minBidAmount.toFixed(2)}`)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/bids/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id, amount }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place bid')
      }

      setSuccess('Bid placed successfully!')
      setBidAmount('')
      
      if (onBidPlaced) {
        onBidPlaced(data.bid)
      }

      // Refresh page after short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isActive) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-lg font-semibold text-gray-700">
          {listing.status === 'UPCOMING' ? 'Auction Not Started' : 'Auction Ended'}
        </p>
        {listing.status === 'UPCOMING' && (
          <p className="text-sm text-gray-600 mt-1">
            Starts {(() => {
              const d = new Date(listing.startTime);
              const day = String(d.getDate()).padStart(2, '0');
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const year = d.getFullYear();
              const hours = String(d.getHours()).padStart(2, '0');
              const minutes = String(d.getMinutes()).padStart(2, '0');
              return `${day}-${month}-${year} ${hours}:${minutes}`;
            })()}
          </p>
        )}
      </div>
    )
  }

  if (isOwner) {
    return (
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center gap-3 mb-2">
          <Gavel className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Your Listing</h3>
        </div>
        <p className="text-gray-700">
          You cannot bid on your own listing. Current bid: <span className="font-bold">${listing.currentBid.toFixed(2)}</span>
        </p>
        {listing.bidCount > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            {listing.bidCount} {listing.bidCount === 1 ? 'bid' : 'bids'} placed
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <Gavel className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Place Your Bid</h3>
          <p className="text-sm text-gray-600">
            Current bid: <span className="font-semibold">${listing.currentBid.toFixed(2)}</span>
          </p>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
          <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <form onSubmit={handlePlaceBid} className="space-y-4">
        {/* Bid Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Bid Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
              $
            </span>
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={minBidAmount.toFixed(2)}
              min={minBidAmount}
              step="0.01"
              required
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg font-semibold"
              disabled={loading}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Minimum bid: ${minBidAmount.toFixed(2)}
          </p>
        </div>

        {/* Quick Bid Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setBidAmount(minBidAmount.toFixed(2))}
            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            disabled={loading}
          >
            +$1
          </button>
          <button
            type="button"
            onClick={() => setBidAmount((minBidAmount + 5).toFixed(2))}
            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            disabled={loading}
          >
            +$5
          </button>
          <button
            type="button"
            onClick={() => setBidAmount((minBidAmount + 10).toFixed(2))}
            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
            disabled={loading}
          >
            +$10
          </button>
        </div>

        {/* Submit Button */}
        {session ? (
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Placing Bid...
              </span>
            ) : (
              'Place Bid'
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push(`/login?callbackUrl=/listings/${listing.id}`)}
            className="w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors"
          >
            Login to Bid
          </button>
        )}
      </form>

      {/* Bid Info */}
      <div className="mt-4 pt-4 border-t space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Total Bids:</span>
          <span className="font-semibold">{listing.bidCount || 0}</span>
        </div>
        <div className="flex justify-between">
          <span>Starting Price:</span>
          <span className="font-semibold">${listing.startingPrice.toFixed(2)}</span>
        </div>
        {listing.reservePrice && (
          <div className="flex justify-between">
            <span>Reserve Price:</span>
            <span className="font-semibold">${listing.reservePrice.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

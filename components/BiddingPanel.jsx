'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useListingRoom } from '@/components/SocketProvider'
import { 
  Gavel, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  User,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trophy,
  Zap,
  Wifi,
  WifiOff
} from 'lucide-react'

/**
 * BiddingPanel Component
 * Displays current bid information and handles bid placement for auction listings
 * 
 * @param {Object} props
 * @param {string} props.listingId - ID of the auction listing
 * @param {number} props.currentBid - Current highest bid amount
 * @param {number} props.startingPrice - Starting price of the auction
 * @param {number} props.bidCount - Total number of bids
 * @param {string} props.status - Auction status (LIVE, ENDED, etc.)
 * @param {Date|string} props.endTime - Auction end time
 * @param {string} props.sellerId - ID of the seller
 * @param {Array} props.initialBids - Initial bid history (last 10 bids)
 * @param {Function} props.onBidPlaced - Callback after successful bid placement
 */
export default function BiddingPanel({
  listingId,
  currentBid: initialCurrentBid,
  startingPrice,
  bidCount: initialBidCount,
  status,
  endTime,
  sellerId,
  initialBids = [],
  onBidPlaced,
}) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const { socket, isConnected, isJoined } = useListingRoom(listingId)

  // State management
  const [bidAmount, setBidAmount] = useState(0)
  const [currentBid, setCurrentBid] = useState(initialCurrentBid || startingPrice)
  const [bidCount, setBidCount] = useState(initialBidCount || 0)
  const [bids, setBids] = useState(initialBids)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [isLoadingBids, setIsLoadingBids] = useState(false)

  const userId = session?.user?.id
  const isAuthenticated = sessionStatus === 'authenticated'
  const isLoading = sessionStatus === 'loading'
  const isSeller = userId === sellerId
  const isAuctionEnded = status === 'ENDED' || status === 'SOLD' || status === 'UNSOLD' || new Date(endTime) <= new Date()

  // Calculate minimum bid
  const minimumBid = currentBid + 1.00
  const isUserHighestBidder = bids.length > 0 && bids[0]?.bidder?.id === userId

  // Initialize bid amount to minimum
  useEffect(() => {
    setBidAmount(Number(minimumBid.toFixed(2)))
  }, [minimumBid])

  // Fetch latest bids
  const fetchBids = useCallback(async () => {
    if (!listingId) return

    try {
      setIsLoadingBids(true)
      const response = await fetch(`/api/bids/listing/${listingId}?limit=10`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch bids')
      }

      const data = await response.json()
      if (data.success) {
        setBids(data.bids || [])
        setCurrentBid(data.listing?.currentBid || startingPrice)
        setBidCount(data.listing?.bidCount || 0)
      }
    } catch (err) {
      console.error('Error fetching bids:', err)
    } finally {
      setIsLoadingBids(false)
    }
  }, [listingId, startingPrice])

  // Listen for real-time bid updates via Socket.IO
  useEffect(() => {
    if (!socket || !isJoined || isAuctionEnded) return

    // Handle new bid from other users
    const handleNewBid = (data) => {
      console.log('🔔 New bid received via Socket.IO:', data)
      
      const { bid, listing } = data

      // Update state with new bid
      setBids((prevBids) => [bid, ...prevBids.slice(0, 9)])
      setCurrentBid(listing.currentBid)
      setBidCount(listing.bidCount)

      // Show toast notification if not current user's bid
      if (bid.bidder.id !== userId) {
        toast.success(
          `New bid of $${bid.amount.toFixed(2)} by ${bid.bidder.username}!`,
          { duration: 3000, icon: '💰' }
        )
      }
    }

    // Handle auction ending soon alert
    const handleEndingSoon = (data) => {
      console.log('⏰ Auction ending soon:', data)
      toast.error(data.message, { duration: 5000, icon: '⏰' })
    }

    // Handle auction ended
    const handleAuctionEnded = (data) => {
      console.log('🏁 Auction ended:', data)
      
      const isWinner = data.winnerId === userId
      const message = isWinner 
        ? '🎉 Congratulations! You won the auction!' 
        : '🏁 Auction has ended'
      
      toast(message, { 
        duration: 5000, 
        icon: isWinner ? '🏆' : '🏁',
        style: isWinner ? { background: '#10b981', color: 'white' } : {}
      })

      // Fetch final bid state
      fetchBids()
    }

    // Subscribe to events
    socket.on('bid:new', handleNewBid)
    socket.on('auction:ending-soon', handleEndingSoon)
    socket.on('auction:ended', handleAuctionEnded)

    // Cleanup
    return () => {
      socket.off('bid:new', handleNewBid)
      socket.off('auction:ending-soon', handleEndingSoon)
      socket.off('auction:ended', handleAuctionEnded)
    }
  }, [socket, isJoined, isAuctionEnded, userId, fetchBids])

  // Auto-refresh bids every 30 seconds as backup (reduced from 10s since we have Socket.IO)
  useEffect(() => {
    if (isAuctionEnded) return

    // Initial fetch
    fetchBids()

    // Fallback polling if Socket.IO disconnects
    const interval = setInterval(() => {
      if (!isConnected) {
        console.log('📡 Socket disconnected, using HTTP polling...')
        fetchBids()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [fetchBids, isAuctionEnded, isConnected])

  // Handle quick increment buttons
  const handleQuickIncrement = (amount) => {
    setBidAmount((prev) => Number((prev + amount).toFixed(2)))
    setError(null)
  }

  // Handle bid amount input change
  const handleBidAmountChange = (e) => {
    const value = parseFloat(e.target.value) || 0
    setBidAmount(Number(value.toFixed(2)))
    setError(null)
  }

  // Place bid with optimistic update
  const handlePlaceBid = async () => {
    // Validation
    if (!isAuthenticated) {
      toast.error('Please sign in to place a bid')
      router.push('/api/auth/signin')
      return
    }

    if (isSeller) {
      toast.error('You cannot bid on your own listing')
      return
    }

    if (isAuctionEnded) {
      toast.error('This auction has ended')
      return
    }

    if (bidAmount < minimumBid) {
      const errorMsg = `Bid must be at least $${minimumBid.toFixed(2)}`
      setError(errorMsg)
      toast.error(errorMsg)
      return
    }

    setIsSubmitting(true)
    setError(null)

    // Optimistic update
    const optimisticBid = {
      id: `temp-${Date.now()}`,
      amount: bidAmount,
      status: 'WINNING',
      createdAt: new Date().toISOString(),
      bidder: {
        id: userId,
        username: session.user.username || session.user.email?.split('@')[0] || 'You',
        fullName: session.user.name || session.user.username || 'You',
        avatar: session.user.image || session.user.avatar,
      },
      isOptimistic: true,
    }

    // Update UI optimistically
    const previousBids = [...bids]
    const previousCurrentBid = currentBid
    const previousBidCount = bidCount

    setBids([optimisticBid, ...bids.slice(0, 9)])
    setCurrentBid(bidAmount)
    setBidCount(bidCount + 1)

    // Show loading toast
    const toastId = toast.loading('Placing your bid...')

    try {
      const response = await fetch('/api/bids/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          amount: bidAmount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place bid')
      }

      // Replace optimistic bid with real bid
      setBids([data.bid, ...previousBids])
      setCurrentBid(data.listing.currentBid)
      setBidCount(data.listing.bidCount)

      // Emit socket event to notify other users (if connected)
      if (socket && isConnected) {
        socket.emit('bid:placed', {
          listingId,
          bid: data.bid,
          listing: data.listing,
          previousHighestBid: data.previousHighestBid,
        })
      }

      // Success notification
      toast.success('Bid placed successfully! 🎉', { id: toastId })

      // Reset bid amount to new minimum
      const newMinimum = data.listing.currentBid + 1.00
      setBidAmount(Number(newMinimum.toFixed(2)))

      // Call callback if provided
      if (onBidPlaced) {
        onBidPlaced(data)
      }

    } catch (err) {
      console.error('Bid placement error:', err)

      // Revert optimistic update
      setBids(previousBids)
      setCurrentBid(previousCurrentBid)
      setBidCount(previousBidCount)

      // Error notification
      const errorMessage = err.message || 'Failed to place bid. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage, { id: toastId })

      // If bid was too low, fetch latest bids
      if (err.message.includes('at least')) {
        fetchBids()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Format time ago
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header - Current Bid Status */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gavel className="w-6 h-6" />
            <h2 className="text-2xl font-bold">
              {isAuctionEnded ? 'Final Bid' : 'Current Bid'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Real-time connection indicator */}
            {!isAuctionEnded && (
              <div className="flex items-center gap-1.5" title={isConnected ? 'Connected to real-time updates' : 'Using HTTP polling'}>
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-300" />
                ) : (
                  <WifiOff className="w-4 h-4 text-yellow-300" />
                )}
                <span className="text-xs opacity-75">
                  {isConnected ? 'Live' : 'Polling'}
                </span>
              </div>
            )}
            {isUserHighestBidder && !isAuctionEnded && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Trophy className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-semibold">You're winning!</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold">{formatCurrency(currentBid)}</span>
          {!isAuctionEnded && (
            <span className="text-blue-100 text-sm">
              ({bidCount} {bidCount === 1 ? 'bid' : 'bids'})
            </span>
          )}
        </div>

        {!isAuctionEnded && (
          <p className="text-blue-100 text-sm mt-2">
            Minimum next bid: <span className="font-semibold text-white">{formatCurrency(minimumBid)}</span>
          </p>
        )}

        {isAuctionEnded && (
          <div className="mt-4 flex items-center gap-2 text-yellow-300">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">Auction has ended</span>
          </div>
        )}
      </div>

      {/* Bidding Form */}
      {!isAuctionEnded && (
        <div className="p-6 border-b border-gray-200">
          {isSeller ? (
            <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <p className="text-sm text-orange-800">
                You cannot bid on your own listing
              </p>
            </div>
          ) : !isAuthenticated ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  Please sign in to place a bid
                </p>
              </div>
              <button
                onClick={() => router.push('/api/auth/signin')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <User className="w-5 h-5" />
                Sign In to Bid
              </button>
            </div>
          ) : isUserHighestBidder ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">
                  You have the highest bid!
                </p>
                <p className="text-xs text-green-600 mt-1">
                  You'll be notified if you're outbid
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Bid Amount Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Bid Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={handleBidAmountChange}
                    min={minimumBid}
                    step="0.01"
                    disabled={isSubmitting}
                    className={`
                      w-full pl-12 pr-4 py-3 text-xl font-bold border-2 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      disabled:bg-gray-100 disabled:cursor-not-allowed
                      ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                    `}
                    placeholder={minimumBid.toFixed(2)}
                  />
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </p>
                )}
              </div>

              {/* Quick Increment Buttons */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Quick Add:</p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 5, 10, 50].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickIncrement(amount)}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      <span className="text-xs">+</span>${amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Place Bid Button */}
              <button
                onClick={handlePlaceBid}
                disabled={isSubmitting || bidAmount < minimumBid}
                className={`
                  w-full py-4 rounded-lg font-bold text-lg transition-all transform
                  flex items-center justify-center gap-3
                  ${
                    isSubmitting || bidAmount < minimumBid
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
                  }
                `}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Placing Bid...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    Place Bid {formatCurrency(bidAmount)}
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                By placing a bid, you agree to purchase this item if you win
              </p>
            </div>
          )}
        </div>
      )}

      {/* Bid History */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Bid History
          </h3>
          {!isLoadingBids && !isAuctionEnded && (
            <button
              onClick={fetchBids}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <Clock className="w-4 h-4" />
              Refresh
            </button>
          )}
        </div>

        {isLoadingBids && bids.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : bids.length === 0 ? (
          <div className="text-center py-8">
            <Gavel className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No bids yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to bid!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {bids.map((bid, index) => (
              <div
                key={bid.id}
                className={`
                  flex items-center justify-between p-4 rounded-lg border-2 transition-all
                  ${
                    bid.isOptimistic
                      ? 'bg-blue-50 border-blue-200 animate-pulse'
                      : index === 0 && bid.status === 'WINNING'
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                      : 'bg-gray-50 border-gray-200'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {bid.bidder?.avatar ? (
                    <img
                      src={bid.bidder.avatar}
                      alt={bid.bidder.username}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm">
                      {bid.bidder?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      {bid.bidder?.username || 'Anonymous'}
                      {bid.bidder?.id === userId && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                          You
                        </span>
                      )}
                      {index === 0 && bid.status === 'WINNING' && (
                        <Trophy className="w-4 h-4 text-yellow-500" />
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {bid.isOptimistic ? 'Placing bid...' : formatTimeAgo(bid.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(bid.amount)}
                  </p>
                  {index === 0 && bid.status === 'WINNING' && (
                    <p className="text-xs text-green-600 font-semibold">Highest</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {bids.length >= 10 && (
          <button
            onClick={() => router.push(`/listings/${listingId}#all-bids`)}
            className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-semibold border-2 border-blue-200 hover:border-blue-300 rounded-lg transition-colors"
          >
            View All Bids
          </button>
        )}
      </div>
    </div>
  )
}

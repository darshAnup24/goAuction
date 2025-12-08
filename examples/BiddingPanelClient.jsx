// BiddingPanelClient.jsx
// Client component wrapper for BiddingPanel (use this in Server Components)

'use client'

import { useState } from 'react'
import BiddingPanel from '@/components/BiddingPanel'

export default function BiddingPanelClient({ 
  listingId,
  currentBid,
  startingPrice,
  bidCount,
  status,
  endTime,
  sellerId,
  initialBids 
}) {
  const [listing, setListing] = useState({
    currentBid,
    bidCount,
  })

  const handleBidPlaced = (data) => {
    // Update local state
    setListing({
      currentBid: data.listing.currentBid,
      bidCount: data.listing.bidCount,
    })

    // Optional: Trigger page refresh or update other components
    console.log('Bid placed successfully:', data.bid)

    // Optional: Track analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'place_bid', {
        listing_id: listingId,
        bid_amount: data.bid.amount,
      })
    }
  }

  return (
    <BiddingPanel
      listingId={listingId}
      currentBid={listing.currentBid}
      startingPrice={startingPrice}
      bidCount={listing.bidCount}
      status={status}
      endTime={endTime}
      sellerId={sellerId}
      initialBids={initialBids}
      onBidPlaced={handleBidPlaced}
    />
  )
}

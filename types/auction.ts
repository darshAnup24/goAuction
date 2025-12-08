/**
 * Type definitions for Auction Listings
 */

export type ListingStatus = 'LIVE' | 'UPCOMING' | 'ENDED' | 'SOLD' | 'UNSOLD'

export type ListingCategory = 
  | 'Electronics' 
  | 'Fashion' 
  | 'Home & Garden' 
  | 'Sports' 
  | 'Collectibles' 
  | 'Art' 
  | 'Books' 
  | 'Toys' 
  | 'Other'

export interface Seller {
  id: string
  username: string
  fullName: string
  email: string
  avatar?: string | null
  isVendor: boolean
  createdAt: Date | string
}

export interface Bid {
  id: string
  amount: number
  userId: string
  listingId: string
  createdAt: Date | string
  user?: {
    username: string
    avatar?: string | null
  }
}

export interface Listing {
  id: string
  title: string
  description: string
  images: string | string[] // Can be JSON string or parsed array
  category: ListingCategory
  startingPrice: number
  currentBid: number
  bidCount: number
  viewCount: number
  status: ListingStatus
  startTime: Date | string
  endTime: Date | string
  sellerId: string
  winnerId?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  
  // Relations (optional, included with Prisma queries)
  seller?: Seller
  bids?: Bid[]
  winner?: {
    id: string
    username: string
    avatar?: string | null
  }
  
  // Prisma aggregations
  _count?: {
    bids: number
  }
}

export interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  diff: number // milliseconds remaining
  expired?: boolean
}

export interface StatusInfo {
  label: string
  color: 'green' | 'blue' | 'red' | 'gray' | 'purple' | 'orange'
  urgent: boolean
  icon?: React.ComponentType<{ className?: string }>
}

export type AuctionCardVariant = 'grid' | 'list'

export interface AuctionCardProps {
  listing: Listing
  variant?: AuctionCardVariant
  showSeller?: boolean
  loading?: boolean
}

/**
 * API Response types
 */
export interface ListingsResponse {
  listings: Listing[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters?: {
    status?: ListingStatus
    category?: ListingCategory
    minPrice?: number
    maxPrice?: number
    search?: string
  }
}

export interface ListingDetailResponse {
  listing: Listing
  relatedListings?: Listing[]
}

export interface CreateListingInput {
  title: string
  description: string
  images: string[] // URLs or base64
  category: ListingCategory
  startingPrice: number
  startTime: Date | string
  endTime: Date | string
}

export interface UpdateListingInput extends Partial<CreateListingInput> {
  status?: ListingStatus
}

export interface PlaceBidInput {
  amount: number
}

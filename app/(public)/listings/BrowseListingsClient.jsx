'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ListingCard from '@/components/listings/ListingCard'
import FilterSidebar from '@/components/listings/FilterSidebar'
import { Loader2, Package } from 'lucide-react'

const sortOptions = [
  { value: 'newest', label: 'Newly Listed' },
  { value: 'ending-soon', label: 'Ending Soon' },
  { value: 'most-bids', label: 'Most Bids' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
]

export default function BrowseListingsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest')
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
  })

  useEffect(() => {
    fetchListings(1)
  }, [filters, sortBy])

  const fetchListings = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sortBy,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.category && { category: filters.category }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
      })

      const response = await fetch(`/api/listings?${params}`)
      const data = await response.json()

      if (response.ok) {
        setListings(data.listings)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handleSortChange = (newSort) => {
    setSortBy(newSort)
  }

  const handleLoadMore = () => {
    if (pagination.hasMore) {
      fetchListings(pagination.page + 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Auctions</h1>
          <p className="text-gray-600">
            {pagination.total ? `${pagination.total} auctions found` : 'Loading...'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <FilterSidebar 
              onFilterChange={handleFilterChange}
              initialFilters={filters}
            />
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Sort Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {loading ? 'Loading...' : `Showing ${listings.length} of ${pagination.total || 0} auctions`}
              </span>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Listings Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
              </div>
            ) : listings.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>

                {/* Load More Button */}
                {pagination.hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={handleLoadMore}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Load More Auctions
                    </button>
                    <p className="text-sm text-gray-600 mt-2">
                      Page {pagination.page} of {pagination.totalPages}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No auctions found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your filters or search terms
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

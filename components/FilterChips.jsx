'use client'
import { X } from 'lucide-react'

const FilterChips = ({ filters, onRemoveFilter, onClearAll }) => {
  const activeFilters = []

  // Build array of active filters
  if (filters.search) {
    activeFilters.push({
      key: 'search',
      label: `Search: "${filters.search}"`,
      value: filters.search,
    })
  }

  if (filters.category && filters.category !== 'all') {
    activeFilters.push({
      key: 'category',
      label: `Category: ${filters.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
      value: filters.category,
    })
  }

  if (filters.status && filters.status !== 'all') {
    activeFilters.push({
      key: 'status',
      label: `Status: ${filters.status.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
      value: filters.status,
    })
  }

  if (filters.timeRemaining && filters.timeRemaining !== 'any') {
    const timeLabels = {
      hour: '< 1 Hour',
      day: '< 24 Hours',
      week: '< 7 Days',
    }
    activeFilters.push({
      key: 'timeRemaining',
      label: `Time: ${timeLabels[filters.timeRemaining]}`,
      value: filters.timeRemaining,
    })
  }

  if (filters.minPrice && filters.minPrice > 0) {
    activeFilters.push({
      key: 'minPrice',
      label: `Min: $${filters.minPrice}`,
      value: filters.minPrice,
    })
  }

  if (filters.maxPrice && filters.maxPrice < 999999999) {
    activeFilters.push({
      key: 'maxPrice',
      label: `Max: $${filters.maxPrice}`,
      value: filters.maxPrice,
    })
  }

  if (filters.sortBy && filters.sortBy !== 'newly-listed') {
    const sortLabels = {
      'ending-soonest': 'Ending Soonest',
      'newly-listed': 'Newly Listed',
      'price-low-high': 'Price: Low to High',
      'price-high-low': 'Price: High to Low',
      'most-bids': 'Most Bids',
    }
    activeFilters.push({
      key: 'sortBy',
      label: `Sort: ${sortLabels[filters.sortBy]}`,
      value: filters.sortBy,
    })
  }

  // Don't render if no active filters
  if (activeFilters.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-sm font-medium text-slate-600">Active Filters:</span>
      
      {activeFilters.map((filter) => (
        <div
          key={filter.key}
          className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm"
        >
          <span>{filter.label}</span>
          <button
            onClick={() => onRemoveFilter(filter.key)}
            className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X size={14} />
          </button>
        </div>
      ))}

      {activeFilters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-slate-600 hover:text-slate-800 underline ml-2"
        >
          Clear all
        </button>
      )}
    </div>
  )
}

export default FilterChips

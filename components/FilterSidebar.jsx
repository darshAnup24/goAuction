'use client'
import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'

const FilterSidebar = ({ filters, onFilterChange, isOpen, onClose }) => {
  const [localFilters, setLocalFilters] = useState({
    search: '',
    category: 'all',
    minPrice: '',
    maxPrice: '',
    status: 'all',
    timeRemaining: 'any',
    sortBy: 'newly-listed',
  })

  // Sync with parent filters
  useEffect(() => {
    setLocalFilters(prev => ({
      ...prev,
      ...filters,
      minPrice: filters.minPrice || '',
      maxPrice: filters.maxPrice || '',
    }))
  }, [filters])

  const categories = [
    'All',
    'Electronics',
    'Clothing',
    'Home & Kitchen',
    'Beauty & Health',
    'Toys & Games',
    'Sports & Outdoors',
    'Books & Media',
    'Food & Drink',
    'Hobbies & Crafts',
    'Others'
  ]

  const statusOptions = [
    { value: 'all', label: 'All Auctions' },
    { value: 'live', label: 'Live' },
    { value: 'ending-soon', label: 'Ending Soon' },
    { value: 'upcoming', label: 'Upcoming' },
  ]

  const timeRemainingOptions = [
    { value: 'any', label: 'Any Time' },
    { value: 'hour', label: '< 1 Hour' },
    { value: 'day', label: '< 24 Hours' },
    { value: 'week', label: '< 7 Days' },
  ]

  const sortOptions = [
    { value: 'ending-soonest', label: 'Ending Soonest' },
    { value: 'newly-listed', label: 'Newly Listed' },
    { value: 'price-low-high', label: 'Price: Low to High' },
    { value: 'price-high-low', label: 'Price: High to Low' },
    { value: 'most-bids', label: 'Most Bids' },
  ]

  const handleInputChange = (field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleApplyFilters = () => {
    const filtersToApply = {
      ...localFilters,
      minPrice: localFilters.minPrice ? parseFloat(localFilters.minPrice) : undefined,
      maxPrice: localFilters.maxPrice ? parseFloat(localFilters.maxPrice) : undefined,
    }
    onFilterChange(filtersToApply)
    if (onClose) onClose() // Close on mobile after applying
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    handleApplyFilters()
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:sticky top-0 left-0 h-screen lg:h-auto
          w-80 lg:w-72 bg-white 
          shadow-xl lg:shadow-none rounded-r-2xl lg:rounded-xl
          z-50 lg:z-0
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          overflow-y-auto p-6
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="text-green-500" size={20} />
            <h2 className="text-lg font-semibold text-slate-800">Filters</h2>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-500 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              value={localFilters.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
              placeholder="Search auctions..."
              className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
            />
            <Search className="absolute right-3 top-2.5 text-slate-400" size={18} />
          </div>
        </form>

        {/* Category */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Category
          </label>
          <select
            value={localFilters.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat.toLowerCase().replace(' & ', '-').replace(' ', '-')}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Auction Status
          </label>
          <div className="space-y-2">
            {statusOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={localFilters.status === option.value}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-4 h-4 text-green-500 focus:ring-green-500"
                />
                <span className="text-sm text-slate-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Time Remaining */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Time Remaining
          </label>
          <select
            value={localFilters.timeRemaining}
            onChange={(e) => handleInputChange('timeRemaining', e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
          >
            {timeRemainingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Price Range (Current Bid)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={localFilters.minPrice}
              onChange={(e) => handleInputChange('minPrice', e.target.value)}
              placeholder="Min"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
            />
            <span className="text-slate-500">-</span>
            <input
              type="number"
              value={localFilters.maxPrice}
              onChange={(e) => handleInputChange('maxPrice', e.target.value)}
              placeholder="Max"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
            />
          </div>
        </div>

        {/* Sort By */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Sort By
          </label>
          <select
            value={localFilters.sortBy}
            onChange={(e) => handleInputChange('sortBy', e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApplyFilters}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 rounded-lg transition-colors duration-200"
        >
          Apply Filters
        </button>
      </div>
    </>
  )
}

export default FilterSidebar

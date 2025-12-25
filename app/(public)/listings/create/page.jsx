'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Upload, 
  X, 
  Loader2,
  Calendar,
  DollarSign,
  FileText,
  Image as ImageIcon
} from 'lucide-react'

const steps = [
  { id: 1, name: 'Details', icon: FileText },
  { id: 2, name: 'Pricing', icon: DollarSign },
  { id: 3, name: 'Timing', icon: Calendar },
  { id: 4, name: 'Images', icon: ImageIcon },
]

const categories = [
  'ELECTRONICS',
  'FASHION',
  'ART',
  'COLLECTIBLES',
  'MUSIC',
  'SPORTS',
  'HOME',
  'AUTOMOTIVE',
  'OTHER'
]

export default function CreateListingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [startOption, setStartOption] = useState('now') // 'now' or 'custom'
  const [durationOption, setDurationOption] = useState('3') // '2', '3', '7', or 'custom'
  const [customStartDate, setCustomStartDate] = useState('')
  const [customStartTime, setCustomStartTime] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [customEndTime, setCustomEndTime] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    trigger,
    setValue,
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: 'ELECTRONICS',
      startingPrice: '',
      reservePrice: '',
      startTime: '',
      endTime: '',
    }
  })

  // Get user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Helper function to format date to DD-MM-YYYY (using LOCAL time, not UTC)
  const formatDateToDDMMYYYY = (date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  // Helper function to format time to HH:MM (using LOCAL time, not UTC)
  const formatTimeToHHMM = (date) => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  // Helper function to convert local datetime to datetime-local format for storage
  // This keeps the time in LOCAL format (YYYY-MM-DDTHH:MM) without converting to UTC
  const localDateTimeToISO = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return ''
    const parts = dateStr.split('-')
    if (parts.length !== 3) return ''
    const [day, month, year] = parts
    const timeParts = timeStr.split(':')
    if (timeParts.length < 2) return ''
    const [hours, minutes] = timeParts
    // Return in datetime-local format (YYYY-MM-DDTHH:MM) - NO UTC conversion
    // This format is parsed by Date constructor as LOCAL time
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  // Helper function to format a Date object to datetime-local format (YYYY-MM-DDTHH:MM)
  // Uses LOCAL time, not UTC
  const formatDateToLocalISO = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Helper function to calculate duration between two dates
  const calculateDuration = (start, end) => {
    if (!start || !end) return ''
    const startDate = new Date(start)
    const endDate = new Date(end)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return ''
    
    const diffMs = endDate - startDate
    if (diffMs <= 0) return '0 minutes'
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays > 0) {
      const remainingHours = diffHours % 24
      return remainingHours > 0 ? `${diffDays} days ${remainingHours} hours` : `${diffDays} days`
    }
    if (diffHours > 0) {
      const remainingMinutes = diffMinutes % 60
      return remainingMinutes > 0 ? `${diffHours} hours ${remainingMinutes} minutes` : `${diffHours} hours`
    }
    return `${diffMinutes} minutes`
  }

  // Initialize with current LOCAL date/time ONCE on page load
  useEffect(() => {
    // Get current LOCAL time (not UTC)
    const now = new Date()
    
    // Debug: Log timezone information
    console.log('User Timezone:', userTimezone)
    console.log('Current Local Time:', now.toString())
    console.log('Local Date:', formatDateToDDMMYYYY(now))
    console.log('Local Time:', formatTimeToHHMM(now))
    
    const startDateStr = formatDateToDDMMYYYY(now)
    const startTimeStr = formatTimeToHHMM(now)
    
    setCustomStartDate(startDateStr)
    setCustomStartTime(startTimeStr)
    
    // Set default start time using LOCAL time
    setValue('startTime', localDateTimeToISO(startDateStr, startTimeStr))
    
    // Set default end time to 3 days from now at same LOCAL time
    const endDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const endDateStr = formatDateToDDMMYYYY(endDate)
    const endTimeStr = formatTimeToHHMM(endDate)
    
    setCustomEndDate(endDateStr)
    setCustomEndTime(endTimeStr)
    setValue('endTime', localDateTimeToISO(endDateStr, endTimeStr))
  }, [])

  // Redirect if not authenticated or not a vendor
  if (status === 'loading') {
    return <LoadingScreen />
  }

  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/listings/create')
    return null
  }

  const handleNext = async () => {
    let fieldsToValidate = []
    
    if (currentStep === 1) {
      fieldsToValidate = ['title', 'description', 'category']
    } else if (currentStep === 2) {
      fieldsToValidate = ['startingPrice']
    } else if (currentStep === 3) {
      // Auto-set times if not already set
      const startTimeValue = watch('startTime')
      const endTimeValue = watch('endTime')
      
      if (!startTimeValue) {
        const now = new Date()
        setValue('startTime', formatDateToLocalISO(now))
      }
      
      if (!endTimeValue && durationOption !== 'custom') {
        const startDate = startTimeValue ? new Date(startTimeValue) : new Date()
        const days = parseInt(durationOption || '3')
        const endDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000)
        setValue('endTime', formatDateToLocalISO(endDate))
      }
      
      fieldsToValidate = ['startTime', 'endTime']
    }

    const isValid = await trigger(fieldsToValidate)
    
    if (isValid) {
      if (currentStep === 4 && images.length === 0) {
        setError('Please upload at least one image')
        return
      }
      setCurrentStep((prev) => Math.min(prev + 1, 4))
      setError('')
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    setError('')
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (images.length + files.length > 10) {
      setError('Maximum 10 images allowed')
      return
    }

    setUploading(true)
    setError('')

    try {
      // Upload to Cloudinary
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('images', file)
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to upload images')
      }

      // Add the uploaded image URLs to state
      const newImageUrls = result.images.map(img => img.url)
      setImages([...images, ...newImageUrls])
    } catch (err) {
      setError(err.message || 'Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const onSubmit = async (data) => {
    if (images.length === 0) {
      setError('Please upload at least one image')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const listingData = {
        title: data.title,
        description: data.description,
        category: data.category,
        startingPrice: parseFloat(data.startingPrice),
        reservePrice: data.reservePrice ? parseFloat(data.reservePrice) : undefined,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
        images: images, // Use the actual Cloudinary URLs
      }

      const response = await fetch('/api/listings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create listing')
      }

      // Success! Redirect to the new listing
      router.push(`/listings/${result.listing.id}`)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Auction</h1>
          <p className="text-gray-600 mt-2">Fill in the details to list your item for auction</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isCompleted = currentStep > step.id
              const isCurrent = currentStep === step.id
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center font-semibold
                        ${isCompleted ? 'bg-green-500 text-white' : ''}
                        ${isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' : ''}
                        ${!isCompleted && !isCurrent ? 'bg-gray-200 text-gray-600' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>
                    <span className={`text-sm mt-2 font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-600'}`}>
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-1 flex-1 mx-4 rounded ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-lg shadow-md p-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                {error}
              </div>
            )}

            {/* Step 1: Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Listing Details</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    {...register('title', { 
                      required: 'Title is required',
                      minLength: { value: 3, message: 'Title must be at least 3 characters' },
                      maxLength: { value: 200, message: 'Title must be less than 200 characters' }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="e.g., Vintage Gibson Guitar 1965"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    {...register('category', { required: 'Category is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0) + cat.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    {...register('description', { 
                      required: 'Description is required',
                      minLength: { value: 10, message: 'Description must be at least 10 characters' },
                      maxLength: { value: 5000, message: 'Description must be less than 5000 characters' }
                    })}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    placeholder="Provide detailed information about your item..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-600">
                    {watch('description')?.length || 0} / 5000 characters
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Pricing */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Pricing</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Price * (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      {...register('startingPrice', { 
                        required: 'Starting price is required',
                        min: { value: 0.01, message: 'Price must be at least $0.01' },
                        validate: (value) => !isNaN(parseFloat(value)) || 'Invalid price'
                      })}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.startingPrice && (
                    <p className="mt-1 text-sm text-red-600">{errors.startingPrice.message}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-600">
                    The minimum bid amount for your auction
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reserve Price (Optional) (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      {...register('reservePrice', {
                        min: { value: 0.01, message: 'Reserve price must be positive' },
                        validate: (value) => {
                          if (!value) return true
                          const startPrice = parseFloat(watch('startingPrice'))
                          const resPrice = parseFloat(value)
                          return resPrice >= startPrice || 'Reserve must be >= starting price'
                        }
                      })}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.reservePrice && (
                    <p className="mt-1 text-sm text-red-600">{errors.reservePrice.message}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-600">
                    The minimum price you're willing to accept. The auction will not sell below this price.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Pricing Tips</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Set a competitive starting price to attract bidders</li>
                    <li>• Reserve price protects your minimum acceptable value</li>
                    <li>• Research similar items to price competitively</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 3: Timing */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Auction Timing</h2>
                
                {/* Start Time Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    When should your auction start? *
                  </label>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setStartOption('now')
                        // Get current LOCAL time
                        const now = new Date()
                        const startDateStr = formatDateToDDMMYYYY(now)
                        const startTimeStr = formatTimeToHHMM(now)
                        
                        setCustomStartDate(startDateStr)
                        setCustomStartTime(startTimeStr)
                        setValue('startTime', localDateTimeToISO(startDateStr, startTimeStr))
                        
                        // Auto-calculate end time based on duration using LOCAL time
                        if (durationOption !== 'custom') {
                          const days = parseInt(durationOption)
                          const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
                          const endDateStr = formatDateToDDMMYYYY(endDate)
                          const endTimeStr = formatTimeToHHMM(endDate)
                          setCustomEndDate(endDateStr)
                          setCustomEndTime(endTimeStr)
                          setValue('endTime', localDateTimeToISO(endDateStr, endTimeStr))
                        }
                      }}
                      className={`p-4 rounded-lg border-2 font-semibold transition-all ${
                        startOption === 'now'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="w-6 h-6" />
                        <span>Start Now</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStartOption('custom')}
                      className={`p-4 rounded-lg border-2 font-semibold transition-all ${
                        startOption === 'custom'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="w-6 h-6" />
                        <span>Schedule Later</span>
                      </div>
                    </button>
                  </div>

                  {startOption === 'custom' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Start Date & Time
                      </label>
                      <p className="text-xs text-gray-600 mb-2">
                        Format: DD-MM-YYYY HH:MM (e.g., 25-12-2025 14:30) • Your timezone: {userTimezone}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Date (DD-MM-YYYY)</label>
                          <input
                            type="text"
                            placeholder="08-12-2025"
                            value={customStartDate}
                            maxLength="10"
                            onChange={(e) => {
                              let value = e.target.value.replace(/[^0-9]/g, '');
                              if (value.length >= 2) value = value.slice(0, 2) + '-' + value.slice(2);
                              if (value.length >= 5) value = value.slice(0, 5) + '-' + value.slice(5, 9);
                              setCustomStartDate(value);
                              
                              // Convert DD-MM-YYYY to ISO format using LOCAL time
                              if (value.length === 10 && customStartTime) {
                                setValue('startTime', localDateTimeToISO(value, customStartTime));
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Time (HH:MM)</label>
                          <input
                            type="time"
                            value={customStartTime}
                            onChange={(e) => {
                              setCustomStartTime(e.target.value);
                              if (customStartDate && customStartDate.length === 10 && e.target.value) {
                                setValue('startTime', localDateTimeToISO(customStartDate, e.target.value));
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                          />
                        </div>
                      </div>
                      <input type="hidden" {...register('startTime', { required: 'Start time is required' })} />
                      {errors.startTime && (
                        <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Duration Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    How long should your auction run? *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {['2', '3', '7'].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => {
                          setDurationOption(days)
                          const startTimeValue = watch('startTime')
                          
                          // Use existing start time or current time only if not set
                          let startDate;
                          if (startTimeValue) {
                            startDate = new Date(startTimeValue)
                          } else {
                            startDate = new Date()
                            const startDateStr = formatDateToDDMMYYYY(startDate)
                            const startTimeStr = formatTimeToHHMM(startDate)
                            setCustomStartDate(startDateStr)
                            setCustomStartTime(startTimeStr)
                            setValue('startTime', localDateTimeToISO(startDateStr, startTimeStr))
                          }
                          
                          // Calculate end date by adding exact duration to start date (using LOCAL time)
                          const endDate = new Date(startDate.getTime() + parseInt(days) * 24 * 60 * 60 * 1000)
                          const endDateStr = formatDateToDDMMYYYY(endDate)
                          const endTimeStr = formatTimeToHHMM(endDate)
                          setCustomEndDate(endDateStr)
                          setCustomEndTime(endTimeStr)
                          setValue('endTime', localDateTimeToISO(endDateStr, endTimeStr))
                        }}
                        className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                          durationOption === days
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        {days} {days === '1' ? 'Day' : 'Days'}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setDurationOption('custom')}
                      className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                        durationOption === 'custom'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {durationOption === 'custom' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom End Date & Time
                      </label>
                      <p className="text-xs text-gray-600 mb-2">
                        Format: DD-MM-YYYY HH:MM (e.g., 25-12-2025 18:00) • Your timezone: {userTimezone}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Date (DD-MM-YYYY)</label>
                          <input
                            type="text"
                            placeholder="15-12-2025"
                            value={customEndDate}
                            maxLength="10"
                            onChange={(e) => {
                              let value = e.target.value.replace(/[^0-9]/g, '');
                              if (value.length >= 2) value = value.slice(0, 2) + '-' + value.slice(2);
                              if (value.length >= 5) value = value.slice(0, 5) + '-' + value.slice(5, 9);
                              setCustomEndDate(value);
                              
                              // Convert DD-MM-YYYY to ISO format using LOCAL time
                              if (value.length === 10 && customEndTime) {
                                setValue('endTime', localDateTimeToISO(value, customEndTime));
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Time (HH:MM)</label>
                          <input
                            type="time"
                            value={customEndTime}
                            onChange={(e) => {
                              setCustomEndTime(e.target.value);
                              if (customEndDate && customEndDate.length === 10 && e.target.value) {
                                setValue('endTime', localDateTimeToISO(customEndDate, e.target.value));
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                          />
                        </div>
                      </div>
                      <input type="hidden" {...register('endTime', { required: 'End time is required' })} />
                      {errors.endTime && (
                        <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                      )}
                    </div>
                  )}
                </div>

                {(() => {
                  const startTimeValue = watch('startTime')
                  const endTimeValue = watch('endTime')
                  
                  if (!startTimeValue || !endTimeValue) return null
                  
                  const startDate = new Date(startTimeValue)
                  const endDate = new Date(endTimeValue)
                  
                  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null
                  
                  return (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">Auction Schedule</h4>
                      <div className="text-sm text-green-800 space-y-1">
                      <p>
                        <span className="font-semibold">Starts:</span>{' '}
                        {(() => {
                          const d = new Date(startDate);
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          const hours = String(d.getHours()).padStart(2, '0');
                          const minutes = String(d.getMinutes()).padStart(2, '0');
                          return `${day}-${month}-${year} ${hours}:${minutes}`;
                        })()}
                      </p>
                      <p>
                        <span className="font-semibold">Ends:</span>{' '}
                        {(() => {
                          const d = new Date(endDate);
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          const hours = String(d.getHours()).padStart(2, '0');
                          const minutes = String(d.getMinutes()).padStart(2, '0');
                          return `${day}-${month}-${year} ${hours}:${minutes}`;
                        })()}
                      </p>
                        <p>
                          <span className="font-semibold">Duration:</span>{' '}
                          {calculateDuration(startTimeValue, endTimeValue)}
                        </p>
                      </div>
                    </div>
                  )
                })()}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Timing Tips</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 3-7 day auctions typically get the most engagement</li>
                    <li>• Start immediately to attract buyers who are browsing now</li>
                    <li>• End auctions on evenings or weekends for more bidders</li>
                    <li>• Give bidders enough time to discover your listing</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 4: Images */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Images</h2>
                
                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={uploading || images.length >= 10}
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-lg font-semibold text-gray-700 mb-1">
                      Click to upload images
                    </p>
                    <p className="text-sm text-gray-600">
                      or drag and drop (Max 10 images)
                    </p>
                    {uploading && (
                      <div className="mt-4">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      </div>
                    )}
                  </label>
                </div>

                {/* Image Preview Grid */}
                {images.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Uploaded Images ({images.length}/10)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={image}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                              Main Image
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Image Guidelines</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• First image will be the main listing image</li>
                    <li>• Use clear, well-lit photos from multiple angles</li>
                    <li>• Show any defects or unique features</li>
                    <li>• Recommended: 1000x1000px or larger</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Listing...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Create Listing
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

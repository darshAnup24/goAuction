'use client'
import { useState, useCallback, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'

/**
 * ImageUpload Component
 * Drag-and-drop image upload with preview, progress, and delete
 * 
 * Props:
 * @param {Array} images - Current uploaded images [{url, publicId}]
 * @param {Function} onChange - Callback when images change
 * @param {Number} maxImages - Maximum number of images (default: 5)
 * @param {Boolean} disabled - Disable upload
 */
export default function ImageUpload({ 
  images = [], 
  onChange, 
  maxImages = 5,
  disabled = false 
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [errors, setErrors] = useState([])
  const fileInputRef = useRef(null)

  // Validate file before upload
  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!validTypes.includes(file.type)) {
      return 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'
    }

    if (file.size > maxSize) {
      return 'File too large. Maximum size is 5MB.'
    }

    return null
  }

  // Handle file upload
  const handleUpload = useCallback(async (files) => {
    if (disabled) return

    const fileArray = Array.from(files)
    
    // Check if adding these files would exceed max images
    if (images.length + fileArray.length > maxImages) {
      setErrors([`Maximum ${maxImages} images allowed. You can upload ${maxImages - images.length} more.`])
      return
    }

    // Validate files
    const validationErrors = []
    const validFiles = []

    fileArray.forEach((file, index) => {
      const error = validateFile(file)
      if (error) {
        validationErrors.push(`File ${index + 1}: ${error}`)
      } else {
        validFiles.push(file)
      }
    })

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
    }

    if (validFiles.length === 0) return

    setUploading(true)
    setErrors([])

    try {
      const formData = new FormData()
      validFiles.forEach(file => {
        formData.append('images', file)
      })

      // Initialize progress for each file
      const progress = {}
      validFiles.forEach((_, index) => {
        progress[index] = 0
      })
      setUploadProgress(progress)

      // Simulate progress (Cloudinary doesn't provide real-time progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const updated = { ...prev }
          Object.keys(updated).forEach(key => {
            if (updated[key] < 90) {
              updated[key] += 10
            }
          })
          return updated
        })
      }, 200)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      const data = await response.json()

      if (data.success) {
        // Update images array
        const newImages = [...images, ...data.images]
        onChange(newImages)

        // Show any partial errors
        if (data.errors && data.errors.length > 0) {
          setErrors(data.errors)
        }

        // Complete progress
        const completed = {}
        validFiles.forEach((_, index) => {
          completed[index] = 100
        })
        setUploadProgress(completed)

        // Clear progress after a short delay
        setTimeout(() => {
          setUploadProgress({})
        }, 1000)
      } else {
        setErrors([data.error || 'Upload failed'])
      }
    } catch (error) {
      console.error('Upload error:', error)
      setErrors(['Failed to upload images. Please try again.'])
    } finally {
      setUploading(false)
    }
  }, [images, onChange, maxImages, disabled])

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files)
    }
  }

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleUpload(files)
    }
  }

  // Handle delete image
  const handleDelete = async (imageToDelete, index) => {
    if (disabled || uploading) return

    try {
      // Call delete API
      const response = await fetch('/api/upload', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicId: imageToDelete.publicId }),
      })

      const data = await response.json()

      if (data.success) {
        // Remove from images array
        const newImages = images.filter((_, i) => i !== index)
        onChange(newImages)
      } else {
        setErrors([data.error || 'Failed to delete image'])
      }
    } catch (error) {
      console.error('Delete error:', error)
      setErrors(['Failed to delete image. Please try again.'])
    }
  }

  const canUploadMore = images.length < maxImages

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canUploadMore && (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-green-500 bg-green-50'
              : 'border-slate-300 hover:border-slate-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled || uploading}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-green-500" size={40} />
              <p className="text-sm text-slate-600">Uploading images...</p>
              
              {/* Progress Bars */}
              <div className="w-full max-w-xs space-y-2">
                {Object.entries(uploadProgress).map(([index, progress]) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Image {parseInt(index) + 1}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <Upload className="mx-auto mb-4 text-slate-400" size={40} />
              <p className="text-slate-600 mb-2">
                Drag and drop images here, or click to browse
              </p>
              <p className="text-sm text-slate-500">
                Maximum {maxImages} images, up to 5MB each
              </p>
              <p className="text-xs text-slate-400 mt-1">
                JPEG, PNG, WebP, GIF supported
              </p>
            </>
          )}
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {images.length} / {maxImages} images uploaded
            </p>
            {images.length > 0 && (
              <p className="text-xs text-slate-500">
                Drag images to reorder (optional)
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image, index) => (
              <div
                key={image.publicId || index}
                className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-slate-300 transition-colors"
              >
                {/* Image */}
                <img
                  src={image.url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(image, index)}
                  disabled={disabled || uploading}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete image"
                >
                  <X size={16} />
                </button>

                {/* First Image Badge */}
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                    Cover
                  </div>
                )}
              </div>
            ))}

            {/* Add More Button */}
            {canUploadMore && !uploading && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="aspect-square rounded-lg border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ImageIcon size={24} />
                <span className="text-xs">Add more</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

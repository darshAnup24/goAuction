/**
 * Responsive Utility Components
 * Reusable components for consistent responsive behavior
 */

'use client'

/**
 * ResponsiveContainer
 * Consistent max-width container with responsive padding
 */
export function ResponsiveContainer({ children, className = '', maxWidth = '7xl' }) {
  const maxWidthClasses = {
    'sm': 'max-w-screen-sm',
    'md': 'max-w-screen-md',
    'lg': 'max-w-screen-lg',
    'xl': 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full',
  }

  return (
    <div className={`w-full ${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  )
}

/**
 * ResponsiveGrid
 * Adaptive grid that changes columns based on screen size
 */
export function ResponsiveGrid({ 
  children, 
  className = '',
  cols = { mobile: 1, tablet: 2, desktop: 3, wide: 4 },
  gap = 6 
}) {
  const colsClasses = `grid-cols-${cols.mobile} sm:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop} xl:grid-cols-${cols.wide}`
  const gapClasses = `gap-${gap}`
  
  return (
    <div className={`grid ${colsClasses} ${gapClasses} ${className}`}>
      {children}
    </div>
  )
}

/**
 * MobileOnly
 * Render children only on mobile devices
 */
export function MobileOnly({ children, breakpoint = 'lg' }) {
  const hiddenClass = `${breakpoint}:hidden`
  return <div className={hiddenClass}>{children}</div>
}

/**
 * DesktopOnly
 * Render children only on desktop devices
 */
export function DesktopOnly({ children, breakpoint = 'lg' }) {
  const hiddenClass = `hidden ${breakpoint}:block`
  return <div className={hiddenClass}>{children}</div>
}

/**
 * ResponsiveStack
 * Stack items vertically on mobile, horizontally on desktop
 */
export function ResponsiveStack({ 
  children, 
  className = '',
  breakpoint = 'md',
  gap = 4,
  align = 'start',
  justify = 'start'
}) {
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  }

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  }

  return (
    <div className={`
      flex flex-col ${breakpoint}:flex-row
      gap-${gap}
      ${alignClasses[align]}
      ${justifyClasses[justify]}
      ${className}
    `}>
      {children}
    </div>
  )
}

/**
 * TouchButton
 * Button with proper touch target size and feedback
 */
export function TouchButton({ 
  children, 
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 touch-manipulation active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-md hover:shadow-lg',
    secondary: 'bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border-2 border-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-md hover:shadow-lg',
    ghost: 'hover:bg-gray-100 active:bg-gray-200 text-gray-700',
    link: 'text-green-600 hover:text-green-700 underline-offset-4 hover:underline',
  }

  const sizeClasses = {
    sm: 'min-h-[40px] px-4 py-2 text-sm',
    md: 'min-h-[44px] px-6 py-3 text-base sm:text-sm',
    lg: 'min-h-[48px] px-8 py-4 text-lg sm:text-base',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * TouchInput
 * Input field with proper touch target size
 */
export function TouchInput({ 
  label,
  error,
  helper,
  className = '',
  containerClassName = '',
  ...props
}) {
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 sm:py-2.5
          text-base sm:text-sm
          border-2 rounded-lg
          outline-none transition-all duration-200
          touch-manipulation
          ${error 
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
            : 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
          }
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helper && !error && (
        <p className="text-xs text-gray-500">{helper}</p>
      )}
    </div>
  )
}

/**
 * TouchSelect
 * Select dropdown with proper touch target size
 */
export function TouchSelect({ 
  label,
  error,
  helper,
  options = [],
  className = '',
  containerClassName = '',
  ...props
}) {
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        className={`
          w-full px-4 py-3 sm:py-2.5
          text-base sm:text-sm
          border-2 rounded-lg
          outline-none transition-all duration-200
          touch-manipulation
          appearance-none bg-white
          cursor-pointer
          ${error 
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
            : 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
          }
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helper && !error && (
        <p className="text-xs text-gray-500">{helper}</p>
      )}
    </div>
  )
}

/**
 * TouchTextarea
 * Textarea with proper touch target size
 */
export function TouchTextarea({ 
  label,
  error,
  helper,
  className = '',
  containerClassName = '',
  rows = 4,
  ...props
}) {
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={`
          w-full px-4 py-3 sm:py-2.5
          text-base sm:text-sm
          border-2 rounded-lg
          outline-none transition-all duration-200
          touch-manipulation
          resize-vertical
          ${error 
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
            : 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
          }
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helper && !error && (
        <p className="text-xs text-gray-500">{helper}</p>
      )}
    </div>
  )
}

/**
 * ResponsiveDialog/Modal
 * Full-screen on mobile, centered on desktop
 */
export function ResponsiveDialog({ 
  isOpen, 
  onClose, 
  children, 
  title,
  className = '' 
}) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="min-h-screen flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className={`
            w-full bg-white
            sm:max-w-lg sm:rounded-lg
            shadow-xl
            max-h-screen sm:max-h-[90vh]
            overflow-y-auto
            ${className}
          `}>
            {title && (
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              </div>
            )}
            <div className="p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * ResponsiveCard
 * Card with responsive padding and spacing
 */
export function ResponsiveCard({ children, className = '', padding = true }) {
  return (
    <div className={`
      bg-white rounded-lg shadow-md border border-gray-200
      ${padding ? 'p-4 sm:p-6' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}

/**
 * Spacer
 * Responsive vertical spacing
 */
export function Spacer({ size = 'md' }) {
  const sizes = {
    xs: 'h-2 sm:h-2',
    sm: 'h-4 sm:h-3',
    md: 'h-6 sm:h-4',
    lg: 'h-8 sm:h-6',
    xl: 'h-12 sm:h-8',
    '2xl': 'h-16 sm:h-12',
  }

  return <div className={sizes[size]} />
}

/**
 * useMediaQuery Hook
 * Detect screen size in components
 */
import { useState, useEffect } from 'react'

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    
    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}

// Preset breakpoint hooks
export const useIsMobile = () => useMediaQuery('(max-width: 640px)')
export const useIsTablet = () => useMediaQuery('(min-width: 641px) and (max-width: 1024px)')
export const useIsDesktop = () => useMediaQuery('(min-width: 1025px)')

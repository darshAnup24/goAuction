/**
 * Touch-Friendly Form Utilities
 * Reusable styles and components for mobile-optimized forms
 */

// Base input classes - Touch-friendly with proper sizing
export const touchInputClasses = `
  w-full px-4 py-3 sm:py-2.5
  text-base sm:text-sm
  border-2 border-gray-300
  rounded-lg
  focus:border-green-500 focus:ring-2 focus:ring-green-200
  outline-none
  transition-all duration-200
  touch-manipulation
  disabled:bg-gray-100 disabled:cursor-not-allowed
`

// Large touch target for mobile (min 44x44px as per accessibility guidelines)
export const touchButtonClasses = `
  min-h-[44px] sm:min-h-[40px]
  px-6 py-3 sm:py-2.5
  text-base sm:text-sm font-medium
  rounded-lg
  transition-all duration-200
  touch-manipulation
  active:scale-95
  disabled:opacity-50 disabled:cursor-not-allowed
`

// Primary action button
export const primaryButtonClasses = `
  ${touchButtonClasses}
  bg-green-600 hover:bg-green-700 active:bg-green-800
  text-white
  shadow-md hover:shadow-lg
`

// Secondary button
export const secondaryButtonClasses = `
  ${touchButtonClasses}
  bg-white hover:bg-gray-50 active:bg-gray-100
  text-gray-700
  border-2 border-gray-300
`

// Danger button
export const dangerButtonClasses = `
  ${touchButtonClasses}
  bg-red-600 hover:bg-red-700 active:bg-red-800
  text-white
  shadow-md hover:shadow-lg
`

// Touch-friendly select dropdown
export const touchSelectClasses = `
  ${touchInputClasses}
  appearance-none
  bg-white
  cursor-pointer
`

// Touch-friendly checkbox/radio
export const touchCheckboxClasses = `
  w-5 h-5 sm:w-4 sm:h-4
  rounded
  border-2 border-gray-300
  text-green-600
  focus:ring-2 focus:ring-green-200
  cursor-pointer
  touch-manipulation
`

// Form label
export const touchLabelClasses = `
  block
  text-sm sm:text-xs font-medium
  text-gray-700
  mb-2
`

// Form error message
export const errorMessageClasses = `
  text-sm text-red-600
  mt-1
`

// Form helper text
export const helperTextClasses = `
  text-xs text-gray-500
  mt-1
`

// Container for form fields with proper spacing
export const fieldContainerClasses = `
  space-y-2 sm:space-y-1.5
`

// Touch-friendly textarea
export const touchTextareaClasses = `
  ${touchInputClasses}
  min-h-[120px] sm:min-h-[100px]
  resize-vertical
`

// Icon button (for things like show/hide password)
export const iconButtonClasses = `
  p-3 sm:p-2
  rounded-lg
  hover:bg-gray-100
  active:bg-gray-200
  transition-colors
  touch-manipulation
`

// Card container with touch-friendly padding
export const touchCardClasses = `
  bg-white
  rounded-lg sm:rounded-xl
  shadow-sm
  p-6 sm:p-4
  border border-gray-200
`

// Form group spacing
export const formGroupClasses = `
  space-y-6 sm:space-y-4
`

// Grid for form fields - responsive
export const formGridClasses = `
  grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-4
`

// Full-width form grid item
export const formGridFullClasses = `
  col-span-1 sm:col-span-2
`

// Submit button container
export const submitContainerClasses = `
  flex flex-col sm:flex-row gap-3 sm:gap-2
  mt-8 sm:mt-6
`

/**
 * Utility function to combine classes
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

/**
 * Touch-friendly spacing utilities
 */
export const spacing = {
  // Padding
  touchPadding: 'p-6 sm:p-4',
  touchPaddingX: 'px-6 sm:px-4',
  touchPaddingY: 'py-6 sm:py-4',
  
  // Margin
  touchMargin: 'm-6 sm:m-4',
  touchMarginX: 'mx-6 sm:mx-4',
  touchMarginY: 'my-6 sm:my-4',
  
  // Gap
  touchGap: 'gap-6 sm:gap-4',
  touchGapX: 'gap-x-6 sm:gap-x-4',
  touchGapY: 'gap-y-6 sm:gap-y-4',
}

/**
 * Breakpoint utilities
 */
export const breakpoints = {
  sm: '640px',   // Small devices (landscape phones)
  md: '768px',   // Medium devices (tablets)
  lg: '1024px',  // Large devices (desktops)
  xl: '1280px',  // Extra large devices (large desktops)
  '2xl': '1536px', // 2X large devices
}

/**
 * Touch target sizes (following WCAG 2.5.5 guidelines)
 */
export const touchTargets = {
  minimum: '44px',    // Minimum recommended size
  comfortable: '48px', // More comfortable for touch
  large: '56px',      // Large, easy-to-tap targets
}

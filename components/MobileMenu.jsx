'use client'
import { X, Home, ShoppingBag, Info, Phone, User, LogIn, Settings, Package } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

/**
 * MobileMenu Component
 * Full-screen mobile navigation drawer
 * 
 * Props:
 * @param {Boolean} isOpen - Controls drawer visibility
 * @param {Function} onClose - Callback to close drawer
 * @param {Object} user - User session object
 */
export default function MobileMenu({ isOpen, onClose, user = null }) {
  
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const menuItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/listings', label: 'Auctions', icon: Package },
    { href: '/dashboard', label: 'Dashboard', icon: ShoppingBag },
    { href: '/about', label: 'About', icon: Info },
    { href: '/contact', label: 'Contact', icon: Phone },
  ]

  const userMenuItems = user ? [
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/dashboard/listings', label: 'My Listings', icon: Package },
    { href: '/settings', label: 'Settings', icon: Settings },
  ] : []

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-50 lg:hidden shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Link 
              href="/" 
              onClick={onClose}
              className="text-2xl font-semibold text-slate-700"
            >
              <span className="text-green-600">go</span>cart
              <span className="text-green-600 text-3xl">.</span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close menu"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-6">
            <div className="space-y-1 px-4">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-4 px-4 py-4 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group"
                  >
                    <Icon size={22} className="text-gray-500 group-hover:text-green-600 transition-colors" />
                    <span className="text-base font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Divider */}
            {userMenuItems.length > 0 && (
              <div className="my-6 border-t border-gray-200" />
            )}

            {/* User Menu Items */}
            {userMenuItems.length > 0 && (
              <div className="space-y-1 px-4">
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Account
                </p>
                {userMenuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-4 px-4 py-4 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group"
                    >
                      <Icon size={22} className="text-gray-500 group-hover:text-green-600 transition-colors" />
                      <span className="text-base font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </nav>

          {/* Footer - Auth Buttons */}
          <div className="p-6 border-t border-gray-200 space-y-3">
            {user ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-lg">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Add logout logic here
                    onClose()
                  }}
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
                >
                  <LogIn size={18} />
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={onClose}
                  className="flex items-center justify-center w-full py-3 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

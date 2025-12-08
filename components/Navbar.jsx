'use client'
import { Search, ShoppingCart, Menu, LogOut, User, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { signOut } from "next-auth/react";
import NotificationBell from "./NotificationBell";
import MobileMenu from "./MobileMenu";

const Navbar = () => {

    const router = useRouter();

    const [search, setSearch] = useState('')
    const [userId, setUserId] = useState(null)
    const [user, setUser] = useState(null)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const cartCount = useSelector(state => state.cart.total)

    const handleLogout = async () => {
        await signOut({ redirect: true, callbackUrl: '/' })
    }

    // Fetch user session
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/auth/session')
                const session = await response.json()
                if (session?.user?.id) {
                    setUserId(session.user.id)
                    setUser(session.user)
                }
            } catch (error) {
                console.error('Failed to fetch session:', error)
            }
        }
        fetchUser()
    }, [])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showUserMenu && !e.target.closest('.user-dropdown')) {
                setShowUserMenu(false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [showUserMenu])

    const handleSearch = (e) => {
        e.preventDefault()
        router.push(`/listings?search=${search}`)
        setIsSearchOpen(false)
    }

    return (
        <>
            <nav className="sticky top-0 z-30 bg-white shadow-sm">
                <div className="mx-4 sm:mx-6">
                    <div className="flex items-center justify-between max-w-7xl mx-auto py-3 sm:py-4 transition-all">

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors -ml-2"
                            aria-label="Open menu"
                        >
                            <Menu size={24} className="text-gray-700" />
                        </button>

                        {/* Logo */}
                        <Link href="/" className="relative text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-700">
                            <span className="text-green-600">go</span>cart<span className="text-green-600 text-3xl sm:text-4xl lg:text-5xl leading-0">.</span>
                            <span className="hidden sm:inline absolute text-[10px] sm:text-xs font-semibold -top-1 -right-6 sm:-right-8 px-2 sm:px-3 p-0.5 rounded-full text-white bg-green-500">
                                plus
                            </span>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden lg:flex items-center gap-4 xl:gap-8 text-slate-600">
                            <Link href="/" className="hover:text-green-600 transition-colors">Home</Link>
                            <Link href="/listings" className="hover:text-green-600 transition-colors">Auctions</Link>
                            <Link href="/dashboard" className="hover:text-green-600 transition-colors">Dashboard</Link>
                            <Link href="/about" className="hover:text-green-600 transition-colors">About</Link>
                            <Link href="/contact" className="hover:text-green-600 transition-colors">Contact</Link>

                            <form onSubmit={handleSearch} className="hidden xl:flex items-center w-64 text-sm gap-2 bg-slate-100 px-4 py-2.5 rounded-full">
                                <Search size={18} className="text-slate-600" />
                                <input 
                                    className="w-full bg-transparent outline-none placeholder-slate-600" 
                                    type="text" 
                                    placeholder="Search auctions" 
                                    value={search} 
                                    onChange={(e) => setSearch(e.target.value)} 
                                />
                            </form>

                            {/* Notification Bell */}
                            {userId && <NotificationBell userId={userId} />}

                            {/* Auth Buttons */}
                            {user ? (
                                <div className="flex items-center gap-3">
                                    <Link 
                                        href="/listings/create"
                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 transition text-white rounded-full font-medium text-sm"
                                    >
                                        Sell Item
                                    </Link>
                                    
                                    {/* User Dropdown */}
                                    <div className="relative user-dropdown">
                                        <button 
                                            onClick={() => setShowUserMenu(!showUserMenu)}
                                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-full transition"
                                        >
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
                                                    {user.username?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                            )}
                                            <span className="hidden xl:inline text-sm font-medium">{user.username}</span>
                                        </button>

                                        {/* Dropdown Menu */}
                                        {showUserMenu && (
                                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                                <div className="px-4 py-2 border-b border-gray-100">
                                                    <p className="text-sm font-medium text-gray-900">{user.fullName || user.username}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                                
                                                <Link 
                                                    href="/profile"
                                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                                                    onClick={() => setShowUserMenu(false)}
                                                >
                                                    <User size={16} />
                                                    My Profile
                                                </Link>
                                                
                                                <Link 
                                                    href="/dashboard"
                                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                                                    onClick={() => setShowUserMenu(false)}
                                                >
                                                    <LayoutDashboard size={16} />
                                                    Dashboard
                                                </Link>
                                                
                                                <hr className="my-2 border-gray-100" />
                                                
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                                                >
                                                    <LogOut size={16} />
                                                    Log Out
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link 
                                        href="/login"
                                        className="px-6 py-2 text-indigo-600 hover:bg-indigo-50 transition rounded-full font-medium"
                                    >
                                        Login
                                    </Link>
                                    <Link 
                                        href="/register"
                                        className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 transition text-white rounded-full font-medium"
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Right Side */}
                        <div className="flex items-center gap-2 sm:gap-3 lg:hidden">
                            {/* Mobile Search Toggle */}
                            <button
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Search"
                            >
                                <Search size={20} className="text-gray-700" />
                            </button>

                            {/* Mobile Notification Bell */}
                            {userId && <NotificationBell userId={userId} />}
                        </div>
                    </div>

                    {/* Mobile Search Bar */}
                    {isSearchOpen && (
                        <div className="pb-3 lg:hidden">
                            <form onSubmit={handleSearch} className="flex items-center gap-2 bg-slate-100 px-4 py-3 rounded-lg">
                                <Search size={18} className="text-slate-600" />
                                <input 
                                    className="flex-1 bg-transparent outline-none placeholder-slate-600 text-sm" 
                                    type="text" 
                                    placeholder="Search auctions" 
                                    value={search} 
                                    onChange={(e) => setSearch(e.target.value)} 
                                    autoFocus
                                />
                            </form>
                        </div>
                    )}
                </div>
                <hr className="border-gray-200" />
            </nav>

            {/* Mobile Menu Drawer */}
            <MobileMenu 
                isOpen={isMobileMenuOpen} 
                onClose={() => setIsMobileMenuOpen(false)} 
                user={user}
            />
        </>
    )
}

export default Navbar
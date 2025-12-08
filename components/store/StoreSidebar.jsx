'use client'
import { usePathname } from "next/navigation"
import { HomeIcon, LayoutListIcon, SquarePenIcon, SquarePlusIcon, WalletIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const StoreSidebar = ({storeInfo}) => {

    const pathname = usePathname()

    const sidebarLinks = [
        { name: 'Dashboard', href: '/store', icon: HomeIcon },
        { name: 'Add Product', href: '/store/add-product', icon: SquarePlusIcon },
        { name: 'Manage Product', href: '/store/manage-product', icon: SquarePenIcon },
        { name: 'Orders', href: '/store/orders', icon: LayoutListIcon },
        { name: 'Stripe Connect', href: '/vendor/connect-stripe', icon: WalletIcon },
    ]

    return (
        <div className="flex h-full flex-col gap-5 border-r border-slate-200 w-full sm:min-w-60 lg:min-w-64">
            {/* Store Info Section - Hidden on mobile */}
            <div className="hidden md:flex flex-col gap-3 justify-center items-center pt-8 px-4">
                {storeInfo?.logo && (
                    <Image 
                        className="w-16 h-16 rounded-full shadow-md object-cover" 
                        src={storeInfo.logo} 
                        alt={storeInfo.name || 'Store'} 
                        width={80} 
                        height={80} 
                    />
                )}
                <p className="text-slate-700 font-medium text-center">{storeInfo?.name || 'My Store'}</p>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto px-2 sm:px-3 py-4 sm:py-0">
                <div className="space-y-1">
                    {
                        sidebarLinks.map((link, index) => {
                            const Icon = link.icon
                            const isActive = pathname === link.href
                            
                            return (
                                <Link 
                                    key={index} 
                                    href={link.href} 
                                    className={`
                                        relative flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg
                                        transition-all duration-200
                                        ${
                                            isActive 
                                                ? 'bg-green-50 text-green-700 font-medium shadow-sm' 
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }
                                        touch-manipulation
                                    `}
                                >
                                    <Icon 
                                        size={20} 
                                        className={`flex-shrink-0 ${isActive ? 'text-green-600' : 'text-slate-500'}`} 
                                    />
                                    <span className="text-sm sm:text-base font-medium">{link.name}</span>
                                    {isActive && (
                                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-green-500 rounded-l"></span>
                                    )}
                                </Link>
                            )
                        })
                    }
                </div>
            </nav>
        </div>
    )
}

export default StoreSidebar
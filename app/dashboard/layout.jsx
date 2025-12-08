import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import MobileMenuScript from "@/components/dashboard/MobileMenuScript";
import { 
  LayoutDashboard, 
  Package, 
  DollarSign, 
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";

/**
 * Vendor Dashboard Layout
 * 
 * Provides consistent layout with sidebar navigation for all vendor dashboard pages.
 */
export default async function DashboardLayout({ children }) {
  const session = await auth();

  // Redirect to sign-in if not authenticated
  if (!session) {
    redirect("/api/auth/signin");
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileMenuScript />
      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">Vendor Dashboard</h1>
          <button
            id="mobile-menu-toggle"
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-white border-r border-gray-200">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">GC</span>
              </div>
              <span className="text-xl font-bold text-gray-900">GoCart</span>
            </Link>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "V"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.name || user.username || "Vendor"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            <NavLink href="/dashboard" icon={LayoutDashboard}>
              Overview
            </NavLink>
            <NavLink href="/dashboard/listings" icon={Package}>
              My Auctions
            </NavLink>
            <NavLink href="/dashboard/sales" icon={DollarSign}>
              Sales History
            </NavLink>
            <NavLink href="/dashboard/analytics" icon={BarChart3}>
              Analytics
            </NavLink>
            <NavLink href="/dashboard/notifications" icon={Bell}>
              Notifications
            </NavLink>
          </nav>

          {/* Bottom actions */}
          <div className="px-4 py-4 border-t border-gray-200 space-y-1">
            <NavLink href="/dashboard/settings" icon={Settings}>
              Settings
            </NavLink>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:pl-64">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      <div id="mobile-sidebar" className="hidden lg:hidden fixed inset-0 z-40 bg-gray-900/50">
        <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transform transition-transform">
          {/* Mobile sidebar content (same as desktop) */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">GC</span>
              </div>
              <span className="text-xl font-bold text-gray-900">GoCart</span>
            </Link>
            <button id="mobile-menu-close" className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "V"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.name || user.username || "Vendor"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1">
            <NavLink href="/dashboard" icon={LayoutDashboard}>
              Overview
            </NavLink>
            <NavLink href="/dashboard/listings" icon={Package}>
              My Auctions
            </NavLink>
            <NavLink href="/dashboard/sales" icon={DollarSign}>
              Sales History
            </NavLink>
            <NavLink href="/dashboard/analytics" icon={BarChart3}>
              Analytics
            </NavLink>
            <NavLink href="/dashboard/notifications" icon={Bell}>
              Notifications
            </NavLink>
          </nav>

          <div className="px-4 py-4 border-t border-gray-200 space-y-1">
            <NavLink href="/dashboard/settings" icon={Settings}>
              Settings
            </NavLink>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}

/**
 * NavLink Component
 * Navigation link with active state styling
 */
function NavLink({ href, icon: Icon, children }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors group"
    >
      <Icon className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
      <span>{children}</span>
    </Link>
  );
}

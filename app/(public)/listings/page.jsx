import { Suspense } from 'react'
import BrowseListingsClient from './BrowseListingsClient'
import { Loader2 } from 'lucide-react'

export const metadata = {
  title: 'Browse Auctions - GoCart',
  description: 'Browse and search for auction listings on GoCart marketplace',
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BrowseListingsClient />
    </Suspense>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading auctions...</p>
      </div>
    </div>
  )
}

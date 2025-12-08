"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical,
  Clock,
  Gavel,
  TrendingUp,
  Package
} from "lucide-react";

/**
 * Listings Table Component
 * Displays auction listings in table format with actions
 */
export default function ListingsTable({ listings, activeTab }) {
  const [selectedListing, setSelectedListing] = useState(null);

  if (!listings || listings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No {activeTab.toLowerCase()} auctions
        </h3>
        <p className="text-gray-600 mb-6">
          {activeTab === "Active" && "You don't have any active auctions yet."}
          {activeTab === "Upcoming" && "No upcoming auctions scheduled."}
          {activeTab === "Ended" && "No ended auctions to display."}
        </p>
        {activeTab === "Active" && (
          <Link
            href="/listings/create"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Package className="w-5 h-5" />
            Create Your First Auction
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Auction
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Current Bid
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Bids
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Time Left
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {listings.map((listing) => (
              <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                {/* Auction Info */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                      {listing.images && listing.images[0] ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                          <Package className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {listing.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        Started: {(() => {
                          const d = new Date(listing.startTime);
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          return `${day}-${month}-${year}`;
                        })()}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Current Bid */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-bold text-gray-900">
                      ${listing.currentBid.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Starting: ${listing.startingPrice.toFixed(2)}
                  </p>
                </td>

                {/* Bids Count */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Gavel className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-900">
                      {listing.bidCount}
                    </span>
                  </div>
                </td>

                {/* Time Left */}
                <td className="px-6 py-4">
                  {listing.status === "LIVE" ? (
                    <TimeRemaining endTime={listing.endTime} />
                  ) : listing.status === "UPCOMING" ? (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-medium">
                        Starts {formatTimeUntil(listing.startTime)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      Ended {new Date(listing.endTime).toLocaleDateString()}
                    </div>
                  )}
                </td>

                {/* Status Badge */}
                <td className="px-6 py-4">
                  <StatusBadge status={listing.status} />
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <ActionDropdown listing={listing} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-gray-200">
        {listings.map((listing) => (
          <div key={listing.id} className="p-4">
            <div className="flex gap-3">
              {/* Thumbnail */}
              <div className="w-20 h-20 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                {listing.images && listing.images[0] ? (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {listing.title}
                  </h3>
                  <ActionDropdown listing={listing} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-green-600 font-bold">
                      <TrendingUp className="w-3 h-3" />
                      ${listing.currentBid.toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1 text-gray-600">
                      <Gavel className="w-3 h-3" />
                      {listing.bidCount} bids
                    </span>
                  </div>

                  {listing.status === "LIVE" ? (
                    <TimeRemaining endTime={listing.endTime} />
                  ) : listing.status === "UPCOMING" ? (
                    <div className="flex items-center gap-2 text-blue-600 text-xs">
                      <Clock className="w-3 h-3" />
                      Starts {formatTimeUntil(listing.startTime)}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      Ended {new Date(listing.endTime).toLocaleDateString()}
                    </div>
                  )}

                  <StatusBadge status={listing.status} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Status Badge Component
 */
function StatusBadge({ status }) {
  const styles = {
    LIVE: "bg-green-100 text-green-800 border-green-200",
    UPCOMING: "bg-blue-100 text-blue-800 border-blue-200",
    ENDED: "bg-gray-100 text-gray-800 border-gray-200",
    SOLD: "bg-purple-100 text-purple-800 border-purple-200",
    UNSOLD: "bg-orange-100 text-orange-800 border-orange-200",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || styles.ENDED}`}>
      {status}
    </span>
  );
}

/**
 * Time Remaining Component
 */
function TimeRemaining({ endTime }) {
  const ms = new Date(endTime) - new Date();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  const isUrgent = hours < 1;
  const color = isUrgent ? "text-red-600" : hours < 24 ? "text-orange-600" : "text-gray-600";

  return (
    <div className={`flex items-center gap-2 ${color}`}>
      <Clock className="w-4 h-4" />
      <span className="text-xs font-medium">
        {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
      </span>
    </div>
  );
}

/**
 * Action Dropdown Component
 */
function ActionDropdown({ listing }) {
  const [isOpen, setIsOpen] = useState(false);
  const canEdit = listing.bidCount === 0;
  const canDelete = listing.bidCount === 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
            <Link
              href={`/product/${listing.id}`}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Eye className="w-4 h-4" />
              View Listing
            </Link>

            {canEdit ? (
              <Link
                href={`/dashboard/listings/${listing.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 cursor-not-allowed">
                <Edit className="w-4 h-4" />
                Edit (Has bids)
              </div>
            )}

            {canDelete ? (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this listing?")) {
                    // Handle delete
                  }
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 cursor-not-allowed">
                <Trash2 className="w-4 h-4" />
                Delete (Has bids)
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Format time until start
 */
function formatTimeUntil(startTime) {
  const ms = new Date(startTime) - new Date();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `in ${days}d ${hours}h`;
  return `in ${hours}h`;
}

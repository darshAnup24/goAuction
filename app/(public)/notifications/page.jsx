'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Check, 
  Filter,
  ChevronLeft,
  ChevronRight 
} from 'lucide-react';

/**
 * Notifications Page
 * Full page view of all user notifications
 * Supports pagination, filtering, and mark as read
 */
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, unread, or notification type
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false
  });
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = async (page = 1, filterType = filter) => {
    try {
      setLoading(true);
      
      let url = `/api/notifications?page=${page}&limit=20`;
      if (filterType === 'unread') {
        url += '&unreadOnly=true';
      } else if (filterType !== 'all') {
        url += `&type=${filterType}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setNotifications(data.notifications);
        setPagination(data.pagination);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark single notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH'
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    fetchNotifications(1, newFilter);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    fetchNotifications(newPage);
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Notification type filters
  const filterOptions = [
    { value: 'all', label: 'All Notifications', icon: '📢' },
    { value: 'unread', label: 'Unread Only', icon: '🔵' },
    { value: 'BID_PLACED', label: 'New Bids', icon: '🔨' },
    { value: 'BID_OUTBID', label: 'Outbid', icon: '⚠️' },
    { value: 'AUCTION_WON', label: 'Auctions Won', icon: '🎉' },
    { value: 'AUCTION_LOST', label: 'Auctions Lost', icon: '😔' },
    { value: 'PAYMENT_RECEIVED', label: 'Payments', icon: '💰' },
    { value: 'NEW_MESSAGE', label: 'Messages', icon: '💬' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="h-8 w-8" />
                Notifications
              </h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? (
                  <>You have <strong>{unreadCount}</strong> unread notification{unreadCount !== 1 && 's'}</>
                ) : (
                  'All caught up!'
                )}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <Check className="h-5 w-5" />
                Mark All as Read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-1">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No notifications found
              </h3>
              <p className="text-gray-500">
                {filter === 'all' 
                  ? "You don't have any notifications yet."
                  : `No ${filterOptions.find(f => f.value === filter)?.label.toLowerCase()} found.`
                }
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onMarkRead={() => markAsRead(notification.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <strong>{((pagination.page - 1) * pagination.limit) + 1}</strong> to{' '}
                    <strong>
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </strong>{' '}
                    of <strong>{pagination.total}</strong> notifications
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              pagination.page === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * NotificationRow Component
 * Single notification row in the full list
 */
function NotificationRow({ notification, onClick, onMarkRead }) {
  const getNotificationIcon = (type) => {
    const icons = {
      BID_PLACED: '🔨',
      BID_OUTBID: '⚠️',
      AUCTION_WON: '🎉',
      AUCTION_LOST: '😔',
      AUCTION_STARTING: '🚀',
      AUCTION_ENDING: '⏰',
      PAYMENT_RECEIVED: '💰',
      PAYMENT_SENT: '💳',
      NEW_MESSAGE: '💬'
    };
    return icons[type] || '📢';
  };

  const getNotificationColor = (type) => {
    const colors = {
      BID_PLACED: 'bg-blue-100 text-blue-800',
      BID_OUTBID: 'bg-yellow-100 text-yellow-800',
      AUCTION_WON: 'bg-green-100 text-green-800',
      AUCTION_LOST: 'bg-gray-100 text-gray-800',
      AUCTION_STARTING: 'bg-purple-100 text-purple-800',
      AUCTION_ENDING: 'bg-orange-100 text-orange-800',
      PAYMENT_RECEIVED: 'bg-emerald-100 text-emerald-800',
      PAYMENT_SENT: 'bg-indigo-100 text-indigo-800',
      NEW_MESSAGE: 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type) => {
    const labels = {
      BID_PLACED: 'New Bid',
      BID_OUTBID: 'Outbid',
      AUCTION_WON: 'Auction Won',
      AUCTION_LOST: 'Auction Lost',
      AUCTION_STARTING: 'Auction Starting',
      AUCTION_ENDING: 'Auction Ending',
      PAYMENT_RECEIVED: 'Payment Received',
      PAYMENT_SENT: 'Payment Sent',
      NEW_MESSAGE: 'New Message'
    };
    return labels[type] || 'Notification';
  };

  return (
    <div
      className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-full ${getNotificationColor(notification.type)} flex items-center justify-center text-2xl`}>
            {getNotificationIcon(notification.type)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getNotificationColor(notification.type)} mb-2`}>
                {getTypeLabel(notification.type)}
              </span>
              <p className={`text-base ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                {notification.message}
              </p>
            </div>

            {/* Mark as read button */}
            {!notification.isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead();
                }}
                className="flex-shrink-0 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors font-medium"
                title="Mark as read"
              >
                Mark as read
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{formatTime(notification.createdAt)}</span>
            {notification.link && (
              <span className="text-blue-600 hover:text-blue-800 font-medium">
                View details →
              </span>
            )}
          </div>
        </div>

        {/* Unread indicator */}
        {!notification.isRead && (
          <div className="flex-shrink-0 pt-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}

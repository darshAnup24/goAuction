'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, BellRing, Check, X } from 'lucide-react';

/**
 * NotificationBell Component
 * Displays notification bell with unread count badge
 * Dropdown shows recent 10 notifications
 * Supports mark as read and mark all as read
 */
export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=10');
      const data = await response.json();
      
      if (response.ok) {
        setNotifications(data.notifications);
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
      setIsOpen(false);
      router.push(notification.link);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Fetch notifications on mount
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  // Socket.IO listener for real-time notifications
  useEffect(() => {
    if (!userId) return;

    const setupSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        const socket = io();

        socket.emit('join-room', `user:${userId}`);

        socket.on('notification', (data) => {
          // Add new notification to the list
          setNotifications(prev => [data, ...prev.slice(0, 9)]);
          setUnreadCount(prev => prev + 1);
        });

        socket.on('notification:read', (data) => {
          setUnreadCount(data.unreadCount);
        });

        socket.on('notification:read-all', () => {
          setUnreadCount(0);
        });

        return () => {
          socket.emit('leave-room', `user:${userId}`);
          socket.disconnect();
        };
      } catch (error) {
        console.error('Socket.IO setup error:', error);
      }
    };

    setupSocket();
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-6 w-6 text-blue-600" />
        ) : (
          <Bell className="h-6 w-6" />
        )}
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mark All Read Button */}
          {unreadCount > 0 && (
            <div className="px-4 py-2 border-b border-gray-100">
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <Check className="h-4 w-4" />
                Mark all as read
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onMarkRead={() => markAsRead(notification.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium block text-center"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * NotificationItem Component
 * Single notification item in dropdown
 */
function NotificationItem({ notification, onClick, onMarkRead }) {
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

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.isRead ? 'bg-blue-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 text-2xl">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatTime(notification.createdAt)}
          </p>
        </div>

        {/* Unread Indicator */}
        {!notification.isRead && (
          <div className="flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead();
              }}
              className="p-1 hover:bg-blue-100 rounded-full transition-colors"
              title="Mark as read"
            >
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

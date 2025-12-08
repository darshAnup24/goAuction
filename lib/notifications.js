import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Notification Helper Utilities
 * Simplifies creating and managing notifications throughout the app
 */

/**
 * Create a notification and emit Socket.IO event
 * @param {Object} params - Notification parameters
 * @param {string} params.userId - User ID to send notification to
 * @param {string} params.type - NotificationType enum value
 * @param {string} params.message - Notification message
 * @param {string} params.link - Optional link to resource
 * @returns {Promise<Object>} Created notification
 */
export async function createNotification({ userId, type, message, link = null }) {
  try {
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        link,
        isRead: false
      }
    });

    // Emit Socket.IO event for real-time update
    try {
      const io = (await import('@/server')).io;
      if (io) {
        io.to(`user:${userId}`).emit('notification', {
          id: notification.id,
          type: notification.type,
          message: notification.message,
          link: notification.link,
          isRead: false,
          createdAt: notification.createdAt
        });
      }
    } catch (socketError) {
      console.error('Socket.IO emit error:', socketError.message);
      // Don't fail if Socket.IO unavailable
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
}

/**
 * Create a bid placed notification
 * @param {string} sellerId - Seller's user ID
 * @param {number} bidAmount - Bid amount
 * @param {string} productId - Product ID
 * @param {string} productName - Product name
 * @param {string} bidderName - Bidder's username
 */
export async function notifyBidPlaced({ sellerId, bidAmount, productId, productName, bidderName }) {
  return createNotification({
    userId: sellerId,
    type: 'BID_PLACED',
    message: `${bidderName} placed a bid of $${bidAmount} on ${productName}`,
    link: `/product/${productId}`
  });
}

/**
 * Create an outbid notification
 * @param {string} bidderId - Previous bidder's user ID
 * @param {string} productId - Product ID
 * @param {string} productName - Product name
 * @param {number} newBidAmount - New bid amount
 */
export async function notifyOutbid({ bidderId, productId, productName, newBidAmount }) {
  return createNotification({
    userId: bidderId,
    type: 'BID_OUTBID',
    message: `You've been outbid on ${productName}. New bid: $${newBidAmount}`,
    link: `/product/${productId}`
  });
}

/**
 * Create an auction won notification
 * @param {string} winnerId - Winner's user ID
 * @param {string} productId - Product ID
 * @param {string} productName - Product name
 * @param {number} finalBid - Final bid amount
 */
export async function notifyAuctionWon({ winnerId, productId, productName, finalBid }) {
  return createNotification({
    userId: winnerId,
    type: 'AUCTION_WON',
    message: `Congratulations! You won ${productName} for $${finalBid}`,
    link: `/orders`
  });
}

/**
 * Create an auction lost notification
 * @param {string} bidderId - Bidder's user ID
 * @param {string} productId - Product ID
 * @param {string} productName - Product name
 */
export async function notifyAuctionLost({ bidderId, productId, productName }) {
  return createNotification({
    userId: bidderId,
    type: 'AUCTION_LOST',
    message: `Auction ended. Unfortunately, you didn't win ${productName}`,
    link: `/product/${productId}`
  });
}

/**
 * Create an auction starting notification
 * @param {string} userId - User ID to notify
 * @param {string} productId - Product ID
 * @param {string} productName - Product name
 */
export async function notifyAuctionStarting({ userId, productId, productName }) {
  return createNotification({
    userId,
    type: 'AUCTION_STARTING',
    message: `Auction starting soon: ${productName}`,
    link: `/product/${productId}`
  });
}

/**
 * Create an auction ending notification
 * @param {string} userId - User ID to notify
 * @param {string} productId - Product ID
 * @param {string} productName - Product name
 * @param {number} timeLeft - Minutes left
 */
export async function notifyAuctionEnding({ userId, productId, productName, timeLeft }) {
  return createNotification({
    userId,
    type: 'AUCTION_ENDING',
    message: `Only ${timeLeft} minutes left! Auction ending soon: ${productName}`,
    link: `/product/${productId}`
  });
}

/**
 * Create a payment received notification (for seller)
 * @param {string} sellerId - Seller's user ID
 * @param {number} amount - Payment amount
 * @param {string} productName - Product name
 * @param {string} buyerName - Buyer's username
 */
export async function notifyPaymentReceived({ sellerId, amount, productName, buyerName }) {
  return createNotification({
    userId: sellerId,
    type: 'PAYMENT_RECEIVED',
    message: `Payment of $${amount} received from ${buyerName} for ${productName}`,
    link: `/vendor/dashboard/earnings`
  });
}

/**
 * Create a payment sent notification (for buyer)
 * @param {string} buyerId - Buyer's user ID
 * @param {number} amount - Payment amount
 * @param {string} productName - Product name
 */
export async function notifyPaymentSent({ buyerId, amount, productName }) {
  return createNotification({
    userId: buyerId,
    type: 'PAYMENT_SENT',
    message: `Payment of $${amount} sent successfully for ${productName}`,
    link: `/orders`
  });
}

/**
 * Create a new message notification
 * @param {string} recipientId - Recipient's user ID
 * @param {string} senderName - Sender's username
 * @param {string} conversationId - Conversation ID
 */
export async function notifyNewMessage({ recipientId, senderName, conversationId }) {
  return createNotification({
    userId: recipientId,
    type: 'NEW_MESSAGE',
    message: `${senderName} sent you a message`,
    link: `/messages/${conversationId}`
  });
}

/**
 * Bulk create notifications for multiple users
 * @param {Array<Object>} notifications - Array of notification objects
 * @returns {Promise<Array>} Created notifications
 */
export async function createBulkNotifications(notifications) {
  try {
    const created = await prisma.notification.createMany({
      data: notifications.map(n => ({
        userId: n.userId,
        type: n.type,
        message: n.message,
        link: n.link || null,
        isRead: false
      }))
    });

    // Emit Socket.IO events for each notification
    try {
      const io = (await import('@/server')).io;
      if (io) {
        notifications.forEach(n => {
          io.to(`user:${n.userId}`).emit('notification', {
            type: n.type,
            message: n.message,
            link: n.link,
            isRead: false,
            createdAt: new Date()
          });
        });
      }
    } catch (socketError) {
      console.error('Socket.IO bulk emit error:', socketError.message);
    }

    return created;
  } catch (error) {
    console.error('Failed to create bulk notifications:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for verification)
 * @returns {Promise<Object>} Updated notification
 */
export async function markNotificationRead(notificationId, userId) {
  try {
    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      throw new Error('Notification not found or unauthorized');
    }

    // Update notification
    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    return updated;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
}

/**
 * Get unread notification count for user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Unread count
 */
export async function getUnreadCount(userId) {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });
    return count;
  } catch (error) {
    console.error('Failed to get unread count:', error);
    return 0;
  }
}

/**
 * Delete old read notifications (cleanup)
 * @param {number} daysOld - Delete notifications older than X days
 * @returns {Promise<number>} Number of deleted notifications
 */
export async function cleanupOldNotifications(daysOld = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: {
          lt: cutoffDate
        }
      }
    });

    console.log(`🧹 Cleaned up ${result.count} old notifications`);
    return result.count;
  } catch (error) {
    console.error('Failed to cleanup old notifications:', error);
    throw error;
  }
}

export default {
  createNotification,
  notifyBidPlaced,
  notifyOutbid,
  notifyAuctionWon,
  notifyAuctionLost,
  notifyAuctionStarting,
  notifyAuctionEnding,
  notifyPaymentReceived,
  notifyPaymentSent,
  notifyNewMessage,
  createBulkNotifications,
  markNotificationRead,
  getUnreadCount,
  cleanupOldNotifications
};

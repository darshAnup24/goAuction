/**
 * FEATURE 2: Auto-Bid Proxy Engine
 * 
 * This module handles automatic bidding on behalf of users.
 * Users set a maximum bid amount, and the system automatically places
 * incremental bids when they are outbid, up to their maximum.
 * 
 * SAFETY: This feature is controlled by ENABLE_AUTO_BID environment variable
 * and can be disabled without affecting existing bidding functionality.
 */

import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

const FEATURE_ENABLED = process.env.ENABLE_AUTO_BID === 'true';
const DEFAULT_INCREMENT = parseFloat(process.env.AUTO_BID_DEFAULT_INCREMENT || '5.00');
const MAX_AMOUNT_LIMIT = parseFloat(process.env.AUTO_BID_MAX_AMOUNT || '10000.00');

/**
 * Creates or updates a proxy bid for a user
 * @param {Object} params - Proxy bid parameters
 * @param {string} params.userId - User ID
 * @param {string} params.listingId - Listing ID
 * @param {number} params.maxAmount - Maximum bid amount
 * @param {number} params.incrementAmount - Increment amount (optional)
 * @returns {Promise<Object>} Created/updated proxy bid
 */
export async function createProxyBid({ userId, listingId, maxAmount, incrementAmount = DEFAULT_INCREMENT }) {
  if (!FEATURE_ENABLED) {
    throw new Error('Auto-bid feature is not enabled');
  }

  try {
    // Validate inputs
    if (!userId || !listingId || !maxAmount) {
      throw new Error('Missing required parameters');
    }

    if (maxAmount > MAX_AMOUNT_LIMIT) {
      throw new Error(`Maximum bid cannot exceed $${MAX_AMOUNT_LIMIT}`);
    }

    if (incrementAmount <= 0) {
      throw new Error('Increment amount must be positive');
    }

    // Get listing and validate
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        currentBid: true,
        startingPrice: true,
        status: true,
        endTime: true,
        sellerId: true
      }
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.sellerId === userId) {
      throw new Error('Cannot bid on your own listing');
    }

    if (listing.status !== 'LIVE') {
      throw new Error('Auction is not active');
    }

    if (new Date() > new Date(listing.endTime)) {
      throw new Error('Auction has ended');
    }

    const minimumBid = listing.currentBid > 0 
      ? listing.currentBid + incrementAmount 
      : listing.startingPrice;

    if (maxAmount < minimumBid) {
      throw new Error(`Maximum bid must be at least $${minimumBid.toFixed(2)}`);
    }

    // Upsert proxy bid (create or update)
    const proxyBid = await prisma.proxyBid.upsert({
      where: {
        userId_listingId: {
          userId,
          listingId
        }
      },
      create: {
        userId,
        listingId,
        maxAmount,
        currentAmount: 0,
        incrementAmount,
        isActive: true
      },
      update: {
        maxAmount,
        incrementAmount,
        isActive: true,
        updatedAt: new Date()
      },
      include: {
        listing: {
          select: {
            title: true,
            currentBid: true,
            endTime: true
          }
        }
      }
    });

    // If we should immediately place a bid, do so
    if (maxAmount > listing.currentBid) {
      const initialBidAmount = Math.min(
        listing.currentBid > 0 ? listing.currentBid + incrementAmount : listing.startingPrice,
        maxAmount
      );

      await placeProxyBid({
        proxyBidId: proxyBid.id,
        listingId,
        userId,
        amount: initialBidAmount
      });
    }

    return proxyBid;

  } catch (error) {
    console.error('[AutoBid] Create proxy bid error:', error);
    throw error;
  }
}

/**
 * Evaluates all active proxy bids after a new manual bid is placed
 * @param {string} listingId - Listing ID
 * @param {number} newBidAmount - The new bid amount
 * @param {string} newBidderId - User ID who placed the new bid
 * @returns {Promise<Object>} Result indicating if proxy bid was executed
 */
export async function evaluateProxyBids(listingId, newBidAmount, newBidderId) {
  if (!FEATURE_ENABLED) {
    return { executed: false, reason: 'Feature disabled' };
  }

  try {
    // Get all active proxy bids for this listing, excluding the new bidder
    const proxyBids = await prisma.proxyBid.findMany({
      where: {
        listingId,
        isActive: true,
        userId: { not: newBidderId }
      },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        }
      },
      orderBy: { maxAmount: 'desc' }
    });

    if (proxyBids.length === 0) {
      return { executed: false, reason: 'No active proxy bids' };
    }

    // Find the highest proxy bid that can beat the new bid
    for (const proxyBid of proxyBids) {
      if (proxyBid.maxAmount > newBidAmount) {
        // Calculate next bid amount
        const nextBidAmount = Math.min(
          newBidAmount + Number(proxyBid.incrementAmount),
          Number(proxyBid.maxAmount)
        );

        // Place the proxy bid
        const placedBid = await placeProxyBid({
          proxyBidId: proxyBid.id,
          listingId,
          userId: proxyBid.userId,
          amount: nextBidAmount
        });

        return {
          executed: true,
          bid: placedBid,
          proxyBidder: proxyBid.user,
          amount: nextBidAmount
        };
      }
    }

    // No proxy bid can beat the new bid, deactivate lower proxy bids
    await prisma.proxyBid.updateMany({
      where: {
        listingId,
        isActive: true,
        maxAmount: { lte: newBidAmount }
      },
      data: { isActive: false }
    });

    return { executed: false, reason: 'No proxy bid exceeds new bid' };

  } catch (error) {
    console.error('[AutoBid] Evaluate proxy bids error:', error);
    // Don't throw - graceful degradation
    return { executed: false, reason: 'Error evaluating proxy bids', error: error.message };
  }
}

/**
 * Places a bid on behalf of a proxy bidder (internal function)
 * @private
 */
async function placeProxyBid({ proxyBidId, listingId, userId, amount }) {
  return await prisma.$transaction(async (tx) => {
    // Get current listing state with lock
    const listing = await tx.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        version: true,
        currentBid: true,
        endTime: true,
        status: true,
        sellerId: true
      }
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    if (listing.status !== 'LIVE') {
      throw new Error('Auction is not active');
    }

    if (new Date() > new Date(listing.endTime)) {
      throw new Error('Auction has ended');
    }

    if (listing.sellerId === userId) {
      throw new Error('Cannot bid on own listing');
    }

    if (amount <= listing.currentBid) {
      throw new Error('Bid amount must be higher than current bid');
    }

    // Create the proxy bid
    const bid = await tx.bid.create({
      data: {
        listingId,
        bidderId: userId,
        amount,
        isProxy: true,  // Mark as proxy bid
        status: 'ACTIVE'
      },
      include: {
        bidder: {
          select: { id: true, username: true, email: true }
        }
      }
    });

    // Update listing (with version increment if enabled)
    const updateData = {
      currentBid: amount,
      bidCount: { increment: 1 }
    };

    // Only increment version if locking feature is enabled
    if (process.env.ENABLE_BID_LOCKING === 'true' && listing.version !== undefined) {
      updateData.version = { increment: 1 };
    }

    await tx.listing.update({
      where: { id: listingId },
      data: updateData
    });

    // Mark previous bids as outbid
    await tx.bid.updateMany({
      where: {
        listingId,
        id: { not: bid.id },
        status: 'ACTIVE'
      },
      data: { status: 'OUTBID' }
    });

    // Update proxy bid current amount
    await tx.proxyBid.update({
      where: { id: proxyBidId },
      data: { currentAmount: amount }
    });

    // Create notification (non-blocking)
    await tx.notification.create({
      data: {
        userId,
        type: 'BID_PLACED',
        message: `Your auto-bid placed a $${amount.toFixed(2)} bid`,
        link: `/listings/${listingId}`
      }
    }).catch(err => console.error('[AutoBid] Notification creation failed:', err));

    return bid;

  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    timeout: 10000
  });
}

/**
 * Cancels a proxy bid
 * @param {string} proxyBidId - Proxy bid ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} Cancelled proxy bid
 */
export async function cancelProxyBid(proxyBidId, userId) {
  if (!FEATURE_ENABLED) {
    throw new Error('Auto-bid feature is not enabled');
  }

  try {
    const proxyBid = await prisma.proxyBid.findUnique({
      where: { id: proxyBidId }
    });

    if (!proxyBid) {
      throw new Error('Proxy bid not found');
    }

    if (proxyBid.userId !== userId) {
      throw new Error('Unauthorized to cancel this proxy bid');
    }

    return await prisma.proxyBid.update({
      where: { id: proxyBidId },
      data: { isActive: false }
    });

  } catch (error) {
    console.error('[AutoBid] Cancel proxy bid error:', error);
    throw error;
  }
}

/**
 * Gets active proxy bids for a user
 * @param {string} userId - User ID
 * @param {string} listingId - Optional listing ID to filter
 * @returns {Promise<Array>} Array of active proxy bids
 */
export async function getUserProxyBids(userId, listingId = null) {
  if (!FEATURE_ENABLED) {
    return [];
  }

  try {
    const where = {
      userId,
      isActive: true
    };

    if (listingId) {
      where.listingId = listingId;
    }

    return await prisma.proxyBid.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            currentBid: true,
            endTime: true,
            status: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

  } catch (error) {
    console.error('[AutoBid] Get user proxy bids error:', error);
    return [];
  }
}

// Export feature status check
export function isAutoB idEnabled() {
  return FEATURE_ENABLED;
}

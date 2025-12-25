/**
 * FEATURE 1: Enhanced Bidding API with Optimistic Locking
 * 
 * POST /api/bids/v2 - Place bid with concurrency control
 * 
 * This is a NEW endpoint that doesn't modify existing /api/bids
 * Uses version-based optimistic locking to prevent race conditions
 * 
 * SAFETY: Feature flag controlled, doesn't modify existing endpoint
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { evaluateProxyBids } from '@/lib/features/autoBid_engine';

const FEATURE_ENABLED = process.env.ENABLE_BID_LOCKING === 'true';
const MAX_RETRIES = parseInt(process.env.BID_MAX_RETRIES || '3');
const RETRY_DELAY_MS = parseInt(process.env.BID_RETRY_DELAY_MS || '100');

/**
 * POST - Place a bid with optimistic locking
 */
export async function POST(req) {
  try {
    // Check feature flag
    if (!FEATURE_ENABLED) {
      return NextResponse.json(
        { 
          error: 'Bid locking feature is not enabled',
          note: 'Use /api/bids endpoint instead, or set ENABLE_BID_LOCKING=true',
          fallbackEndpoint: '/api/bids'
        },
        { status: 501 } // Not Implemented
      );
    }

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request
    const body = await req.json();
    const { listingId, amount, expectedVersion } = body;

    // Validate inputs
    if (!listingId || !amount) {
      return NextResponse.json(
        { error: 'listingId and amount are required' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 }
      );
    }

    if (expectedVersion !== undefined && typeof expectedVersion !== 'number') {
      return NextResponse.json(
        { error: 'expectedVersion must be a number' },
        { status: 400 }
      );
    }

    // Place bid with retry logic
    let lastError;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const result = await placeBidWithLock({
          listingId,
          amount,
          expectedVersion: expectedVersion ?? 0,
          userId: session.user.id
        });

        // Success - trigger proxy bid evaluation (non-blocking)
        if (process.env.ENABLE_AUTO_BID === 'true') {
          setTimeout(() => {
            evaluateProxyBids(listingId, amount, session.user.id)
              .then(proxyResult => {
                if (proxyResult.executed) {
                  console.log('[BidLocking] Proxy bid executed:', proxyResult.amount);
                }
              })
              .catch(err => console.error('[BidLocking] Proxy bid evaluation failed:', err));
          }, 100);
        }

        return NextResponse.json({
          success: true,
          bid: result.bid,
          newVersion: result.newVersion,
          message: 'Bid placed successfully',
          attempt: attempt + 1
        });

      } catch (error) {
        lastError = error;

        // Check if it's a retryable error (version mismatch)
        if (error.code === 'VERSION_MISMATCH') {
          // Fetch latest version for next retry
          const listing = await prisma.listing.findUnique({
            where: { id: listingId },
            select: { version: true, currentBid: true, status: true }
          });

          if (!listing) {
            return NextResponse.json(
              { error: 'Listing not found' },
              { status: 404 }
            );
          }

          if (listing.status !== 'LIVE') {
            return NextResponse.json(
              { error: 'Auction is not active' },
              { status: 410 }
            );
          }

          // Update expected version for next attempt
          body.expectedVersion = listing.version;

          // Exponential backoff
          if (attempt < MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
            continue;
          }
        }

        // Non-retryable error - break loop
        break;
      }
    }

    // All retries failed
    if (lastError?.code === 'VERSION_MISMATCH') {
      return NextResponse.json(
        {
          error: 'Unable to place bid due to high activity',
          code: 'CONCURRENT_MODIFICATION',
          message: 'Too many users bidding simultaneously. Please try again.',
          retries: MAX_RETRIES
        },
        { status: 409 } // Conflict
      );
    }

    // Other error
    throw lastError;

  } catch (error) {
    console.error('[BidLocking API] Error:', error);

    // Map errors to appropriate HTTP status codes
    const statusCode = error.code === 'BID_TOO_LOW' ? 400 :
                      error.code === 'AUCTION_ENDED' ? 410 :
                      error.code === 'OWN_LISTING' ? 403 :
                      error.code === 'NOT_FOUND' ? 404 :
                      500;

    return NextResponse.json(
      { 
        error: error.message || 'Failed to place bid',
        code: error.code,
        success: false
      },
      { status: statusCode }
    );
  }
}

/**
 * Places a bid with database-level optimistic locking
 * @private
 */
async function placeBidWithLock({ listingId, amount, expectedVersion, userId }) {
  return await prisma.$transaction(async (tx) => {
    // 1. Lock and fetch listing
    const listing = await tx.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        version: true,
        currentBid: true,
        startingPrice: true,
        endTime: true,
        status: true,
        sellerId: true
      }
    });

    if (!listing) {
      const error = new Error('Listing not found');
      error.code = 'NOT_FOUND';
      throw error;
    }

    // 2. Version check (optimistic lock)
    if (listing.version !== expectedVersion) {
      const error = new Error('Listing was modified by another user');
      error.code = 'VERSION_MISMATCH';
      error.expectedVersion = expectedVersion;
      error.actualVersion = listing.version;
      throw error;
    }

    // 3. Validate auction status
    if (listing.status !== 'LIVE') {
      const error = new Error('Auction is not active');
      error.code = 'AUCTION_ENDED';
      throw error;
    }

    if (new Date() > new Date(listing.endTime)) {
      const error = new Error('Auction has ended');
      error.code = 'AUCTION_ENDED';
      throw error;
    }

    // 4. Validate user isn't bidding on own listing
    if (listing.sellerId === userId) {
      const error = new Error('Cannot bid on your own listing');
      error.code = 'OWN_LISTING';
      throw error;
    }

    // 5. Validate bid amount
    const minimumBid = listing.currentBid > 0 
      ? listing.currentBid + 1 
      : listing.startingPrice;

    if (amount < minimumBid) {
      const error = new Error(`Bid must be at least $${minimumBid.toFixed(2)}`);
      error.code = 'BID_TOO_LOW';
      error.minimumBid = minimumBid;
      throw error;
    }

    // 6. Create the bid
    const bid = await tx.bid.create({
      data: {
        listingId,
        bidderId: userId,
        amount,
        status: 'ACTIVE',
        isProxy: false // Manual bid
      },
      include: {
        bidder: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    // 7. Update listing with new bid and increment version (atomic)
    const updatedListing = await tx.listing.update({
      where: {
        id: listingId,
        version: expectedVersion // Double-check version in update
      },
      data: {
        currentBid: amount,
        bidCount: { increment: 1 },
        version: { increment: 1 } // Increment version for next bid
      },
      select: {
        version: true,
        currentBid: true,
        bidCount: true
      }
    });

    // 8. Mark previous bids as outbid
    await tx.bid.updateMany({
      where: {
        listingId,
        id: { not: bid.id },
        status: 'ACTIVE'
      },
      data: {
        status: 'OUTBID'
      }
    });

    // 9. Create notification for previous bidder (non-blocking, best effort)
    try {
      const previousHighBidder = await tx.bid.findFirst({
        where: {
          listingId,
          id: { not: bid.id },
          status: 'OUTBID'
        },
        orderBy: { createdAt: 'desc' },
        select: { bidderId: true }
      });

      if (previousHighBidder) {
        await tx.notification.create({
          data: {
            userId: previousHighBidder.bidderId,
            type: 'BID_OUTBID',
            message: `You've been outbid! New bid: $${amount}`,
            link: `/listings/${listingId}`
          }
        });
      }
    } catch (notifError) {
      // Non-critical - log but don't fail transaction
      console.error('[BidLocking] Notification creation failed:', notifError);
    }

    return {
      bid,
      newVersion: updatedListing.version,
      previousBid: listing.currentBid
    };

  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 5000, // Wait up to 5 seconds for a connection
    timeout: 10000 // Transaction timeout: 10 seconds
  });
}

// OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json(
    { methods: ['POST', 'OPTIONS'] },
    {
      headers: {
        'Allow': 'POST, OPTIONS',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    }
  );
}

/**
 * FEATURE 2: Proxy Bid API Endpoints
 * 
 * POST   /api/bids/proxy - Create/update proxy bid
 * GET    /api/bids/proxy - Get user's proxy bids
 * DELETE /api/bids/proxy - Cancel proxy bid
 * 
 * SAFETY: Feature flag controlled, graceful degradation
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  createProxyBid,
  cancelProxyBid,
  getUserProxyBids,
  isAutoBidEnabled
} from '@/lib/features/autoBid_engine';

/**
 * POST - Create or update a proxy bid
 */
export async function POST(req) {
  try {
    // Check feature flag
    if (!isAutoBidEnabled()) {
      return NextResponse.json(
        { 
          error: 'Auto-bid feature is not enabled',
          note: 'Set ENABLE_AUTO_BID=true to enable this feature'
        },
        { status: 501 } // Not Implemented
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { listingId, maxAmount, incrementAmount } = body;

    // Validate inputs
    if (!listingId || !maxAmount) {
      return NextResponse.json(
        { error: 'listingId and maxAmount are required' },
        { status: 400 }
      );
    }

    if (typeof maxAmount !== 'number' || maxAmount <= 0) {
      return NextResponse.json(
        { error: 'maxAmount must be a positive number' },
        { status: 400 }
      );
    }

    if (incrementAmount && (typeof incrementAmount !== 'number' || incrementAmount <= 0)) {
      return NextResponse.json(
        { error: 'incrementAmount must be a positive number' },
        { status: 400 }
      );
    }

    // Create proxy bid
    const proxyBid = await createProxyBid({
      userId: session.user.id,
      listingId,
      maxAmount: parseFloat(maxAmount),
      incrementAmount: incrementAmount ? parseFloat(incrementAmount) : undefined
    });

    return NextResponse.json({
      success: true,
      proxyBid,
      message: `Auto-bidding activated up to $${maxAmount}`
    });

  } catch (error) {
    console.error('[ProxyBid API] POST error:', error);

    // Return user-friendly error messages
    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('not enabled') ? 501 :
                      error.message.includes('not active') ? 410 :
                      error.message.includes('ended') ? 410 :
                      error.message.includes('own listing') ? 403 :
                      400;

    return NextResponse.json(
      { 
        error: error.message || 'Failed to create proxy bid',
        success: false
      },
      { status: statusCode }
    );
  }
}

/**
 * GET - Get user's active proxy bids
 */
export async function GET(req) {
  try {
    // Check feature flag
    if (!isAutoBidEnabled()) {
      return NextResponse.json(
        { proxyBids: [], note: 'Auto-bid feature is disabled' },
        { status: 200 }
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

    // Get query params
    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get('listingId');

    // Get proxy bids
    const proxyBids = await getUserProxyBids(session.user.id, listingId);

    return NextResponse.json({ proxyBids });

  } catch (error) {
    console.error('[ProxyBid API] GET error:', error);

    // Graceful degradation - return empty array
    return NextResponse.json(
      { 
        proxyBids: [],
        error: 'Failed to fetch proxy bids'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Cancel a proxy bid
 */
export async function DELETE(req) {
  try {
    // Check feature flag
    if (!isAutoBidEnabled()) {
      return NextResponse.json(
        { error: 'Auto-bid feature is not enabled' },
        { status: 501 }
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

    // Get proxy bid ID from query params
    const { searchParams } = new URL(req.url);
    const proxyBidId = searchParams.get('id');

    if (!proxyBidId) {
      return NextResponse.json(
        { error: 'Proxy bid ID is required' },
        { status: 400 }
      );
    }

    // Cancel proxy bid
    await cancelProxyBid(proxyBidId, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Auto-bidding cancelled successfully'
    });

  } catch (error) {
    console.error('[ProxyBid API] DELETE error:', error);

    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('Unauthorized') ? 403 :
                      400;

    return NextResponse.json(
      { 
        error: error.message || 'Failed to cancel proxy bid',
        success: false
      },
      { status: statusCode }
    );
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return NextResponse.json(
    { methods: ['GET', 'POST', 'DELETE', 'OPTIONS'] },
    {
      headers: {
        'Allow': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
      }
    }
  );
}

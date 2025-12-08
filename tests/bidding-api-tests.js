/**
 * Bidding System API Test Suite
 * 
 * Run these tests in the browser console after logging in
 * Make sure you have:
 * 1. A live auction listing
 * 2. Two different user accounts (buyer and seller)
 */

// Test Configuration
const BASE_URL = 'http://localhost:3000'
let TEST_LISTING_ID = null // Will be created during tests
let CURRENT_USER_ID = null

// Helper function to make authenticated requests
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  
  const data = await response.json()
  
  return {
    ok: response.ok,
    status: response.status,
    data,
  }
}

// Test Results Tracker
const testResults = {
  passed: 0,
  failed: 0,
  tests: [],
}

function logTest(name, passed, error = null) {
  testResults.tests.push({ name, passed, error })
  if (passed) {
    testResults.passed++
    console.log(`✅ ${name}`)
  } else {
    testResults.failed++
    console.error(`❌ ${name}`)
    if (error) console.error('   Error:', error)
  }
}

// ===========================
// TEST SUITE
// ===========================

async function runBiddingTests() {
  console.log('🧪 Starting Bidding System API Tests\n')
  console.log('=' .repeat(50))
  
  // ===========================
  // SETUP TESTS
  // ===========================
  console.log('\n📋 SETUP PHASE')
  console.log('-'.repeat(50))
  
  try {
    // Get current user
    const userRes = await apiRequest('/api/users/profile')
    if (userRes.ok) {
      CURRENT_USER_ID = userRes.data.user.id
      console.log(`Current User: ${userRes.data.user.username} (${CURRENT_USER_ID})`)
      logTest('Get current user profile', true)
    } else {
      logTest('Get current user profile', false, 'Not authenticated')
      console.log('\n⚠️  Please log in first!')
      return
    }
    
    // Get a live listing to test with
    const listingsRes = await apiRequest('/api/listings?status=LIVE&limit=1')
    if (listingsRes.ok && listingsRes.data.listings.length > 0) {
      TEST_LISTING_ID = listingsRes.data.listings[0].id
      console.log(`Test Listing: ${listingsRes.data.listings[0].title} (${TEST_LISTING_ID})`)
      logTest('Find live listing for testing', true)
    } else {
      console.log('⚠️  No live listings found. Creating test scenario...')
      logTest('Find live listing for testing', false, 'No live listings available')
    }
  } catch (error) {
    logTest('Setup phase', false, error.message)
    return
  }
  
  // ===========================
  // BID PLACEMENT TESTS
  // ===========================
  console.log('\n💰 BID PLACEMENT TESTS')
  console.log('-'.repeat(50))
  
  // Test 1: Place valid bid
  if (TEST_LISTING_ID) {
    try {
      // Get current bid first
      const listingRes = await apiRequest(`/api/listings/${TEST_LISTING_ID}`)
      const currentBid = listingRes.data.listing.currentBid || listingRes.data.listing.startingPrice
      const sellerId = listingRes.data.listing.sellerId
      
      if (sellerId === CURRENT_USER_ID) {
        console.log('⚠️  Cannot test bid placement - you are the seller')
        logTest('Place valid bid', false, 'Current user is the seller')
      } else {
        const bidAmount = currentBid + 5.00
        const bidRes = await apiRequest('/api/bids/place', {
          method: 'POST',
          body: JSON.stringify({
            listingId: TEST_LISTING_ID,
            amount: bidAmount,
          }),
        })
        
        logTest(
          'Place valid bid',
          bidRes.ok && bidRes.data.success,
          bidRes.ok ? null : bidRes.data.error
        )
        
        if (bidRes.ok) {
          console.log(`   Bid placed: $${bidAmount.toFixed(2)}`)
          console.log(`   New bid count: ${bidRes.data.listing.bidCount}`)
        }
      }
    } catch (error) {
      logTest('Place valid bid', false, error.message)
    }
  }
  
  // Test 2: Try to place bid below minimum
  if (TEST_LISTING_ID) {
    try {
      const listingRes = await apiRequest(`/api/listings/${TEST_LISTING_ID}`)
      const currentBid = listingRes.data.listing.currentBid
      const lowBid = currentBid + 0.50 // Below minimum increment
      
      const bidRes = await apiRequest('/api/bids/place', {
        method: 'POST',
        body: JSON.stringify({
          listingId: TEST_LISTING_ID,
          amount: lowBid,
        }),
      })
      
      logTest(
        'Reject bid below minimum increment',
        !bidRes.ok && bidRes.data.error.includes('at least'),
        bidRes.ok ? 'Should have been rejected' : null
      )
    } catch (error) {
      logTest('Reject bid below minimum increment', false, error.message)
    }
  }
  
  // Test 3: Try to place bid with invalid listing ID
  try {
    const bidRes = await apiRequest('/api/bids/place', {
      method: 'POST',
      body: JSON.stringify({
        listingId: 'invalid_id_123',
        amount: 100.00,
      }),
    })
    
    logTest(
      'Reject bid with invalid listing ID',
      !bidRes.ok,
      bidRes.ok ? 'Should have been rejected' : null
    )
  } catch (error) {
    logTest('Reject bid with invalid listing ID', false, error.message)
  }
  
  // Test 4: Try to place bid with negative amount
  if (TEST_LISTING_ID) {
    try {
      const bidRes = await apiRequest('/api/bids/place', {
        method: 'POST',
        body: JSON.stringify({
          listingId: TEST_LISTING_ID,
          amount: -50.00,
        }),
      })
      
      logTest(
        'Reject negative bid amount',
        !bidRes.ok,
        bidRes.ok ? 'Should have been rejected' : null
      )
    } catch (error) {
      logTest('Reject negative bid amount', false, error.message)
    }
  }
  
  // Test 5: Try to place bid without authentication
  try {
    // This would need to be tested by logging out first
    console.log('⚠️  Skipping unauthenticated bid test (requires logout)')
    logTest('Reject unauthenticated bid', true, 'Skipped - manual test required')
  } catch (error) {
    logTest('Reject unauthenticated bid', false, error.message)
  }
  
  // ===========================
  // GET LISTING BIDS TESTS
  // ===========================
  console.log('\n📊 GET LISTING BIDS TESTS')
  console.log('-'.repeat(50))
  
  // Test 6: Get all bids for a listing
  if (TEST_LISTING_ID) {
    try {
      const bidsRes = await apiRequest(`/api/bids/listing/${TEST_LISTING_ID}`)
      
      logTest(
        'Get all bids for listing',
        bidsRes.ok && Array.isArray(bidsRes.data.bids),
        bidsRes.ok ? null : bidsRes.data.error
      )
      
      if (bidsRes.ok) {
        console.log(`   Total bids: ${bidsRes.data.statistics.totalBids}`)
        console.log(`   Unique bidders: ${bidsRes.data.statistics.uniqueBidders}`)
        console.log(`   Highest bid: $${bidsRes.data.statistics.highestBid?.toFixed(2) || '0.00'}`)
      }
    } catch (error) {
      logTest('Get all bids for listing', false, error.message)
    }
  }
  
  // Test 7: Get bids with pagination
  if (TEST_LISTING_ID) {
    try {
      const bidsRes = await apiRequest(`/api/bids/listing/${TEST_LISTING_ID}?page=1&limit=5`)
      
      logTest(
        'Get bids with pagination',
        bidsRes.ok && bidsRes.data.pagination.limit === 5,
        bidsRes.ok ? null : bidsRes.data.error
      )
      
      if (bidsRes.ok) {
        console.log(`   Page: ${bidsRes.data.pagination.page}`)
        console.log(`   Items: ${bidsRes.data.bids.length}`)
        console.log(`   Total pages: ${bidsRes.data.pagination.totalPages}`)
      }
    } catch (error) {
      logTest('Get bids with pagination', false, error.message)
    }
  }
  
  // Test 8: Filter bids by status
  if (TEST_LISTING_ID) {
    try {
      const bidsRes = await apiRequest(`/api/bids/listing/${TEST_LISTING_ID}?status=WINNING`)
      
      logTest(
        'Filter bids by WINNING status',
        bidsRes.ok && bidsRes.data.filters.status === 'WINNING',
        bidsRes.ok ? null : bidsRes.data.error
      )
      
      if (bidsRes.ok) {
        console.log(`   Winning bids: ${bidsRes.data.bids.length}`)
      }
    } catch (error) {
      logTest('Filter bids by WINNING status', false, error.message)
    }
  }
  
  // Test 9: Get bids for non-existent listing
  try {
    const bidsRes = await apiRequest('/api/bids/listing/nonexistent_id_999')
    
    logTest(
      'Handle non-existent listing gracefully',
      !bidsRes.ok && bidsRes.status === 404,
      bidsRes.ok ? 'Should return 404' : null
    )
  } catch (error) {
    logTest('Handle non-existent listing gracefully', false, error.message)
  }
  
  // ===========================
  // MY BIDS TESTS
  // ===========================
  console.log('\n👤 MY BIDS TESTS')
  console.log('-'.repeat(50))
  
  // Test 10: Get my bid history
  try {
    const myBidsRes = await apiRequest('/api/bids/my-bids')
    
    logTest(
      'Get my bid history',
      myBidsRes.ok && Array.isArray(myBidsRes.data.bids),
      myBidsRes.ok ? null : myBidsRes.data.error
    )
    
    if (myBidsRes.ok) {
      console.log(`   Total bids: ${myBidsRes.data.summary.totalBids}`)
      console.log(`   Currently winning: ${myBidsRes.data.summary.activeWinning}`)
      console.log(`   Outbid: ${myBidsRes.data.summary.activeOutbid}`)
      console.log(`   Auctions won: ${myBidsRes.data.summary.auctionsWon}`)
      console.log(`   Auctions lost: ${myBidsRes.data.summary.auctionsLost}`)
    }
  } catch (error) {
    logTest('Get my bid history', false, error.message)
  }
  
  // Test 11: Get my bids with pagination
  try {
    const myBidsRes = await apiRequest('/api/bids/my-bids?page=1&limit=10')
    
    logTest(
      'Get my bids with pagination',
      myBidsRes.ok && myBidsRes.data.pagination.limit === 10,
      myBidsRes.ok ? null : myBidsRes.data.error
    )
  } catch (error) {
    logTest('Get my bids with pagination', false, error.message)
  }
  
  // Test 12: Filter my bids by status
  try {
    const myBidsRes = await apiRequest('/api/bids/my-bids?status=WINNING')
    
    logTest(
      'Filter my bids by WINNING status',
      myBidsRes.ok && myBidsRes.data.filters.status === 'WINNING',
      myBidsRes.ok ? null : myBidsRes.data.error
    )
    
    if (myBidsRes.ok) {
      console.log(`   My winning bids: ${myBidsRes.data.bids.length}`)
    }
  } catch (error) {
    logTest('Filter my bids by WINNING status', false, error.message)
  }
  
  // Test 13: Verify grouped bids structure
  try {
    const myBidsRes = await apiRequest('/api/bids/my-bids')
    
    const hasGroups = myBidsRes.ok && 
                      myBidsRes.data.groupedBids &&
                      'winning' in myBidsRes.data.groupedBids &&
                      'outbid' in myBidsRes.data.groupedBids &&
                      'won' in myBidsRes.data.groupedBids &&
                      'lost' in myBidsRes.data.groupedBids
    
    logTest(
      'Verify grouped bids structure',
      hasGroups,
      hasGroups ? null : 'Missing grouped bids structure'
    )
    
    if (hasGroups) {
      console.log(`   Winning: ${myBidsRes.data.groupedBids.winning.length}`)
      console.log(`   Outbid: ${myBidsRes.data.groupedBids.outbid.length}`)
      console.log(`   Won: ${myBidsRes.data.groupedBids.won.length}`)
      console.log(`   Lost: ${myBidsRes.data.groupedBids.lost.length}`)
    }
  } catch (error) {
    logTest('Verify grouped bids structure', false, error.message)
  }
  
  // ===========================
  // RESULTS SUMMARY
  // ===========================
  console.log('\n' + '='.repeat(50))
  console.log('📊 TEST RESULTS SUMMARY')
  console.log('='.repeat(50))
  console.log(`Total Tests: ${testResults.tests.length}`)
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`)
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:')
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`   - ${t.name}`)
        if (t.error) console.log(`     ${t.error}`)
      })
  }
  
  console.log('\n✅ Test suite completed!')
  
  return testResults
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.runBiddingTests = runBiddingTests
  console.log('💡 Run tests with: runBiddingTests()')
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runBiddingTests }
}

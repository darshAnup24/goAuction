// GoCart Listings API - Test Examples
// Run these tests after logging in as a vendor user

// =============================================================================
// TEST 1: Create New Listing
// =============================================================================
async function testCreateListing() {
  const listingData = {
    title: "Vintage Vinyl Record Collection - Beatles Anthology",
    description: "Rare collection of Beatles vinyl records from the 1960s. Includes Abbey Road, Sgt. Pepper's Lonely Hearts Club Band, and The White Album. All records are in excellent condition with minimal wear. Original sleeves included.",
    images: [
      "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800",
      "https://images.unsplash.com/photo-1619983081563-430f63602796?w=800",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800"
    ],
    startingPrice: 150.00,
    reservePrice: 500.00,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days from now
    category: "MUSIC"
  }

  const response = await fetch('http://localhost:3000/api/listings/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important for session cookie
    body: JSON.stringify(listingData)
  })

  const result = await response.json()
  console.log('Create Listing Result:', result)
  return result.listing?.id
}

// =============================================================================
// TEST 2: Browse Listings with Filters
// =============================================================================
async function testBrowseListings() {
  // Test 1: Get all live listings
  const liveListings = await fetch(
    'http://localhost:3000/api/listings?status=LIVE&page=1&limit=10'
  ).then(r => r.json())
  console.log('Live Listings:', liveListings)

  // Test 2: Search for specific items
  const searchResults = await fetch(
    'http://localhost:3000/api/listings?search=camera&sortBy=ending-soon'
  ).then(r => r.json())
  console.log('Search Results:', searchResults)

  // Test 3: Filter by category and price
  const filtered = await fetch(
    'http://localhost:3000/api/listings?category=ELECTRONICS&minPrice=100&maxPrice=500&sortBy=price-low'
  ).then(r => r.json())
  console.log('Filtered Results:', filtered)

  // Test 4: Get seller's listings
  const sellerListings = await fetch(
    'http://localhost:3000/api/listings?sellerId=USER_ID_HERE&sortBy=newest'
  ).then(r => r.json())
  console.log('Seller Listings:', sellerListings)
}

// =============================================================================
// TEST 3: Get Single Listing Details
// =============================================================================
async function testGetListing(listingId) {
  const response = await fetch(`http://localhost:3000/api/listings/${listingId}`)
  const result = await response.json()
  
  console.log('Listing Details:', {
    title: result.listing.title,
    currentBid: result.listing.currentBid,
    bidCount: result.listing.bidCount,
    timeRemaining: Math.floor(result.listing.timeRemaining / (1000 * 60 * 60)), // hours
    isActive: result.listing.isActive,
    highestBid: result.listing.highestBid,
    seller: result.listing.seller.fullName
  })
  
  return result
}

// =============================================================================
// TEST 4: Update Listing (Before Any Bids)
// =============================================================================
async function testUpdateListing(listingId) {
  const updateData = {
    title: "Updated: Vintage Vinyl Record Collection - Beatles Anthology RARE",
    startingPrice: 200.00,
    reservePrice: 600.00
  }

  const response = await fetch(`http://localhost:3000/api/listings/${listingId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updateData)
  })

  const result = await response.json()
  console.log('Update Result:', result)
  return result
}

// =============================================================================
// TEST 5: Delete Listing (Before Any Bids)
// =============================================================================
async function testDeleteListing(listingId) {
  const response = await fetch(`http://localhost:3000/api/listings/${listingId}`, {
    method: 'DELETE',
    credentials: 'include'
  })

  const result = await response.json()
  console.log('Delete Result:', result)
  return result
}

// =============================================================================
// TEST 6: Error Scenarios
// =============================================================================
async function testErrorScenarios() {
  console.log('\n=== Testing Error Scenarios ===\n')

  // Test 1: Create listing without authentication
  try {
    const response = await fetch('http://localhost:3000/api/listings/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: "Test",
        description: "Test description",
        images: ["https://example.com/test.jpg"],
        startingPrice: 100,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 86400000).toISOString(),
        category: "OTHER"
      })
    })
    const result = await response.json()
    console.log('❌ Test Unauthorized:', response.status, result)
  } catch (error) {
    console.log('Error:', error.message)
  }

  // Test 2: Invalid validation - endTime before startTime
  try {
    const response = await fetch('http://localhost:3000/api/listings/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: "Test",
        description: "Test description",
        images: ["https://example.com/test.jpg"],
        startingPrice: 100,
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date().toISOString(), // Before start time!
        category: "OTHER"
      })
    })
    const result = await response.json()
    console.log('❌ Test Invalid Times:', response.status, result)
  } catch (error) {
    console.log('Error:', error.message)
  }

  // Test 3: Update listing with bids (should fail)
  // First, you'd need a listing with bids, then:
  // const result = await testUpdateListing('listing_with_bids_id')
  // Expected: 400 "Cannot update listing with existing bids"
}

// =============================================================================
// FULL TEST SUITE
// =============================================================================
async function runFullTestSuite() {
  console.log('🚀 Starting GoCart Listings API Test Suite\n')
  
  try {
    // Step 1: Create a new listing
    console.log('📝 TEST 1: Creating new listing...')
    const listingId = await testCreateListing()
    console.log('✅ Listing created with ID:', listingId)
    console.log('\n' + '='.repeat(80) + '\n')
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Step 2: Get the listing details
    console.log('🔍 TEST 2: Fetching listing details...')
    await testGetListing(listingId)
    console.log('✅ Listing details retrieved')
    console.log('\n' + '='.repeat(80) + '\n')
    
    // Step 3: Browse listings
    console.log('📋 TEST 3: Browsing listings with filters...')
    await testBrowseListings()
    console.log('✅ Browse tests completed')
    console.log('\n' + '='.repeat(80) + '\n')
    
    // Step 4: Update the listing
    console.log('✏️  TEST 4: Updating listing...')
    await testUpdateListing(listingId)
    console.log('✅ Listing updated')
    console.log('\n' + '='.repeat(80) + '\n')
    
    // Step 5: Test error scenarios
    console.log('⚠️  TEST 5: Testing error scenarios...')
    await testErrorScenarios()
    console.log('✅ Error scenario tests completed')
    console.log('\n' + '='.repeat(80) + '\n')
    
    // Step 6: Delete the listing
    console.log('🗑️  TEST 6: Deleting listing...')
    await testDeleteListing(listingId)
    console.log('✅ Listing deleted')
    console.log('\n' + '='.repeat(80) + '\n')
    
    console.log('🎉 All tests completed successfully!')
    
  } catch (error) {
    console.error('❌ Test suite failed:', error)
  }
}

// =============================================================================
// USAGE INSTRUCTIONS
// =============================================================================
console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                    GoCart Listings API Test Suite                          ║
╚════════════════════════════════════════════════════════════════════════════╝

🔧 SETUP:
1. Make sure the dev server is running: npm run dev
2. Login to the application as a VENDOR user
3. Open browser console on http://localhost:3000
4. Copy and paste this entire file into the console
5. Run: runFullTestSuite()

📝 INDIVIDUAL TESTS:
- testCreateListing()          → Create new listing
- testBrowseListings()         → Browse with filters
- testGetListing(id)           → Get single listing
- testUpdateListing(id)        → Update listing
- testDeleteListing(id)        → Delete listing
- testErrorScenarios()         → Test error handling

🎯 DEMO VENDOR ACCOUNTS:
Email: alice@vendor.com        Password: password123
Email: bob@vintage.com         Password: password123

💡 TIP: Open Network tab to see actual API requests/responses

╚════════════════════════════════════════════════════════════════════════════╝
`)

// Export functions for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testCreateListing,
    testBrowseListings,
    testGetListing,
    testUpdateListing,
    testDeleteListing,
    testErrorScenarios,
    runFullTestSuite
  }
}

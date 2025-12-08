import { NextResponse } from 'next/server';
import { 
  sendWelcomeEmail, 
  sendBidPlacedEmail, 
  sendOutbidEmail,
  sendAuctionWonEmail,
  sendPaymentReceivedEmail,
  sendAuctionNoBidsEmail
} from '@/lib/email';

export async function POST(req) {
  try {
    const { email, template } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email address required' }, { status: 400 });
    }
    
    // Test data
    const testData = {
      email,
      username: 'Test User',
      sellerName: 'John Seller',
      bidderName: 'Jane Bidder',
      winnerName: 'Jane Winner',
      buyerName: 'Jane Buyer',
      productName: 'Vintage Camera',
      productId: 'prod_123',
      bidAmount: '125.00',
      yourBid: '100.00',
      newBid: '125.00',
      finalBid: '150.00',
      amount: '150.00',
      platformFee: '7.50',
      sellerPayout: '142.50',
      startingBid: '50.00',
      currentBidCount: 5,
    };
    
    let results = [];
    
    if (template === 'all' || !template) {
      // Test all templates
      const tests = [
        { name: 'Welcome', fn: () => sendWelcomeEmail({ to: email, username: testData.username }) },
        { 
          name: 'Bid Placed', 
          fn: () => sendBidPlacedEmail({
            to: email,
            sellerName: testData.sellerName,
            bidderName: testData.bidderName,
            bidAmount: testData.bidAmount,
            productName: testData.productName,
            productId: testData.productId,
            currentBidCount: testData.currentBidCount,
          })
        },
        {
          name: 'Outbid',
          fn: () => sendOutbidEmail({
            to: email,
            bidderName: testData.bidderName,
            productName: testData.productName,
            yourBid: testData.yourBid,
            newBid: testData.newBid,
            productId: testData.productId,
          })
        },
        {
          name: 'Auction Won',
          fn: () => sendAuctionWonEmail({
            to: email,
            winnerName: testData.winnerName,
            productName: testData.productName,
            finalBid: testData.finalBid,
            productId: testData.productId,
            sellerName: testData.sellerName,
          })
        },
        {
          name: 'Payment Received',
          fn: () => sendPaymentReceivedEmail({
            to: email,
            sellerName: testData.sellerName,
            buyerName: testData.buyerName,
            amount: testData.amount,
            productName: testData.productName,
            platformFee: testData.platformFee,
            sellerPayout: testData.sellerPayout,
          })
        },
        {
          name: 'Auction No Bids',
          fn: () => sendAuctionNoBidsEmail({
            to: email,
            sellerName: testData.sellerName,
            productName: testData.productName,
            productId: testData.productId,
            startingBid: testData.startingBid,
          })
        },
      ];
      
      for (const test of tests) {
        const result = await test.fn();
        results.push({
          template: test.name,
          success: result.success,
          error: result.error,
          emailId: result.data?.id,
        });
        
        // Add 600ms delay between emails to avoid rate limiting (2 per second = 500ms minimum)
        if (tests.indexOf(test) < tests.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      }
    } else {
      // Test specific template
      let result;
      switch (template) {
        case 'welcome':
          result = await sendWelcomeEmail({ to: email, username: testData.username });
          break;
        case 'bid-placed':
          result = await sendBidPlacedEmail({
            to: email,
            sellerName: testData.sellerName,
            bidderName: testData.bidderName,
            bidAmount: testData.bidAmount,
            productName: testData.productName,
            productId: testData.productId,
            currentBidCount: testData.currentBidCount,
          });
          break;
        case 'outbid':
          result = await sendOutbidEmail({
            to: email,
            bidderName: testData.bidderName,
            productName: testData.productName,
            yourBid: testData.yourBid,
            newBid: testData.newBid,
            productId: testData.productId,
          });
          break;
        case 'auction-won':
          result = await sendAuctionWonEmail({
            to: email,
            winnerName: testData.winnerName,
            productName: testData.productName,
            finalBid: testData.finalBid,
            productId: testData.productId,
            sellerName: testData.sellerName,
          });
          break;
        case 'payment-received':
          result = await sendPaymentReceivedEmail({
            to: email,
            sellerName: testData.sellerName,
            buyerName: testData.buyerName,
            amount: testData.amount,
            productName: testData.productName,
            platformFee: testData.platformFee,
            sellerPayout: testData.sellerPayout,
          });
          break;
        case 'no-bids':
          result = await sendAuctionNoBidsEmail({
            to: email,
            sellerName: testData.sellerName,
            productName: testData.productName,
            productId: testData.productId,
            startingBid: testData.startingBid,
          });
          break;
        default:
          return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
      }
      
      results.push({
        template,
        success: result.success,
        error: result.error,
        emailId: result.data?.id,
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `Test email${results.length > 1 ? 's' : ''} sent to ${email}`,
      results,
    });
    
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

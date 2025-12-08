import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSocket } from "@/lib/socket";

/**
 * Cron Job: Expire Auctions
 * 
 * This API route is called periodically (every minute) to automatically
 * expire auctions when their end time has passed.
 * 
 * Vercel Cron Configuration: See vercel.json
 * 
 * GET /api/cron/expire-auctions
 * 
 * Authorization: Vercel Cron Secret (CRON_SECRET env variable)
 */
export async function GET(request) {
  const startTime = Date.now();

  try {
    // Verify cron secret (security check)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("❌ Unauthorized cron job attempt");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🕐 Starting auction expiration check...");

    // Find all live auctions that have expired
    const expiredAuctions = await prisma.listing.findMany({
      where: {
        type: "AUCTION",
        status: "LIVE",
        endTime: {
          lte: new Date(), // End time has passed
        },
      },
      include: {
        bids: {
          orderBy: { amount: "desc" },
          take: 1,
          include: {
            bidder: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        seller: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    console.log(`📦 Found ${expiredAuctions.length} expired auctions`);

    if (expiredAuctions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No auctions to expire",
        processed: 0,
        duration: `${Date.now() - startTime}ms`,
      });
    }

    const results = {
      sold: [],
      unsold: [],
      errors: [],
    };

    // Process each expired auction
    for (const auction of expiredAuctions) {
      try {
        const highestBid = auction.bids[0];
        const hasReserveMet = auction.reservePrice
          ? auction.currentBid >= auction.reservePrice
          : true;

        let newStatus;
        let winnerId = null;

        // Determine new status
        if (highestBid && hasReserveMet) {
          // Auction sold successfully
          newStatus = "SOLD";
          winnerId = highestBid.bidderId;
        } else if (highestBid && !hasReserveMet) {
          // Reserve price not met
          newStatus = "UNSOLD";
        } else {
          // No bids received
          newStatus = "UNSOLD";
        }

        // Update auction status in database
        const updatedAuction = await prisma.$transaction(async (tx) => {
          // Calculate payment due date (7 days from now)
          const paymentDueDate = new Date();
          paymentDueDate.setDate(paymentDueDate.getDate() + 7);

          // Update listing
          const listing = await tx.listing.update({
            where: { id: auction.id },
            data: {
              status: newStatus,
              winnerId: winnerId,
              paymentRequired: newStatus === "SOLD",
              paymentDueDate: newStatus === "SOLD" ? paymentDueDate : null,
            },
          });

          // Update winning bid status
          if (winnerId && highestBid) {
            await tx.bid.update({
              where: { id: highestBid.id },
              data: { status: "WON" },
            });

            // Mark other bids as lost
            await tx.bid.updateMany({
              where: {
                listingId: auction.id,
                id: { not: highestBid.id },
                status: { in: ["WINNING", "OUTBID"] },
              },
              data: { status: "LOST" },
            });
          } else {
            // No winner - mark all bids as lost
            await tx.bid.updateMany({
              where: {
                listingId: auction.id,
                status: { in: ["WINNING", "OUTBID"] },
              },
              data: { status: "LOST" },
            });
          }

          return listing;
        });

        // Emit Socket.IO event for real-time updates
        const io = getSocket();
        if (io) {
          io.to(`listing:${auction.id}`).emit("auction:ended", {
            listingId: auction.id,
            winnerId: winnerId,
            winningBid: winnerId ? auction.currentBid : null,
            status: newStatus,
            message: winnerId
              ? "Auction has ended! Winner determined."
              : "Auction has ended. No winner.",
            timestamp: new Date().toISOString(),
          });
        }

        // Track result
        if (newStatus === "SOLD") {
          results.sold.push({
            id: auction.id,
            title: auction.title,
            finalPrice: auction.currentBid,
            winner: highestBid.bidder.username,
            bids: auction.bidCount,
          });

          console.log(`✅ Auction SOLD: "${auction.title}" - $${auction.currentBid} to ${highestBid.bidder.username}`);
        } else {
          results.unsold.push({
            id: auction.id,
            title: auction.title,
            highestBid: auction.currentBid,
            reserveMet: hasReserveMet,
            bids: auction.bidCount,
          });

          console.log(`❌ Auction UNSOLD: "${auction.title}" - ${!hasReserveMet ? "Reserve not met" : "No bids"}`);
        }

        // Send email notifications
        try {
          const { sendAuctionWonEmail, sendAuctionNoBidsEmail, sendOutbidEmail } = await import('@/lib/email');
          
          if (newStatus === "SOLD" && winnerId && highestBid) {
            // Send winner email
            await sendAuctionWonEmail({
              to: highestBid.bidder.email,
              winnerName: highestBid.bidder.fullName || highestBid.bidder.username,
              productName: auction.title,
              finalBid: auction.currentBid,
              productId: auction.id,
              sellerName: auction.seller.username,
            });
            console.log(`📧 Winner email sent to ${highestBid.bidder.email}`);

            // Notify all losing bidders
            const losingBidders = await prisma.bid.findMany({
              where: {
                listingId: auction.id,
                id: { not: highestBid.id },
              },
              include: {
                bidder: {
                  select: {
                    email: true,
                    fullName: true,
                    username: true,
                  },
                },
              },
              distinct: ['bidderId'],
            });

            for (const losingBid of losingBidders) {
              await sendOutbidEmail({
                to: losingBid.bidder.email,
                bidderName: losingBid.bidder.fullName || losingBid.bidder.username,
                productName: auction.title,
                yourBid: losingBid.amount,
                currentBid: auction.currentBid,
                productId: auction.id,
              });
            }
            console.log(`📧 Sent ${losingBidders.length} losing bidder notifications`);
          } else if (newStatus === "UNSOLD" && auction.bidCount === 0) {
            // No bids received - notify seller
            await sendAuctionNoBidsEmail({
              to: auction.seller.email,
              sellerName: auction.seller.username,
              productName: auction.title,
              productId: auction.id,
              startingBid: auction.startingPrice,
            });
            console.log(`📧 No bids email sent to seller ${auction.seller.email}`);
          }
        } catch (emailError) {
          console.error(`⚠️ Email notification error for auction ${auction.id}:`, emailError);
        }

      } catch (error) {
        console.error(`⚠️ Error processing auction ${auction.id}:`, error);
        results.errors.push({
          id: auction.id,
          title: auction.title,
          error: error.message,
        });
      }
    }

    const duration = Date.now() - startTime;

    console.log(`
✅ Auction expiration completed
────────────────────────────────
📦 Total processed: ${expiredAuctions.length}
💰 Sold: ${results.sold.length}
📉 Unsold: ${results.unsold.length}
❌ Errors: ${results.errors.length}
⏱️  Duration: ${duration}ms
────────────────────────────────
    `);

    return NextResponse.json({
      success: true,
      message: "Auctions processed successfully",
      processed: expiredAuctions.length,
      results: {
        sold: results.sold.length,
        unsold: results.unsold.length,
        errors: results.errors.length,
      },
      details: results,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ Cron job error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process expired auctions",
        message: error.message,
        duration: `${Date.now() - startTime}ms`,
      },
      { status: 500 }
    );
  }
}

/**
 * Allow POST method as well (for manual trigger during testing)
 */
export async function POST(request) {
  return GET(request);
}

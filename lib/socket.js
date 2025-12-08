import { Server } from "socket.io";

/**
 * Socket.IO API Route Handler for Next.js
 * 
 * This handles Socket.IO events from API routes when running with custom server.
 * Used to emit events from API routes (e.g., after bid placement).
 */

let io;

/**
 * Initialize Socket.IO instance
 * @param {Object} server - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
export function initSocket(server) {
  if (!io) {
    io = new Server(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      path: "/socket.io",
    });

    console.log("✅ Socket.IO initialized");
  }

  return io;
}

/**
 * Get existing Socket.IO instance
 * @returns {Server|null} Socket.IO server instance or null
 */
export function getSocket() {
  return io || null;
}

/**
 * Emit bid placed event to all users in listing room
 * @param {string} listingId - Listing ID
 * @param {Object} data - Bid data to broadcast
 */
export function emitBidPlaced(listingId, data) {
  if (!io) {
    console.warn("⚠️ Socket.IO not initialized, skipping emit");
    return;
  }

  io.to(`listing:${listingId}`).emit("bid:new", {
    ...data,
    timestamp: new Date().toISOString(),
  });

  console.log(`💰 Bid broadcast to listing:${listingId}`);
}

/**
 * Emit auction ending soon alert
 * @param {string} listingId - Listing ID
 * @param {number} timeRemaining - Time remaining in milliseconds
 */
export function emitAuctionEndingSoon(listingId, timeRemaining) {
  if (!io) return;

  io.to(`listing:${listingId}`).emit("auction:ending-soon", {
    listingId,
    timeRemaining,
    message: "Auction ending soon! Place your bid now.",
    timestamp: new Date().toISOString(),
  });

  console.log(`⏰ Ending soon alert for listing:${listingId}`);
}

/**
 * Emit auction ended event
 * @param {string} listingId - Listing ID
 * @param {string} winnerId - Winner user ID
 * @param {number} winningBid - Final winning bid amount
 */
export function emitAuctionEnded(listingId, winnerId, winningBid) {
  if (!io) return;

  io.to(`listing:${listingId}`).emit("auction:ended", {
    listingId,
    winnerId,
    winningBid,
    message: "Auction has ended!",
    timestamp: new Date().toISOString(),
  });

  console.log(`🏁 Auction ended for listing:${listingId}`);
}

/**
 * Custom Next.js Server with Socket.IO
 * 
 * This server adds real-time WebSocket support to Next.js App Router.
 * It runs alongside Next.js and handles Socket.IO connections for live auction updates.
 */

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { initCronJobs, stopCronJobs } = require("./lib/cron");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store active connections by listing ID
const listingRooms = new Map();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || `http://${hostname}:${port}`,
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io",
    transports: ["websocket", "polling"],
  });

  // Socket.IO connection handler
  io.on("connection", (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    /**
     * Join a listing room to receive real-time updates
     * Event: 'listing:join'
     * Payload: { listingId: string }
     */
    socket.on("listing:join", (data) => {
      const { listingId } = data;
      
      if (!listingId) {
        socket.emit("error", { message: "listingId is required" });
        return;
      }

      socket.join(`listing:${listingId}`);
      
      // Track room membership
      if (!listingRooms.has(listingId)) {
        listingRooms.set(listingId, new Set());
      }
      listingRooms.get(listingId).add(socket.id);

      console.log(`👥 Socket ${socket.id} joined listing:${listingId}`);
      
      // Send confirmation
      socket.emit("listing:joined", { listingId });
    });

    /**
     * Leave a listing room
     * Event: 'listing:leave'
     * Payload: { listingId: string }
     */
    socket.on("listing:leave", (data) => {
      const { listingId } = data;
      
      if (!listingId) return;

      socket.leave(`listing:${listingId}`);
      
      // Remove from tracking
      if (listingRooms.has(listingId)) {
        listingRooms.get(listingId).delete(socket.id);
        if (listingRooms.get(listingId).size === 0) {
          listingRooms.delete(listingId);
        }
      }

      console.log(`👋 Socket ${socket.id} left listing:${listingId}`);
    });

    /**
     * Broadcast new bid to all users viewing the listing
     * This is called from API route after successful bid placement
     */
    socket.on("bid:placed", (data) => {
      const { listingId, bid, listing, previousHighestBid } = data;
      
      if (!listingId) return;

      // Broadcast to all users in the listing room (except sender)
      socket.to(`listing:${listingId}`).emit("bid:new", {
        bid,
        listing,
        previousHighestBid,
        timestamp: new Date().toISOString(),
      });

      console.log(`💰 New bid broadcast to listing:${listingId}`, {
        amount: bid.amount,
        bidder: bid.bidder.username,
      });
    });

    /**
     * Notify when auction is ending soon (< 5 minutes)
     */
    socket.on("auction:ending-soon", (data) => {
      const { listingId, timeRemaining } = data;
      
      if (!listingId) return;

      io.to(`listing:${listingId}`).emit("auction:ending-soon", {
        listingId,
        timeRemaining,
        message: "Auction ending soon! Place your bid now.",
        timestamp: new Date().toISOString(),
      });

      console.log(`⏰ Ending soon alert for listing:${listingId}`);
    });

    /**
     * Notify when auction has ended
     */
    socket.on("auction:ended", (data) => {
      const { listingId, winnerId, winningBid } = data;
      
      if (!listingId) return;

      io.to(`listing:${listingId}`).emit("auction:ended", {
        listingId,
        winnerId,
        winningBid,
        message: "Auction has ended!",
        timestamp: new Date().toISOString(),
      });

      console.log(`🏁 Auction ended for listing:${listingId}`, {
        winner: winnerId,
        amount: winningBid,
      });

      // Clean up room after a delay
      setTimeout(() => {
        if (listingRooms.has(listingId)) {
          listingRooms.delete(listingId);
        }
      }, 60000); // 1 minute delay
    });

    /**
     * Handle disconnection
     */
    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      
      // Clean up room memberships
      listingRooms.forEach((sockets, listingId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            listingRooms.delete(listingId);
          }
        }
      });
    });

    /**
     * Handle errors
     */
    socket.on("error", (error) => {
      console.error(`⚠️ Socket error (${socket.id}):`, error);
    });
  });

  // Start the server
  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 Server ready on http://${hostname}:${port}`);
    console.log(`🔌 Socket.IO ready for real-time updates`);
    
    // Initialize cron jobs for self-hosted deployments
    if (!process.env.VERCEL) {
      initCronJobs();
      console.log(`⏰ Cron jobs initialized (self-hosted mode)`);
    } else {
      console.log(`☁️  Using Vercel Cron (see vercel.json)`);
    }
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    stopCronJobs();
    httpServer.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    console.log("SIGINT signal received: closing HTTP server");
    stopCronJobs();
    httpServer.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  });
});

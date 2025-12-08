/**
 * Stripe Integration Helper
 * 
 * Server-side Stripe initialization and helper functions
 */

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
  typescript: true,
});

/**
 * Calculate platform fee (5% of transaction)
 */
export function calculatePlatformFee(amount) {
  return Math.round(amount * 0.05 * 100) / 100; // 5% fee
}

/**
 * Calculate seller payout after platform fee
 */
export function calculateSellerPayout(amount) {
  const platformFee = calculatePlatformFee(amount);
  return amount - platformFee;
}

/**
 * Format amount for Stripe (convert to cents)
 */
export function formatAmountForStripe(amount) {
  return Math.round(amount * 100);
}

/**
 * Format amount from Stripe (convert from cents)
 */
export function formatAmountFromStripe(amount) {
  return amount / 100;
}

/**
 * Get Stripe publishable key for client-side
 */
export function getStripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}

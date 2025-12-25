/**
 * Email Utility Library
 * 
 * This module provides functions for sending transactional emails using Resend and React Email.
 * All email templates are located in the /emails directory.
 * 
 * Configuration:
 * - RESEND_API_KEY: Your Resend API key (from .env)
 * - RESEND_FROM_EMAIL: The "from" email address (default: onboarding@resend.dev for testing)
 * 
 * Usage:
 * import { sendWelcomeEmail, sendBidPlacedEmail } from '@/lib/email';
 * await sendWelcomeEmail({ to: 'user@example.com', username: 'John' });
 */

import { Resend } from 'resend';
import { render } from '@react-email/render';
import React from 'react';
import WelcomeEmail from '../emails/WelcomeEmail.jsx';
import BidPlacedEmail from '../emails/BidPlacedEmail.jsx';
import OutbidEmail from '../emails/OutbidEmail.jsx';
import AuctionWonEmail from '../emails/AuctionWonEmail.jsx';
import PaymentReceivedEmail from '../emails/PaymentReceivedEmail.jsx';
import AuctionNoBidsEmail from '../emails/AuctionNoBidsEmail.jsx';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Default "from" email address
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'GoCart <onboarding@resend.dev>';

/**
 * Base function to send emails using Resend
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {React.Component} options.template - React Email template
 * @param {Object} options.templateProps - Props to pass to the template
 * @returns {Promise<Object>} - Resend API response
 */
async function sendEmail({ to, subject, template, templateProps }) {
  try {
    // Render the React component to HTML string
    // Note: render() in v2.0.0 might be async
    const html = await render(React.createElement(template, templateProps));
    
    // Debug: Check what render() returns
    console.log('🔍 Rendered HTML type:', typeof html);
    console.log('🔍 Rendered HTML preview:', String(html).substring(0, 100));

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('❌ Email send error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('✅ Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Email send exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email to new users
 * @param {Object} params
 * @param {string} params.to - User's email address
 * @param {string} params.username - User's username or name
 */
export async function sendWelcomeEmail({ to, username }) {
  return await sendEmail({
    to,
    subject: '🎉 Welcome to GoCart - Start Bidding Now!',
    template: WelcomeEmail,
    templateProps: { username },
  });
}

/**
 * Send email to seller when a new bid is placed
 * @param {Object} params
 * @param {string} params.to - Seller's email address
 * @param {string} params.sellerName - Seller's name
 * @param {string} params.bidderName - Bidder's name
 * @param {string} params.bidAmount - Bid amount (formatted)
 * @param {string} params.productName - Product name
 * @param {string} params.productId - Product ID
 * @param {number} params.currentBidCount - Total number of bids
 */
export async function sendBidPlacedEmail({
  to,
  sellerName,
  bidderName,
  bidAmount,
  productName,
  productId,
  currentBidCount,
}) {
  return await sendEmail({
    to,
    subject: `🔨 New Bid on ${productName}!`,
    template: BidPlacedEmail,
    templateProps: {
      sellerName,
      bidderName,
      bidAmount,
      productName,
      productId,
      currentBidCount,
    },
  });
}

/**
 * Send email to bidder when they've been outbid
 * @param {Object} params
 * @param {string} params.to - Bidder's email address
 * @param {string} params.bidderName - Bidder's name
 * @param {string} params.productName - Product name
 * @param {string} params.yourBid - Their bid amount (formatted)
 * @param {string} params.newBid - New highest bid amount (formatted)
 * @param {string} params.productId - Product ID
 */
export async function sendOutbidEmail({
  to,
  bidderName,
  productName,
  yourBid,
  newBid,
  productId,
}) {
  return await sendEmail({
    to,
    subject: `⚠️ You've Been Outbid on ${productName}!`,
    template: OutbidEmail,
    templateProps: {
      bidderName,
      productName,
      yourBid,
      newBid,
      productId,
    },
  });
}

/**
 * Send email to winner when auction ends
 * @param {Object} params
 * @param {string} params.to - Winner's email address
 * @param {string} params.winnerName - Winner's name
 * @param {string} params.productName - Product name
 * @param {string} params.finalBid - Final winning bid amount (formatted)
 * @param {string} params.productId - Product ID
 * @param {string} params.sellerName - Seller's name
 */
export async function sendAuctionWonEmail({
  to,
  winnerName,
  productName,
  finalBid,
  productId,
  sellerName,
}) {
  return await sendEmail({
    to,
    subject: `🎉 Congratulations! You Won ${productName}!`,
    template: AuctionWonEmail,
    templateProps: {
      winnerName,
      productName,
      finalBid,
      productId,
      sellerName,
    },
  });
}

/**
 * Send email to seller when payment is received
 * @param {Object} params
 * @param {string} params.to - Seller's email address
 * @param {string} params.sellerName - Seller's name
 * @param {string} params.buyerName - Buyer's name
 * @param {string} params.amount - Total payment amount (formatted)
 * @param {string} params.productName - Product name
 * @param {string} params.platformFee - Platform fee (5% formatted)
 * @param {string} params.sellerPayout - Seller's payout after fee (formatted)
 */
export async function sendPaymentReceivedEmail({
  to,
  sellerName,
  buyerName,
  amount,
  productName,
  platformFee,
  sellerPayout,
}) {
  return await sendEmail({
    to,
    subject: `💰 Payment Received for ${productName}!`,
    template: PaymentReceivedEmail,
    templateProps: {
      sellerName,
      buyerName,
      amount,
      productName,
      platformFee,
      sellerPayout,
    },
  });
}

/**
 * Send email to seller when auction ends with no bids
 * @param {Object} params
 * @param {string} params.to - Seller's email address
 * @param {string} params.sellerName - Seller's name
 * @param {string} params.productName - Product name
 * @param {string} params.productId - Product ID
 * @param {string} params.startingBid - Original starting bid (formatted)
 */
export async function sendAuctionNoBidsEmail({
  to,
  sellerName,
  productName,
  productId,
  startingBid,
}) {
  return await sendEmail({
    to,
    subject: `📭 Your Auction for ${productName} Has Ended`,
    template: AuctionNoBidsEmail,
    templateProps: {
      sellerName,
      productName,
      productId,
      startingBid,
    },
  });
}

/**
 * Send verification email to new users
 * @param {string} to - User's email address
 * @param {string} name - User's name
 * @param {string} verificationUrl - Verification URL
 */
export async function sendVerificationEmail(to, name, verificationUrl) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: '✉️ Verify your GoCart email address',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🛒 GoCart</h1>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px;">Hi ${name},</h2>
            
            <p style="color: #4b5563; font-size: 16px;">
              Thanks for signing up for GoCart! Please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              If you didn't create an account with GoCart, you can safely ignore this email.
            </p>
            
            <p style="color: #6b7280; font-size: 14px;">
              This link will expire in 24 hours.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Verification email error:', error);
      console.error('📧 Attempted to send to:', to);
      console.error('📧 From address:', FROM_EMAIL);
      if (error.statusCode === 403) {
        console.error('⚠️ RESEND LIMITATION: With onboarding@resend.dev, you can only send to your own Resend account email.');
        console.error('⚠️ To send to other emails, verify a domain at https://resend.com/domains');
      }
      throw new Error(`Failed to send verification email: ${error.message}`);
    }

    console.log('✅ Verification email sent successfully to:', to);
    console.log('✅ Email ID:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Verification email exception:', error);
    throw error;
  }
}

/**
 * Test function to send a test email
 * Can be used to verify Resend configuration
 */
export async function sendTestEmail(to) {
  return await sendWelcomeEmail({
    to,
    username: 'Test User',
  });
}

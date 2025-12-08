/**
 * Stripe Connect Account Status API
 * 
 * GET /api/vendors/stripe/status
 * 
 * Checks the status of a vendor's Stripe Connect account
 * and updates the user record with latest information
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET(request) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has a connected account
    if (!user.stripeConnectedAccountId) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: "No Stripe account connected",
      });
    }

    // Retrieve account details from Stripe
    const account = await stripe.accounts.retrieve(
      user.stripeConnectedAccountId
    );

    // Update user record with latest status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeDetailsSubmitted: account.details_submitted,
        stripeChargesEnabled: account.charges_enabled,
        stripePayoutsEnabled: account.payouts_enabled,
        stripeOnboardingComplete: account.details_submitted && account.charges_enabled,
      },
    });

    console.log(`✅ Updated Stripe Connect status for ${user.email}`);

    return NextResponse.json({
      success: true,
      connected: true,
      account: {
        id: account.id,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        onboardingComplete: account.details_submitted && account.charges_enabled,
        country: account.country,
        currency: account.default_currency,
        email: account.email,
        // Requirements for incomplete accounts
        requirementsDue: account.requirements?.currently_due || [],
        requirementsEventuallyDue: account.requirements?.eventually_due || [],
        requirementsPastDue: account.requirements?.past_due || [],
        disabled: account.requirements?.disabled_reason || null,
      },
    });

  } catch (error) {
    console.error("❌ Error retrieving Stripe Connect account:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve account status",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

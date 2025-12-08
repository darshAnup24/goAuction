/**
 * Stripe Connect Onboarding API
 * 
 * POST /api/vendors/stripe/onboard
 * 
 * Creates a Stripe Connect Express account for vendors and returns
 * an onboarding link for them to complete account setup
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request) {
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

    // Check if user is a vendor
    if (!user.isVendor) {
      return NextResponse.json(
        { error: "Only vendors can connect a Stripe account" },
        { status: 403 }
      );
    }

    let accountId = user.stripeConnectedAccountId;

    // Create Stripe Connect account if doesn't exist
    if (!accountId) {
      console.log(`Creating Stripe Connect account for user ${user.id}`);

      const account = await stripe.accounts.create({
        type: "express",
        country: "US", // Default to US, you can make this dynamic
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        business_profile: {
          name: user.fullName,
          support_email: user.email,
        },
        metadata: {
          userId: user.id,
          username: user.username,
        },
      });

      accountId = account.id;

      // Save account ID to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          stripeConnectedAccountId: accountId,
        },
      });

      console.log(`✅ Created Stripe Connect account: ${accountId}`);
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXTAUTH_URL}/dashboard/connect-stripe?refresh=true`,
      return_url: `${process.env.NEXTAUTH_URL}/dashboard/connect-stripe?success=true`,
      type: "account_onboarding",
    });

    console.log(`✅ Generated onboarding link for ${user.email}`);

    return NextResponse.json({
      success: true,
      url: accountLink.url,
      accountId: accountId,
      message: "Stripe Connect account created successfully",
    });

  } catch (error) {
    console.error("❌ Error creating Stripe Connect account:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create Stripe Connect account",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

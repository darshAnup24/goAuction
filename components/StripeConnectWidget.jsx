'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * StripeConnectWidget
 * Small dashboard widget showing Stripe Connect status
 * Displays connection state and prompts action if needed
 */
export default function StripeConnectWidget() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/vendors/stripe/status');
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch Stripe status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="border border-slate-200 p-4 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  // Not connected
  if (!status?.hasConnectedAccount) {
    return (
      <div className="border border-yellow-200 bg-yellow-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 text-sm mb-1">
              Connect Stripe Account
            </h3>
            <p className="text-xs text-yellow-700 mb-3">
              Connect your Stripe account to receive automatic payouts when your auctions sell.
            </p>
            <Link 
              href="/vendor/connect-stripe"
              className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition"
            >
              Get Started
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Connected but incomplete
  if (!status.chargesEnabled || !status.payoutsEnabled) {
    return (
      <div className="border border-orange-200 bg-orange-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900 text-sm mb-1">
              Complete Stripe Setup
            </h3>
            <p className="text-xs text-orange-700 mb-3">
              Your Stripe account needs additional information to enable payouts.
            </p>
            <Link 
              href="/vendor/connect-stripe"
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition"
            >
              Complete Setup
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fully connected and active
  return (
    <div className="border border-green-200 bg-green-50 p-4 rounded-lg">
      <div className="flex items-start gap-3">
        <svg className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <h3 className="font-semibold text-green-900 text-sm mb-1">
            Stripe Connected ✓
          </h3>
          <p className="text-xs text-green-700 mb-3">
            Your account is ready to receive automatic payouts. You'll receive 95% of each sale (5% platform fee).
          </p>
          <Link 
            href="/vendor/connect-stripe"
            className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 text-xs font-semibold"
          >
            View Details
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

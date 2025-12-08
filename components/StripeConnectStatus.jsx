'use client';

import { useState, useEffect } from 'react';
import StripeConnectButton from './StripeConnectButton';

/**
 * StripeConnectStatus Component
 * Displays vendor's Stripe Connect account status and capabilities
 * Shows earnings, payout schedule, and account requirements
 */
export default function StripeConnectStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);

    try {
      const response = await fetch('/api/vendors/stripe/status');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch status');
      }

      setStatus(data);
    } catch (err) {
      console.error('Status fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
          <strong>Error:</strong> {error}
        </div>
        <button 
          onClick={() => fetchStatus()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Not connected yet
  if (!status?.hasConnectedAccount) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connect Your Stripe Account
          </h2>
          <p className="text-gray-600">
            Connect your Stripe account to receive payouts directly when your auctions sell.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Why Connect Stripe?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 ml-7">
            <li>• Automatic payouts when auctions are paid</li>
            <li>• Secure transfers directly to your bank account</li>
            <li>• Track earnings and transaction history</li>
            <li>• Platform fee (5%) automatically deducted</li>
          </ul>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-gray-900">What You'll Need:</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>✓ Business or personal bank account details</li>
            <li>✓ Tax identification number (SSN or EIN)</li>
            <li>✓ Government-issued ID</li>
            <li>✓ Business information (if applicable)</li>
          </ul>
        </div>

        <StripeConnectButton size="lg" />

        <p className="text-xs text-gray-500">
          By connecting your account, you agree to Stripe's Connected Account Agreement 
          and GoCart's platform terms.
        </p>
      </div>
    );
  }

  // Connected - show status
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Stripe Account Status
          </h2>
          <p className="text-sm text-gray-600">
            Connected Account ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{status.accountId}</code>
          </p>
        </div>
        <button
          onClick={() => fetchStatus(true)}
          disabled={refreshing}
          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
          <svg 
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard
          title="Details Submitted"
          status={status.detailsSubmitted}
          icon="📋"
        />
        <StatusCard
          title="Charges Enabled"
          status={status.chargesEnabled}
          icon="💳"
        />
        <StatusCard
          title="Payouts Enabled"
          status={status.payoutsEnabled}
          icon="💰"
        />
      </div>

      {/* Account fully active */}
      {status.detailsSubmitted && status.chargesEnabled && status.payoutsEnabled && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-green-900">Account Active!</h3>
              <p className="text-sm text-green-700 mt-1">
                Your Stripe account is fully set up. You'll receive automatic payouts when your auctions are paid (95% of sale price after 5% platform fee).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account incomplete */}
      {!status.detailsSubmitted && status.requirements?.currently_due?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">Action Required</h3>
              <p className="text-sm text-yellow-700 mt-1 mb-3">
                Please complete your Stripe account setup to start receiving payouts.
              </p>
              <div className="bg-white rounded p-3 text-sm space-y-1">
                <p className="font-medium text-gray-900">Missing Information:</p>
                {status.requirements.currently_due.map((req, i) => (
                  <div key={i} className="text-gray-700">
                    • {formatRequirement(req)}
                  </div>
                ))}
              </div>
              <StripeConnectButton 
                variant="outline" 
                size="sm" 
                className="mt-3"
              />
            </div>
          </div>
        </div>
      )}

      {/* Account restricted */}
      {status.disabledReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-red-900">Account Restricted</h3>
              <p className="text-sm text-red-700 mt-1">
                Your account is currently disabled: {formatDisabledReason(status.disabledReason)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming requirements */}
      {status.requirements?.eventually_due?.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Upcoming Requirements</h3>
          <p className="text-sm text-gray-600 mb-2">
            These items will be needed in the future:
          </p>
          <ul className="text-sm text-gray-700 space-y-1">
            {status.requirements.eventually_due.map((req, i) => (
              <li key={i}>• {formatRequirement(req)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Additional info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Payouts are processed automatically by Stripe according to your payout schedule</p>
        <p>• Platform fee: 5% of each sale (automatically deducted)</p>
        <p>• View detailed payout history in your Stripe Dashboard</p>
      </div>
    </div>
  );
}

// Helper component for status cards
function StatusCard({ title, status, icon }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm font-medium text-gray-700">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {status ? (
          <>
            <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-semibold text-green-700">Active</span>
          </>
        ) : (
          <>
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-semibold text-gray-500">Inactive</span>
          </>
        )}
      </div>
    </div>
  );
}

// Format Stripe requirement strings
function formatRequirement(requirement) {
  const replacements = {
    'individual.': '',
    'business.': '',
    'external_account': 'bank account',
    'tos_acceptance.date': 'terms of service acceptance',
    'tos_acceptance.ip': 'terms of service IP address',
    '_': ' '
  };

  let formatted = requirement;
  Object.entries(replacements).forEach(([key, value]) => {
    formatted = formatted.replace(new RegExp(key, 'g'), value);
  });

  return formatted
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Format disabled reason
function formatDisabledReason(reason) {
  const reasons = {
    'requirements.past_due': 'Required information is past due',
    'requirements.pending_verification': 'Account verification is pending',
    'listed': 'Account is on a prohibited list',
    'rejected.fraud': 'Account rejected due to fraud concerns',
    'rejected.terms_of_service': 'Terms of service violation',
    'rejected.listed': 'Account is on a prohibited list',
    'rejected.other': 'Account rejected by Stripe',
    'under_review': 'Account is under review',
    'other': 'Account disabled by Stripe'
  };

  return reasons[reason] || reason;
}

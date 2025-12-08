'use client';

import { useState } from 'react';

/**
 * StripeConnectButton Component
 * Initiates Stripe Connect Express onboarding flow
 * Used in vendor dashboard to connect Stripe account for receiving payouts
 */
export default function StripeConnectButton({ 
  variant = 'primary',
  size = 'md',
  className = '' 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/vendors/stripe/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start onboarding');
      }

      // Redirect to Stripe onboarding
      window.location.href = data.url;

    } catch (err) {
      console.error('Stripe Connect error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Button size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Button variant classes
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleConnect}
        disabled={loading}
        className={`
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
          font-semibold rounded-lg
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          flex items-center gap-2
        `}
      >
        {loading ? (
          <>
            <svg 
              className="animate-spin h-5 w-5" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg 
              className="h-5 w-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 10V3L4 14h7v7l9-11h-7z" 
              />
            </svg>
            <span>Connect Stripe Account</span>
          </>
        )}
      </button>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}

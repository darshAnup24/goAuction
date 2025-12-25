/**
 * FEATURE 2: Proxy Bid Modal Component
 * 
 * UI component for setting up automatic bidding
 * 
 * SAFETY: Feature flag checked, graceful fallback if disabled
 */

'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function ProxyBidModal({ listing, isOpen, onClose, onSuccess }) {
  const [maxAmount, setMaxAmount] = useState('');
  const [incrementAmount, setIncrementAmount] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [featureEnabled, setFeatureEnabled] = useState(false);

  // Check if feature is available
  useEffect(() => {
    fetch('/api/bids/proxy')
      .then(res => {
        setFeatureEnabled(res.status !== 501);
      })
      .catch(() => setFeatureEnabled(false));
  }, []);

  if (!isOpen) return null;

  const minAmount = listing?.currentBid > 0 
    ? listing.currentBid + incrementAmount 
    : listing?.startingPrice || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const amount = parseFloat(maxAmount);

      if (isNaN(amount) || amount < minAmount) {
        toast.error(`Maximum bid must be at least $${minAmount.toFixed(2)}`);
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/bids/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          maxAmount: amount,
          incrementAmount
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Auto-bidding activated!');
        onSuccess?.(data.proxyBid);
        onClose();
      } else if (response.status === 501) {
        toast.error('Auto-bid feature is not enabled on this server');
      } else {
        toast.error(data.error || 'Failed to set auto-bid');
      }

    } catch (error) {
      console.error('Proxy bid error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Set Auto-Bidding</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {!featureEnabled && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Auto-bid feature is not available on this server.
            </p>
          </div>
        )}

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            💡 We'll automatically bid on your behalf when you're outbid, 
            up to your maximum amount. You'll be notified of each auto-bid.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Bid Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                min={minAmount}
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={minAmount.toFixed(2)}
                disabled={isSubmitting || !featureEnabled}
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum: ${minAmount.toFixed(2)}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Increment Amount: ${incrementAmount}
            </label>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={incrementAmount}
              onChange={(e) => setIncrementAmount(parseInt(e.target.value))}
              className="w-full"
              disabled={isSubmitting || !featureEnabled}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>$1</span>
              <span>$50</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              How much to increase your bid when outbid
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !featureEnabled}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? 'Activating...' : 'Activate Auto-Bid'}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>How it works:</strong> When someone outbids you, we'll automatically 
            place a new bid on your behalf (up to your max). You can cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}

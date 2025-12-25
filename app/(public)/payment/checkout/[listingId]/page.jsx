/**
 * Test Payment Checkout Page
 * 
 * /payment/checkout/[listingId]
 * 
 * Displays payment breakdown with shipping and mock card form
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  CreditCard, 
  Package, 
  Truck, 
  Shield, 
  CheckCircle, 
  Loader2,
  ArrowLeft,
  AlertCircle
} from 'lucide-react'

export default function TestCheckoutPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.listingId

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [paymentData, setPaymentData] = useState(null)
  const [success, setSuccess] = useState(false)
  const [transactionId, setTransactionId] = useState(null)

  // Mock card form state
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [cardName, setCardName] = useState('')

  // Fetch payment details on load
  useEffect(() => {
    const initCheckout = async () => {
      try {
        const response = await fetch('/api/payments/test-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to initialize checkout')
        }

        setPaymentData(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (listingId) {
      initCheckout()
    }
  }, [listingId])

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : value
  }

  // Format expiry date
  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  // Handle payment submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    if (cardNumber.replace(/\s/g, '').length < 16) {
      setError('Please enter a valid card number')
      return
    }
    if (expiryDate.length < 5) {
      setError('Please enter a valid expiry date')
      return
    }
    if (cvv.length < 3) {
      setError('Please enter a valid CVV')
      return
    }
    if (!cardName.trim()) {
      setError('Please enter the cardholder name')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/complete-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: paymentData.paymentId,
          cardDetails: {
            cardType: cardNumber.startsWith('4') ? 'Visa' : 
                      cardNumber.startsWith('5') ? 'Mastercard' : 'Card',
            lastFour: cardNumber.replace(/\s/g, '').slice(-4),
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed')
      }

      setSuccess(true)
      setTransactionId(data.payment.transactionId)

    } catch (err) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    )
  }

  // Error state (no payment data)
  if (error && !paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Checkout Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/orders"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go to Orders
          </Link>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    const images = typeof paymentData.listing.images === 'string' 
      ? JSON.parse(paymentData.listing.images) 
      : paymentData.listing.images
    const mainImage = images?.[0] || '/placeholder.jpg'

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your payment has been processed successfully.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-center gap-4 mb-4">
              <img 
                src={mainImage} 
                alt={paymentData.listing.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <p className="font-semibold text-gray-900">{paymentData.listing.title}</p>
                <p className="text-sm text-gray-500">Sold by {paymentData.seller.fullName}</p>
              </div>
            </div>
            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono text-gray-900">{transactionId?.slice(0, 20)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-bold text-green-600">${paymentData.breakdown.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link 
              href="/orders"
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              View Orders
            </Link>
            <Link 
              href="/listings"
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Checkout form
  const images = typeof paymentData.listing.images === 'string' 
    ? JSON.parse(paymentData.listing.images) 
    : paymentData.listing.images
  const mainImage = images?.[0] || '/placeholder.jpg'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/orders"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Orders
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600">Complete your payment to receive your item</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Order Summary
            </h2>

            {/* Product */}
            <div className="flex gap-4 pb-6 border-b">
              <img 
                src={mainImage} 
                alt={paymentData.listing.title}
                className="w-24 h-24 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{paymentData.listing.title}</h3>
                <p className="text-sm text-gray-500">Sold by {paymentData.seller.fullName}</p>
                <p className="text-lg font-bold text-blue-600 mt-2">
                  ${paymentData.breakdown.itemAmount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="py-6 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Item Price</span>
                <span>${paymentData.breakdown.itemAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Shipping
                </span>
                <span>${paymentData.breakdown.shippingCharge.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-green-600">${paymentData.breakdown.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Security Badge */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <Shield className="w-8 h-8 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800">Secure Payment</p>
                <p className="text-sm text-green-600">Your payment information is encrypted</p>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-600" />
              Payment Details
            </h2>

            {/* Test Mode Banner */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>🧪 Test Mode:</strong> Use any card number (e.g., 4242 4242 4242 4242) with any future expiry date and any 3-digit CVV.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                    maxLength={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={processing}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay ${paymentData.breakdown.totalAmount.toFixed(2)}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

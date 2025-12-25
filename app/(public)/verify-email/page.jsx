'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState('loading') // 'loading', 'success', 'error'
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  useEffect(() => {
    if (!token || !email) {
      setStatus('error')
      setMessage('Invalid verification link. Missing token or email.')
      return
    }

    // Verify the email
    const verifyEmail = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`)
        const data = await res.json()

        if (res.ok) {
          setStatus('success')
          setMessage(data.message || 'Email verified successfully!')
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login?verified=true')
          }, 3000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Failed to verify email')
        }
      } catch (error) {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      }
    }

    verifyEmail()
  }, [token, email, router])

  const handleResendVerification = async () => {
    if (!email) return

    setResending(true)
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (res.ok) {
        setResendSuccess(true)
        setMessage('Verification email sent! Please check your inbox.')
      } else {
        setMessage(data.error || 'Failed to resend verification email')
      }
    } catch (error) {
      setMessage('Failed to resend verification email')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying your email...</h1>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500 mb-4">Redirecting to login page...</p>
            <Link
              href="/login"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            
            {email && !resendSuccess && (
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {resending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Mail className="w-5 h-5" />
                )}
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </button>
            )}

            {resendSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-700 text-sm">
                  ✓ Verification email sent! Check your inbox.
                </p>
              </div>
            )}

            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

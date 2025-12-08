'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

export default function CountdownTimer({ endTime, onExpire }) {
  const [timeRemaining, setTimeRemaining] = useState(null)

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime()
      const end = new Date(endTime).getTime()
      const difference = end - now

      if (difference <= 0) {
        setTimeRemaining(null)
        if (onExpire) onExpire()
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeRemaining({ days, hours, minutes, seconds })
    }

    // Initial calculation
    calculateTimeRemaining()

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [endTime, onExpire])

  if (!timeRemaining) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 text-center">
        <p className="text-xl font-bold text-gray-700">Auction Ended</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-orange-600 animate-pulse" />
        <h3 className="text-lg font-bold text-gray-900">Time Remaining</h3>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <TimeUnit value={timeRemaining.days} label="Days" />
        <TimeUnit value={timeRemaining.hours} label="Hours" />
        <TimeUnit value={timeRemaining.minutes} label="Mins" />
        <TimeUnit value={timeRemaining.seconds} label="Secs" />
      </div>
    </div>
  )
}

function TimeUnit({ value, label }) {
  return (
    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
      <div className="text-2xl font-bold text-gray-900">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
    </div>
  )
}

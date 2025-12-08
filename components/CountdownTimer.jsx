"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";

/**
 * CountdownTimer Component
 * 
 * Displays a real-time countdown to an auction end time with color-coded urgency.
 * 
 * @param {Object} props
 * @param {string|Date} props.endTime - ISO string or Date object for auction end
 * @param {Function} [props.onExpire] - Callback when timer reaches zero
 * @param {boolean} [props.showIcon=true] - Show clock icon
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.size="md"] - Size variant: "sm", "md", "lg"
 * 
 * @example
 * <CountdownTimer 
 *   endTime="2025-12-31T23:59:59Z"
 *   onExpire={() => console.log('Auction ended!')}
 * />
 */
export default function CountdownTimer({
  endTime,
  onExpire,
  showIcon = true,
  className = "",
  size = "md",
}) {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [hasExpired, setHasExpired] = useState(false);

  /**
   * Calculate time remaining from current time to end time
   * @returns {Object|null} Time object with days, hours, minutes, seconds
   */
  const calculateTimeRemaining = useCallback(() => {
    if (!endTime) return null;

    const end = new Date(endTime).getTime();
    const now = Date.now();
    const difference = end - now;

    // Auction has ended
    if (difference <= 0) {
      return {
        total: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    // Calculate time units
    const seconds = Math.floor((difference / 1000) % 60);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));

    return {
      total: difference,
      days,
      hours,
      minutes,
      seconds,
    };
  }, [endTime]);

  // Update timer every second
  useEffect(() => {
    // Initial calculation
    const time = calculateTimeRemaining();
    setTimeRemaining(time);

    // Check if already expired
    if (time && time.total === 0) {
      setHasExpired(true);
      if (onExpire && !hasExpired) {
        onExpire();
      }
      return; // Don't start interval if already expired
    }

    // Start interval
    const interval = setInterval(() => {
      const newTime = calculateTimeRemaining();
      setTimeRemaining(newTime);

      // Check for expiration
      if (newTime && newTime.total === 0 && !hasExpired) {
        setHasExpired(true);
        if (onExpire) {
          onExpire();
        }
        clearInterval(interval);
      }
    }, 1000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [calculateTimeRemaining, onExpire, hasExpired]);

  /**
   * Format time remaining into readable string
   * Only shows relevant units (hides days if 0, etc.)
   * @returns {string} Formatted time string
   */
  const formatTime = () => {
    if (!timeRemaining) return "Loading...";
    if (timeRemaining.total === 0) return "Auction Ended";

    const { days, hours, minutes, seconds } = timeRemaining;
    const parts = [];

    if (days > 0) {
      parts.push(`${days}d`);
      parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
    } else if (hours > 0) {
      parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);
    } else if (minutes > 0) {
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);
    } else {
      parts.push(`${seconds}s`);
    }

    return parts.join(" ");
  };

  /**
   * Get color classes based on time remaining
   * @returns {string} Tailwind CSS classes for urgency color
   */
  const getColorClass = () => {
    if (!timeRemaining || timeRemaining.total === 0) {
      return "text-gray-500 bg-gray-100";
    }

    const totalHours = timeRemaining.total / (1000 * 60 * 60);

    if (totalHours > 24) {
      // Green: More than 24 hours
      return "text-green-700 bg-green-50 border-green-200";
    } else if (totalHours > 1) {
      // Yellow: 1-24 hours
      return "text-yellow-700 bg-yellow-50 border-yellow-200";
    } else {
      // Red: Less than 1 hour (critical)
      return "text-red-700 bg-red-50 border-red-200";
    }
  };

  /**
   * Check if should show pulsing animation (< 1 hour)
   * @returns {boolean}
   */
  const shouldPulse = () => {
    if (!timeRemaining || timeRemaining.total === 0) return false;
    const totalHours = timeRemaining.total / (1000 * 60 * 60);
    return totalHours < 1;
  };

  /**
   * Get size-specific classes
   * @returns {string} Tailwind CSS classes for size
   */
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-xs px-2 py-1 gap-1";
      case "lg":
        return "text-lg px-4 py-2 gap-2";
      case "md":
      default:
        return "text-sm px-3 py-1.5 gap-1.5";
    }
  };

  /**
   * Get icon size based on component size
   * @returns {number} Icon size in pixels
   */
  const getIconSize = () => {
    switch (size) {
      case "sm":
        return 12;
      case "lg":
        return 20;
      case "md":
      default:
        return 16;
    }
  };

  return (
    <div
      className={`
        inline-flex items-center rounded-lg border font-semibold
        ${getSizeClasses()}
        ${getColorClass()}
        ${shouldPulse() ? "animate-pulse" : ""}
        ${className}
      `}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      {showIcon && (
        <Clock 
          size={getIconSize()} 
          className={shouldPulse() ? "animate-spin" : ""} 
        />
      )}
      <span>{formatTime()}</span>
    </div>
  );
}

/**
 * TypeScript Type Definitions (JSDoc)
 * 
 * @typedef {Object} CountdownTimerProps
 * @property {string|Date} endTime - ISO string or Date object for auction end time
 * @property {() => void} [onExpire] - Callback function when timer reaches zero
 * @property {boolean} [showIcon=true] - Whether to show the clock icon
 * @property {string} [className] - Additional CSS classes to apply
 * @property {"sm"|"md"|"lg"} [size="md"] - Size variant of the component
 * 
 * @typedef {Object} TimeRemaining
 * @property {number} total - Total milliseconds remaining
 * @property {number} days - Days remaining
 * @property {number} hours - Hours remaining (0-23)
 * @property {number} minutes - Minutes remaining (0-59)
 * @property {number} seconds - Seconds remaining (0-59)
 */

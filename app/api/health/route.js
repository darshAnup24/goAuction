/**
 * FEATURE 3: Health Check API Endpoint
 * 
 * GET /api/health - Comprehensive health check of all services
 * 
 * Returns HTTP 200 when all services are healthy
 * Returns HTTP 503 when any service is down
 * 
 * SAFETY: Read-only endpoint, no side effects
 */

import { NextResponse } from 'next/server';
import { performHealthCheck } from '@/lib/features/monitoring';

export async function GET(req) {
  try {
    // Check if feature is enabled
    if (process.env.ENABLE_HEALTH_CHECKS !== 'true') {
      return NextResponse.json(
        { 
          status: 'disabled',
          message: 'Health check feature is not enabled',
          note: 'Set ENABLE_HEALTH_CHECKS=true to enable'
        },
        { status: 501 } // Not Implemented
      );
    }

    // Perform health check
    const healthStatus = await performHealthCheck();

    // Determine HTTP status code
    const httpStatus = healthStatus.status === 'healthy' ? 200 :
                      healthStatus.status === 'degraded' ? 200 :
                      healthStatus.status === 'disabled' ? 501 :
                      503; // Service Unavailable

    return NextResponse.json(healthStatus, { status: httpStatus });

  } catch (error) {
    console.error('[HealthCheck API] Error:', error);

    // Always return JSON, never crash
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    { methods: ['GET', 'OPTIONS'] },
    {
      headers: {
        'Allow': 'GET, OPTIONS',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    }
  );
}

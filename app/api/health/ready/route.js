/**
 * FEATURE 3: Readiness Probe Endpoint
 * 
 * GET /api/health/ready - Kubernetes/Docker readiness probe
 * 
 * Simple endpoint that returns 200 if app is ready to serve traffic
 * Used by container orchestration systems
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Simple database connectivity check
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      { status: 'ready', timestamp: new Date().toISOString() },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { status: 'not ready', error: error.message },
      { status: 503 }
    );
  }
}

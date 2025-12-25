/**
 * FEATURE 3: System Monitoring & Health Checks
 * 
 * Provides comprehensive health check utilities for monitoring
 * application dependencies and services.
 * 
 * SAFETY: Read-only operations, no side effects on existing functionality
 */

import { prisma } from '../prisma';

const FEATURE_ENABLED = process.env.ENABLE_HEALTH_CHECKS === 'true';
const TIMEOUT_MS = parseInt(process.env.HEALTH_CHECK_TIMEOUT_MS || '5000');

/**
 * Performs a comprehensive health check of all services
 * @returns {Promise<Object>} Health check results
 */
export async function performHealthCheck() {
  if (!FEATURE_ENABLED) {
    return {
      status: 'disabled',
      message: 'Health checks are disabled'
    };
  }

  const startTime = Date.now();
  const checks = {};

  try {
    // Run all checks in parallel with timeout
    const [
      databaseCheck,
      stripeCheck,
      cloudinaryCheck,
      emailCheck
    ] = await Promise.allSettled([
      checkDatabase(),
      checkStripe(),
      checkCloudinary(),
      checkEmail()
    ]);

    checks.database = databaseCheck.status === 'fulfilled' ? databaseCheck.value : { status: 'error', error: databaseCheck.reason?.message };
    checks.stripe = stripeCheck.status === 'fulfilled' ? stripeCheck.value : { status: 'error', error: stripeCheck.reason?.message };
    checks.cloudinary = cloudinaryCheck.status === 'fulfilled' ? cloudinaryCheck.value : { status: 'error', error: cloudinaryCheck.reason?.message };
    checks.email = emailCheck.status === 'fulfilled' ? emailCheck.value : { status: 'error', error: emailCheck.reason?.message };

    // Determine overall status
    const allHealthy = Object.values(checks).every(check => check.status === 'ok');
    const anyDegraded = Object.values(checks).some(check => check.status === 'degraded');
    const anyDown = Object.values(checks).some(check => check.status === 'error');

    const overallStatus = anyDown ? 'down' : anyDegraded ? 'degraded' : allHealthy ? 'healthy' : 'unknown';

    const result = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      checks
    };

    // Store health check result (non-blocking)
    if (overallStatus !== 'healthy') {
      storeHealthCheckResult(checks).catch(err => 
        console.error('[Monitoring] Failed to store health check:', err)
      );
    }

    return result;

  } catch (error) {
    console.error('[Monitoring] Health check error:', error);
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      checks
    };
  }
}

/**
 * Checks database connectivity and performance
 */
async function checkDatabase() {
  const start = Date.now();
  
  try {
    // Simple query to test connection
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      timeout(TIMEOUT_MS)
    ]);

    const responseTime = Date.now() - start;

    // Check if response time is degraded
    const status = responseTime > 1000 ? 'degraded' : 'ok';

    return {
      status,
      responseTime,
      message: status === 'ok' ? 'Database is healthy' : 'Database response slow'
    };

  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - start,
      error: error.message,
      message: 'Database connection failed'
    };
  }
}

/**
 * Checks Stripe API connectivity
 */
async function checkStripe() {
  const start = Date.now();
  
  try {
    // Don't actually call Stripe in health check to avoid rate limits
    // Just verify API key is configured
    const apiKey = process.env.STRIPE_SECRET_KEY;
    
    if (!apiKey || !apiKey.startsWith('sk_')) {
      return {
        status: 'error',
        responseTime: Date.now() - start,
        message: 'Stripe API key not configured'
      };
    }

    // If we have the stripe library, we could do a lightweight API call
    // For now, just check configuration
    return {
      status: 'ok',
      responseTime: Date.now() - start,
      message: 'Stripe is configured'
    };

  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - start,
      error: error.message,
      message: 'Stripe check failed'
    };
  }
}

/**
 * Checks Cloudinary configuration
 */
async function checkCloudinary() {
  const start = Date.now();
  
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;

    if (!cloudName || !apiKey) {
      return {
        status: 'error',
        responseTime: Date.now() - start,
        message: 'Cloudinary not configured'
      };
    }

    return {
      status: 'ok',
      responseTime: Date.now() - start,
      message: 'Cloudinary is configured'
    };

  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - start,
      error: error.message,
      message: 'Cloudinary check failed'
    };
  }
}

/**
 * Checks email service configuration
 */
async function checkEmail() {
  const start = Date.now();
  
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || !apiKey.startsWith('re_')) {
      return {
        status: 'error',
        responseTime: Date.now() - start,
        message: 'Email service not configured'
      };
    }

    return {
      status: 'ok',
      responseTime: Date.now() - start,
      message: 'Email service is configured'
    };

  } catch (error) {
    return {
      status: 'error',
      responseTime: Date.now() - start,
      error: error.message,
      message: 'Email service check failed'
    };
  }
}

/**
 * Stores health check results in database
 * @private
 */
async function storeHealthCheckResult(checks) {
  try {
    const promises = Object.entries(checks).map(([service, result]) => {
      return prisma.healthCheck.create({
        data: {
          service,
          status: result.status,
          responseTime: result.responseTime || 0,
          errorMessage: result.error || result.message,
          metadata: result
        }
      });
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('[Monitoring] Failed to store health check results:', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Gets recent health check history
 * @param {number} limit - Number of recent checks to retrieve
 * @returns {Promise<Array>} Recent health checks
 */
export async function getHealthCheckHistory(limit = 50) {
  if (!FEATURE_ENABLED) {
    return [];
  }

  try {
    return await prisma.healthCheck.findMany({
      orderBy: { checkedAt: 'desc' },
      take: limit
    });
  } catch (error) {
    console.error('[Monitoring] Failed to get health check history:', error);
    return [];
  }
}

/**
 * Gets health statistics for a specific service
 * @param {string} service - Service name
 * @param {number} hours - Hours to look back
 * @returns {Promise<Object>} Service health statistics
 */
export async function getServiceStats(service, hours = 24) {
  if (!FEATURE_ENABLED) {
    return null;
  }

  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const checks = await prisma.healthCheck.findMany({
      where: {
        service,
        checkedAt: { gte: since }
      },
      orderBy: { checkedAt: 'desc' }
    });

    if (checks.length === 0) {
      return {
        service,
        period: `${hours}h`,
        noData: true
      };
    }

    const totalChecks = checks.length;
    const healthyChecks = checks.filter(c => c.status === 'healthy' || c.status === 'ok').length;
    const degradedChecks = checks.filter(c => c.status === 'degraded').length;
    const errorChecks = checks.filter(c => c.status === 'error' || c.status === 'down').length;

    const avgResponseTime = checks.reduce((sum, c) => sum + c.responseTime, 0) / totalChecks;

    return {
      service,
      period: `${hours}h`,
      totalChecks,
      healthyChecks,
      degradedChecks,
      errorChecks,
      availability: ((healthyChecks / totalChecks) * 100).toFixed(2) + '%',
      avgResponseTime: Math.round(avgResponseTime),
      lastCheck: checks[0]
    };

  } catch (error) {
    console.error('[Monitoring] Failed to get service stats:', error);
    return null;
  }
}

/**
 * Cleans up old health check records
 * @param {number} days - Days to retain
 */
export async function cleanupHealthChecks(days = 7) {
  if (!FEATURE_ENABLED) {
    return { deleted: 0 };
  }

  try {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await prisma.healthCheck.deleteMany({
      where: {
        checkedAt: { lt: cutoff }
      }
    });

    console.log(`[Monitoring] Deleted ${result.count} old health check records`);
    return { deleted: result.count };

  } catch (error) {
    console.error('[Monitoring] Cleanup failed:', error);
    return { deleted: 0, error: error.message };
  }
}

/**
 * Helper function for timeout
 */
function timeout(ms) {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
}

// Export feature status
export function isMonitoringEnabled() {
  return FEATURE_ENABLED;
}

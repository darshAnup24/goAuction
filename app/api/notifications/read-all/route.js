import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for the authenticated user
 */
export async function PATCH(req) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mark all unread notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    // Emit Socket.IO event
    try {
      const io = (await import('@/server')).io;
      if (io) {
        io.to(`user:${session.user.id}`).emit('notification:read-all', {
          count: result.count
        });
      }
    } catch (error) {
      console.error('Socket.IO emit error:', error.message);
    }

    return NextResponse.json({
      success: true,
      message: `Marked ${result.count} notifications as read`,
      count: result.count,
      unreadCount: 0
    });

  } catch (error) {
    console.error('❌ Mark all read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read', details: error.message },
      { status: 500 }
    );
  }
}

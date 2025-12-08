import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * PATCH /api/notifications/[id]/read
 * Mark a single notification as read
 */
export async function PATCH(req, { params }) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Verify notification belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true, isRead: true }
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to update this notification' },
        { status: 403 }
      );
    }

    // Update notification
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    // Get updated unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    });

    // Emit Socket.IO event
    try {
      const io = (await import('@/server')).io;
      if (io) {
        io.to(`user:${session.user.id}`).emit('notification:read', {
          notificationId: id,
          unreadCount
        });
      }
    } catch (error) {
      console.error('Socket.IO emit error:', error.message);
    }

    return NextResponse.json({
      success: true,
      notification: updated,
      unreadCount
    });

  } catch (error) {
    console.error('❌ Mark notification read error:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read', details: error.message },
      { status: 500 }
    );
  }
}

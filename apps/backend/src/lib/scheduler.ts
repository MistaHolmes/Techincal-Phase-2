import prisma from "./prisma";
import { broadcastNotificationUpdate } from "./websocket";

/**
 * Checks for blogs that are scheduled for publication and whose 
 * scheduled time has passed.
 */
export async function processScheduledBlogs() {
  try {
    const now = new Date();
    
    // Find blogs that are not published, have a scheduledAt date in the past
    // Cast to any to bypass stale types if necessary, though prisma generate should fix it
    const toPublish = await (prisma.blog as any).findMany({
      where: {
        published: false,
        scheduledAt: {
          lte: now
        }
      },
      include: {
        author: true
      }
    });

    if (toPublish.length === 0) return;

    console.log(`[Scheduler] Found ${toPublish.length} blogs to publish.`);

    for (const blog of toPublish) {
      await (prisma.blog as any).update({
        where: { id: blog.id },
        data: {
          published: true,
          scheduledAt: null // Clear scheduling once published
        }
      });

      // Create a notification record first
      await prisma.notification.create({
        data: {
          userId: blog.authorId,
          message: `Your scheduled blog "${blog.title}" is now live!`
        }
      });

      // Notify the author via WS
      broadcastNotificationUpdate(blog.authorId);
      
      console.log(`[Scheduler] Published: ${blog.title} (${blog.id})`);
    }
  } catch (error) {
    console.error("[Scheduler] Error processing scheduled blogs:", error);
  }
}

/**
 * Starts a simple interval-based scheduler.
 */
export function initScheduler(intervalMs: number = 60000) {
  console.log(`[Scheduler] Initialized with interval ${intervalMs}ms`);
  setInterval(processScheduledBlogs, intervalMs);
}

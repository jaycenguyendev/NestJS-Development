import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use IP + User Agent for tracking to prevent abuse
    const ip =
      req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';

    // If user is authenticated, use user ID for more lenient rate limiting
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }

    // For anonymous users, use IP + User Agent
    return `${ip}:${userAgent}`;
  }
}

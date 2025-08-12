import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class TwoFactorGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private databaseService: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if 2FA is required for this endpoint
    const require2FA = this.reflector.getAllAndOverride<boolean>('require2FA', [
      context.getHandler(),
      context.getClass(),
    ]);

    // If 2FA is not required, allow access
    if (!require2FA) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Check if user has 2FA enabled
    const userWith2FA = await this.databaseService.user.findUnique({
      where: { id: user.id },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!userWith2FA) {
      throw new UnauthorizedException('User not found');
    }

    // If user doesn't have 2FA enabled, deny access to 2FA-required endpoints
    if (!userWith2FA.twoFactorEnabled || !userWith2FA.twoFactorSecret) {
      throw new UnauthorizedException(
        'Two-factor authentication is required for this action',
      );
    }

    // Check if user has recently verified 2FA (within last 5 minutes)
    const twoFactorVerified = request.session?.twoFactorVerified;
    const verificationTime = request.session?.twoFactorVerifiedAt;

    if (
      !twoFactorVerified ||
      !verificationTime ||
      Date.now() - verificationTime > 5 * 60 * 1000 // 5 minutes
    ) {
      throw new UnauthorizedException(
        'Two-factor authentication verification required',
      );
    }

    return true;
  }
}

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class OptionalTwoFactorGuard implements CanActivate {
  constructor(private databaseService: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    // If user doesn't have 2FA enabled, allow access
    if (!userWith2FA.twoFactorEnabled || !userWith2FA.twoFactorSecret) {
      return true;
    }

    // If user has 2FA enabled, check verification
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

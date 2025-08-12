import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { JwtPayload, AuthUser } from '../interfaces/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const { sub: userId, email } = payload;

    // Tìm user trong database
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    // Kiểm tra email trong token có khớp với DB không
    if (user.email !== email) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      role: user.role,
      emailVerified: user.emailVerified ?? undefined,
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }
}

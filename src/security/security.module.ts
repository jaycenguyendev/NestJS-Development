import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          name: 'short',
          ttl: configService.get<number>('THROTTLE_TTL_SHORT', 60000), // 1 minute
          limit: configService.get<number>('THROTTLE_LIMIT_SHORT', 10),
        },
        {
          name: 'medium',
          ttl: configService.get<number>('THROTTLE_TTL_MEDIUM', 60000 * 15), // 15 minutes
          limit: configService.get<number>('THROTTLE_LIMIT_MEDIUM', 100),
        },
        {
          name: 'long',
          ttl: configService.get<number>('THROTTLE_TTL_LONG', 60000 * 60), // 1 hour
          limit: configService.get<number>('THROTTLE_LIMIT_LONG', 1000),
        },
      ],
    }),
  ],
})
export class SecurityModule {}

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SecurityHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();

    // Set security headers
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-XSS-Protection', '1; mode=block');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=()',
    );

    // Remove server header
    response.removeHeader('X-Powered-By');

    return next.handle().pipe(
      map((data) => {
        // Add timestamp to response
        if (typeof data === 'object' && data !== null) {
          return {
            ...data,
            timestamp: new Date().toISOString(),
          };
        }
        return data;
      }),
    );
  }
}

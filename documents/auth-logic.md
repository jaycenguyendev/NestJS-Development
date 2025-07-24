1. User login → Tạo session record + JWT access token + refresh token
2. Mỗi API call → Verify JWT (stateless, không query DB)
3. JWT hết hạn → Dùng refresh token (query DB để check valid)
4. User logout → Revoke session + refresh token
5. Admin/User → Xem danh sách session, logout thiết bị khác



task 1: Chạy migration Prisma để tạo các bảng User, Session, RefreshToken, OAuthAccount, TwoFactorSecret, VerificationTokena
task 2: Tạo Auth module NestJS với JWT service, guards, strategies
task 3: Tạo DTOs cho register, login, refresh token, 2FA, OAuth
task 4: Implement AuthService: register, login, refresh token (hybrid), logout, profile
task 5: Implement JWT service với access token (stateless) và refresh token (stateful)
task 6: Tạo guards: JWT guard, 2FA guard, role-based guard
task 7: Tạo AuthController với endpoints: /auth/register, /auth/login, /auth/refresh, /auth/logout, /auth/profile
task 8: Implement 2FA service: enable/disable 2FA, generate QR code, verify OTP
task 9: Implement OAuth service: Google, Facebook login/register
task 10: Thêm security middleware: rate limiting, CORS, helmet, validation
task 11: Tạo Next.js app với shadcn/ui, TypeScript, Tailwind CSS
task 12: Xây dựng UI: login, register, profile, 2FA, OAuth với shadcn/ui
task 13: Kết nối frontend với backend: API client, token management, error handling
task 14: Bảo mật frontend: httpOnly cookies, CSRF protection, XSS prevention
task 15: Testing toàn bộ hệ thống và deployment guide
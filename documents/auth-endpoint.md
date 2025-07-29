# Auth API Endpoints Documentation

## 🔐 Basic Authentication

| Method | Endpoint           | Description                 | Guards | Body              |
| ------ | ------------------ | --------------------------- | ------ | ----------------- |
| POST   | `/auth/register`   | Đăng ký tài khoản mới       | None   | `RegisterDto`     |
| POST   | `/auth/login`      | Đăng nhập                   | None   | `LoginDto`        |
| POST   | `/auth/refresh`    | Làm mới access token        | None   | `RefreshTokenDto` |
| POST   | `/auth/logout`     | Đăng xuất thiết bị hiện tại | JWT    | None              |
| POST   | `/auth/logout-all` | Đăng xuất tất cả thiết bị   | JWT    | None              |
| GET    | `/auth/profile`    | Lấy thông tin profile       | JWT    | None              |

## 🔑 Password Management

| Method | Endpoint                | Description              | Guards            | Body                |
| ------ | ----------------------- | ------------------------ | ----------------- | ------------------- |
| PATCH  | `/auth/change-password` | Đổi mật khẩu             | JWT + Optional2FA | `ChangePasswordDto` |
| POST   | `/auth/forgot-password` | Yêu cầu reset mật khẩu   | None              | `ForgotPasswordDto` |
| POST   | `/auth/reset-password`  | Reset mật khẩu với token | None              | `ResetPasswordDto`  |

## 📧 Email Verification

| Method | Endpoint                    | Description            | Guards | Body                    |
| ------ | --------------------------- | ---------------------- | ------ | ----------------------- |
| POST   | `/auth/verify-email`        | Xác thực email         | None   | `VerifyEmailDto`        |
| POST   | `/auth/resend-verification` | Gửi lại email xác thực | None   | `ResendVerificationDto` |

## 🛡️ Two-Factor Authentication

| Method | Endpoint            | Description               | Guards | Body            |
| ------ | ------------------- | ------------------------- | ------ | --------------- |
| POST   | `/auth/2fa/enable`  | Bật 2FA (tạo secret & QR) | JWT    | `Enable2FADto`  |
| POST   | `/auth/2fa/disable` | Tắt 2FA                   | JWT    | `Disable2FADto` |
| POST   | `/auth/2fa/verify`  | Xác thực OTP code         | JWT    | `VerifyOTPDto`  |

## 🌐 OAuth Integration

| Method | Endpoint            | Description                 | Guards | Body            |
| ------ | ------------------- | --------------------------- | ------ | --------------- |
| POST   | `/auth/oauth/login` | Đăng nhập OAuth (Google/FB) | None   | `OAuthLoginDto` |

## 📱 Session Management

| Method | Endpoint             | Description                   | Guards | Body |
| ------ | -------------------- | ----------------------------- | ------ | ---- |
| GET    | `/auth/sessions`     | Lấy danh sách sessions active | JWT    | None |
| DELETE | `/auth/sessions/:id` | Revoke session cụ thể         | JWT    | None |

## 👑 Admin Endpoints

| Method | Endpoint                     | Description            | Guards             | Body |
| ------ | ---------------------------- | ---------------------- | ------------------ | ---- |
| POST   | `/auth/admin/cleanup-tokens` | Cleanup expired tokens | JWT + Roles(ADMIN) | None |

## 🔒 Protected Examples

| Method | Endpoint                 | Description                 | Guards                    | Body |
| ------ | ------------------------ | --------------------------- | ------------------------- | ---- |
| GET    | `/auth/sensitive-action` | Action yêu cầu 2FA bắt buộc | JWT + 2FA + Require2FA    | None |
| GET    | `/auth/admin-only`       | Action chỉ dành cho admin   | JWT + Roles + Optional2FA | None |

## Guards Explanation

### Available Guards:

- **JwtAuthGuard**: Xác thực JWT token
- **RolesGuard**: Kiểm tra role của user
- **TwoFactorGuard**: Yêu cầu 2FA verification (bắt buộc)
- **OptionalTwoFactorGuard**: Nếu user có 2FA thì phải verify

### Decorators:

- **@GetUser()**: Lấy thông tin user từ JWT
- **@Roles(Role.ADMIN)**: Yêu cầu role cụ thể
- **@Require2FA()**: Mark endpoint yêu cầu 2FA bắt buộc

## Response Types

All endpoints return appropriate response types defined in `auth.interface.ts`:

- `AuthUser`, `LoginResponse`, `RefreshTokenResponse`
- `Enable2FAResponse`, `Verify2FAResponse`, `OAuthResponse`
- `EmailVerificationResponse`, `PasswordResetResponse`

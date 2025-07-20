1. User login → Tạo session record + JWT access token + refresh token
2. Mỗi API call → Verify JWT (stateless, không query DB)
3. JWT hết hạn → Dùng refresh token (query DB để check valid)
4. User logout → Revoke session + refresh token
5. Admin/User → Xem danh sách session, logout thiết bị khác

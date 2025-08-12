import { IsString, MinLength } from 'class-validator';

export class Disable2FADto {
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(1, { message: 'Mật khẩu không được để trống' })
  password: string;

  @IsString({ message: 'Mã OTP phải là chuỗi' })
  @MinLength(6, { message: 'Mã OTP phải có 6 ký tự' })
  otpCode: string;
}

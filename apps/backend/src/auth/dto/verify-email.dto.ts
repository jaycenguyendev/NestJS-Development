import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class VerifyEmailDto {
  @IsString({ message: 'OTP phải là chuỗi' })
  @IsNotEmpty({ message: 'OTP không được để trống' })
  otp: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}

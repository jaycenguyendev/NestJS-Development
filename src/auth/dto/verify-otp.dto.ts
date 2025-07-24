import { IsString, Length, Matches } from 'class-validator';

export class VerifyOTPDto {
  @IsString({ message: 'Mã OTP phải là chuỗi' })
  @Length(6, 6, { message: 'Mã OTP phải có đúng 6 ký tự' })
  @Matches(/^\d{6}$/, { message: 'Mã OTP chỉ được chứa số' })
  otpCode: string;
}

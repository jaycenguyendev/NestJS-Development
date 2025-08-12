import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'Mật khẩu cũ phải là chuỗi' })
  @MinLength(1, { message: 'Mật khẩu cũ không được để trống' })
  currentPassword: string;

  @IsString({ message: 'Mật khẩu mới phải là chuỗi' })
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  @MaxLength(128, { message: 'Mật khẩu mới không được quá 128 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
  })
  newPassword: string;
}

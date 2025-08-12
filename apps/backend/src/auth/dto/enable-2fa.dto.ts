import { IsString, MinLength } from 'class-validator';

export class Enable2FADto {
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(1, { message: 'Mật khẩu không được để trống' })
  password: string;
}

import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyEmailDto {
  @IsString({ message: 'Token phải là chuỗi' })
  @IsNotEmpty({ message: 'Token không được để trống' })
  token: string;
}

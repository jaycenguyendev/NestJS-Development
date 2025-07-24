import { IsString, IsOptional } from 'class-validator';

export class OAuthCallbackDto {
  @IsString({ message: 'Code phải là chuỗi' })
  code: string;

  @IsString({ message: 'State phải là chuỗi' })
  state: string;

  @IsOptional()
  @IsString({ message: 'Error phải là chuỗi' })
  error?: string;

  @IsOptional()
  @IsString({ message: 'Error description phải là chuỗi' })
  error_description?: string;
}

import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum OAuthProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
}

export class OAuthLoginDto {
  @IsEnum(OAuthProvider, { message: 'Provider không hợp lệ' })
  provider: OAuthProvider;

  @IsString({ message: 'Access token phải là chuỗi' })
  accessToken: string;

  @IsOptional()
  @IsString({ message: 'ID token phải là chuỗi' })
  idToken?: string;
}

import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { DatabaseService } from '../../database/database.service';
import { OAuthProvider } from '../dto/oauth-login.dto';

export interface OAuthUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  provider: OAuthProvider;
}

export interface GoogleTokenPayload {
  iss: string;
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified: boolean;
}

export interface FacebookUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}

@Injectable()
export class OAuthService {
  private googleClient: OAuth2Client;

  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
  ) {
    // Initialize Google OAuth client
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
    );
  }

  /**
   * Verify Google OAuth token và lấy user info
   */
  async verifyGoogleToken(accessToken: string): Promise<OAuthUserInfo> {
    try {
      // Verify access token với Google
      const response = await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`,
      );

      const userInfo = response.data;

      if (!userInfo.email) {
        throw new BadRequestException('Google OAuth: Email not provided');
      }

      return {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        provider: OAuthProvider.GOOGLE,
      };
    } catch (error: any) {
      console.error(
        'Google OAuth verification error:',
        error.response?.data || error.message,
      );
      throw new UnauthorizedException('Invalid Google access token');
    }
  }

  /**
   * Verify Google ID Token (alternative method)
   */
  async verifyGoogleIdToken(idToken: string): Promise<OAuthUserInfo> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload() as GoogleTokenPayload;

      if (!payload || !payload.email) {
        throw new BadRequestException('Invalid Google ID token payload');
      }

      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        provider: OAuthProvider.GOOGLE,
      };
    } catch (error: any) {
      console.error('Google ID token verification error:', error.message);
      throw new UnauthorizedException('Invalid Google ID token');
    }
  }

  /**
   * Verify Facebook OAuth token và lấy user info
   */
  async verifyFacebookToken(accessToken: string): Promise<OAuthUserInfo> {
    try {
      // Verify token with Facebook
      const tokenValidationResponse = await axios.get(
        `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${this.configService.get<string>('FACEBOOK_APP_ID')}|${this.configService.get<string>('FACEBOOK_APP_SECRET')}`,
      );

      const tokenData = tokenValidationResponse.data.data;

      if (!tokenData.is_valid) {
        throw new UnauthorizedException('Invalid Facebook access token');
      }

      // Get user info
      const userResponse = await axios.get(
        `https://graph.facebook.com/me?fields=id,email,name,picture&access_token=${accessToken}`,
      );

      const userInfo: FacebookUserInfo = userResponse.data;

      if (!userInfo.email) {
        throw new BadRequestException('Facebook OAuth: Email not provided');
      }

      return {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture?.data?.url,
        provider: OAuthProvider.FACEBOOK,
      };
    } catch (error: any) {
      console.error(
        'Facebook OAuth verification error:',
        error.response?.data || error.message,
      );
      throw new UnauthorizedException('Invalid Facebook access token');
    }
  }

  /**
   * Main method để verify OAuth token dựa trên provider
   */
  async verifyOAuthToken(
    provider: OAuthProvider,
    accessToken: string,
    idToken?: string,
  ): Promise<OAuthUserInfo> {
    switch (provider) {
      case OAuthProvider.GOOGLE:
        // Ưu tiên ID token nếu có
        if (idToken) {
          return this.verifyGoogleIdToken(idToken);
        }
        return this.verifyGoogleToken(accessToken);

      case OAuthProvider.FACEBOOK:
        return this.verifyFacebookToken(accessToken);

      default:
        throw new BadRequestException(
          `Unsupported OAuth provider: ${provider}`,
        );
    }
  }

  /**
   * Lưu hoặc cập nhật OAuth account
   */
  async saveOrUpdateOAuthAccount(
    userId: number,
    provider: OAuthProvider,
    providerAccountId: string,
    accessToken: string,
    refreshToken?: string,
  ): Promise<void> {
    await this.databaseService.oAuthAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      update: {
        accessToken,
        refreshToken,
        updatedAt: new Date(),
      },
      create: {
        provider,
        providerAccountId,
        userId,
        accessToken,
        refreshToken,
      },
    });
  }

  /**
   * Tìm user bằng OAuth account
   */
  async findUserByOAuthAccount(
    provider: OAuthProvider,
    providerAccountId: string,
  ) {
    const oauthAccount = await this.databaseService.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            emailVerified: true,
            twoFactorEnabled: true,
          },
        },
      },
    });

    return oauthAccount?.user || null;
  }

  /**
   * Link OAuth account với user existing
   */
  async linkOAuthAccount(
    userId: number,
    oauthUserInfo: OAuthUserInfo,
    accessToken: string,
  ): Promise<void> {
    await this.saveOrUpdateOAuthAccount(
      userId,
      oauthUserInfo.provider,
      oauthUserInfo.id,
      accessToken,
    );
  }

  /**
   * Kiểm tra user có OAuth account không
   */
  async getUserOAuthAccounts(userId: number) {
    return this.databaseService.oAuthAccount.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        providerAccountId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Unlink OAuth account
   */
  async unlinkOAuthAccount(
    userId: number,
    provider: OAuthProvider,
  ): Promise<void> {
    await this.databaseService.oAuthAccount.deleteMany({
      where: {
        userId,
        provider,
      },
    });
  }

  /**
   * Generate OAuth authorization URL (for OAuth flow)
   */
  getGoogleAuthUrl(redirectUri: string): string {
    const scopes = ['openid', 'email', 'profile'];

    return this.googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      redirect_uri: redirectUri,
      state: this.generateStateToken(),
    });
  }

  /**
   * Generate state token for CSRF protection
   */
  private generateStateToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Exchange authorization code for tokens (Google)
   */
  async exchangeGoogleCode(code: string, redirectUri: string) {
    try {
      const { tokens } = await this.googleClient.getToken({
        code,
        redirect_uri: redirectUri,
      });

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        idToken: tokens.id_token,
      };
    } catch (error: any) {
      console.error('Google code exchange error:', error.message);
      throw new BadRequestException(
        'Failed to exchange Google authorization code',
      );
    }
  }
}

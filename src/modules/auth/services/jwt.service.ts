import * as bcrypt from 'bcrypt';
import { IJWTService, AuthTokens, RefreshTokenResult } from '../interfaces/jwt-service.interface';
import { IAuthSessionRepository } from '../interfaces/auth-session-repository.interface';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  AccessTokenPayload,
  RefreshTokenPayload,
  decodeToken
} from '../../../shared/helpers/jwt';
import { DeviceInfo } from '../interfaces/device-info.interface';
import { RedisService } from '../../../shared/services/redis.service';
import { appConfig } from '../../../config/app.config';

export class JWTService implements IJWTService {
  private readonly ACCESS_TOKEN_EXPIRY = appConfig.jwt.accessTokenExpiry;
  private readonly REFRESH_TOKEN_EXPIRY = appConfig.jwt.refreshTokenExpiry;

  constructor(
    private authSessionRepository: IAuthSessionRepository,
    private redisService: RedisService
  ) { }

  async generateTokens(userId: string, phoneNumber: string, deviceInfo: DeviceInfo): Promise<AuthTokens> {
    // Create session record first
    const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY * 1000);

    const session = await this.authSessionRepository.create({
      userId,
      refreshTokenHash: '', // Will be updated after token generation
      expiresAt,
      deviceInfo,
      isRevoked: false,
    });

    // Generate tokens
    const accessTokenPayload: AccessTokenPayload = { userId, phoneNumber };
    const refreshTokenPayload: RefreshTokenPayload = { userId, sessionId: session.id };

    const accessToken = generateAccessToken(accessTokenPayload);
    const refreshToken = generateRefreshToken(refreshTokenPayload);

    // Hash and store refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await this.authSessionRepository.update(session.id, { refreshTokenHash });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    };
  }

  async refreshTokens(refreshToken: string): Promise<RefreshTokenResult> {
    try {
      // Verify refresh token
      const verificationResult = verifyRefreshToken(refreshToken);

      if (!verificationResult.valid) {
        return {
          success: false,
          error: verificationResult.error || 'Invalid refresh token',
        };
      }

      const payload = verificationResult.payload as RefreshTokenPayload;

      // Find session in database with user relation
      const session = await this.authSessionRepository.findByIdWithUser(payload.sessionId);

      if (!session || session.isRevoked || session.expiresAt < new Date()) {
        return {
          success: false,
          error: 'Session not found or expired',
        };
      }

      // Verify refresh token hash matches
      const tokenMatches = await bcrypt.compare(refreshToken, session.refreshTokenHash);
      if (!tokenMatches) {
        return {
          success: false,
          error: 'Invalid refresh token',
        };
      }

      // Generate new tokens
      const newTokens = await this.generateTokens(
        session.userId,
        session.user.phoneNumber,
        session.deviceInfo
      );

      // Revoke old session
      await this.authSessionRepository.revokeSession(session.id);

      return {
        success: true,
        tokens: newTokens,
      };
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      return {
        success: false,
        error: 'Failed to refresh tokens',
      };
    }
  }

  async revokeToken(refreshToken: string): Promise<boolean> {
    try {
      const verificationResult = verifyRefreshToken(refreshToken);

      if (!verificationResult.valid) {
        return false;
      }

      const payload = verificationResult.payload as RefreshTokenPayload;

      // Blacklist the refresh token in Redis
      const decoded = decodeToken(refreshToken);
      if (decoded && decoded.jti) {
        await this.redisService.blacklistToken(decoded.jti, this.REFRESH_TOKEN_EXPIRY);
      }

      return this.authSessionRepository.revokeSession(payload.sessionId);
    } catch (error) {
      console.error('Error revoking token:', error);
      return false;
    }
  }

  async revokeAllUserTokens(userId: string): Promise<number> {
    return this.authSessionRepository.deleteByUserId(userId);
  }

  async validateAccessToken(token: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
    try {
      const verificationResult = verifyAccessToken(token);

      if (!verificationResult.valid) {
        return {
          valid: false,
          error: verificationResult.error,
        };
      }

      const payload = verificationResult.payload as AccessTokenPayload;

      // Check if token is blacklisted
      const decoded = decodeToken(token);
      if (decoded && decoded.jti) {
        const isBlacklisted = await this.redisService.isTokenBlacklisted(decoded.jti);
        if (isBlacklisted) {
          return {
            valid: false,
            error: 'Token has been revoked',
          };
        }
      }

      return {
        valid: true,
        userId: payload.userId,
      };
    } catch (error) {
      console.error('Error validating access token:', error);
      return {
        valid: false,
        error: 'Token validation failed',
      };
    }
  }
}
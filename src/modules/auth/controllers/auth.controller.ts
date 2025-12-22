import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { IAuthService } from '../interfaces/auth-service.interface';
import { DeviceInfo } from '../interfaces/device-info.interface';
import { TOKENS } from '../../../di/tokens';

@injectable()
export class AuthController {
  constructor(@inject(TOKENS.AuthService) private authService: IAuthService) {}

  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phoneNumber, businessName, email } = req.body;

      // Basic validation
      if (!phoneNumber || !businessName) {
        res.status(400).json({
          success: false,
          error: 'Phone number and business name are required',
        });
        return;
      }

      const result = await this.authService.register(phoneNumber, businessName, email);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          user: {
            id: result.user?.id,
            phoneNumber: result.user?.phoneNumber,
            businessName: result.user?.businessName,
            email: result.user?.email,
            isVerified: result.user?.isVerified,
          },
          otpSent: result.otpSent,
          ...(result.devOtp && { devOtp: result.devOtp }), // Only in dev mode
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify OTP and login user
   * POST /api/v1/auth/verify-otp
   */
  async verifyOTPAndLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phoneNumber, otp } = req.body;

      // Basic validation
      if (!phoneNumber || !otp) {
        res.status(400).json({
          success: false,
          error: 'Phone number and OTP are required',
        });
        return;
      }

      // Extract device info from request
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const deviceInfo: DeviceInfo = {
        userAgent,
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        deviceType: this.detectDeviceType(userAgent),
      };

      const result = await this.authService.verifyOTPAndLogin(phoneNumber, otp, deviceInfo);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          tokens: result.tokens,
          user: {
            id: result.user?.id,
            phoneNumber: result.user?.phoneNumber,
            businessName: result.user?.businessName,
            email: result.user?.email,
            isVerified: result.user?.isVerified,
            connectedPlatforms: result.user?.connectedPlatforms,
            onboardingCompleted: result.user?.onboardingCompleted,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message,
          attemptsRemaining: result.attemptsRemaining,
          lockedUntil: result.lockedUntil,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login existing user (sends OTP)
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        res.status(400).json({
          success: false,
          error: 'Phone number is required',
        });
        return;
      }

      // Send OTP to existing user
      const result = await this.authService.sendLoginOTP(phoneNumber);

      if (result.success) {
        res.json({
          success: true,
          message: 'OTP sent to your phone number',
          otpSent: true,
          ...(result.devOtp && { devOtp: result.devOtp }), // Only in dev mode
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);

      if (result.success) {
        res.json({
          success: true,
          tokens: result.tokens,
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.error || 'Token refresh failed',
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user (revoke refresh token)
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
        return;
      }

      const success = await this.authService.logout(refreshToken);

      if (success) {
        res.json({
          success: true,
          message: 'Logged out successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Logout failed',
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout from all devices
   * POST /api/v1/auth/logout-all
   */
  async logoutAllDevices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const revokedCount = await this.authService.logoutAllDevices(userId);

      res.json({
        success: true,
        message: `Logged out from ${revokedCount} devices`,
        revokedTokens: revokedCount,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Note: This would require a getUserById method in AuthService
      // For now, we return the user info from the JWT token
      res.json({
        success: true,
        user: {
          id: req.user?.id,
          phoneNumber: req.user?.phoneNumber,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
    const ua = userAgent.toLowerCase();

    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    }

    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    }

    return 'desktop';
  }
}

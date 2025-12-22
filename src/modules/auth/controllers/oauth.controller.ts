import { Request, Response, NextFunction } from 'express';
import { WhatsAppOAuthService } from '../services/whatsapp-oauth.service';
import { OAuthCallbackDto } from '../dto/oauth-initiate.dto';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { InstagramOAuthService } from '../services';

export class OAuthController {
  constructor(
    private whatsappOAuthService: WhatsAppOAuthService,
    private instagramOAuthService: InstagramOAuthService
  ) { }

  /**
   * Initiate WhatsApp OAuth flow
   */
  async initiateWhatsAppOAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const result = await this.whatsappOAuthService.initiateOAuth(userId);

      if (result.success) {
        res.json({
          success: true,
          authUrl: result.authUrl,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle WhatsApp OAuth callback
   */
  async handleWhatsAppCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = plainToClass(OAuthCallbackDto, req.query);
      const errors = await validate(dto);

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid callback parameters',
          details: errors,
        });
        return;
      }

      // Check for OAuth error
      if (dto.error) {
        res.status(400).json({
          success: false,
          error: dto.error,
          description: dto.error_description,
        });
        return;
      }

      const result = await this.whatsappOAuthService.handleCallback(dto.code, dto.state);

      if (result.success) {
        // In a real app, you might redirect to a success page
        res.json({
          success: true,
          message: 'WhatsApp connected successfully',
          user: result.user,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disconnect WhatsApp
   */
  async disconnectWhatsApp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const result = await this.whatsappOAuthService.disconnect(userId);

      if (result.success) {
        res.json({
          success: true,
          message: 'WhatsApp disconnected successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Initiate Instagram OAuth flow
   */
  async initiateInstagramOAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const result = await this.instagramOAuthService.initiateOAuth(userId);

      if (result.success) {
        res.json({
          success: true,
          authUrl: result.authUrl,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Instagram OAuth callback
   */
  async handleInstagramCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = plainToClass(OAuthCallbackDto, req.query);
      const errors = await validate(dto);

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid callback parameters',
          details: errors,
        });
        return;
      }

      // Check for OAuth error
      if (dto.error) {
        res.status(400).json({
          success: false,
          error: dto.error,
          description: dto.error_description,
        });
        return;
      }

      const result = await this.instagramOAuthService.handleCallback(dto.code, dto.state);

      if (result.success) {
        res.json({
          success: true,
          message: 'Instagram connected successfully',
          user: result.user,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disconnect Instagram
   */
  async disconnectInstagram(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const result = await this.instagramOAuthService.disconnect(userId);

      if (result.success) {
        res.json({
          success: true,
          message: 'Instagram disconnected successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      next(error);
    }
  }
}
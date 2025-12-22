import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { TOKENS } from '../../../di/tokens';
import { SettingsService } from '../services';
import { successResponse } from '../../../shared/utils/response.util';
import { AppError } from '../../../api/middleware/error.middleware';
import {
  updateSettingsSchema,
  updateNotificationPreferencesSchema,
  updateBusinessProfileSchema,
  updateIntegrationSettingsSchema,
  updateDataPrivacySchema,
} from '../dto';

/**
 * Settings controller
 * Handles HTTP requests for user settings management
 */
@injectable()
export class SettingsController {
  constructor(@inject(TOKENS.SettingsService) private settingsService: SettingsService) { }

  /**
   * Get all user settings
   * GET /api/v1/settings
   */
  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
      }

      const settings = await this.settingsService.getSettings(userId);
      successResponse(res, settings, 'Settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update all user settings
   * PUT /api/v1/settings
   */
  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
      }

      const validatedData = updateSettingsSchema.parse(req.body);
      const settings = await this.settingsService.updateSettings(userId, validatedData);
      successResponse(res, settings, 'Settings updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notification preferences
   * GET /api/v1/settings/notifications
   */
  async getNotificationPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
      }

      const preferences = await this.settingsService.getNotificationPreferences(userId);
      successResponse(res, preferences, 'Notification preferences retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update notification preferences
   * PUT /api/v1/settings/notifications
   */
  async updateNotificationPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
      }

      const validatedData = updateNotificationPreferencesSchema.parse(req.body);
      const preferences = await this.settingsService.updateNotificationPreferences(userId, validatedData);
      successResponse(res, preferences, 'Notification preferences updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get business profile
   * GET /api/v1/settings/profile
   */
  async getBusinessProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
      }

      const profile = await this.settingsService.getBusinessProfile(userId);
      successResponse(res, profile, 'Business profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update business profile
   * PUT /api/v1/settings/profile
   */
  async updateBusinessProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
      }

      const validatedData = updateBusinessProfileSchema.parse(req.body);
      const profile = await this.settingsService.updateBusinessProfile(userId, validatedData);
      successResponse(res, profile, 'Business profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get integration settings
   * GET /api/v1/settings/integrations
   */
  async getIntegrationSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
      }

      const integrations = await this.settingsService.getIntegrationSettings(userId);
      successResponse(res, integrations, 'Integration settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update integration settings
   * PUT /api/v1/settings/integrations
   */
  async updateIntegrationSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
      }

      const validatedData = updateIntegrationSettingsSchema.parse(req.body);
      const integrations = await this.settingsService.updateIntegrationSettings(userId, validatedData);
      successResponse(res, integrations, 'Integration settings updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get data privacy settings
   * GET /api/v1/settings/privacy
   */
  async getDataPrivacySettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
      }

      const privacy = await this.settingsService.getDataPrivacySettings(userId);
      successResponse(res, privacy, 'Data privacy settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update data privacy settings
   * PUT /api/v1/settings/privacy
   */
  async updateDataPrivacySettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
      }

      const validatedData = updateDataPrivacySchema.parse(req.body);
      const privacy = await this.settingsService.updateDataPrivacySettings(userId, validatedData);
      successResponse(res, privacy, 'Data privacy settings updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

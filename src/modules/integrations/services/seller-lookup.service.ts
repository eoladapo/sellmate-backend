import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../../di/tokens';
import { IOAuthTokenRepository } from '../../auth/interfaces/oauth-token-repository.interface';
import { ISellerLookupService, SellerInfo } from '../interfaces/seller-lookup-service.interface';

/**
 * Service for identifying sellers from webhook payloads
 * Maps platform-specific identifiers to user accounts
 */
@injectable()
export class SellerLookupService implements ISellerLookupService {
  constructor(
    @inject(TOKENS.OAuthTokenRepository)
    private oauthTokenRepository: IOAuthTokenRepository
  ) { }

  /**
   * Find seller by WhatsApp phone number ID
   * The phone number ID is used as the business account ID for WhatsApp
   */
  async findByWhatsAppPhoneNumberId(phoneNumberId: string): Promise<SellerInfo | null> {
    return this.findByBusinessAccountId('whatsapp', phoneNumberId);
  }

  /**
   * Find seller by Instagram account ID
   */
  async findByInstagramAccountId(accountId: string): Promise<SellerInfo | null> {
    return this.findByBusinessAccountId('instagram', accountId);
  }

  /**
   * Find seller by platform and business account ID
   */
  async findByBusinessAccountId(
    platform: 'whatsapp' | 'instagram',
    businessAccountId: string
  ): Promise<SellerInfo | null> {
    const token = await this.oauthTokenRepository.findByBusinessAccountId(
      platform,
      businessAccountId
    );

    if (!token) {
      return null;
    }

    return {
      userId: token.userId,
      businessAccountId: token.businessAccountId || businessAccountId,
      businessAccountName: token.businessAccountName,
    };
  }
}

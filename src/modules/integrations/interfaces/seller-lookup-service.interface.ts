/**
 * Seller information returned from lookup operations
 */
export interface SellerInfo {
  userId: string;
  businessAccountId: string;
  businessAccountName?: string;
}

/**
 * Interface for SellerLookupService
 * Used to identify sellers from webhook payloads
 */
export interface ISellerLookupService {
  /**
   * Find seller by WhatsApp phone number ID
   * @param phoneNumberId - The WhatsApp phone number ID from webhook payload
   * @returns SellerInfo if found, null otherwise
   */
  findByWhatsAppPhoneNumberId(phoneNumberId: string): Promise<SellerInfo | null>;

  /**
   * Find seller by Instagram account ID
   * @param accountId - The Instagram account ID from webhook payload
   * @returns SellerInfo if found, null otherwise
   */
  findByInstagramAccountId(accountId: string): Promise<SellerInfo | null>;

  /**
   * Find seller by platform and business account ID
   * @param platform - The platform (whatsapp or instagram)
   * @param businessAccountId - The business account ID
   * @returns SellerInfo if found, null otherwise
   */
  findByBusinessAccountId(
    platform: 'whatsapp' | 'instagram',
    businessAccountId: string
  ): Promise<SellerInfo | null>;
}

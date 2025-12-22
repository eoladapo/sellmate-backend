export interface ConnectedPlatforms {
  whatsapp: {
    connected: boolean;
    businessAccountId?: string;
    accessToken?: string;
    connectedAt?: Date;
  };
  instagram: {
    connected: boolean;
    businessAccountId?: string;
    accessToken?: string;
    connectedAt?: Date;
  };
}
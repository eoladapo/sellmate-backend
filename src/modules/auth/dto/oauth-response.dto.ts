export class OAuthInitiateResponseDto {
  success!: boolean;
  authUrl?: string;
  state?: string;
  error?: string;
}

export class OAuthCallbackResponseDto {
  success!: boolean;
  message?: string;
  user?: {
    id: string;
    phoneNumber: string;
    businessName: string;
    connectedPlatforms: {
      whatsapp: { connected: boolean; accountId?: string };
      instagram: { connected: boolean; accountId?: string };
    };
  };
  error?: string;
}

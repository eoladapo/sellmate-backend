import { IsEnum, IsOptional, IsArray, IsString } from 'class-validator';

export class OAuthInitiateDto {
  @IsEnum(['whatsapp', 'instagram'])
  platform!: 'whatsapp' | 'instagram';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];
}

export class OAuthCallbackDto {
  @IsString()
  code!: string;

  @IsString()
  state!: string;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  error_description?: string;
}
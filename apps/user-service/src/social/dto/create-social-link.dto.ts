import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SocialPlatform {
  LINKEDIN = 'LINKEDIN',
  GITHUB = 'GITHUB',
  XING = 'XING',
  PORTFOLIO = 'PORTFOLIO',
  TWITTER = 'TWITTER',
  OTHER = 'OTHER',
}

export class CreateSocialLinkDto {
  @ApiProperty({ enum: SocialPlatform, example: SocialPlatform.LINKEDIN })
  @IsNotEmpty()
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @ApiPropertyOptional({ example: 'johndoe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  username?: string;

  @ApiProperty({ example: 'https://linkedin.com/in/johndoe' })
  @IsNotEmpty()
  @IsUrl()
  url: string;
}

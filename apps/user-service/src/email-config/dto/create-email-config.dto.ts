import { IsString, IsNotEmpty, IsEmail, IsInt, Min, Max, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EmailEncryption {
  SSL = 'SSL',
  TLS = 'TLS',
  STARTTLS = 'STARTTLS',
  NONE = 'NONE',
}

export class CreateEmailConfigDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Email password or app password' })
  @IsOptional()
  @IsString()
  password: string;

  @ApiProperty({ description: 'Alternative field name for password' })
  @IsOptional()
  @IsString()
  appPassword?: string;

  @ApiPropertyOptional({ description: 'Auto-detected if not provided' })
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiPropertyOptional({ description: 'Auto-detected if not provided' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @ApiPropertyOptional({ enum: EmailEncryption, description: 'Auto-detected if not provided' })
  @IsOptional()
  @IsEnum(EmailEncryption)
  encryption?: EmailEncryption;

  @ApiPropertyOptional({ description: 'Defaults to email username if not provided' })
  @IsOptional()
  @IsString()
  fromName?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  isActive?: boolean;
}

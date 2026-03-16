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

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  smtpHost: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort: number;

  @ApiProperty({ enum: EmailEncryption })
  @IsEnum(EmailEncryption)
  encryption: EmailEncryption;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  fromName: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  isActive?: boolean;
}

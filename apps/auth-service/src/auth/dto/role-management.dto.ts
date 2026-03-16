import { IsString, IsOptional, IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'PREMIUM_USER' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Premium subscription user with extended features' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['jobs:read', 'jobs:apply', 'profile:premium'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}

export class UpdateRoleDto {
  @ApiProperty({ example: 'Premium user with AI features' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['jobs:read', 'jobs:apply', 'ai:access'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}

export class AssignRoleDto {
  @ApiProperty({ example: 'user-uuid-here' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'PREMIUM_USER' })
  @IsString()
  @IsNotEmpty()
  roleName: string;
}

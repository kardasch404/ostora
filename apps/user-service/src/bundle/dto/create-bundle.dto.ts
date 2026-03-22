import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBundleDto {
  @ApiProperty({ example: 'MERN Stack JS' })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Bundle for MERN stack positions' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

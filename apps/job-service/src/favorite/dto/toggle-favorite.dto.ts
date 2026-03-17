import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleFavoriteDto {
  @ApiProperty()
  @IsString()
  @IsUUID()
  jobPostId: string;
}

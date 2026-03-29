import { IsString, IsUUID } from 'class-validator';

export class MarkReadDto {
  @IsString()
  @IsUUID()
  notificationId!: string;
}

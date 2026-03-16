import { IsString } from 'class-validator';

export class Disable2FaDto {
  @IsString()
  password: string;
}

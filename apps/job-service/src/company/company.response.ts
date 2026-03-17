import { ApiProperty } from '@nestjs/swagger';

export class CompanyResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  logoUrl?: string;

  @ApiProperty({ required: false })
  city?: string;

  @ApiProperty({ required: false })
  country?: string;

  @ApiProperty({ required: false })
  website?: string;

  @ApiProperty()
  createdAt: Date;
}

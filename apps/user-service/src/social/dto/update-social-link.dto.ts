import { PartialType } from '@nestjs/swagger';
import { CreateSocialLinkDto } from './create-social-link.dto';

export class UpdateSocialLinkDto extends PartialType(CreateSocialLinkDto) {}

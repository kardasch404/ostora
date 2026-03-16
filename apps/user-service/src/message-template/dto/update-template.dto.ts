import { PartialType } from '@nestjs/swagger';
import { CreateMessageTemplateDto } from './create-template.dto';

export class UpdateMessageTemplateDto extends PartialType(CreateMessageTemplateDto) {}

import { PartialType } from '@nestjs/swagger';
import { createConversationDto } from './create-conversation.dto';

export class UpdateChatDto extends PartialType(createConversationDto) {}

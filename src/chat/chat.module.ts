import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaService } from '../common/services/prisma.service';
import { AppGateway } from '../app.gateway';

@Module({
  controllers: [ChatController],
  providers: [ChatService, PrismaService, AppGateway],
})
export class ChatModule {}

import { Controller, Get, Post, Body, Patch, Param, Delete, Request, ParseIntPipe } from '@nestjs/common';
import { ChatService } from './chat.service';
import { createConversationDto } from './dto/create-conversation.dto';
import { SendChatDto } from './dto/send-chat.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { RequestWithUser } from '../auth/jwt.strategy';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createConversation(
    @Body() createConversationDto: createConversationDto,
    @Request() request: RequestWithUser,
  ) {
    const result = await this.chatService.createConversation({
      createConversationDto,
      userId: request.user.userId,
    });

    if (result.error) {
      return {
        success: false,
        message: result.message,
      };
    }

    return {
      success: true,
      conversationId: result.conversationId,
      message: result.message,
      isNew: result.isNew,
      lastMessage: result.lastMessage,
    };
  }


  @Post(':conversationId')
  @UseGuards(JwtAuthGuard)
  async sendChat(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Body() sendChatDto: SendChatDto,
    @Request() request: RequestWithUser,

  ) {
    return this.chatService.sendChat({
      conversationId,
      senderId: request.user.userId,
      sendChatDto,
    });
  };

@UseGuards(JwtAuthGuard)
@Get()
async getConversations(@Request() request: RequestWithUser){
  return await this.chatService.getConversations({
    userId: request.user.userId
  })
};

@UseGuards(JwtAuthGuard)
@Get(':conversationId')
async getConversation(
  @Param('conversationId', ParseIntPipe) conversationId: number,
  @Request() request: RequestWithUser
){
  return await this.chatService.getConversation({
    userId: request.user.userId,
    conversationId,
  })
}

 @UseGuards(JwtAuthGuard)
 @Delete(':conversationId/hide')
 async hideConversation(
  @Param('conversationId', ParseIntPipe) conversationId: number,
  @Request() request: RequestWithUser,
 ){
  return await this.chatService.hideConversation({
    userId: request.user.userId,
    conversationId,
  });
 }

 @UseGuards(JwtAuthGuard)
 @Delete(':conversationId/messages/:messageId')
 async hideMessage(
  @Param('conversationId', ParseIntPipe) conversationId: number,
  @Param('messageId', ParseIntPipe) messageId: number,
  @Request() request: RequestWithUser,
 ){
  return await this.chatService.hideMessage({
    userId: request.user.userId,
    conversationId,
    messageId,
  });
 }

 @UseGuards(JwtAuthGuard)
 @Delete(':conversationId/messages/:messageId/for-all')
 async deleteMessageForAll(
  @Param('conversationId', ParseIntPipe) conversationId: number,
  @Param('messageId', ParseIntPipe) messageId: number,
  @Request() request: RequestWithUser,
 ){
  return await this.chatService.deleteMessageForAll({
    userId: request.user.userId,
    conversationId,
    messageId,
  });
 }

}

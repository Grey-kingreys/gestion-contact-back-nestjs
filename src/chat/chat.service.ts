import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { createConversationDto } from './dto/create-conversation.dto';
import { SendChatDto } from './dto/send-chat.dto';
import { AppGateway } from '../app.gateway';
import { error } from 'console';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: AppGateway,
  ) {}
  
  async createConversation({
    createConversationDto: { recipiendId },
    userId,
  }: {
    createConversationDto: createConversationDto;
    userId: number;
  }) {
    try {
      // Vérifier que l'utilisateur ne crée pas de conversation avec lui-même
      if (userId === recipiendId) {
        throw new Error("Vous ne pouvez pas créer de conversation avec vous-même.");
      }

      const [existingRecipient, existingUser] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: recipiendId },
          select: { id: true, name: true, email: true },
        }),
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true },
        })
      ]);

      if (!existingRecipient) {
        throw new Error("L'utilisateur sélectionné n'existe pas.");
      }

      if (!existingUser) {
        throw new Error("Votre compte n'est plus valide.");
      }
      
      // Vérifier s'il existe déjà une conversation entre ces deux utilisateurs
      const existingConversation = await this.prisma.conversation.findFirst({
        where: {
          AND: [
            { users: { some: { id: existingUser.id } } },
            { users: { some: { id: existingRecipient.id } } },
          ],
        },
        select: { 
          id: true,
          updatedAt: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, createdAt: true }
          }
        },
      });

      // Si une conversation existe déjà, on la retourne avec le dernier message
      if (existingConversation) {
        const lastMessage = existingConversation.messages[0];
        return {
          error: false,
          conversationId: existingConversation.id,
          message: "Conversation existante trouvée",
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            sentAt: lastMessage.createdAt
          } : null,
          isNew: false
        };
      }

      // Créer une nouvelle conversation
      const createConversation = await this.prisma.conversation.create({
        data: {
          userId: existingUser.id,
          users: {
            connect: [
              { id: existingUser.id },
              { id: existingRecipient.id }
            ]
          },
          // Créer un premier message de bienvenue
          messages: {
            create: {
              content: `Nouvelle conversation entre ${existingUser.name} et ${existingRecipient.name}`,
              senderId: existingUser.id,
            }
          }
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, createdAt: true }
          }
        }
      });

      // Récupérer le dernier message (qui est le message de bienvenue)
      const lastMessage = createConversation.messages[0];
      
      return {
        error: false,
        conversationId: createConversation.id,
        message: "Votre conversation a été créée avec succès",
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          sentAt: lastMessage.createdAt
        } : null,
        isNew: true
      };
    } catch (error) {
      console.log(error)
      return {
        error: true,
        message: error.message
      }
    }
  }

  async sendChat({
    sendChatDto,
    conversationId,
    senderId,
  }: {
    sendChatDto: SendChatDto;
    conversationId: number;
    senderId: number;
  }) {
    try {
      const [existingConversation, existingUser] = await Promise.all([
        this.prisma.conversation.findUnique({
          where : {
            id: conversationId
          },
        }),
        this.prisma.user.findUnique({
          where : {
            id: senderId
          },
        })
      ]);
      if(!existingConversation){
        throw new Error('La conversation n\'existe pas');
      }
      if(!existingUser){
        throw new Error('L\'utilisateur n\'existe pas');
      }
      const updateConversation = await this.prisma.conversation.update({
        where: { 
          id: existingConversation.id
        },
        data: {
          messages : {
            create : {
              content : sendChatDto.content,
              sender : {
                connect : {
                  id: existingUser.id
                }
              }
            }
          }
        },
        select : {
          messages : {
            select : {
              content: true,
              id: true,
              sender : {
                select: {
                  id: true,
                  name: true,
                }
              }
            },
            orderBy : {
              createdAt : 'asc'
            }
          }
        }    
      });
      const newMessage = updateConversation.messages[updateConversation.messages.length - 1];
      try {
        this.gateway.server?.to(String(conversationId)).emit('chat:newMessage', {
          conversationId,
          message: newMessage,
        });
      } catch (e) {
        return {
          error: e,
          message: "Un probleme avec le serveur de message"
        }
      }

      return {
        error: false,
        message: "Votre message a été envoyé"
      }

    } catch (error) {
      console.log(error)
      if (error.message === 'La conversation n\'existe pas') {
        return {
          error: true,
          message: 'La conversation n\'existe pas',
        }
      } else if (error.message === 'L\'utilisateur n\'existe pas') {
        return {
          error: true,
          message: 'L\'utilisateur n\'existe pas',
        }
      } else {
        return {
          error: true,
          message: error.message
        }
      }
    }
  }

  async getConversations({userId}: {userId: number}) {
    try {
      const conversations = await this.prisma.conversation.findMany({
        where: {
          users: { some: { id: userId } },
          hides: { none: { userId } },
        },
        select: {
          id: true,
          updatedAt: true,
          users: { select: { id: true, name: true } },
          messages: {
            select: {
              id: true,
              content: true,
              sender: { select: { id: true, name: true } },
            },
            where: {
              deletedForAll: false,
              hides: { none: { userId } },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return conversations;

    } catch (error) {
      console.log(error)
      return {
        error: true,
        message: error.message
      }
    }
  }

  async getConversation({
    userId,
    conversationId
  }: {
    userId: number;
    conversationId: number;
  }) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: {
          id: userId
        },
      });
      if(!existingUser){
        throw new Error ("L'utilisateur n'existe pas.");
      }

      const conversation = await this.prisma.conversation.findUnique({
        where: {
          id: conversationId,
        },
        select : {
          id: true,
          updatedAt : true,
          users : {
            select : {
              id : true,
              name : true,
            }
          },
          messages : {
            select : {
              id : true,
              content : true,
              sender : {
                select : {
                  id : true,
                  name : true,
                }
              }
            },
            where: {
              deletedForAll: false,
              hides: { none: { userId } },
            },
            orderBy : {
              createdAt : 'asc'
            }
          }
        }
      });
      if(!conversation){
        throw new Error ("Cette conversation n'existe pas.");
      }
      return conversation
      
  }catch(error) {
    console.log(error)
    return {
      error: true,
      message: error.message
    }

  }

}
  
async hideConversation({
     userId, 
     conversationId 
    }: { 
      userId: number; 
      conversationId: number 
    }) {

    const conv = await this.prisma.conversation.findUnique({ 
      where: { 
        id: conversationId 
      }, select: {
        id: true, 
        users: { 
          select: { 
            id: true 
          } 
        } 
      } 
    });

    if (!conv) return { 
      error: true,
      message: "La conversation n'existe pas" 
    };

    const isMember = conv.users.some(u => u.id === userId);

    if (!isMember) return { error: true, message: "Accès refusé" };
    await this.prisma.conversationHide.upsert({
      where: { 
        userId_conversationId: { 
          userId, 
          conversationId 
        } 
      },
      create: { 
        userId, 
        conversationId 
      },
      update: {},
    });
    return { error: false, message: 'Conversation masquée' };
  }

  
  
  async hideMessage({ 
    userId, 
    conversationId, 
    messageId 
  }: { 
    userId: number; 
    conversationId: number; 
    messageId: number 
  }) {

    const msg = await this.prisma.chatMessage.findFirst({ 
      where: { 
        id: messageId, 
        chatId: conversationId 
      }, 
      select: { 
        id: true 
      } 
    });

    if (!msg) return { 
      error: true, 
      message: "Message introuvable" 
    };

    await this.prisma.messageHide.upsert({
      where: { 
        userId_messageId: { 
          userId, 
          messageId 
        } 
      },

      create: { 
        userId, 
        messageId 
      },

      update: {},
    });
    return { error: false, message: 'Message masqué' };
  }

  
  async deleteMessageForAll({ 
    userId, 
    conversationId, 
    messageId 
  }: { 
    userId: number; 
    conversationId: number; 
    messageId: number 
  }) {

    const msg = await this.prisma.chatMessage.findFirst({ 
      where: { id: messageId, 
        chatId: conversationId 
      }, 
      select: { 
        id: true, 
        senderId: true 
      } 
    });

    if (!msg) return { 
      error: true, 
      message: "Message introuvable" 
    };

    if (msg.senderId !== userId) return { 
      error: true, 
      message: "Seul l'expéditeur peut supprimer pour tous" 
    };

    await this.prisma.chatMessage.update({ 
      where: { 
        id: messageId 
      }, 
      data: { 
        deletedForAll: true, 
        deletedAt: new Date() 
      } 
    });

    try {
      this.gateway.server?.to(String(conversationId)).emit('chat:messageDeleted', 
        { 
          conversationId, 
          messageId, 
          scope: 'all' 
        });

    } catch {

    }
    return { 
      error: false, 
      message: 'Message supprimé pour tout le monde' 
    };
    
  }
}
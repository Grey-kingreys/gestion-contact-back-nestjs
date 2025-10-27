// contacts.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, data: { firstname: string; lastname: string; email: string; phone?: string }) {
    return this.prisma.contact.create({
      data: {
        ...data,
        userId: userId
      }
    });
  }

  async findAllByUser(userId: number) {
    return this.prisma.contact.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOneByUser(userId: number, contactId: number) {
    return this.prisma.contact.findFirst({
      where: { 
        id: contactId,
        userId: userId 
      }
    });
  }

  async update(userId: number, contactId: number, data: any) {
    return this.prisma.contact.update({
      where: { 
        id: contactId,
        userId: userId 
      },
      data
    });
  }

  async remove(userId: number, contactId: number) {
    return this.prisma.contact.delete({
      where: { 
        id: contactId,
        userId: userId 
      }
    });
  }
}
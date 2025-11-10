// contacts.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/jwt.strategy';


@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private contactsService: ContactsService) {} // ✅ Bon service

  @Get('all')
  getUserContacts(@Request() req: RequestWithUser) {
    return this.contactsService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  getUserContact(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.contactsService.findOneByUser(req.user.userId, +id);
  }

  @Post('create')
  createContact(@Request() req: RequestWithUser, @Body() dto: any) {
    return this.contactsService.create(req.user.userId, dto);
  }

  @Patch('update/:id')
  updateContact(@Request() req: RequestWithUser, @Param('id') id: string, @Body() dto: any) {
    return this.contactsService.update(req.user.userId, +id, dto);
  }

  @Delete('delete/:id')
  deleteContact(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.contactsService.remove(req.user.userId, +id);
  }
}
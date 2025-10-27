// contacts.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private contactsService: ContactsService) {} // ✅ Bon service

  @Get('all')
  getUserContacts(@Request() req) {
    return this.contactsService.findAllByUser(req.user.sub);
  }

  @Get(':id')
  getUserContact(@Request() req, @Param('id') id: string) {
    return this.contactsService.findOneByUser(req.user.sub, +id);
  }

  @Post('create')
  createContact(@Request() req, @Body() dto: any) {
    return this.contactsService.create(req.user.sub, dto);
  }

  @Patch('update/:id')
  updateContact(@Request() req, @Param('id') id: string, @Body() dto: any) {
    return this.contactsService.update(req.user.sub, +id, dto);
  }

  @Delete('delete/:id')
  deleteContact(@Request() req, @Param('id') id: string) {
    return this.contactsService.remove(req.user.sub, +id);
  }
}
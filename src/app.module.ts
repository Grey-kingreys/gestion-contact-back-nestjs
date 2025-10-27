// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Ajouter cette importation
import { UsersModule } from './users/users.module';
import { ContactsModule } from './contacts/contacts.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { MailerService } from './mailer.service';
import { AppGateway } from './app.gateway';


@Module({
  imports: [
    ConfigModule.forRoot(), // Ajouter cette ligne
    UsersModule, 
    ContactsModule, 
    AuthModule, 
  ],
  providers: [PrismaService, MailerService, AppGateway],
})
export class AppModule {}
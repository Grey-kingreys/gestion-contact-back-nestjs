// users.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Ajouter cette importation
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { MailerService } from '../common/services/mailer.service';
import { RecaptchaService } from '../common/services/recaptcha.service';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot(), // Ajouter cette ligne
  ],
  controllers: [UsersController],
  providers: [UsersService, PrismaService, MailerService, RecaptchaService],
  exports: [UsersService],
})
export class UsersModule {}
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Ajouter cette importation
import { UsersModule } from './users/users.module';
import { ContactsModule } from './contacts/contacts.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './common/services/prisma.service';
import { MailerService } from './common/services/mailer.service';
import { RecaptchaService } from './common/services/recaptcha.service';
import { RecaptchaGuard } from './common/guards/recaptcha.guard';
import { RecaptchaInterceptor } from './common/interceptors/recaptcha.interceptor';
import { ChatModule } from './chat/chat.module';


@Module({
  imports: [
    ConfigModule.forRoot(), // Ajouter cette ligne
    UsersModule, 
    ContactsModule, 
    AuthModule, ChatModule, 
  ],
  providers: [
    PrismaService, 
    MailerService, 
    RecaptchaService, 
    RecaptchaGuard, 
    RecaptchaInterceptor],
})
export class AppModule {}
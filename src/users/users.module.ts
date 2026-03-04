// users.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Ajouter cette importation
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../common/services/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { MailerService } from '../common/services/mailer.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot(),
    UploadModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, PrismaService, MailerService],
  exports: [UsersService],
})
export class UsersModule {}
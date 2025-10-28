import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '../common/services/mailer.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private jwtService: JwtService, private mailerService: MailerService) {}

  async create(data: { name: string; email: string; password: string }) {
    const hashed = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: { name: data.name, email: data.email, password: hashed },
    });
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    await this.prisma.token.create({
      data: {
        token,
        userId: user.id,
      },
    });
    await this.mailerService.sendCreatedAccountEmail({
      recipient: user.email,
      name: user.name,
    });
    return { user, token };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const match = await bcrypt.compare(password, user.password);
    if (!match) return null;
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new BadRequestException('Email ou mot de pass incorrect');
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    await this.prisma.token.create({
      data: {
        token,
        userId: user.id,
      },
    });
    return { user, token };
  }


    async resetUserPasswordRequest({email}: {email: string}) {

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Utilisateur existe pas');
    if(user.isVerified === true) {
      throw new BadRequestException('Utilisateur est deja entrain de reinitialiser son mot de passe');
    }

    await this.prisma.user.update({
      where: { email },
      data: {
        isVerified : true,
        resetPasswordToken: this.jwtService.sign({
          sub: user.id,
          email: user.email,
        }),
        resetPasswordTokenExpiry: new Date(Date.now() + 60 * 1000),
      }
    })

    await this.mailerService.sendResetPasswordEmail({
      recipient: user.email,
      name: user.name,
      token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
      }),
    })
  }

  async ResetPassword({token, password}: {token: string, password: string}) {
    console.log('Token:', token);
    const user = await this.prisma.user.findUnique({ where: { resetPasswordToken: token } });
    console.log('User:', user);
    if (!user) throw new BadRequestException('Utilisateur existe pas');
    if(user.isVerified === false) {
      throw new BadRequestException('Utilisateur n est pas verifie');
    }
    if(user.resetPasswordTokenExpiry < new Date()) {
      await this.prisma.user.update({
        where: { resetPasswordToken: token },
        data: {
          isVerified : false,
          resetPasswordToken: null,
          resetPasswordTokenExpiry: null,
        }
      })
      throw new BadRequestException('Lien expiré');
    }
    await this.prisma.user.update({
      where: { resetPasswordToken: token },
      data: {
        isVerified : false,
        password: await bcrypt.hash(password, 10),
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      }
    })
    return user;
  }

  async logout(userId: number, token: string) {
    await this.prisma.token.deleteMany({ where: { userId, token } });
  }

  async logoutAll(userId: number) {
    await this.prisma.token.deleteMany({ where: { userId } });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: number, data: any) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return this.prisma.user.update({ where: { id }, data });
  }

  async remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}

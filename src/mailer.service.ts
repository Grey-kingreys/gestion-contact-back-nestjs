import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly mailer: Resend;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not defined');
    }

    this.mailer = new Resend(apiKey);
    this.fromEmail = 'Acme <onboarding@resend.dev>';
  }

  async sendCreatedAccountEmail({ recipient, name }: { recipient: string; name: string }) {
    const subject = 'Bienvenue sur Notre plateforme de gestion de contact';
    const html = this.getWelcomeTemplate(name);

    return this.sendEmail({ recipient, subject, html });
  }

  async sendResetPasswordEmail({ recipient, name, token }: { 
    recipient: string; 
    name: string; 
    token: string; 
  }) {
    
    const link = `${process.env.CORS_ORIGIN}/reset-password/${token}`;
    const subject = 'Notre plateforme de gestion de contact - Réinitialisation de mot de passe';
    const html = this.getResetPasswordTemplate(name, link);

    return this.sendEmail({ recipient, subject, html });
  }

  private async sendEmail({ recipient, subject, html }: { 
    recipient: string; 
    subject: string; 
    html: string; 
  }) {
    try {
      const { data, error } = await this.mailer.emails.send({
        from: this.fromEmail,
        to: [recipient],
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send email to ${recipient}: ${error.message}`);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      this.logger.log(`Email sent successfully to ${recipient}`);
      return data;

    } catch (error) {
      this.logger.error(`Email sending failed to ${recipient}:`, error);
      throw error;
    }
  }

  private getWelcomeTemplate(name: string): string {
    return `Bienvenue ${name} 
    sur notre plateforme de gestion de contact! Nous sommes <strong>heureux</strong> 
    de vous avoir parmi nous!`;
  }

  private getResetPasswordTemplate(name: string, link: string): string {
    return `
      Bonjour ${name}, 
      <br><br>
      Voici votre lien de réinitialisation de mot de passe: 
      <a href="${link}">Réinitialiser mon mot de passe</a>
      <br><br>
      Ce lien expirera dans 1 minute.
    `;
  }
}
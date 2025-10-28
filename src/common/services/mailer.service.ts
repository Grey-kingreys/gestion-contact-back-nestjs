import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

interface EmailOptions {
  recipient: string;
  subject: string;
  html: string;
}

interface UserEmailParams {
  recipient: string;
  name: string;
}

interface ResetPasswordParams extends UserEmailParams {
  token: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly mailer: Resend;
  private readonly fromEmail: string;
  private readonly corsOrigin: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.corsOrigin = this.configService.get<string>('CORS_ORIGIN');
    
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not defined');
    }

    if (!this.corsOrigin) {
      throw new Error('CORS_ORIGIN is not defined');
    }

    this.mailer = new Resend(apiKey);
    this.fromEmail = 'Acme <onboarding@resend.dev>';
  }

  async sendCreatedAccountEmail(params: UserEmailParams): Promise<any> {
    const subject = 'Bienvenue sur Notre plateforme de gestion de contact';
    const html = this.getWelcomeTemplate(params.name);

    return this.sendEmail({ 
      recipient: params.recipient, 
      subject, 
      html 
    });
  }

  async sendResetPasswordEmail(params: ResetPasswordParams): Promise<any> {
    const link = `${this.corsOrigin}/reset-password/${params.token}`;
    const subject = 'Notre plateforme de gestion de contact - Réinitialisation de mot de passe';
    const html = this.getResetPasswordTemplate(params.name, link);

    return this.sendEmail({ 
      recipient: params.recipient, 
      subject, 
      html 
    });
  }

  private async sendEmail(options: EmailOptions): Promise<any> {
    try {
      const { data, error } = await this.mailer.emails.send({
        from: this.fromEmail,
        to: [options.recipient],
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        this.logger.error(`Failed to send email to ${options.recipient}: ${error.message}`);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      this.logger.log(`Email sent successfully to ${options.recipient}`);
      return data;

    } catch (error) {
      this.logger.error(`Email sending failed to ${options.recipient}:`, error);
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
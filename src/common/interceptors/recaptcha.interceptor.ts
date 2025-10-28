// src/common/interceptors/recaptcha.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RecaptchaService } from '../services/recaptcha.service';

@Injectable()
export class RecaptchaInterceptor implements NestInterceptor {
  constructor(private readonly recaptchaService: RecaptchaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new HttpException('reCAPTCHA token is required', HttpStatus.BAD_REQUEST);
    }

    const isValid = await this.recaptchaService.validateToken(token);
    
    if (!isValid) {
      throw new HttpException('reCAPTCHA verification failed', HttpStatus.FORBIDDEN);
    }

    return next.handle();
  }

  private extractToken(request: any): string | null {
    if (request.body && request.body.recaptchaToken) {
      return request.body.recaptchaToken;
    }

    const headerToken = request.headers['recaptcha-token'] || request.headers['x-recaptcha-token'];
    if (headerToken) {
      return Array.isArray(headerToken) ? headerToken[0] : headerToken;
    }

    if (request.query && request.query.recaptchaToken) {
      return request.query.recaptchaToken;
    }

    return null;
  }
}
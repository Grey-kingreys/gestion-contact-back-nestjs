import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from "@nestjs/common";
import { RecaptchaService } from "../services/recaptcha.service";

@Injectable()
export class RecaptchaGuard implements CanActivate {
    constructor(private readonly recaptchaService: RecaptchaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = this.extractToken(request);

        if(!token){
            throw new HttpException('Le token de reCAPTCHA est manquant', HttpStatus.BAD_REQUEST);
        }

        const isValid = await this.recaptchaService.validateToken(token);

        if(!isValid){
            throw new HttpException('Le token de reCAPTCHA est invalide', HttpStatus.BAD_REQUEST);
        }

        return true;
    }

    private extractToken(request: any): string | null {
        //Verifier le token dans le body
        if(request.body && request.body.recaptchaToken) {
            return request.body.recaptchaToken;
        }


        //Verifier le token dans les header
        const headerToken = request.headers['recaptcha-token'] || request.headers['x-recaptcha-token'];
        if(headerToken) {
            return Array.isArray(headerToken)? headerToken[0]: headerToken;
        }


        //verifier dans le query
        if(request.query && request.query.recaptchaToken) {
            return request.query.recaptchaToken;
        }

        return null;
    }
}

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { promises } from 'dns';

@Injectable()
export class RecaptchaService {
    private secretKey: string;
    constructor(private configService: ConfigService) {
        this.secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY');

        if(!this.secretKey) {
            throw new HttpException(
                'RECAPTCHA_SECRET_KEY is not defined', 
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async verifyToke(
         token: string
        ): 
        Promise<{ 
            success: boolean, 
            score?: number, 
            reason?: string[]
        }>{
            if(!token) {
                throw new HttpException(
                    'reCAPTCHAT token est requis', 
                    HttpStatus.BAD_REQUEST
                );
            }
            try {
                const response = await axios.post(
                    `https://www.google.com/recaptcha/api/siteverify`, null,
                    {
                        params: {
                            secret: this.secretKey,
                            response: token
                        }
                    }
                );
                const { success, score, 'error-codes': errorCodes } = response.data;
                return {
                    success: success && score > 0.5,
                    score,
                    reason: errorCodes
                }
            } catch (error) {
                console.log('Erreur lors de la verification de reCAPTCHA', error)
                throw new HttpException(
                    'reCAPTCHA verification failed',
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
        
    }

    async validateToken(token: string): Promise<boolean>{
        const result = await this.verifyToke(token);
        return result.success;
    }
}

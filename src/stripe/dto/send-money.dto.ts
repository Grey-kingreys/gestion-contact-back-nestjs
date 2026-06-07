import { IsEmail, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class SendMoneyDto {
    @IsEmail({}, { message: 'Email du destinataire invalide' })
    receiverEmail: string;

    @IsNumber({}, { message: 'Le montant doit être un nombre' })
    @Min(1, { message: 'Montant minimum : 1€' })
    @Max(10000, { message: 'Montant maximum : 10 000€' })
    amount: number;

    @IsOptional()
    @IsString()
    description?: string;
}
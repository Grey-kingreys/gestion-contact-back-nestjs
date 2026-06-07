import { IsString, IsIn } from 'class-validator';

export class CreateSubscriptionDto {
    @IsString()
    @IsIn(['monthly', 'yearly'], {
        message: 'Le plan doit être "monthly" ou "yearly"'
    })
    plan: 'monthly' | 'yearly';
}
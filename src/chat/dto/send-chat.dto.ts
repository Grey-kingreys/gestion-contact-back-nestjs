import { IsString, MinLength } from "class-validator";

export class SendChatDto {
    @IsString({
        message: 'Vous devez fournir un message.',
    })
    @MinLength(1, {
        message: 'Le message doit contenir au moins 1 caractère.',
    })
    content: string;
}

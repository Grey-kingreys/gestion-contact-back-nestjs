import { IsNumber, IsString } from "class-validator";

export class createConversationDto {
    @IsNumber()
    recipiendId: number
}

import { IsOptional, IsEmail } from 'class-validator';

export class CreateContactDto {
  @IsOptional()
  firstname?: string;

  @IsOptional()
  lastname?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  phone?: string;
}

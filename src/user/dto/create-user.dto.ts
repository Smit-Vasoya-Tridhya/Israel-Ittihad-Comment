import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @Length(6, 20)
  password: string;

  @IsString()
  firstname: string;

  @IsString()
  lastname: string;

  @IsString()
  status: string;

  @IsString()
  site: string;

  @IsNumber()
  phone: string;

  @IsString()
  user_type: string;
}

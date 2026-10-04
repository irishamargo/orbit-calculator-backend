import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterOrbitUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @MaxLength(120)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;
}

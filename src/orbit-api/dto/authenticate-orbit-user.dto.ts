import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class AuthenticateOrbitUserDto {
  @ApiProperty({
    example: 'pilot@example.com',
    description: 'Почта зарегистрированного пользователя',
  })
  @IsEmail()
  @MaxLength(120)
  email: string;

  @ApiProperty({ example: 'orbit-pass-2026', minLength: 6, maxLength: 255 })
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;
}

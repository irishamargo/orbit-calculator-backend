import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterOrbitUserDto {
  @ApiProperty({ example: 'Космический пилот', minLength: 2, maxLength: 80 })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'pilot@example.com', maxLength: 120 })
  @IsEmail()
  @MaxLength(120)
  email: string;

  @ApiProperty({ example: 'orbit-pass-2026', minLength: 6, maxLength: 255 })
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateOrbitTypeDto {
  @ApiProperty({
    example: 'Низкая околоземная орбита',
    minLength: 2,
    maxLength: 120,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @IsNotEmpty()
  name: string;
}

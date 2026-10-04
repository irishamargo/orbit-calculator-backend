import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateOrbitTypeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @IsNotEmpty()
  name: string;
}

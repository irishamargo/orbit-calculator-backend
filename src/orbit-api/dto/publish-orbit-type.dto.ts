import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class PublishOrbitTypeDto {
  @ApiProperty({ example: 'Орбита для наблюдения Земли', maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description: string;

  @ApiProperty({ example: 550, minimum: 0, maximum: 40000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(40000)
  height: number;

  @ApiProperty({ example: 51.6, minimum: 0, maximum: 180 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(180)
  inclination: number;
}

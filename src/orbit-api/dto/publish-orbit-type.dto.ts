import { Type } from 'class-transformer';
import { IsNumber, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class PublishOrbitTypeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(40000)
  height: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(180)
  inclination: number;
}

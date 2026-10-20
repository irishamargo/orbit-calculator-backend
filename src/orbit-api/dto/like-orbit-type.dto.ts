import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class LikeOrbitTypeDto {
  @ApiProperty({
    enum: [0, 1],
    description: '1 — поставить лайк, 0 — снять лайк',
  })
  @IsIn([0, 1])
  liked: 0 | 1;
}

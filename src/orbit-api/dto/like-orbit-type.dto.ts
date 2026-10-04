import { IsIn } from 'class-validator';

export class LikeOrbitTypeDto {
  @IsIn([0, 1])
  liked: 0 | 1;
}

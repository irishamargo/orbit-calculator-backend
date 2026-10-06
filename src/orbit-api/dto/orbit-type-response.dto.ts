import { Expose } from 'class-transformer';

export class OrbitTypeResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  description: string | null;

  @Expose()
  height: number | null;

  @Expose()
  inclination: number | null;

  @Expose()
  image: string;

  @Expose()
  video: string;

  @Expose()
  status: string;

  @Expose()
  creatorId: number;

  @Expose()
  createdAt: Date;

  @Expose()
  formedAt: Date | null;

  @Expose()
  isCreator: 0 | 1;

  @Expose()
  likeCount: number;

  @Expose()
  isLiked: 0 | 1;
}

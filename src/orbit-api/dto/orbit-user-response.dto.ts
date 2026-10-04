import { Expose } from 'class-transformer';

export class OrbitUserResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  email: string;
}

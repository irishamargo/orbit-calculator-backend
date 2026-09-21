import { Module } from '@nestjs/common';
import { OrbitTypeModule } from './orbit-type/orbit-type.module.js';

@Module({
  imports: [OrbitTypeModule],
})
export class AppModule {}

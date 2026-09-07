import { Module } from '@nestjs/common';
import { OrbitModule } from './orbit/orbit.module.js';

@Module({
  imports: [OrbitModule],
})
export class AppModule {}

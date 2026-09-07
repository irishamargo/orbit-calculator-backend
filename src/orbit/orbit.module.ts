import { Module } from '@nestjs/common';
import { OrbitController } from './orbit.controller.js';
import { OrbitService } from './orbit.service.js';

@Module({
  controllers: [OrbitController],
  providers: [OrbitService]
})
export class OrbitModule {}

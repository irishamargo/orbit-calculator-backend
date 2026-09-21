import { Module } from '@nestjs/common';

import { OrbitTypeController } from './orbit-type.controller.js';
import { OrbitTypeService } from './orbit-type.service.js';

@Module({
  controllers: [OrbitTypeController],
  providers: [OrbitTypeService],
})
export class OrbitTypeModule {}

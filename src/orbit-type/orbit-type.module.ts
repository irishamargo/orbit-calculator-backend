import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrbitTypeController } from './orbit-type.controller.js';
import { OrbitTypeService } from './orbit-type.service.js';
import { OrbitTypeEntity } from './entities/orbit-type.entity.js';
import { OrbitTypeLike } from './entities/orbit-type-like.entity.js';
import { OrbitUser } from './entities/orbit-user.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([OrbitTypeEntity, OrbitTypeLike, OrbitUser])],
  controllers: [OrbitTypeController],
  providers: [OrbitTypeService],
})
export class OrbitTypeModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrbitTypeLike } from '../orbit-type/entities/orbit-type-like.entity.js';
import { OrbitTypeEntity } from '../orbit-type/entities/orbit-type.entity.js';
import { OrbitUser } from '../orbit-type/entities/orbit-user.entity.js';
import { OrbitApiController } from './orbit-api.controller.js';
import { OrbitApiService } from './orbit-api.service.js';
import { OrbitMediaStorageService } from './minio.service.js';
import { OrbitUserApiController } from './orbit-user-api.controller.js';
import { OrbitUserApiService } from './orbit-user-api.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([OrbitTypeEntity, OrbitTypeLike, OrbitUser])],
  controllers: [OrbitApiController, OrbitUserApiController],
  providers: [OrbitApiService, OrbitUserApiService, OrbitMediaStorageService],
})
export class OrbitApiModule {}

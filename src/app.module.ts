import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrbitTypeModule } from './orbit-type/orbit-type.module.js';
import { OrbitApiModule } from './orbit-api/orbit-api.module.js';
import { OrbitTypeEntity } from './orbit-type/entities/orbit-type.entity.js';
import { OrbitTypeLike } from './orbit-type/entities/orbit-type-like.entity.js';
import { OrbitUser } from './orbit-type/entities/orbit-user.entity.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.get('DB_USERNAME', 'orbit_user'),
        password: config.get('DB_PASSWORD', 'orbit_password'),
        database: config.get('DB_DATABASE', 'orbit_calculator'),
        entities: [OrbitUser, OrbitTypeEntity, OrbitTypeLike],
        synchronize: false,
      }),
    }),
    OrbitTypeModule,
    OrbitApiModule,
  ],
})
export class AppModule {}

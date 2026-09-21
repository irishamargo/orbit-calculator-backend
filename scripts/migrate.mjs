import 'dotenv/config';
import { DataSource } from 'typeorm';

import { OrbitTypeEntity } from '../dist/orbit-type/entities/orbit-type.entity.js';
import { OrbitTypeLike } from '../dist/orbit-type/entities/orbit-type-like.entity.js';
import { OrbitUser } from '../dist/orbit-type/entities/orbit-user.entity.js';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'orbit_user',
  password: process.env.DB_PASSWORD || 'orbit_password',
  database: process.env.DB_DATABASE || 'orbit_calculator',
  entities: [OrbitUser, OrbitTypeEntity, OrbitTypeLike],
  synchronize: false,
});

await dataSource.initialize();

try {
  await dataSource.synchronize();
  console.log('Схема создана. Тестовые данные добавьте вручную через Adminer.');
} finally {
  await dataSource.destroy();
}

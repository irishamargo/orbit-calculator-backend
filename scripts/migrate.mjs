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
  const [{ userTableName }] = await dataSource.query(
    `SELECT to_regclass('public.orbit_users') AS "userTableName"`,
  );

  if (userTableName) {
    // Older lab databases do not have a role column. Preserve existing users
    // and give them the regular user role before the entity schema is synced.
    await dataSource.query(`
      ALTER TABLE public.orbit_users
        ADD COLUMN IF NOT EXISTS orbit_user_role varchar(20) NOT NULL DEFAULT 'user'
    `);
  }

  const [{ tableName }] = await dataSource.query(
    `SELECT to_regclass('public.orbit_types') AS "tableName"`,
  );

  if (tableName) {
    await dataSource.query(`
      ALTER TABLE orbit_types
        DROP COLUMN IF EXISTS orbit_kind,
        DROP COLUMN IF EXISTS orbit_code
    `);
    await dataSource.query(
      `UPDATE orbit_types
       SET orbit_image_url = COALESCE(orbit_image_url, $1),
           orbit_video_url = COALESCE(orbit_video_url, $2)`,
      ['/media/default-orbit.svg', '/media/default-orbit.webm'],
    );
  }
  await dataSource.synchronize();
  console.log('Схема создана. Тестовые данные добавьте вручную через Adminer.');
} finally {
  await dataSource.destroy();
}

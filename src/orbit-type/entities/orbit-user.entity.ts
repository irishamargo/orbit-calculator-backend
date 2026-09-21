import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';

import { OrbitTypeLike } from './orbit-type-like.entity.js';
import { OrbitTypeEntity } from './orbit-type.entity.js';

@Entity('orbit_users')
export class OrbitUser {
  @PrimaryGeneratedColumn({ name: 'orbit_user_id' })
  id: number;

  @Column({ name: 'orbit_user_name', length: 80 })
  name: string;

  @Column({ name: 'orbit_user_email', length: 120, unique: true })
  email: string;

  @OneToMany(() => OrbitTypeEntity, (orbitType) => orbitType.creator)
  orbitTypes: Relation<OrbitTypeEntity[]>;

  @OneToMany(() => OrbitTypeLike, (like) => like.user)
  likes: Relation<OrbitTypeLike[]>;
}

import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { OrbitTypeEntity } from './orbit-type.entity.js';
import { OrbitUser } from './orbit-user.entity.js';

@Entity('orbit_type_likes')
@Index('IDX_orbit_type_likes_user_orbit', ['userId', 'orbitTypeId'], {
  unique: true,
})
export class OrbitTypeLike {
  @PrimaryGeneratedColumn({ name: 'orbit_type_like_id' })
  id: number;

  @Column({ name: 'orbit_user_id' })
  userId: number;

  @ManyToOne(() => OrbitUser, (user) => user.likes, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'orbit_user_id' })
  user: Relation<OrbitUser>;

  @Column({ name: 'orbit_type_id' })
  orbitTypeId: number;

  @ManyToOne(() => OrbitTypeEntity, (orbitType) => orbitType.likes, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'orbit_type_id' })
  orbitType: Relation<OrbitTypeEntity>;
}

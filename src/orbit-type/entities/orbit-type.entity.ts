import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';

import { OrbitTypeLike } from './orbit-type-like.entity.js';
import { OrbitUser } from './orbit-user.entity.js';

export type OrbitTypeStatus = 'Опубликован' | 'Черновик' | 'Удален';

@Entity('orbit_types')
@Index('IDX_orbit_types_one_draft_per_creator', ['creatorId'], {
  unique: true,
  where: '"orbit_status" = \'Черновик\'',
})
export class OrbitTypeEntity {
  @PrimaryGeneratedColumn({ name: 'orbit_type_id' })
  id: number;

  @Column({ name: 'orbit_name', length: 120 })
  name: string;

  @Column({ name: 'orbit_height_km', type: 'integer', nullable: true })
  height: number | null;

  @Column({ name: 'orbit_inclination_deg', type: 'real', nullable: true })
  inclination: number | null;

  @Column({ name: 'orbit_description', type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'orbit_image_url',
    type: 'varchar',
    length: 500,
    default: '/media/default-orbit.svg',
  })
  image: string;

  @Column({
    name: 'orbit_video_url',
    type: 'varchar',
    length: 500,
    default: '/media/default-orbit.webm',
  })
  video: string;

  @Column({ name: 'orbit_status', type: 'varchar', length: 20 })
  status: OrbitTypeStatus;

  @CreateDateColumn({ name: 'orbit_created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'orbit_formed_at', type: 'timestamptz', nullable: true })
  formedAt: Date | null;

  @Column({ name: 'orbit_creator_id' })
  creatorId: number;

  @ManyToOne(() => OrbitUser, (user) => user.orbitTypes, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'orbit_creator_id' })
  creator: Relation<OrbitUser>;

  @OneToMany(() => OrbitTypeLike, (like) => like.orbitType)
  likes: Relation<OrbitTypeLike[]>;
}

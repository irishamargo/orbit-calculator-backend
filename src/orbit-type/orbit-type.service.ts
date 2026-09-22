import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, Repository } from 'typeorm';

import { OrbitTypeEntity } from './entities/orbit-type.entity.js';

export const CURRENT_ORBIT_TYPE_USER_ID = 1;
export const MAX_ORBIT_TYPE_HEIGHT = 40000;
export const DEFAULT_ORBIT_IMAGE = '/media/default-orbit.svg';
export const DEFAULT_ORBIT_VIDEO = '/media/default-orbit.webm';

export interface OrbitTypeView {
  id: number;
  name: string;
  orbitType: string;
  orbitCode: string;
  height: number;
  inclination: number;
  description: string;
  image: string;
  video: string;
  videoType: string;
  status: string;
  likeCount: number;
  isLiked: boolean;
}

const ORBIT_KINDS: Record<string, string> = {
  LEO: 'Низкая околоземная',
  GEO: 'Геостационарная',
  SSO: 'Солнечно-синхронная',
};

@Injectable()
export class OrbitTypeService {
  constructor(
    @InjectRepository(OrbitTypeEntity)
    private readonly orbitTypes: Repository<OrbitTypeEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getPublishedOrbitTypes(maxHeight = MAX_ORBIT_TYPE_HEIGHT) {
    return this.orbitTypes.find({
      where: { status: 'Опубликован', height: LessThanOrEqual(maxHeight) },
      relations: { likes: true },
      order: { id: 'ASC' },
    });
  }

  async getDraftOrbitType(userId = CURRENT_ORBIT_TYPE_USER_ID) {
    return this.orbitTypes.findOne({
      where: { status: 'Черновик', creatorId: userId },
    });
  }

  async createDraft(name: string, userId = CURRENT_ORBIT_TYPE_USER_ID) {
    const trimmedName = name?.trim();
    if (!trimmedName || trimmedName.length > 120) {
      throw new BadRequestException('Укажите название длиной до 120 символов');
    }

    const existingDraft = await this.getDraftOrbitType(userId);
    if (existingDraft) return existingDraft;

    return this.orbitTypes.save(
      this.orbitTypes.create({
        name: trimmedName,
        creatorId: userId,
        status: 'Черновик',
        image: null,
        video: null,
        formedAt: null,
      }),
    );
  }

  async publishDraft(
    input: { description: string; height: string; inclination: string; orbitCode: string },
    userId = CURRENT_ORBIT_TYPE_USER_ID,
  ) {
    const draft = await this.getDraftOrbitType(userId);
    if (!draft) throw new NotFoundException('Черновик не найден');

    const height = Number(input.height);
    const inclination = Number(input.inclination);
    const description = input.description?.trim();
    const orbitType = ORBIT_KINDS[input.orbitCode];

    if (
      !description ||
      description.length > 2000 ||
      !input.height ||
      !Number.isFinite(height) ||
      height < 0 ||
      height > MAX_ORBIT_TYPE_HEIGHT ||
      !input.inclination ||
      !Number.isFinite(inclination) ||
      inclination < 0 ||
      inclination > 180 ||
      !orbitType
    ) {
      throw new BadRequestException('Проверьте описание, высоту, наклонение и тип орбиты');
    }

    draft.description = description;
    draft.height = height;
    draft.inclination = inclination;
    draft.orbitCode = input.orbitCode;
    draft.orbitType = orbitType;
    draft.status = 'Опубликован';
    draft.formedAt = new Date();
    return this.orbitTypes.save(draft);
  }

  async deletePublishedWithCursor(id: number) {
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new BadRequestException('Некорректный идентификатор');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `DECLARE c CURSOR FOR SELECT orbit_type_id FROM orbit_types
         WHERE orbit_type_id = $1 AND orbit_status = 'Опубликован' FOR UPDATE`,
        [id],
      );
      const rows = await manager.query('FETCH NEXT FROM c');
      if (!rows.length) throw new NotFoundException('Опубликованная орбита не найдена');

      const [, count] = await manager.query(
        `UPDATE orbit_types SET orbit_status = 'Удален'
         WHERE CURRENT OF c RETURNING orbit_type_id`,
      );
      if (count !== 1) throw new NotFoundException('Опубликованная орбита не найдена');
      await manager.query('CLOSE c');
    });
  }

  toView(orbitType: OrbitTypeEntity): OrbitTypeView {
    const description = orbitType.description || '';

    return {
      id: orbitType.id,
      name: orbitType.name,
      orbitType: orbitType.orbitType,
      orbitCode: orbitType.orbitCode,
      height: orbitType.height,
      inclination: orbitType.inclination,
      description,
      image: orbitType.image || DEFAULT_ORBIT_IMAGE,
      video: orbitType.video || DEFAULT_ORBIT_VIDEO,
      videoType: orbitType.video?.toLowerCase().split('?')[0].endsWith('.mp4')
        ? 'video/mp4'
        : 'video/webm',
      status: orbitType.status,
      likeCount: orbitType.likes?.length ?? 0,
      isLiked: orbitType.likes?.some((like) => like.userId === CURRENT_ORBIT_TYPE_USER_ID) ?? false,
    };
  }
}

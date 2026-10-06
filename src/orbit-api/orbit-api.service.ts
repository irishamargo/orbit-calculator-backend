import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { LessThanOrEqual, MoreThan, Repository } from 'typeorm';

import { OrbitTypeLike } from '../orbit-type/entities/orbit-type-like.entity.js';
import { OrbitTypeEntity } from '../orbit-type/entities/orbit-type.entity.js';
import { OrbitUser } from '../orbit-type/entities/orbit-user.entity.js';
import {
  DEFAULT_ORBIT_IMAGE,
  DEFAULT_ORBIT_VIDEO,
  MAX_ORBIT_TYPE_HEIGHT,
} from '../orbit-type/orbit-type.service.js';
import { CreateOrbitTypeDto } from './dto/create-orbit-type.dto.js';
import { LikeOrbitTypeDto } from './dto/like-orbit-type.dto.js';
import { OrbitTypeFeedQueryDto, OrbitTypeListQueryDto } from './dto/orbit-type-feed-query.dto.js';
import { OrbitTypeResponseDto } from './dto/orbit-type-response.dto.js';
import { PublishOrbitTypeDto } from './dto/publish-orbit-type.dto.js';
import { getCurrentOrbitTypeUserId } from './current-orbit-user.js';
import { OrbitMediaStorageService } from './minio.service.js';

@Injectable()
export class OrbitApiService {
  constructor(
    @InjectRepository(OrbitTypeEntity)
    private readonly orbitTypes: Repository<OrbitTypeEntity>,
    @InjectRepository(OrbitTypeLike)
    private readonly likes: Repository<OrbitTypeLike>,
    @InjectRepository(OrbitUser)
    private readonly users: Repository<OrbitUser>,
    private readonly mediaStorage: OrbitMediaStorageService,
  ) {}

  async getPublishedList(query: OrbitTypeListQueryDto) {
    const maxHeight = query.maxHeight ?? MAX_ORBIT_TYPE_HEIGHT;
    const orbitTypes = await this.orbitTypes.find({
      where: { status: 'Опубликован', height: LessThanOrEqual(maxHeight) },
      relations: { likes: true },
      order: { id: 'ASC' },
    });

    return Promise.all(orbitTypes.map((orbitType) => this.toResponse(orbitType)));
  }

  async getFeed(query: OrbitTypeFeedQueryDto) {
    const orbitType = await this.findPublishedForFeed(query);
    if (!orbitType) throw new NotFoundException('Опубликованный тип орбиты не найден');
    return this.toResponse(orbitType);
  }

  async getDraft() {
    const draft = await this.orbitTypes.findOne({
      where: { status: 'Черновик', creatorId: getCurrentOrbitTypeUserId() },
      relations: { likes: true },
    });
    if (!draft) throw new NotFoundException('Черновик не найден');
    return this.toResponse(draft);
  }

  async createDraft(
    input: CreateOrbitTypeDto,
    files: { image?: Express.Multer.File[]; video?: Express.Multer.File[] } = {},
  ) {
    const creatorId = getCurrentOrbitTypeUserId();
    const creator = await this.users.findOne({ where: { id: creatorId } });
    if (!creator) throw new NotFoundException('Текущий пользователь не найден');

    let draft = await this.orbitTypes.findOne({
      where: { status: 'Черновик', creatorId },
    });

    if (!draft) {
      draft = await this.orbitTypes.save(
        this.orbitTypes.create({
          name: input.name.trim(),
          creatorId,
          status: 'Черновик',
          image: DEFAULT_ORBIT_IMAGE,
          video: DEFAULT_ORBIT_VIDEO,
          formedAt: null,
        }),
      );
    }

    const image = files.image?.[0];
    const video = files.video?.[0];
    if (image) draft.image = await this.mediaStorage.uploadOrbitMedia(image, draft.id, 'image');
    if (video) draft.video = await this.mediaStorage.uploadOrbitMedia(video, draft.id, 'video');
    if (image || video) draft = await this.orbitTypes.save(draft);

    return this.toResponse(await this.getById(draft.id));
  }

  async publishDraft(input: PublishOrbitTypeDto) {
    const draft = await this.orbitTypes.findOne({
      where: { status: 'Черновик', creatorId: getCurrentOrbitTypeUserId() },
    });
    if (!draft) throw new NotFoundException('Черновик не найден');

    const description = input.description.trim();
    if (!description) throw new BadRequestException('Описание не может быть пустым');

    draft.description = description;
    draft.height = input.height;
    draft.inclination = input.inclination;
    draft.status = 'Опубликован';
    draft.formedAt = new Date();

    return this.toResponse(await this.orbitTypes.save(draft));
  }

  async deletePublished(id: number) {
    this.validateId(id);
    const orbitType = await this.orbitTypes.findOne({
      where: { id, creatorId: getCurrentOrbitTypeUserId(), status: 'Опубликован' },
    });
    if (!orbitType) throw new NotFoundException('Опубликованный тип орбиты не найден');

    orbitType.status = 'Удален';
    await this.orbitTypes.save(orbitType);
    return { id, status: 'Удален' };
  }

  async setLike(id: number, input: LikeOrbitTypeDto) {
    this.validateId(id);
    const orbitType = await this.orbitTypes.findOne({
      where: { id, status: 'Опубликован' },
    });
    if (!orbitType) throw new NotFoundException('Опубликованный тип орбиты не найден');

    const userId = getCurrentOrbitTypeUserId();
    const existingLike = await this.likes.findOne({ where: { userId, orbitTypeId: id } });
    if (input.liked === 1 && !existingLike) {
      await this.likes.save(this.likes.create({ userId, orbitTypeId: id }));
    }
    if (input.liked === 0 && existingLike) {
      await this.likes.remove(existingLike);
    }

    const updated = await this.getById(id);
    return {
      id,
      liked: input.liked,
      likeCount: updated.likes?.length ?? 0,
    };
  }

  private async findPublishedForFeed(query: OrbitTypeFeedQueryDto) {
    if (query.id === undefined) {
      return this.orbitTypes.findOne({
        where: { status: 'Опубликован' },
        relations: { likes: true },
        order: { id: 'ASC' },
      });
    }

    const current = await this.orbitTypes.findOne({
      where: { id: query.id, status: 'Опубликован' },
      relations: { likes: true },
    });
    if (!current) return null;
    if (!query.next) return current;

    return (
      (await this.orbitTypes.findOne({
        where: { id: MoreThan(current.id), status: 'Опубликован' },
        relations: { likes: true },
        order: { id: 'ASC' },
      })) ??
      (await this.orbitTypes.findOne({
        where: { status: 'Опубликован' },
        relations: { likes: true },
        order: { id: 'ASC' },
      }))
    );
  }

  private async getById(id: number) {
    const orbitType = await this.orbitTypes.findOne({
      where: { id },
      relations: { likes: true },
    });
    if (!orbitType) throw new NotFoundException('Тип орбиты не найден');
    return orbitType;
  }

  private async toResponse(orbitType: OrbitTypeEntity) {
    const currentUserId = getCurrentOrbitTypeUserId();
    const [image, video] = await Promise.all([
      this.mediaStorage.getMediaUrl(orbitType.image, DEFAULT_ORBIT_IMAGE),
      this.mediaStorage.getMediaUrl(orbitType.video, DEFAULT_ORBIT_VIDEO),
    ]);

    return plainToInstance(
      OrbitTypeResponseDto,
      {
        id: orbitType.id,
        name: orbitType.name,
        description: orbitType.description,
        height: orbitType.height,
        inclination: orbitType.inclination,
        image,
        video,
        status: orbitType.status,
        creatorId: orbitType.creatorId,
        createdAt: orbitType.createdAt,
        formedAt: orbitType.formedAt,
        isCreator: orbitType.creatorId === currentUserId ? 1 : 0,
        likeCount: orbitType.likes?.length ?? 0,
        isLiked: orbitType.likes?.some((like) => like.userId === currentUserId) ? 1 : 0,
      },
      { excludeExtraneousValues: true },
    );
  }

  private validateId(id: number) {
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new BadRequestException('Некорректный идентификатор');
    }
  }
}

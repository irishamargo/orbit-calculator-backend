import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OrbitTypeEntity } from './entities/orbit-type.entity.js';
import {
  DEFAULT_ORBIT_IMAGE,
  DEFAULT_ORBIT_VIDEO,
  OrbitTypeService,
} from './orbit-type.service.js';

describe('OrbitTypeService', () => {
  const repository = {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn((value) => value),
    save: vi.fn((value) => Promise.resolve(value)),
  };
  const dataSource = { query: vi.fn() };
  const service = new OrbitTypeService(
    repository as unknown as Repository<OrbitTypeEntity>,
    dataSource as unknown as DataSource,
  );

  beforeEach(() => vi.clearAllMocks());

  it('получает только опубликованные записи через ORM с фильтром высоты', async () => {
    repository.find.mockResolvedValue([]);
    await service.getPublishedOrbitTypes(600);

    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'Опубликован' }),
        relations: { likes: true },
      }),
    );
  });

  it('не создает второй черновик пользователя', async () => {
    const draft = { id: 3, name: 'Черновик' };
    repository.findOne.mockResolvedValue(draft);

    expect(await service.createDraft('Новое название')).toBe(draft);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('создает черновик без фото и видео и отображает стандартные медиа', async () => {
    repository.findOne.mockResolvedValue(null);

    const draft = await service.createDraft('Новая орбита');

    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Новая орбита', status: 'Черновик', image: null, video: null,
    }));
    expect(service.toView(draft)).toEqual(expect.objectContaining({
      image: DEFAULT_ORBIT_IMAGE,
      video: DEFAULT_ORBIT_VIDEO,
      videoType: 'video/webm',
    }));
  });

  it('публикует черновик с двумя числовыми полями темы', async () => {
    const draft = { id: 3, name: 'Орбита', status: 'Черновик' };
    repository.findOne.mockResolvedValue(draft);

    await service.publishDraft({
      description: 'Наблюдение Земли', height: '600', inclination: '98.2', orbitCode: 'SSO',
    });

    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'Опубликован', height: 600, inclination: 98.2,
      orbitType: 'Солнечно-синхронная', formedAt: expect.any(Date),
    }));
  });

  it('не публикует некорректные значения', async () => {
    repository.findOne.mockResolvedValue({ id: 3, status: 'Черновик' });
    await expect(service.publishDraft({
      description: 'Орбита', height: '-1', inclination: '98', orbitCode: 'SSO',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('удаляет только опубликованную запись параметризованным SQL UPDATE', async () => {
    dataSource.query.mockResolvedValue([{ orbit_type_id: 2 }]);
    await service.deletePublishedWithSql(2);

    const [sql, params] = dataSource.query.mock.calls[0];
    expect(sql).toContain('UPDATE orbit_types SET orbit_status = $1');
    expect(sql).toContain('RETURNING orbit_type_id');
    expect(params).toEqual(['Удален', 2, 'Опубликован']);
  });

  it('не удаляет повторно уже удаленную запись', async () => {
    dataSource.query.mockResolvedValue([]);
    await expect(service.deletePublishedWithSql(2)).rejects.toBeInstanceOf(NotFoundException);
  });
});

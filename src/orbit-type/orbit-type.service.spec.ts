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
  const manager = { query: vi.fn() };
  const dataSource = {
    transaction: vi.fn(async (work: (transactionManager: typeof manager) => Promise<void>) => work(manager)),
  };
  const service = new OrbitTypeService(
    repository as unknown as Repository<OrbitTypeEntity>,
    dataSource as unknown as DataSource,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('удаляет опубликованную запись через SQL-курсор в транзакции', async () => {
    manager.query.mockImplementation(async (sql: string) => {
      if (sql.startsWith('FETCH')) return [{ orbit_type_id: 2 }];
      if (sql.startsWith('UPDATE')) return [[{ orbit_type_id: 2 }], 1];
      return [];
    });

    await service.deletePublishedWithCursor(2);

    expect(dataSource.transaction).toHaveBeenCalledOnce();
    expect(manager.query).toHaveBeenNthCalledWith(1,
      expect.stringContaining('DECLARE c CURSOR FOR'),
      [2],
    );
    expect(manager.query).toHaveBeenNthCalledWith(2, 'FETCH NEXT FROM c');
    expect(manager.query).toHaveBeenNthCalledWith(3,
      expect.stringContaining('WHERE CURRENT OF c RETURNING orbit_type_id'),
    );
    expect(manager.query).toHaveBeenNthCalledWith(4, 'CLOSE c');
  });

  it('не удаляет повторно уже удаленную запись', async () => {
    manager.query.mockResolvedValue([]);

    await expect(service.deletePublishedWithCursor(2)).rejects.toBeInstanceOf(NotFoundException);

    expect(manager.query).toHaveBeenCalledTimes(2);
  });

  it('откатывает транзакцию, если SQL UPDATE завершился ошибкой', async () => {
    manager.query.mockImplementation(async (sql: string) => {
      if (sql.startsWith('FETCH')) return [{ orbit_type_id: 2 }];
      if (sql.startsWith('UPDATE')) throw new Error('Ошибка БД');
      return [];
    });

    await expect(service.deletePublishedWithCursor(2)).rejects.toThrow('Ошибка БД');

    expect(manager.query).toHaveBeenCalledTimes(3);
  });

  it('не подтверждает транзакцию, если курсор не обновил строку', async () => {
    manager.query.mockImplementation(async (sql: string) => {
      if (sql.startsWith('FETCH')) return [{ orbit_type_id: 2 }];
      if (sql.startsWith('UPDATE')) return [[], 0];
      return [];
    });

    await expect(service.deletePublishedWithCursor(2)).rejects.toBeInstanceOf(NotFoundException);

    expect(manager.query).toHaveBeenCalledTimes(3);
  });

  it('не открывает курсор для некорректного идентификатора', async () => {
    await expect(service.deletePublishedWithCursor(0)).rejects.toBeInstanceOf(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});

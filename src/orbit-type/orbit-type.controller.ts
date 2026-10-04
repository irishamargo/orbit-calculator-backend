import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  Redirect,
  Render,
} from '@nestjs/common';

import {
  DEFAULT_ORBIT_IMAGE,
  MAX_ORBIT_TYPE_HEIGHT,
  OrbitTypeService,
} from './orbit-type.service.js';

@Controller()
export class OrbitTypeController {
  constructor(private readonly orbitTypeService: OrbitTypeService) {}

  @Get()
  @Render('orbit-type-feed')
  async getOrbitTypeFeed(@Query('id') id?: string) {
    const requestedId = id === undefined ? undefined : Number(id);
    const orbitType =
      requestedId === undefined
        ? await this.orbitTypeService.getPublishedOrbitType()
        : Number.isSafeInteger(requestedId) && requestedId > 0
          ? await this.orbitTypeService.getPublishedOrbitType(requestedId)
          : null;

    if (id !== undefined && !orbitType) {
      throw new NotFoundException('Тип орбиты не найден или удален');
    }

    const nextOrbitType = orbitType
      ? await this.orbitTypeService.getNextPublishedOrbitType(orbitType.id)
      : null;
    return {
      title: 'Лента типов орбит',
      orbitType: orbitType ? this.orbitTypeService.toView(orbitType) : null,
      nextOrbitType,
    };
  }

  @Get('orbit-type/add')
  @Render('orbit-type-add')
  async getOrbitTypeAddPage() {
    const draft = await this.orbitTypeService.getDraftOrbitType();
    return {
      title: 'Добавление типа орбиты',
      draftOrbitType: draft && { ...draft, image: draft.image || DEFAULT_ORBIT_IMAGE },
    };
  }

  @Post('orbit-type/add')
  @Redirect('/orbit-type/add', 303)
  async createDraft(@Body('name') name: string) {
    await this.orbitTypeService.createDraft(name);
  }

  @Post('orbit-type/publish')
  @Redirect('/orbit-type/grid', 303)
  async publishDraft(
    @Body() input: { description: string; height: string; inclination: string },
  ) {
    await this.orbitTypeService.publishDraft(input);
  }

  @Get('orbit-type/grid')
  @Render('orbit-type-grid')
  async getOrbitTypeGrid(@Query('maxHeight') maxHeight?: string) {
    const parsedHeight = maxHeight === undefined ? MAX_ORBIT_TYPE_HEIGHT : Number(maxHeight);
    const selectedHeight = Number.isFinite(parsedHeight)
      ? Math.min(Math.max(parsedHeight, 0), MAX_ORBIT_TYPE_HEIGHT)
      : MAX_ORBIT_TYPE_HEIGHT;

    return {
      title: 'Плитка типов орбит',
      orbitTypes: (await this.orbitTypeService.getPublishedOrbitTypes(selectedHeight))
        .map((orbitType) => this.orbitTypeService.toView(orbitType)),
      selectedHeight,
      maxHeight: MAX_ORBIT_TYPE_HEIGHT,
    };
  }

  @Post('orbit-type/delete')
  @Redirect('/orbit-type/grid', 303)
  async deleteOrbitType(@Body('orbitTypeId') orbitTypeId: string) {
    await this.orbitTypeService.deletePublishedWithCursor(Number(orbitTypeId));
  }
}

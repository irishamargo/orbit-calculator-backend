import {
  Controller,
  Get,
  Post,
  Query,
  Redirect,
  Render,
} from '@nestjs/common';

import {
  CURRENT_ORBIT_TYPE_USER_ID,
  MAX_ORBIT_TYPE_HEIGHT,
  OrbitType,
  OrbitTypeView,
  OrbitTypeService,
} from './orbit-type.service.js';

@Controller()
export class OrbitTypeController {
  constructor(private readonly orbitTypeService: OrbitTypeService) {}

  private splitDescription(description: string) {
    const words = description.trim().split(/\s+/);
    const maxStartLength = 32;
    let startLength = 0;
    let splitIndex = words.length;

    for (let index = 0; index < words.length; index += 1) {
      const nextLength = startLength === 0
        ? words[index].length
        : startLength + 1 + words[index].length;

      if (nextLength > maxStartLength && index > 0) {
        splitIndex = index;
        break;
      }

      startLength = nextLength;
    }

    return {
      descriptionStart: words.slice(0, splitIndex).join(' ').replace(/[.!?]+$/, ''),
      descriptionContinuation: words.slice(splitIndex).join(' '),
    };
  }

  private toOrbitTypeView(orbitType: OrbitType): OrbitTypeView {
    const { descriptionStart, descriptionContinuation } = this.splitDescription(
      orbitType.description,
    );

    return {
      ...orbitType,
      likeCount: orbitType.likedBy.length,
      isLiked: orbitType.likedBy.includes(CURRENT_ORBIT_TYPE_USER_ID),
      isDraft: orbitType.status === 'Черновик',
      descriptionStart,
      descriptionContinuation,
    };
  }

  @Get()
  @Render('orbit-type-feed')
  getOrbitTypeFeed(
    @Query('id') id?: string,
    @Query('next') next?: string,
  ) {
    const orbitTypes = this.orbitTypeService.getPublishedOrbitTypes();
    let currentIndex = 0;

    if (id) {
      const requestedId = Number(id);
      const index = orbitTypes.findIndex(
        (orbitType) => orbitType.id === requestedId,
      );

      if (index !== -1) {
        currentIndex = index;
      }
    }

    if (next === 'true' && orbitTypes.length > 0) {
      currentIndex = (currentIndex + 1) % orbitTypes.length;
    }

    const orbitType = orbitTypes[currentIndex];
    const nextOrbitType = orbitTypes[(currentIndex + 1) % orbitTypes.length];

    return {
      title: 'Лента типов орбит',
      orbitType: this.toOrbitTypeView(orbitType),
      nextOrbitType,
    };
  }

  @Post('orbit-type/like')
  @Redirect('/', 303)
  toggleOrbitTypeLike(@Query('id') id?: string) {
    const orbitType = this.orbitTypeService.toggleOrbitTypeLike(
      Number(id),
      CURRENT_ORBIT_TYPE_USER_ID,
    );

    return {
      url: orbitType ? `/?id=${orbitType.id}` : '/',
    };
  }

  @Get('orbit-type/add')
  @Render('orbit-type-add')
  getOrbitTypeAddPage() {
    return {
      title: 'Добавление типа орбиты',
      draftOrbitType: this.orbitTypeService.getDraftOrbitType(),
    };
  }

  @Get('orbit-type/grid')
  @Render('orbit-type-grid')
  getOrbitTypeGrid(@Query('maxHeight') maxHeight?: string) {
    const parsedHeight = Number(maxHeight);
    const selectedHeight = Number.isFinite(parsedHeight)
      ? Math.min(Math.max(parsedHeight, 0), MAX_ORBIT_TYPE_HEIGHT)
      : MAX_ORBIT_TYPE_HEIGHT;

    return {
      title: 'Плитка типов орбит',
      orbitTypes: this.orbitTypeService
        .getPublishedOrbitTypes()
        .filter((orbitType) => orbitType.height <= selectedHeight)
        .map((orbitType) => this.toOrbitTypeView(orbitType)),
      selectedHeight,
      maxHeight: MAX_ORBIT_TYPE_HEIGHT,
    };
  }
}

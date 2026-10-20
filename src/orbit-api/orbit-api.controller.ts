import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CreateOrbitTypeDto } from './dto/create-orbit-type.dto.js';
import { LikeOrbitTypeDto } from './dto/like-orbit-type.dto.js';
import {
  OrbitTypeFeedQueryDto,
  OrbitTypeListQueryDto,
} from './dto/orbit-type-feed-query.dto.js';
import { PublishOrbitTypeDto } from './dto/publish-orbit-type.dto.js';
import {
  OrbitSessionGuard,
  OptionalOrbitSessionGuard,
} from './orbit-session.guard.js';
import type { OrbitAuthenticatedRequest } from './orbit-session.guard.js';
import { OrbitApiService } from './orbit-api.service.js';

type OrbitMediaFiles = {
  image?: Express.Multer.File[];
  video?: Express.Multer.File[];
};

@Controller('api/orbit-types')
@ApiTags('Типы орбит')
export class OrbitApiController {
  constructor(private readonly orbitApiService: OrbitApiService) {}

  @Get()
  @UseGuards(OptionalOrbitSessionGuard)
  @ApiOperation({
    summary: 'Получить опубликованные типы орбит с фильтром по высоте',
  })
  @ApiResponse({
    status: 200,
    description: 'Список доступен гостям; maxHeight задаётся в километрах',
  })
  getPublishedList(
    @Query() query: OrbitTypeListQueryDto,
    @Req() request: OrbitAuthenticatedRequest,
  ) {
    return this.orbitApiService.getPublishedList(query, request.orbitUserId);
  }

  @Get('feed')
  @UseGuards(OptionalOrbitSessionGuard)
  @ApiOperation({
    summary: 'Получить одну опубликованную орбиту или следующую за указанной',
  })
  @ApiResponse({
    status: 200,
    description: 'Гостевой доступ; query: id и next=true',
  })
  @ApiResponse({
    status: 404,
    description: 'Опубликованный тип орбиты не найден',
  })
  getFeed(
    @Query() query: OrbitTypeFeedQueryDto,
    @Req() request: OrbitAuthenticatedRequest,
  ) {
    return this.orbitApiService.getFeed(query, request.orbitUserId);
  }

  @Get('draft')
  @UseGuards(OrbitSessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Получить черновик текущего пользователя' })
  @ApiResponse({
    status: 401,
    description: 'Требуется действующая сессионная cookie',
  })
  getDraft(@Req() request: OrbitAuthenticatedRequest) {
    return this.orbitApiService.getDraft(request.orbitUserId!);
  }

  @Post()
  @UseGuards(OrbitSessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Создать черновик орбиты и загрузить изображение и видео',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Низкая околоземная орбита' },
        image: { type: 'string', format: 'binary' },
        video: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Черновик создан; создатель определён по сессии',
  })
  @ApiResponse({
    status: 401,
    description: 'Требуется действующая сессионная cookie',
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      {
        limits: { fileSize: 50 * 1024 * 1024 },
        fileFilter: (_request, file, callback) => {
          const validImage =
            file.fieldname === 'image' && file.mimetype.startsWith('image/');
          const validVideo =
            file.fieldname === 'video' && file.mimetype.startsWith('video/');
          if (!validImage && !validVideo) {
            callback(
              new BadRequestException(
                'Допустимы только фото в поле image и видео в поле video',
              ),
              false,
            );
            return;
          }
          callback(null, true);
        },
      },
    ),
  )
  createDraft(
    @Body() input: CreateOrbitTypeDto,
    @UploadedFiles() files: OrbitMediaFiles,
    @Req() request: OrbitAuthenticatedRequest,
  ) {
    return this.orbitApiService.createDraft(input, request.orbitUserId!, files);
  }

  @Put('draft/publish')
  @UseGuards(OrbitSessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Опубликовать черновик текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Черновик опубликован' })
  @ApiResponse({
    status: 401,
    description: 'Гость не может публиковать орбиты',
  })
  publishDraft(
    @Body() input: PublishOrbitTypeDto,
    @Req() request: OrbitAuthenticatedRequest,
  ) {
    return this.orbitApiService.publishDraft(input, request.orbitUserId!);
  }

  @Delete(':id')
  @UseGuards(OrbitSessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({
    summary: 'Логически удалить опубликованную орбиту текущего пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Статус орбиты изменён на «Удален»',
  })
  @ApiResponse({
    status: 401,
    description: 'Требуется действующая сессионная cookie',
  })
  deletePublished(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: OrbitAuthenticatedRequest,
  ) {
    return this.orbitApiService.deletePublished(id, request.orbitUserId!);
  }

  @Post(':id/like')
  @UseGuards(OrbitSessionGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Поставить или снять лайк с опубликованной орбиты' })
  @ApiResponse({
    status: 200,
    description: 'Лайк изменён для текущего пользователя',
  })
  @ApiResponse({
    status: 401,
    description: 'Требуется действующая сессионная cookie',
  })
  setLike(
    @Param('id', ParseIntPipe) id: number,
    @Body() input: LikeOrbitTypeDto,
    @Req() request: OrbitAuthenticatedRequest,
  ) {
    return this.orbitApiService.setLike(id, input, request.orbitUserId!);
  }
}

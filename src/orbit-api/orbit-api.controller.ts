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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { CreateOrbitTypeDto } from './dto/create-orbit-type.dto.js';
import { LikeOrbitTypeDto } from './dto/like-orbit-type.dto.js';
import { OrbitTypeFeedQueryDto, OrbitTypeListQueryDto } from './dto/orbit-type-feed-query.dto.js';
import { PublishOrbitTypeDto } from './dto/publish-orbit-type.dto.js';
import { OrbitApiService } from './orbit-api.service.js';

type OrbitMediaFiles = {
  image?: Express.Multer.File[];
  video?: Express.Multer.File[];
};

@Controller('api/orbit-types')
export class OrbitApiController {
  constructor(private readonly orbitApiService: OrbitApiService) {}

  @Get()
  getPublishedList(@Query() query: OrbitTypeListQueryDto) {
    return this.orbitApiService.getPublishedList(query);
  }

  @Get('feed')
  getFeed(@Query() query: OrbitTypeFeedQueryDto) {
    return this.orbitApiService.getFeed(query);
  }

  @Get('draft')
  getDraft() {
    return this.orbitApiService.getDraft();
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      {
        limits: { fileSize: 50 * 1024 * 1024 },
        fileFilter: (_request, file, callback) => {
          const validImage = file.fieldname === 'image' && file.mimetype.startsWith('image/');
          const validVideo = file.fieldname === 'video' && file.mimetype.startsWith('video/');
          if (!validImage && !validVideo) {
            callback(new BadRequestException('Допустимы только фото в поле image и видео в поле video'), false);
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
  ) {
    return this.orbitApiService.createDraft(input, files);
  }

  @Put('draft/publish')
  publishDraft(@Body() input: PublishOrbitTypeDto) {
    return this.orbitApiService.publishDraft(input);
  }

  @Delete(':id')
  deletePublished(@Param('id', ParseIntPipe) id: number) {
    return this.orbitApiService.deletePublished(id);
  }

  @Post(':id/like')
  setLike(@Param('id', ParseIntPipe) id: number, @Body() input: LikeOrbitTypeDto) {
    return this.orbitApiService.setLike(id, input);
  }
}

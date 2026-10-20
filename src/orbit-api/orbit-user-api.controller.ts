import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { AuthenticateOrbitUserDto } from './dto/authenticate-orbit-user.dto.js';
import { RegisterOrbitUserDto } from './dto/register-orbit-user.dto.js';
import { OrbitUserApiService } from './orbit-user-api.service.js';

@Controller('api/orbit-users')
@ApiTags('Пользователи')
export class OrbitUserApiController {
  constructor(private readonly orbitUserApiService: OrbitUserApiService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Зарегистрировать пользователя-исследователя орбит',
  })
  @ApiResponse({
    status: 201,
    description: 'Пользователь создан; пароль в ответ не включается',
  })
  @ApiResponse({ status: 409, description: 'Почта уже зарегистрирована' })
  register(@Body() input: RegisterOrbitUserDto) {
    return this.orbitUserApiService.register(input);
  }

  @Post('authentication')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Войти и получить сессионную cookie' })
  @ApiResponse({
    status: 200,
    description:
      'Сессия сохранена в Redis, ID передан в HttpOnly cookie sessionId',
  })
  @ApiResponse({ status: 401, description: 'Неверная почта или пароль' })
  async authenticate(
    @Body() input: AuthenticateOrbitUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.orbitUserApiService.authenticate(input);
    response.cookie('sessionId', result.sessionId, {
      httpOnly: true,
      secure: process.env.SESSION_COOKIE_SECURE === 'true',
      sameSite: 'lax',
      path: '/',
      maxAge: this.orbitUserApiService.sessionTtlSeconds * 1000,
    });
    return { user: result.user };
  }

  @Post('deauthentication')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Завершить текущую сессию и удалить cookie' })
  @ApiResponse({ status: 200, description: 'Сессия отозвана в Redis' })
  async deauthenticate(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.orbitUserApiService.deauthenticate(request.cookies?.sessionId);
    response.clearCookie('sessionId', { path: '/' });
    return { ok: true };
  }
}

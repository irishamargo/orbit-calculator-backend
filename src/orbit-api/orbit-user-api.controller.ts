import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { RegisterOrbitUserDto } from './dto/register-orbit-user.dto.js';
import { OrbitUserApiService } from './orbit-user-api.service.js';

@Controller('api/orbit-users')
export class OrbitUserApiController {
  constructor(private readonly orbitUserApiService: OrbitUserApiService) {}

  @Post('register')
  register(@Body() input: RegisterOrbitUserDto) {
    return this.orbitUserApiService.register(input);
  }

  @Post('authentication')
  @HttpCode(HttpStatus.OK)
  authenticateStub() {
    return { message: 'Аутентификация будет реализована в лабораторной работе 4' };
  }

  @Post('deauthentication')
  @HttpCode(HttpStatus.OK)
  logoutStub() {
    return { message: 'Деавторизация будет реализована в лабораторной работе 4' };
  }
}

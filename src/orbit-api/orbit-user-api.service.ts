import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';

import { OrbitUser } from '../orbit-type/entities/orbit-user.entity.js';
import { RegisterOrbitUserDto } from './dto/register-orbit-user.dto.js';
import { OrbitUserResponseDto } from './dto/orbit-user-response.dto.js';

@Injectable()
export class OrbitUserApiService {
  constructor(
    @InjectRepository(OrbitUser)
    private readonly users: Repository<OrbitUser>,
  ) {}

  async register(input: RegisterOrbitUserDto) {
    const email = input.email.trim().toLowerCase();
    const existingUser = await this.users.findOne({ where: { email } });
    if (existingUser) throw new ConflictException('Пользователь с такой почтой уже зарегистрирован');

    const user = await this.users.save(
      this.users.create({
        name: input.name.trim(),
        email,
        password: input.password,
      }),
    );

    return plainToInstance(
      OrbitUserResponseDto,
      { id: user.id, name: user.name, email: user.email },
      { excludeExtraneousValues: true },
    );
  }
}

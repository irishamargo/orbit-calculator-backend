import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Repository } from 'typeorm';

import { OrbitUser } from '../orbit-type/entities/orbit-user.entity.js';
import { AuthenticateOrbitUserDto } from './dto/authenticate-orbit-user.dto.js';
import { RegisterOrbitUserDto } from './dto/register-orbit-user.dto.js';
import { OrbitUserResponseDto } from './dto/orbit-user-response.dto.js';
import { OrbitSessionService } from './orbit-session.service.js';

const scryptAsync = promisify(scrypt);
const PASSWORD_KEY_LENGTH = 64;

@Injectable()
export class OrbitUserApiService {
  constructor(
    @InjectRepository(OrbitUser)
    private readonly users: Repository<OrbitUser>,
    private readonly sessions: OrbitSessionService,
  ) {}

  get sessionTtlSeconds(): number {
    return this.sessions.ttlSeconds;
  }

  async register(input: RegisterOrbitUserDto) {
    const email = input.email.trim().toLowerCase();
    const existingUser = await this.users.findOne({ where: { email } });
    if (existingUser)
      throw new ConflictException(
        'Пользователь с такой почтой уже зарегистрирован',
      );

    const user = await this.users.save(
      this.users.create({
        name: input.name.trim(),
        email,
        password: await this.hashPassword(input.password),
        role: 'user',
      }),
    );

    return plainToInstance(
      OrbitUserResponseDto,
      { id: user.id, name: user.name, email: user.email, role: user.role },
      { excludeExtraneousValues: true },
    );
  }

  async authenticate(input: AuthenticateOrbitUserDto) {
    const email = input.email.trim().toLowerCase();
    const user = await this.users.findOne({ where: { email } });
    if (!user || !(await this.verifyPassword(input.password, user.password))) {
      throw new UnauthorizedException('Неверная почта или пароль');
    }

    // Older lab registrations stored a plain password. Upgrade it on successful login.
    if (!user.password.startsWith('scrypt$')) {
      user.password = await this.hashPassword(input.password);
      await this.users.save(user);
    }

    const sessionId = randomBytes(32).toString('base64url');
    await this.sessions.create(sessionId, user.id);

    return {
      sessionId,
      user: plainToInstance(
        OrbitUserResponseDto,
        { id: user.id, name: user.name, email: user.email, role: user.role },
        { excludeExtraneousValues: true },
      ),
    };
  }

  async deauthenticate(sessionId?: string): Promise<void> {
    if (sessionId) await this.sessions.destroy(sessionId);
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    const key = (await scryptAsync(
      password,
      salt,
      PASSWORD_KEY_LENGTH,
    )) as Buffer;
    return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
  }

  private async verifyPassword(
    password: string,
    storedPassword: string,
  ): Promise<boolean> {
    const [algorithm, saltHex, keyHex] = storedPassword.split('$');
    if (algorithm !== 'scrypt' || !saltHex || !keyHex) {
      const submitted = Buffer.from(password);
      const stored = Buffer.from(storedPassword);
      return (
        submitted.length === stored.length && timingSafeEqual(submitted, stored)
      );
    }

    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(keyHex, 'hex');
    if (salt.length !== 16 || expected.length !== PASSWORD_KEY_LENGTH)
      return false;
    const actual = (await scryptAsync(
      password,
      salt,
      PASSWORD_KEY_LENGTH,
    )) as Buffer;
    return timingSafeEqual(actual, expected);
  }
}

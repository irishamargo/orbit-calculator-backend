import {
  Controller,
  Get,
  Query,
  Render,
} from '@nestjs/common';

import { OrbitService } from './orbit.service.js';

@Controller()
export class OrbitController {
  constructor(private readonly orbitService: OrbitService) {}

  // Лента
    @Get()
    @Render('index')
    getHome(@Query('id') id?: string) {
    const calculations = this.orbitService.getAll();

    let currentIndex = 0;

    if (id) {
        const requestedId = Number(id);

        const index = calculations.findIndex(
        (calculation) => calculation.id === requestedId,
        );

        if (index !== -1) {
        currentIndex = index;
        }
    }

    const calculation = calculations[currentIndex];

    const nextIndex =
        currentIndex === calculations.length - 1
        ? 0
        : currentIndex + 1;

    const nextCalculation = calculations[nextIndex];

    return {
        title: 'Расчёт параметров орбиты',
        calculation,
        nextCalculation,
    };
    }

  // Страница добавления
  @Get('add')
  @Render('add')
  getAddPage() {
    const draftCalculation = this.orbitService.getDraft();

    return {
      title: 'Добавление расчёта',
      draftCalculation,
    };
  }

  // Все расчёты
  @Get('calculations')
  @Render('calculations')
  getCalculations(@Query('type') type?: string) {
    const calculations = this.orbitService.getByType(type).map((calculation) => ({
      ...calculation,
      isDraft: calculation.status === 'Черновик',
    }));

    return {
      title: 'Все расчёты',
      calculations,
      selectedType: type || 'ALL',
    };
  }
}

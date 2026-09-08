import { Injectable } from '@nestjs/common';

export interface OrbitCalculation {
  id: number;
  name: string;
  mass: number;
  orbitType: string;
  orbitCode: string;
  height: number;
  velocity: number;
  period: number;
  image: string;
  video: string;
  likes: number;
  liked: boolean;
  status: 'Опубликован' | 'Черновик';
}

@Injectable()
export class OrbitService {
  private calculations: OrbitCalculation[] = [
    {
      id: 1,
      name: 'Astra-1',
      mass: 500,
      orbitType: 'Низкая околоземная',
      orbitCode: 'LEO',
      height: 400,
      velocity: 7.67,
      period: 92.4,
      image: 'http://localhost:9000/orbit-media/image/astra-1.png',
      video: 'http://localhost:9000/orbit-media/videos/astra-1.mp4',
      likes: 128,
      liked: false,
      status: 'Опубликован',
    },
    {
      id: 2,
      name: 'Meteor-2',
      mass: 1200,
      orbitType: 'Низкая околоземная',
      orbitCode: 'LEO',
      height: 800,
      velocity: 7.46,
      period: 100.9,
      image: 'http://localhost:9000/orbit-media/image/meteor-2.png',
      video: 'http://localhost:9000/orbit-media/videos/meteor-2.mp4',
      likes: 35,
      liked: false,
      status: 'Опубликован',
    },
    {
      id: 3,
      name: 'GeoSat-1',
      mass: 3500,
      orbitType: 'Геостационарная',
      orbitCode: 'GEO',
      height: 35786,
      velocity: 3.07,
      period: 1436,
      image: 'http://localhost:9000/orbit-media/image/geosat-1.png',
      video: 'http://localhost:9000/orbit-media/videos/geosat-1.mp4',
      likes: 96,
      liked: false,
      status: 'Опубликован',
    },
    {
      id: 4,
      name: 'Sfera',
      mass: 750,
      orbitType: 'Солнечно-синхронная',
      orbitCode: 'SSO',
      height: 600,
      velocity: 7.56,
      period: 96.7,
      image: 'http://localhost:9000/orbit-media/image/sfera.png',
      video: 'http://localhost:9000/orbit-media/videos/sfera.mp4',
      likes: 0,
      liked: false,
      status: 'Черновик',
    },
  ];

  /* Получение всех расчётов */
  getAll(): OrbitCalculation[] {
    return this.calculations;
  }

  /* Получение черновика */
  getDraft(): OrbitCalculation {
    return (
      this.calculations.find(
        (calculation) => calculation.status === 'Черновик',
      ) ?? this.calculations[0]
    );
  }

  /* Переключение лайка */
  toggleLike(id: number): OrbitCalculation | undefined {
    const calculation = this.calculations.find(
      (item) => item.id === id,
    );

    if (!calculation) {
      return undefined;
    }

    calculation.liked = !calculation.liked;
    calculation.likes += calculation.liked ? 1 : -1;

    return calculation;
  }

  /* Фильтрация по типу орбиты */
  getByType(type?: string): OrbitCalculation[] {
    if (!type || type === 'ALL') {
      return this.calculations;
    }

    return this.calculations.filter(
      (calculation) => calculation.orbitCode === type,
    );
  }
}

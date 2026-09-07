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
        status: 'Черновик',
    },
  ];

  /*Получение всех расчётов*/
  getAll(): OrbitCalculation[] {
    return this.calculations;
  }

  getDraft(): OrbitCalculation {
    return (
      this.calculations.find((calculation) => calculation.status === 'Черновик') ??
      this.calculations[0]
    );
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

  /*Расчёт параметров орбиты*/
  calculate(
    name: string,
    mass: number,
    orbitCode: string,
  ): OrbitCalculation {
    const orbitParameters = {
      LEO: {
        orbitType: 'Низкая околоземная',
        height: 400,
      },
      GEO: {
        orbitType: 'Геостационарная',
        height: 35786,
      },
      SSO: {
        orbitType: 'Солнечно-синхронная',
        height: 600,
      },
    };

    const selectedOrbit =
      orbitParameters[orbitCode as keyof typeof orbitParameters] ??
      orbitParameters.LEO;

    const earthRadius = 6371;
    const gravitationalParameter = 398600;

    const radius = earthRadius + selectedOrbit.height;

    // Скорость круговой орбиты, км/с
    const velocity = Math.sqrt(gravitationalParameter / radius);

    // Период обращения, секунды
    const periodSeconds =
      2 * Math.PI * Math.sqrt(Math.pow(radius, 3) / gravitationalParameter);

    // Переводим в минуты
    const period = periodSeconds / 60;

    const calculation: OrbitCalculation = {
      id: Date.now(),
      name,
      mass,
      orbitType: selectedOrbit.orbitType,
      orbitCode,
      height: selectedOrbit.height,
      velocity: Number(velocity.toFixed(2)),
      period: Number(period.toFixed(1)),
      image: '/images/sfera.png',
      video: '/videos/sfera.mp4',
      likes: 0,
      status: 'Черновик',
    };

    this.calculations.push(calculation);

    return calculation;
  }
}

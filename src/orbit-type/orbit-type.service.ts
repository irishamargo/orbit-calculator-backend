import { Injectable } from '@nestjs/common';

export type OrbitTypeStatus = 'Опубликован' | 'Черновик' | 'Удален';

export interface OrbitType {
  id: number;
  orbitType: string;
  orbitCode: string;
  height: number;
  inclination: number;
  description: string;
  image: string;
  video: string;
  likedBy: number[];
  status: OrbitTypeStatus;
}

export interface OrbitTypeView extends OrbitType {
  likeCount: number;
  isLiked: boolean;
  isDraft: boolean;
  descriptionStart: string;
  descriptionContinuation: string;
}

export const CURRENT_ORBIT_TYPE_USER_ID = 1;
export const MAX_ORBIT_TYPE_HEIGHT = 40000;

@Injectable()
export class OrbitTypeService {
  private readonly orbitTypes: OrbitType[] = [
    {
      id: 1,
      orbitType: 'Низкая околоземная',
      orbitCode: 'LEO',
      height: 400,
      inclination: 51.6,
      description:
        'Орбита на высоте 400 км используется для спутников дистанционного зондирования и мониторинга Земли.',
      image: 'http://localhost:9000/orbit-media/image/astra-1.png',
      video: 'http://localhost:9000/orbit-media/videos/astra-1.mp4',
      likedBy: [2, 3, 4],
      status: 'Опубликован',
    },
    {
      id: 2,
      orbitType: 'Низкая околоземная',
      orbitCode: 'LEO',
      height: 800,
      inclination: 97.4,
      description:
        'Орбита на высоте 800 км используется для спутников дистанционного зондирования и мониторинга Земли.',
      image: 'http://localhost:9000/orbit-media/image/meteor-2.png',
      video: 'http://localhost:9000/orbit-media/videos/meteor-2.mp4',
      likedBy: [1, 2],
      status: 'Опубликован',
    },
    {
      id: 3,
      orbitType: 'Геостационарная',
      orbitCode: 'GEO',
      height: 35786,
      inclination: 0,
      description:
        'Геостационарная орбита позволяет спутнику постоянно находиться над одной областью Земли.',
      image: 'http://localhost:9000/orbit-media/image/geosat-1.png',
      video: 'http://localhost:9000/orbit-media/videos/geosat-1.mp4',
      likedBy: [2, 3, 4, 5],
      status: 'Опубликован',
    },
    {
      id: 4,
      orbitType: 'Солнечно-синхронная',
      orbitCode: 'SSO',
      height: 600,
      inclination: 98.2,
      description:
        'Солнечно-синхронная орбита позволяет спутнику проходить над заданными участками Земли примерно в одно и то же местное солнечное время.',
      image: 'http://localhost:9000/orbit-media/image/sfera.png',
      video: 'http://localhost:9000/orbit-media/videos/sfera.mp4',
      likedBy: [],
      status: 'Черновик',
    },
    {
      id: 5,
      orbitType: 'Низкая околоземная',
      orbitCode: 'LEO',
      height: 500,
      inclination: 45,
      description: 'Архивная орбита не отображается в пользовательском интерфейсе.',
      image: '',
      video: '',
      likedBy: [],
      status: 'Удален',
    },
  ];

  getPublishedOrbitTypes(): OrbitType[] {
    return this.orbitTypes.filter(
      (orbitType) => orbitType.status === 'Опубликован',
    );
  }

  getDraftOrbitType(): OrbitType {
    return (
      this.orbitTypes.find((orbitType) => orbitType.status === 'Черновик') ??
      this.orbitTypes[0]
    );
  }

  findPublishedOrbitType(id?: number): OrbitType | undefined {
    return this.getPublishedOrbitTypes().find(
      (orbitType) => orbitType.id === id,
    );
  }

  toggleOrbitTypeLike(id: number, userId: number): OrbitType | undefined {
    const orbitType = this.findPublishedOrbitType(id);

    if (!orbitType) {
      return undefined;
    }

    const userIndex = orbitType.likedBy.indexOf(userId);

    if (userIndex === -1) {
      orbitType.likedBy.push(userId);
    } else {
      orbitType.likedBy.splice(userIndex, 1);
    }

    return orbitType;
  }
}

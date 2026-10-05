# Orbit Calculator Backend

REST API для работы с типами орбит. Проект выполнен на NestJS, TypeORM, PostgreSQL и MinIO. SSR-страницы лабораторной работы 2 сохранены и работают вместе с API лабораторной работы 3.

## Методы API

| Метод | URL | Назначение |
| --- | --- | --- |
| GET | `/api/orbit-types?maxHeight=40000` | Список опубликованных типов орбит с фильтрацией по высоте |
| GET | `/api/orbit-types/feed` | Лента; параметры `id` и `next=true` позволяют получить конкретную или следующую запись |
| GET | `/api/orbit-types/draft` | Черновик текущего пользователя |
| POST | `/api/orbit-types` | Создание черновика и загрузка фото/видео |
| PUT | `/api/orbit-types/draft/publish` | Заполнение полей и публикация черновика |
| DELETE | `/api/orbit-types/:id` | Логическое удаление типа орбиты создателем |
| POST | `/api/orbit-types/:id/like` | Установка или снятие лайка, тело `{ "liked": 1 }` или `{ "liked": 0 }` |
| POST | `/api/orbit-users/register` | Регистрация пользователя |
| POST | `/api/orbit-users/authentication` | Заглушка авторизации для лабораторной работы 4 |
| POST | `/api/orbit-users/deauthentication` | Заглушка деавторизации для лабораторной работы 4 |

## Таблицы базы данных

### `orbit_users`

`orbit_user_id` — первичный ключ, `orbit_user_name`, `orbit_user_email`, `orbit_user_password`.

### `orbit_types`

`orbit_type_id` — первичный ключ, `orbit_name`, `orbit_description`, `orbit_height_km`, `orbit_inclination_deg`, `orbit_image_url`, `orbit_video_url`, `orbit_status`, `orbit_created_at`, `orbit_formed_at`, `orbit_creator_id` — внешний ключ на `orbit_users`.

### `orbit_type_likes`

`orbit_type_like_id` — первичный ключ, `orbit_user_id` — внешний ключ на `orbit_users`, `orbit_type_id` — внешний ключ на `orbit_types`. Пара пользователя и типа орбиты уникальна. Каскадное удаление не используется.

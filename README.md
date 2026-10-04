# Orbit Calculator Backend

REST API для работы с типами орбит. Проект выполнен на NestJS, TypeORM, PostgreSQL и MinIO. SSR-страницы лабораторной работы 2 сохранены и работают вместе с API лабораторной работы 3.

## Запуск

1. Запустить Docker Desktop.
2. Запустить PostgreSQL и MinIO:

```powershell
docker compose up -d
```

3. Установить зависимости и создать или обновить структуру базы данных:

```powershell
npm install
npm run migrate
```

4. Запустить сервер:

```powershell
npm run start:dev
```

По умолчанию API доступен по адресу `http://localhost:3000/api`.

Перед проверкой методов убедитесь, что в `orbit_users` существует пользователь с `orbit_user_id = 1`. Если база пустая, добавьте его вручную через Adminer:

```sql
INSERT INTO orbit_users (orbit_user_name, orbit_user_email, orbit_user_password)
VALUES ('Создатель орбит', 'creator@orbit.local', 'password123');
```

## Текущий пользователь

До добавления авторизации в лабораторной работе 4 используется singleton-функция `getCurrentOrbitTypeUserId()`. Она возвращает пользователя с идентификатором `1`. Идентификатор создателя и системные поля не передаются клиентом.

## Методы API

| Метод | URL | Назначение |
| --- | --- | --- |
| GET | `/api/orbit-types?maxHeight=40000` | Список опубликованных типов орбит с фильтрацией по высоте |
| GET | `/api/orbit-types/feed` | Первый тип орбиты в ленте |
| GET | `/api/orbit-types/feed?id=3` | Тип орбиты с указанным идентификатором |
| GET | `/api/orbit-types/feed?id=3&next=true` | Следующий опубликованный тип орбиты |
| GET | `/api/orbit-types/draft` | Черновик текущего пользователя |
| POST | `/api/orbit-types` | Создание черновика и загрузка фото/видео |
| PUT | `/api/orbit-types/draft/publish` | Заполнение полей и публикация черновика |
| DELETE | `/api/orbit-types/:id` | Логическое удаление типа орбиты создателем |
| POST | `/api/orbit-types/:id/like` | Установка или снятие лайка, тело `{ "liked": 1 }` или `{ "liked": 0 }` |
| POST | `/api/orbit-users/register` | Регистрация пользователя |
| POST | `/api/orbit-users/authenticate` | Заглушка авторизации для лабораторной работы 4 |
| POST | `/api/orbit-users/logout` | Заглушка деавторизации для лабораторной работы 4 |

### Создание черновика

Используется `multipart/form-data`:

```text
name  Text  Низкая околоземная орбита
image File  изображение
video File  короткое видео
```

Файлы сохраняются в MinIO. В базе сохраняется сгенерированное латинское имя объекта. Если файл не передан, используются `/media/default-orbit.svg` и `/media/default-orbit.webm`.

### Публикация

```json
{
  "description": "Орбита для наблюдения Земли",
  "height": 600,
  "inclination": 98.2
}
```

### Регистрация

```json
{
  "name": "Новый пользователь",
  "email": "user@example.com",
  "password": "password123"
}
```

## Таблицы базы данных

### `orbit_users`

`orbit_user_id` — первичный ключ, `orbit_user_name`, `orbit_user_email`, `orbit_user_password`.

### `orbit_types`

`orbit_type_id` — первичный ключ, `orbit_name`, `orbit_description`, `orbit_height_km`, `orbit_inclination_deg`, `orbit_image_url`, `orbit_video_url`, `orbit_status`, `orbit_created_at`, `orbit_formed_at`, `orbit_creator_id` — внешний ключ на `orbit_users`.

### `orbit_type_likes`

`orbit_type_like_id` — первичный ключ, `orbit_user_id` — внешний ключ на `orbit_users`, `orbit_type_id` — внешний ключ на `orbit_types`. Пара пользователя и типа орбиты уникальна. Каскадное удаление не используется.

-- Выполнить вручную в Adminer один раз после npm run migrate в пустой БД.
BEGIN;

INSERT INTO orbit_users (orbit_user_name, orbit_user_email)
VALUES
  ('Автор', 'author@example.test'),
  ('Наблюдатель 1', 'observer1@example.test'),
  ('Наблюдатель 2', 'observer2@example.test'),
  ('Наблюдатель 3', 'observer3@example.test'),
  ('Наблюдатель 4', 'observer4@example.test');

INSERT INTO orbit_types (
  orbit_name, orbit_kind, orbit_code, orbit_height_km,
  orbit_inclination_deg, orbit_description, orbit_status,
  orbit_image_url, orbit_video_url, orbit_formed_at, orbit_creator_id
)
SELECT
  sample.orbit_name, sample.orbit_kind, sample.orbit_code,
  sample.orbit_height_km, sample.orbit_inclination_deg,
  sample.orbit_description, sample.orbit_status,
  sample.orbit_image_url, sample.orbit_video_url,
  sample.orbit_formed_at, author.orbit_user_id
FROM orbit_users AS author
CROSS JOIN (
  VALUES
    ('МКС', 'Низкая околоземная', 'LEO', 400, 51.6,
     'Орбита на высоте 400 км используется для спутников дистанционного зондирования и мониторинга Земли.',
     'Опубликован',
     'http://localhost:9000/orbit-media/image/astra-1.png',
     'http://localhost:9000/orbit-media/videos/astra-1.mp4', CURRENT_TIMESTAMP),
    ('Метеор-2', 'Низкая околоземная', 'LEO', 800, 97.4,
     'Орбита на высоте 800 км используется для спутников дистанционного зондирования и мониторинга Земли.',
     'Опубликован',
     'http://localhost:9000/orbit-media/image/meteor-2.png',
     'http://localhost:9000/orbit-media/videos/meteor-2.mp4', CURRENT_TIMESTAMP),
    ('Геостационарный спутник', 'Геостационарная', 'GEO', 35786, 0.0,
     'Геостационарная орбита позволяет спутнику постоянно находиться над одной областью Земли.',
     'Опубликован',
     'http://localhost:9000/orbit-media/image/geosat-1.png',
     'http://localhost:9000/orbit-media/videos/geosat-1.mp4', CURRENT_TIMESTAMP),
    ('Солнечно-синхронная орбита', 'Солнечно-синхронная', 'SSO', 600, 98.2,
     'Солнечно-синхронная орбита позволяет спутнику проходить над заданными участками Земли примерно в одно и то же местное солнечное время.',
     'Черновик',
     'http://localhost:9000/orbit-media/image/sfera.png',
     'http://localhost:9000/orbit-media/videos/sfera.mp4', NULL::timestamptz)
) AS sample (
  orbit_name, orbit_kind, orbit_code, orbit_height_km,
  orbit_inclination_deg, orbit_description, orbit_status,
  orbit_image_url, orbit_video_url, orbit_formed_at
)
WHERE author.orbit_user_email = 'author@example.test';

INSERT INTO orbit_types (
  orbit_name, orbit_kind, orbit_code, orbit_height_km,
  orbit_inclination_deg, orbit_description, orbit_status,
  orbit_formed_at, orbit_creator_id
)
SELECT 'Архивная орбита', 'Низкая околоземная', 'LEO', 500,
       45.0, 'Архивная орбита не отображается в пользовательском интерфейсе.',
       'Удален', CURRENT_TIMESTAMP, author.orbit_user_id
FROM orbit_users AS author
WHERE author.orbit_user_email = 'author@example.test';

INSERT INTO orbit_type_likes (orbit_user_id, orbit_type_id)
SELECT observer.orbit_user_id, orbit.orbit_type_id
FROM (
  VALUES
    ('observer1@example.test', 'МКС'),
    ('observer2@example.test', 'МКС'),
    ('observer3@example.test', 'МКС'),
    ('author@example.test', 'Метеор-2'),
    ('observer1@example.test', 'Метеор-2'),
    ('observer1@example.test', 'Геостационарный спутник'),
    ('observer2@example.test', 'Геостационарный спутник'),
    ('observer3@example.test', 'Геостационарный спутник'),
    ('observer4@example.test', 'Геостационарный спутник')
) AS sample (orbit_user_email, orbit_name)
JOIN orbit_users AS observer
  ON observer.orbit_user_email = sample.orbit_user_email
JOIN orbit_types AS orbit
  ON orbit.orbit_name = sample.orbit_name;

COMMIT;

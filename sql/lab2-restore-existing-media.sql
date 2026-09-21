-- Выполнить вручную в Adminer только если уже были добавлены старые тестовые записи
-- из первой версии lab2-manual-data.sql. Не удаляет существующие строки.
BEGIN;

UPDATE orbit_types
SET orbit_image_url = 'http://localhost:9000/orbit-media/image/astra-1.png',
    orbit_video_url = 'http://localhost:9000/orbit-media/videos/astra-1.mp4'
WHERE orbit_name = 'МКС' AND orbit_status = 'Опубликован';

UPDATE orbit_types
SET orbit_image_url = 'http://localhost:9000/orbit-media/image/geosat-1.png',
    orbit_video_url = 'http://localhost:9000/orbit-media/videos/geosat-1.mp4'
WHERE orbit_name = 'Геостационарный спутник' AND orbit_status = 'Опубликован';

UPDATE orbit_types
SET orbit_image_url = 'http://localhost:9000/orbit-media/image/sfera.png',
    orbit_video_url = 'http://localhost:9000/orbit-media/videos/sfera.mp4'
WHERE orbit_name = 'Солнечно-синхронная орбита' AND orbit_status = 'Черновик';

INSERT INTO orbit_types (
  orbit_name, orbit_kind, orbit_code, orbit_height_km,
  orbit_inclination_deg, orbit_description, orbit_status,
  orbit_image_url, orbit_video_url, orbit_formed_at, orbit_creator_id
)
SELECT 'Метеор-2', 'Низкая околоземная', 'LEO', 800, 97.4,
       'Орбита на высоте 800 км используется для спутников дистанционного зондирования и мониторинга Земли.',
       'Опубликован',
       'http://localhost:9000/orbit-media/image/meteor-2.png',
       'http://localhost:9000/orbit-media/videos/meteor-2.mp4',
       CURRENT_TIMESTAMP, author.orbit_user_id
FROM orbit_users AS author
WHERE author.orbit_user_email = 'author@example.test'
  AND NOT EXISTS (
    SELECT 1 FROM orbit_types WHERE orbit_name = 'Метеор-2'
  );

INSERT INTO orbit_type_likes (orbit_user_id, orbit_type_id)
SELECT viewer.orbit_user_id, orbit.orbit_type_id
FROM orbit_users AS viewer
JOIN orbit_types AS orbit ON orbit.orbit_name = 'Метеор-2'
WHERE viewer.orbit_user_email IN ('author@example.test', 'observer1@example.test')
ON CONFLICT (orbit_user_id, orbit_type_id) DO NOTHING;

COMMIT;

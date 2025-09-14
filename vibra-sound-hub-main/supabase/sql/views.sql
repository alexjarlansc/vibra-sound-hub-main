-- Views recomendadas para ranking (apply in Supabase SQL editor)

-- 1) track_trending_view: soma plays, likes, downloads e calcula score
CREATE OR REPLACE VIEW public.track_trending_view AS
SELECT
  t.id,
  t.filename AS name,
  t.album_id,
  t.user_id,
  t.created_at,
  COALESCE(tp.plays_count, 0) AS plays_count,
  COALESCE(tl.likes_count, 0) AS likes_count,
  COALESCE(td.downloads_count, 0) AS downloads_count,
  -- Score weight: plays * 1 + likes * 3 + downloads * 2
  (COALESCE(tp.plays_count,0) * 1 + COALESCE(tl.likes_count,0) * 3 + COALESCE(td.downloads_count,0) * 2) AS score
FROM public.tracks t
LEFT JOIN (
  SELECT track_id, COUNT(*) AS plays_count FROM public.track_plays GROUP BY track_id
) tp ON tp.track_id = t.id
LEFT JOIN (
  SELECT track_id, COUNT(*) AS likes_count FROM public.track_likes GROUP BY track_id
) tl ON tl.track_id = t.id
LEFT JOIN (
  SELECT track_id, COUNT(*) AS downloads_count FROM public.track_downloads GROUP BY track_id
) td ON td.track_id = t.id;

-- 2) album_trending_view: agrega por álbum
CREATE OR REPLACE VIEW public.album_trending_view AS
SELECT
  a.id,
  a.name,
  a.cover_url,
  a.user_id,
  a.created_at,
  COALESCE(sum_tp.plays_count,0) AS plays_count,
  COALESCE(sum_tl.likes_count,0) AS likes_count,
  COALESCE(sum_td.downloads_count,0) AS downloads_count,
  (COALESCE(sum_tp.plays_count,0)*1 + COALESCE(sum_tl.likes_count,0)*3 + COALESCE(sum_td.downloads_count,0)*2) AS score
FROM public.albums a
LEFT JOIN (
  SELECT t.album_id, COUNT(tp.*) AS plays_count
  FROM public.track_plays tp
  JOIN public.tracks t ON t.id = tp.track_id
  WHERE t.album_id IS NOT NULL
  GROUP BY t.album_id
) sum_tp ON sum_tp.album_id = a.id
LEFT JOIN (
  SELECT t.album_id, COUNT(tl.*) AS likes_count
  FROM public.track_likes tl
  JOIN public.tracks t ON t.id = tl.track_id
  WHERE t.album_id IS NOT NULL
  GROUP BY t.album_id
) sum_tl ON sum_tl.album_id = a.id
LEFT JOIN (
  SELECT t.album_id, COUNT(td.*) AS downloads_count
  FROM public.track_downloads td
  JOIN public.tracks t ON t.id = td.track_id
  WHERE t.album_id IS NOT NULL
  GROUP BY t.album_id
) sum_td ON sum_td.album_id = a.id;

-- 3) profile_trending_view: sumariza por perfil/usuário
CREATE OR REPLACE VIEW public.profile_trending_view AS
SELECT
  p.id,
  p.username,
  p.avatar_url,
  p.created_at,
  COALESCE(user_plays.plays_count,0) AS plays_count,
  COALESCE(user_likes.likes_count,0) AS likes_count,
  COALESCE(user_downloads.downloads_count,0) AS downloads_count,
  (COALESCE(user_plays.plays_count,0)*1 + COALESCE(user_likes.likes_count,0)*3 + COALESCE(user_downloads.downloads_count,0)*2) AS score
FROM public.profiles p
LEFT JOIN (
  SELECT a.user_id, COUNT(tp.*) AS plays_count
  FROM public.track_plays tp
  JOIN public.tracks t ON t.id = tp.track_id
  JOIN public.albums a ON a.id = t.album_id
  GROUP BY a.user_id
) user_plays ON user_plays.user_id = p.id
LEFT JOIN (
  SELECT a.user_id, COUNT(al.*) AS likes_count
  FROM public.album_likes al
  JOIN public.albums a ON a.id = al.album_id
  GROUP BY a.user_id
) user_likes ON user_likes.user_id = p.id
LEFT JOIN (
  SELECT a.user_id, COUNT(ad.*) AS downloads_count
  FROM public.album_downloads ad
  JOIN public.albums a ON a.id = ad.album_id
  GROUP BY a.user_id
) user_downloads ON user_downloads.user_id = p.id;

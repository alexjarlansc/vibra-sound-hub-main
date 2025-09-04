-- Extensão necessária para gen_random_uuid
create extension if not exists pgcrypto;

-- View simplificada de trending de álbuns (recria se já existir)
drop view if exists public.album_trending_view cascade;
create view public.album_trending_view as
select a.id,
       a.created_at,
       a.name,
       a.genre,
       a.cover_url,
       a.user_id,
       coalesce(p.plays_count,0) as plays_count,
       coalesce(d.downloads_count,0) as downloads_count,
       coalesce(l.likes_count,0) as likes_count,
       -- score simples (ajuste depois): peso likes=3, downloads=2, plays=1
       (coalesce(l.likes_count,0)*3 + coalesce(d.downloads_count,0)*2 + coalesce(p.plays_count,0))::int as score
from public.albums a
left join (
  select t.album_id, count(*)::int plays_count from public.track_plays t group by t.album_id
) p on p.album_id = a.id
left join (
  select ad.album_id, count(*)::int downloads_count from public.album_downloads ad group by ad.album_id
) d on d.album_id = a.id
left join (
  select al.album_id, count(*)::int likes_count from public.album_likes al group by al.album_id
) l on l.album_id = a.id;

-- View simplificada de trending de faixas
create or replace view public.track_trending_view as
select tr.id,
       tr.created_at,
       tr.album_id,
       tr.user_id,
       tr.filename as name,
       coalesce(p.plays_count,0) as plays_count,
       coalesce(d.downloads_count,0) as downloads_count,
       coalesce(l.likes_count,0) as likes_count,
       (coalesce(l.likes_count,0)*3 + coalesce(d.downloads_count,0)*2 + coalesce(p.plays_count,0))::int as score
from public.tracks tr
left join (
  select tp.track_id, count(*)::int plays_count from public.track_plays tp group by tp.track_id
) p on p.track_id = tr.id
left join (
  select tdl.track_id, count(*)::int downloads_count from public.track_downloads tdl group by tdl.track_id
) d on d.track_id = tr.id
left join (
  select tl.track_id, count(*)::int likes_count from public.track_likes tl group by tl.track_id
) l on l.track_id = tr.id;

-- Nota: track_downloads não existe ainda; a coluna downloads_count ficará 0. Ajuste quando criar a tabela.

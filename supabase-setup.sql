-- =====================================================================
--  SETUP DO SUPABASE — rode isto no SQL Editor do seu projeto Supabase.
--  Depois preencha url + anonKey em js/config.js e pronto.
-- =====================================================================

-- 1) Tabela das mensagens do mural
create table if not exists public.mural (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  photo_url text,
  track_uri text,                       -- música do Spotify anexada ao post (spotify:track:ID)
  track_name text,                      -- nome da música (pra mostrar no topo do post)
  track_artist text,                    -- artista da faixa
  track_image text,                     -- capa do álbum
  track_duration_ms integer,            -- duração em milissegundos
  reactions jsonb not null default '{"❤️":0,"😂":0,"🚀":0}'::jsonb,
  comments jsonb not null default '[]'::jsonb,   -- comentários de outras pessoas
  created_at timestamptz not null default now()
);

-- Se a tabela já existia, garante as colunas novas:
alter table public.mural add column if not exists track_uri text;
alter table public.mural add column if not exists track_name text;
alter table public.mural add column if not exists track_artist text;
alter table public.mural add column if not exists track_image text;
alter table public.mural add column if not exists track_duration_ms integer;
alter table public.mural add column if not exists comments jsonb not null default '[]'::jsonb;

-- 2) Liga o Row Level Security
alter table public.mural enable row level security;

-- 3) Políticas: qualquer um pode LER, INSERIR e ATUALIZAR (festa aberta).
--    Em produção de verdade você restringiria mais, mas pra zoeira tá ótimo.
create policy "mural_select" on public.mural for select using (true);
create policy "mural_insert" on public.mural for insert with check (true);
create policy "mural_update" on public.mural for update using (true) with check (true);
create policy "mural_delete" on public.mural for delete using (true);

-- 4) Bucket público pras fotos
insert into storage.buckets (id, name, public)
values ('mural-fotos', 'mural-fotos', true)
on conflict (id) do nothing;

-- 5) Políticas do storage: leitura pública + upload liberado
create policy "fotos_read" on storage.objects
  for select using (bucket_id = 'mural-fotos');
create policy "fotos_upload" on storage.objects
  for insert with check (bucket_id = 'mural-fotos');

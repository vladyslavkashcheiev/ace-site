-- Схема базы данных портала ACE. Выполнить один раз в Supabase → SQL Editor → New query → Run.

create table if not exists profiles (
  discord_id text primary key,
  username text not null,
  ic_name text not null,
  passport text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists promotion_reports (
  id bigint generated always as identity primary key,
  discord_id text not null references profiles(discord_id),
  from_rank int not null,
  to_rank int not null,
  points int not null,
  breakdown jsonb not null default '{}'::jsonb,
  proof text not null,
  discord_message_id text,
  status text not null default 'pending', -- pending | approved | rejected (этап 2)
  created_at timestamptz not null default now()
);
create index if not exists promotion_reports_user_idx on promotion_reports (discord_id, created_at desc);

create table if not exists exam_requests (
  id bigint generated always as identity primary key,
  discord_id text not null references profiles(discord_id),
  exam text not null,
  preferred_time text not null,
  comment text,
  discord_message_id text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists exam_requests_user_idx on exam_requests (discord_id, created_at desc);

-- Сайт ходит в базу только с сервера (service role), поэтому публичный доступ закрываем.
alter table profiles enable row level security;
alter table promotion_reports enable row level security;
alter table exam_requests enable row level security;

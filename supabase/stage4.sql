-- Этап 4: настройки сайта (техническое обслуживание). Выполнить один раз в Supabase → SQL Editor.

create table if not exists site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by_name text,
  updated_at timestamptz not null default now()
);
alter table site_settings enable row level security;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

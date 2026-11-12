-- Этап 2: штаб и админ-панель. Выполнить один раз в Supabase → SQL Editor → New query → Run.

alter table promotion_reports add column if not exists reviewed_by text;
alter table promotion_reports add column if not exists reviewed_by_name text;
alter table promotion_reports add column if not exists reviewed_at timestamptz;
alter table promotion_reports add column if not exists review_note text;

alter table exam_requests add column if not exists reviewed_by text;
alter table exam_requests add column if not exists reviewed_by_name text;
alter table exam_requests add column if not exists reviewed_at timestamptz;
alter table exam_requests add column if not exists review_note text;
-- статусы заявок на аттестацию: pending → accepted → passed / failed, либо rejected

create table if not exists audit_log (
  id bigint generated always as identity primary key,
  actor_id text not null,
  actor_name text not null,
  action text not null,
  target_id text,
  target_name text,
  details text,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_created_idx on audit_log (created_at desc);
alter table audit_log enable row level security;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

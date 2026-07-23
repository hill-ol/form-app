-- form-app database schema
--
-- Reverse-engineered from every `.from('...')` call in src/lib/db.ts and the
-- handful of direct supabase calls in DataSection.tsx / FinishSummary.tsx /
-- AddWorkoutSheet.tsx / CycleSettings.tsx. Matches the app's existing
-- convention (see the embedded `period_logs` snippet in CycleSettings.tsx):
-- uuid primary keys, RLS disabled, a single low-privilege role for
-- PostgREST to connect as (no per-user auth in this app).
--
-- Run this once against a fresh Postgres database (Neon, self-hosted, etc.)
-- before pointing PostgREST at it. Safe to re-run (everything is
-- `if not exists`).

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ── sleep_logs ──────────────────────────────────────────────────────────
create table if not exists sleep_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  hours numeric not null,
  mood integer not null,
  created_at timestamptz not null default now()
);

-- ── workout_sessions ────────────────────────────────────────────────────
create table if not exists workout_sessions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  day_type text not null,
  workout_type text not null,
  name text not null,
  duration_seconds integer,
  mood integer,
  sleep_hours numeric,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists workout_sessions_date_idx on workout_sessions (date desc);
create index if not exists workout_sessions_day_type_idx on workout_sessions (day_type);

-- ── exercise_logs ───────────────────────────────────────────────────────
create table if not exists exercise_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions (id) on delete cascade,
  exercise_id text not null,
  exercise_name text not null,
  muscle_group text,
  equipment text,
  exercise_type text,
  created_at timestamptz not null default now()
);
create index if not exists exercise_logs_session_id_idx on exercise_logs (session_id);
create index if not exists exercise_logs_exercise_id_idx on exercise_logs (exercise_id);
create index if not exists exercise_logs_created_at_idx on exercise_logs (created_at desc);

-- ── set_logs ────────────────────────────────────────────────────────────
create table if not exists set_logs (
  id uuid primary key default gen_random_uuid(),
  exercise_log_id uuid not null references exercise_logs (id) on delete cascade,
  set_number integer not null,
  reps integer,
  weight_lbs numeric,
  duration_seconds integer,
  distance numeric,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists set_logs_exercise_log_id_idx on set_logs (exercise_log_id);

-- ── weekly_template ─────────────────────────────────────────────────────
create table if not exists weekly_template (
  day_of_week integer primary key, -- 0=Sunday .. 6=Saturday
  day_type text not null,
  workout_type text not null,
  label text not null,
  updated_at timestamptz not null default now()
);

-- ── training_preferences (single row) ──────────────────────────────────
create table if not exists training_preferences (
  id uuid primary key default gen_random_uuid(),
  weekly_goal integer not null default 4,
  rest_duration_seconds integer not null default 90,
  rest_timer_default boolean not null default true,
  show_ai_coach boolean not null default true,
  period_start_date date,
  cycle_length_days integer,
  updated_at timestamptz not null default now()
);

-- ── daily_checkins ──────────────────────────────────────────────────────
create table if not exists daily_checkins (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  energy_level integer,
  coach_insight text,
  stress_flag boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── exercise_library ────────────────────────────────────────────────────
-- id is a text slug (e.g. "bench-press", "custom-1721676600000"), not a uuid.
create table if not exists exercise_library (
  id text primary key,
  name text not null,
  day_types text[] not null default '{}',
  muscle_groups text[] not null default '{}',
  primary_muscle text,
  equipment text[] not null default '{}',
  movement_type text,
  current_weight numeric,
  exercise_type text,
  notes text,
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── day_overrides ───────────────────────────────────────────────────────
create table if not exists day_overrides (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  day_type text not null,
  label text not null,
  is_logged boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists day_overrides_date_idx on day_overrides (date);

-- ── day_type_templates ──────────────────────────────────────────────────
create table if not exists day_type_templates (
  id uuid primary key default gen_random_uuid(),
  day_type text not null,
  exercise_id text not null,
  exercise_name text not null,
  sets integer not null,
  target_distance numeric,
  display_order integer not null default 0,
  unique (day_type, exercise_id)
);

-- ── period_logs ─────────────────────────────────────────────────────────
create table if not exists period_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  created_at timestamptz not null default now()
);

-- ── RLS: this app has no auth, so every table is fully open to the anon
--   connection role below. Matches the existing period_logs convention.
alter table sleep_logs           disable row level security;
alter table workout_sessions     disable row level security;
alter table exercise_logs        disable row level security;
alter table set_logs             disable row level security;
alter table weekly_template      disable row level security;
alter table training_preferences disable row level security;
alter table daily_checkins       disable row level security;
alter table exercise_library     disable row level security;
alter table day_overrides        disable row level security;
alter table day_type_templates   disable row level security;
alter table period_logs          disable row level security;

-- ── PostgREST connection role ───────────────────────────────────────────
-- PostgREST connects to Postgres as this role for every request (this app
-- has no per-user auth, so there's no need for the anon/authenticated JWT
-- role-switching pattern Supabase uses — one role, full access).
-- CHANGE THE PASSWORD before running this against a real database.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'web_anon') then
    create role web_anon with login password 'change-me-before-deploying';
  end if;
end
$$;

grant usage on schema public to web_anon;
grant select, insert, update, delete on all tables in schema public to web_anon;
grant usage, select on all sequences in schema public to web_anon;
alter default privileges in schema public
  grant select, insert, update, delete on tables to web_anon;

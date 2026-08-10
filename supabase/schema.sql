create extension if not exists pgcrypto;

create type public.user_role as enum ('client','admin');
create type public.account_status as enum ('active','suspended');
create type public.project_status as enum ('draft','submitted','received','to_review','waiting_for_information','under_analysis','appointment_required','appointment_confirmed','proposal_in_progress','proposal_available','changes_requested','approved','completed','archived');
create type public.appointment_status as enum ('proposed','to_confirm','confirmed','refused','rescheduled','completed','cancelled');
create type public.meeting_type as enum ('onsite','video','office');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'client',
  first_name text not null default '', last_name text not null default '', phone text, avatar_url text,
  account_status public.account_status not null default 'active', terms_accepted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.services (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, short_description text,
  description text, price_information text, active boolean not null default true, display_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.projects (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, status public.project_status not null default 'draft', service_id uuid references public.services(id) on delete set null,
  service_type text, property_type text, room_type text, city text, address text, surface numeric check(surface is null or surface >= 0),
  surface_unit text not null default 'm²', description text, budget_range text, desired_date date, urgency text,
  current_step int not null default 1 check(current_step between 1 and 10), is_submitted boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), submitted_at timestamptz, archived_at timestamptz
);
create index projects_user_idx on public.projects(user_id);
create index projects_status_idx on public.projects(status);
create index projects_updated_idx on public.projects(updated_at desc);

create table public.project_answers (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  section text not null, question_key text not null, answer_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(project_id, section, question_key)
);
create index project_answers_project_idx on public.project_answers(project_id);

create table public.project_measurements (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  label text not null, value numeric not null check(value >= 0), unit text not null default 'cm', category text not null, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index project_measurements_project_idx on public.project_measurements(project_id);

create table public.project_files (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, file_type text not null,
  storage_bucket text not null, storage_path text not null unique, original_name text not null, safe_name text not null,
  mime_type text not null, size bigint not null check(size >= 0), caption text, category text, upload_status text not null default 'ready',
  created_at timestamptz not null default now()
);
create index project_files_project_idx on public.project_files(project_id);
create index project_files_user_idx on public.project_files(user_id);

create table public.appointments (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, first_choice timestamptz not null, second_choice timestamptz,
  confirmed_at timestamptz, meeting_type public.meeting_type not null, status public.appointment_status not null default 'proposed',
  client_comment text, admin_comment text, meeting_url text, location text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index appointments_project_idx on public.appointments(project_id);
create index appointments_user_idx on public.appointments(user_id);

create table public.project_messages (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade, message text not null, is_internal boolean not null default false,
  attachment_file_id uuid references public.project_files(id) on delete set null, read_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index project_messages_project_idx on public.project_messages(project_id, created_at);

create table public.admin_notes (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  admin_id uuid not null references public.profiles(id) on delete cascade, content text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index admin_notes_project_idx on public.admin_notes(project_id);

create table public.project_status_history (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  previous_status public.project_status, new_status public.project_status not null, changed_by uuid not null references public.profiles(id),
  public_message text, created_at timestamptz not null default now()
);
create index status_history_project_idx on public.project_status_history(project_id, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade, type text, title text not null, message text not null, action_url text,
  read_at timestamptz, created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);

create table public.contact_requests (
  id uuid primary key default gen_random_uuid(), first_name text not null, last_name text not null, email text not null,
  phone text, subject text, message text not null, status text not null default 'new', created_at timestamptz not null default now()
);

create table public.app_settings (
  id uuid primary key default gen_random_uuid(), setting_key text not null unique, setting_value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false, updated_by uuid references public.profiles(id), updated_at timestamptz not null default now()
);

create table public.ai_inspirations (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  source_file_id uuid not null references public.project_files(id) on delete cascade, created_by uuid not null references public.profiles(id),
  provider text, model text, prompt_private text, output_storage_path text, status text not null default 'internal_draft',
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index ai_inspirations_project_idx on public.ai_inspirations(project_id);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['profiles','services','projects','project_answers','project_measurements','appointments','project_messages','admin_notes'] loop execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()',t,t); end loop; end $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id, role, first_name, last_name, phone, terms_accepted_at)
  values(new.id, 'client', coalesce(new.raw_user_meta_data->>'first_name',''), coalesce(new.raw_user_meta_data->>'last_name',''), new.raw_user_meta_data->>'phone', now());
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

insert into public.services(name,slug,display_order) values
('Conseil décoration','conseil-decoration',10),('Coaching déco','coaching-deco',20),('Aménagement d’une pièce','amenagement-piece',30),('Optimisation d’espace','optimisation-espace',40),('Conseil couleurs et matières','couleurs-matieres',50),('Rénovation légère','renovation-legere',60),('Projet complet','projet-complet',70),('Décoration à distance','decoration-distance',80)
on conflict (slug) do nothing;

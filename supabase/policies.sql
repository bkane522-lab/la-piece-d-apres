-- Référence finale RLS — La Pièce d’Après
-- Idempotent : peut être rejoué après création du schéma.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and account_status = 'active'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.projects enable row level security;
alter table public.project_answers enable row level security;
alter table public.project_measurements enable row level security;
alter table public.project_files enable row level security;
alter table public.appointments enable row level security;
alter table public.project_messages enable row level security;
alter table public.admin_notes enable row level security;
alter table public.project_status_history enable row level security;
alter table public.notifications enable row level security;
alter table public.contact_requests enable row level security;
alter table public.app_settings enable row level security;
alter table public.ai_inspirations enable row level security;

do $$ declare r record; begin
  for r in select schemaname, tablename, policyname from pg_policies
    where schemaname='public' and tablename in ('profiles','services','projects','project_answers','project_measurements','project_files','appointments','project_messages','admin_notes','project_status_history','notifications','contact_requests','app_settings','ai_inspirations')
  loop execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename); end loop;
end $$;

create policy profiles_select_own_or_admin on public.profiles for select to authenticated
using (id=(select auth.uid()) or (select public.is_admin()));
create policy profiles_update_own_or_admin on public.profiles for update to authenticated
using (id=(select auth.uid()) or (select public.is_admin()))
with check (id=(select auth.uid()) or (select public.is_admin()));

create policy services_select_active_public on public.services for select to anon,authenticated
using (active=true or (select public.is_admin()));
create policy services_insert_admin on public.services for insert to authenticated with check ((select public.is_admin()));
create policy services_update_admin on public.services for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy services_delete_admin on public.services for delete to authenticated using ((select public.is_admin()));

create policy projects_select_own_or_admin on public.projects for select to authenticated
using (user_id=(select auth.uid()) or (select public.is_admin()));
create policy projects_insert_own on public.projects for insert to authenticated
with check (user_id=(select auth.uid()));
create policy projects_update_own_or_admin on public.projects for update to authenticated
using (user_id=(select auth.uid()) or (select public.is_admin()))
with check (user_id=(select auth.uid()) or (select public.is_admin()));
create policy projects_delete_draft_own_or_admin on public.projects for delete to authenticated
using ((user_id=(select auth.uid()) and status='draft') or (select public.is_admin()));

create policy project_answers_select_own_or_admin on public.project_answers for select to authenticated using (
  exists(select 1 from public.projects p where p.id=project_answers.project_id and (p.user_id=(select auth.uid()) or (select public.is_admin())))
);
create policy project_answers_insert_own_or_admin on public.project_answers for insert to authenticated with check (
  exists(select 1 from public.projects p where p.id=project_answers.project_id and (p.user_id=(select auth.uid()) or (select public.is_admin())))
);
create policy project_answers_update_own_or_admin on public.project_answers for update to authenticated using (
  exists(select 1 from public.projects p where p.id=project_answers.project_id and (p.user_id=(select auth.uid()) or (select public.is_admin())))
) with check (
  exists(select 1 from public.projects p where p.id=project_answers.project_id and (p.user_id=(select auth.uid()) or (select public.is_admin())))
);
create policy project_answers_delete_own_or_admin on public.project_answers for delete to authenticated using (
  exists(select 1 from public.projects p where p.id=project_answers.project_id and (p.user_id=(select auth.uid()) or (select public.is_admin())))
);

create policy project_measurements_select_own_or_admin on public.project_measurements for select to authenticated using (
  exists(select 1 from public.projects p where p.id=project_measurements.project_id and (p.user_id=(select auth.uid()) or (select public.is_admin())))
);
create policy project_measurements_insert_own_or_admin on public.project_measurements for insert to authenticated with check (
  exists(select 1 from public.projects p where p.id=project_measurements.project_id and (p.user_id=(select auth.uid()) or (select public.is_admin())))
);
create policy project_measurements_update_own_or_admin on public.project_measurements for update to authenticated using (
  exists(select 1 from public.projects p where p.id=project_measurements.project_id and (p.user_id=(select auth.uid()) or (select public.is_admin())))
) with check (
  exists(select 1 from public.projects p where p.id=project_measurements.project_id and (p.user_id=(select auth.uid()) or (select public.is_admin())))
);
create policy project_measurements_delete_own_or_admin on public.project_measurements for delete to authenticated using (
  exists(select 1 from public.projects p where p.id=project_measurements.project_id and (p.user_id=(select auth.uid()) or (select public.is_admin())))
);

create policy project_files_select_own_or_admin on public.project_files for select to authenticated
using (user_id=(select auth.uid()) or (select public.is_admin()));
create policy project_files_insert_own_or_admin on public.project_files for insert to authenticated with check (
  (user_id=(select auth.uid()) and exists(select 1 from public.projects p where p.id=project_files.project_id and p.user_id=(select auth.uid()))) or (select public.is_admin())
);
create policy project_files_update_own_or_admin on public.project_files for update to authenticated
using (user_id=(select auth.uid()) or (select public.is_admin())) with check (user_id=(select auth.uid()) or (select public.is_admin()));
create policy project_files_delete_own_or_admin on public.project_files for delete to authenticated
using (user_id=(select auth.uid()) or (select public.is_admin()));

create policy appointments_select_own_or_admin on public.appointments for select to authenticated
using (user_id=(select auth.uid()) or (select public.is_admin()));
create policy appointments_insert_own_or_admin on public.appointments for insert to authenticated with check (
  (user_id=(select auth.uid()) and exists(select 1 from public.projects p where p.id=appointments.project_id and p.user_id=(select auth.uid()))) or (select public.is_admin())
);
create policy appointments_update_own_or_admin on public.appointments for update to authenticated
using (user_id=(select auth.uid()) or (select public.is_admin())) with check (user_id=(select auth.uid()) or (select public.is_admin()));
create policy appointments_delete_admin on public.appointments for delete to authenticated using ((select public.is_admin()));

create policy project_messages_select_own_or_admin on public.project_messages for select to authenticated using (
  (is_internal=false and exists(select 1 from public.projects p where p.id=project_messages.project_id and p.user_id=(select auth.uid()))) or (select public.is_admin())
);
create policy project_messages_insert_own_or_admin on public.project_messages for insert to authenticated with check (
  (sender_id=(select auth.uid()) and is_internal=false and exists(select 1 from public.projects p where p.id=project_messages.project_id and p.user_id=(select auth.uid()))) or (select public.is_admin())
);
create policy project_messages_update_admin on public.project_messages for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy project_messages_delete_admin on public.project_messages for delete to authenticated using ((select public.is_admin()));

create policy admin_notes_admin_only on public.admin_notes for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy status_history_select_own_or_admin on public.project_status_history for select to authenticated using (
  exists(select 1 from public.projects p where p.id=project_status_history.project_id and (p.user_id=(select auth.uid()) or (select public.is_admin())))
);
create policy status_history_insert_admin on public.project_status_history for insert to authenticated with check ((select public.is_admin()));
create policy status_history_update_admin on public.project_status_history for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy status_history_delete_admin on public.project_status_history for delete to authenticated using ((select public.is_admin()));

create policy notifications_select_own_or_admin on public.notifications for select to authenticated
using (user_id=(select auth.uid()) or (select public.is_admin()));
create policy notifications_update_own_or_admin on public.notifications for update to authenticated
using (user_id=(select auth.uid()) or (select public.is_admin())) with check (user_id=(select auth.uid()) or (select public.is_admin()));
create policy notifications_insert_admin on public.notifications for insert to authenticated with check ((select public.is_admin()));

create policy contact_requests_insert_public on public.contact_requests for insert to anon,authenticated with check (true);
create policy contact_requests_admin_select on public.contact_requests for select to authenticated using ((select public.is_admin()));
create policy contact_requests_admin_update on public.contact_requests for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy contact_requests_admin_delete on public.contact_requests for delete to authenticated using ((select public.is_admin()));

create policy app_settings_select_public_or_admin on public.app_settings for select to anon,authenticated
using (is_public=true or (select public.is_admin()));
create policy app_settings_admin_all on public.app_settings for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy ai_inspirations_admin_only on public.ai_inspirations for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

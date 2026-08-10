create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;

create or replace function public.protect_profile_privileges()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if current_user <> 'postgres' and coalesce(auth.role(),'') <> 'service_role' and not public.is_admin() then
    if new.role is distinct from old.role then raise exception 'Vous ne pouvez pas modifier votre rôle.'; end if;
    if new.account_status is distinct from old.account_status then raise exception 'Vous ne pouvez pas modifier le statut du compte.'; end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_privileges_trigger on public.profiles;
create trigger protect_profile_privileges_trigger before update on public.profiles
for each row execute function public.protect_profile_privileges();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,role,first_name,last_name,phone,terms_accepted_at)
  values(new.id,'client',coalesce(new.raw_user_meta_data->>'first_name',''),coalesce(new.raw_user_meta_data->>'last_name',''),new.raw_user_meta_data->>'phone',now())
  on conflict(id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.admin_set_project_status(p_project_id uuid,p_new_status public.project_status,p_public_message text default null)
returns void language plpgsql security definer set search_path=public as $$
declare old_status public.project_status;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select status into old_status from public.projects where id=p_project_id for update;
  if old_status is null then raise exception 'project_not_found'; end if;
  update public.projects set status=p_new_status,is_submitted=(p_new_status<>'draft') where id=p_project_id;
  insert into public.project_status_history(project_id,previous_status,new_status,changed_by,public_message)
  values(p_project_id,old_status,p_new_status,auth.uid(),p_public_message);
end $$;

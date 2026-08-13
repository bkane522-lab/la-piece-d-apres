-- Buckets privés + policies basées sur le premier dossier du chemin : <user_id>/<project_id>/fichier
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('project-images','project-images',false,10485760,array['image/jpeg','image/png','image/webp']),
('project-documents','project-documents',false,20971520,array['application/pdf','image/jpeg','image/png','image/webp']),
('avatars','avatars',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false;

do $$ declare r record; begin
  for r in select policyname from pg_policies where schemaname='storage' and tablename='objects' and policyname like 'lpda_%'
  loop execute format('drop policy if exists %I on storage.objects',r.policyname); end loop;
end $$;

create policy lpda_storage_select on storage.objects for select to authenticated using (
  bucket_id in ('project-images','project-documents','avatars')
  and ((storage.foldername(name))[1]=(select auth.uid())::text or (select public.is_admin()))
);
create policy lpda_storage_insert on storage.objects for insert to authenticated with check (
  bucket_id in ('project-images','project-documents','avatars')
  and ((storage.foldername(name))[1]=(select auth.uid())::text or (select public.is_admin()))
);
create policy lpda_storage_update on storage.objects for update to authenticated using (
  bucket_id in ('project-images','project-documents','avatars')
  and ((storage.foldername(name))[1]=(select auth.uid())::text or (select public.is_admin()))
) with check (
  bucket_id in ('project-images','project-documents','avatars')
  and ((storage.foldername(name))[1]=(select auth.uid())::text or (select public.is_admin()))
);
create policy lpda_storage_delete on storage.objects for delete to authenticated using (
  bucket_id in ('project-images','project-documents','avatars')
  and ((storage.foldername(name))[1]=(select auth.uid())::text or (select public.is_admin()))
);

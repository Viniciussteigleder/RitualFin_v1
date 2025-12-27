# Supabase setup (manual SQL)

## Schema bootstrap
Run these in the Supabase SQL editor in order:

1) supabase/migrations/000_init.sql
2) supabase/migrations/001_review_flags.sql

If PostgREST cache is stale, run:

```
notify pgrst, 'reload schema';
```

## Storage bucket
If the uploads bucket does not exist, create it:

```
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;
```

## Test user (email/password)
This block creates or resets a test user without touching generated columns:

```
create extension if not exists pgcrypto;

do $$
declare
  v_user_id uuid;
  v_email text := 'testv1@gmail.com';
  v_password text := 'testv1++';
  v_now timestamptz := now();
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_sso_user
    ) values (
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      v_now,
      v_now,
      v_now,
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      '{}'::jsonb,
      false
    );
  else
    update auth.users
      set encrypted_password = crypt(v_password, gen_salt('bf')),
          email_confirmed_at = v_now,
          updated_at = v_now
      where id = v_user_id;
  end if;

  if not exists (
    select 1 from auth.identities where provider = 'email' and provider_id = v_user_id::text
  ) then
    insert into auth.identities (
      id,
      user_id,
      provider,
      provider_id,
      identity_data,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      v_user_id,
      'email',
      v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      v_now,
      v_now,
      v_now
    );
  end if;
end $$;
```

## Cleanup test user

```
delete from auth.users where email = 'testv1@gmail.com';
```

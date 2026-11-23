-- CarCat landing CMS. Public can read; only accounts listed in public.admins can write.
-- Run once in the Supabase SQL editor (or via the Supabase connector).

create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create table if not exists public.news (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  date date not null,
  image text not null,
  fit text not null default 'cover' check (fit in ('cover', 'contain')),
  alt text not null default '',
  published boolean not null default false,
  sort int not null default 0,
  en jsonb not null,  -- { title, lead, body: string[] }
  az jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.team (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  photo text not null,
  role jsonb not null,  -- { en, az }
  linkedin text not null default '',
  visible boolean not null default true,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.orgs (
  id text primary key default gen_random_uuid()::text,
  kind text not null check (kind in ('sponsor', 'partner')),
  name text not null,
  logo text not null,
  url text not null default '',
  scale numeric,
  tall boolean not null default false,
  visible boolean not null default true,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.centers (
  id text primary key,
  name text not null,
  logo text not null,
  category jsonb not null,               -- { en, az }
  soon boolean not null default false,
  locations jsonb not null default '[]', -- [{ district: {en, az}, x, y, mapsQuery }]
  visible boolean not null default true,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

-- Text overrides keyed by the English source string; hidden sections stored as settings.
create table if not exists public.texts (
  key text primary key,
  en text,
  az text,
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row level security: read for everyone, write for admins only.
do $$
declare t text;
begin
  foreach t in array array['news', 'team', 'orgs', 'centers', 'texts', 'settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%1$s read" on public.%1$I', t);
    execute format('drop policy if exists "%1$s write" on public.%1$I', t);
    execute format('create policy "%1$s read" on public.%1$I for select using (true)', t);
    execute format('create policy "%1$s write" on public.%1$I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Unpublished news must not leak through the public API.
drop policy if exists "news read" on public.news;
create policy "news read" on public.news for select using (published or public.is_admin());

alter table public.admins enable row level security;
drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select using (user_id = auth.uid());

-- Images: public bucket, admin-only uploads.
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
drop policy if exists "media admin write" on storage.objects;
create policy "media admin write" on storage.objects for all
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

-- Admin allowlist: accounts with these emails become admins on creation.
create table if not exists public.admin_emails (email text primary key);
alter table public.admin_emails enable row level security;
insert into public.admin_emails (email) values ('askerova986@gmail.com'), ('mirzayev.ne@gmail.com') on conflict do nothing;

create or replace function public.grant_admin_on_signup() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.admin_emails where lower(email) = lower(new.email)) then
    insert into public.admins (user_id, email) values (new.id, new.email) on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created_admin on auth.users;
create trigger on_auth_user_created_admin after insert on auth.users
  for each row execute function public.grant_admin_on_signup();
revoke execute on function public.grant_admin_on_signup() from public, anon, authenticated;

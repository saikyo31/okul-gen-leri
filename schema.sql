-- OKUL GENÇLERİ production schema
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slogan text not null default '',
  photo_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  student_no text not null unique,
  created_at timestamptz not null default now()
);
create table if not exists public.hourly_codes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  hour_bucket timestamptz not null,
  code_hash text not null unique,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  unique(student_id, hour_bucket)
);
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id),
  hour_bucket timestamptz not null,
  created_at timestamptz not null default now(),
  unique(student_id, hour_bucket)
);
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  published boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from public.candidates) then
    insert into public.candidates(name,slogan,sort_order) values
      ('Aday 1','Sloganını ve vaatlerini yönetim panelinden düzenle.',1),
      ('Aday 2','Sloganını ve vaatlerini yönetim panelinden düzenle.',2),
      ('Aday 3','Sloganını ve vaatlerini yönetim panelinden düzenle.',3),
      ('Aday 4','Sloganını ve vaatlerini yönetim panelinden düzenle.',4);
  end if;
end $$;

-- Browser clients cannot read or change election records directly.
alter table public.admin_users enable row level security;
alter table public.candidates enable row level security;
alter table public.students enable row level security;
alter table public.hourly_codes enable row level security;
alter table public.votes enable row level security;
alter table public.announcements enable row level security;
revoke all on public.admin_users,public.candidates,public.students,public.hourly_codes,public.votes,public.announcements from anon, authenticated;
grant all on public.admin_users,public.candidates,public.students,public.hourly_codes,public.votes,public.announcements to service_role;

create or replace function public.cast_student_vote(p_code_hash text,p_candidate_id uuid,p_hour_bucket timestamptz)
returns void language plpgsql security definer set search_path=public as $$
declare v_student_id uuid;
begin
  if p_hour_bucket <> date_trunc('hour', now() at time zone 'utc') at time zone 'utc' then
    raise exception 'CODE_INVALID';
  end if;
  if not exists(select 1 from public.candidates where id=p_candidate_id and active=true) then
    raise exception 'CANDIDATE_INVALID';
  end if;
  update public.hourly_codes
    set used_at=now()
    where code_hash=p_code_hash and hour_bucket=p_hour_bucket and used_at is null
    returning student_id into v_student_id;
  if v_student_id is null then
    raise exception 'CODE_INVALID';
  end if;
  insert into public.votes(student_id,candidate_id,hour_bucket)
    values(v_student_id,p_candidate_id,p_hour_bucket);
exception when unique_violation then
  raise exception 'ALREADY_VOTED';
end;
$$;
revoke all on function public.cast_student_vote(text,uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.cast_student_vote(text,uuid,timestamptz) to service_role;

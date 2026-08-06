create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create policy "Users can read their own roles"
on public.user_roles for select to authenticated
using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

drop policy if exists "Signed-in users can add influencers" on public.influencers;
drop policy if exists "Contributors can edit their own entries" on public.influencers;
drop policy if exists "Contributors can delete their own entries" on public.influencers;

create policy "Admins can add influencers"
on public.influencers for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can edit influencers"
on public.influencers for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete influencers"
on public.influencers for delete to authenticated
using (public.has_role(auth.uid(), 'admin'));

insert into public.user_roles (user_id, role)
values ('be2bd8fe-b0a5-4ff1-baff-e5956c97737f', 'admin')
on conflict do nothing;
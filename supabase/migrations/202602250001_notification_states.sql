-- Persist notification read/dismiss states per user.
create table if not exists public.user_notification_states (
  user_id uuid not null references public.profiles(id) on delete cascade,
  notification_id text not null,
  is_read boolean not null default false,
  is_dismissed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, notification_id)
);

create index if not exists idx_user_notification_states_user_updated
  on public.user_notification_states (user_id, updated_at desc);

alter table public.user_notification_states enable row level security;

drop policy if exists "notification_states_select_own" on public.user_notification_states;
create policy "notification_states_select_own"
  on public.user_notification_states
  for select
  using (auth.uid() = user_id);

drop policy if exists "notification_states_insert_own" on public.user_notification_states;
create policy "notification_states_insert_own"
  on public.user_notification_states
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "notification_states_update_own" on public.user_notification_states;
create policy "notification_states_update_own"
  on public.user_notification_states
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notification_states_delete_own" on public.user_notification_states;
create policy "notification_states_delete_own"
  on public.user_notification_states
  for delete
  using (auth.uid() = user_id);

create or replace function public.touch_user_notification_states_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_touch_user_notification_states_updated_at on public.user_notification_states;
create trigger trg_touch_user_notification_states_updated_at
before update on public.user_notification_states
for each row
execute function public.touch_user_notification_states_updated_at();

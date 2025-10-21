-- Migration: Create interview_panelists table for interview panel members
create table if not exists interview_panelists (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid references interview_schedules(id) on delete cascade not null,
  name text not null,
  email text,
  role text,
  organization text,
  phone text,
  photo_url text,
  linkedin_url text,
  notes text,
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

-- Auto-update updated_at on row change
create or replace function update_panelist_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_panelist_updated_at on interview_panelists;
create trigger set_panelist_updated_at
before update on interview_panelists
for each row
execute procedure update_panelist_updated_at();

/* -- Enable RLS
alter table interview_panelists enable row level security;

-- Policy: Allow all authenticated users to select (read)
create policy "Allow read for authenticated users" on interview_panelists
  for select using (auth.role() = 'authenticated');

-- Policy: Allow only admins to insert
create policy "Allow insert for admins only" on interview_panelists
  for insert using (auth.role() = 'admin');

-- Policy: Allow only admins to update
create policy "Allow update for admins only" on interview_panelists
  for update using (auth.role() = 'admin');

-- Policy: Allow only admins to delete
create policy "Allow delete for admins only" on interview_panelists
  for delete using (auth.role() = 'admin');

-- To allow interview owners to manage their panelists, add a policy like:
-- create policy "Interview owner can manage panelists" on interview_panelists ... 
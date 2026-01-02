-- Realtime community chat schema
create extension if not exists "pgcrypto";

create table if not exists profiles (
  email text primary key,
  role text not null default 'member' check (role in ('member', 'admin')),
  last_seen_at timestamptz
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  label text check (label in ('team-match', 'mentor-mesh', 'lab-hub', 'admin')),
  invite_code text not null unique,
  created_by text not null references profiles(email) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists room_members (
  room_id uuid not null references rooms(id) on delete cascade,
  user_email text not null references profiles(email) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_email)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  user_email text not null references profiles(email) on delete set null,
  message_type text not null check (message_type in ('text', 'file')),
  content text,
  file_url text,
  file_name text,
  file_type text,
  file_size integer,
  storage_path text,
  created_at timestamptz not null default now()
);

create index if not exists messages_room_created_idx on messages (room_id, created_at);
create index if not exists room_members_user_idx on room_members (user_email);

-- Storage bucket for attachments
insert into storage.buckets (id, name, public)
values ('chat-uploads', 'chat-uploads', true)
on conflict (id) do nothing;

-- Open policies (replace with stricter RLS before production)
alter table profiles enable row level security;
alter table rooms enable row level security;
alter table room_members enable row level security;
alter table messages enable row level security;

drop policy if exists "Public read/write profiles" on profiles;
create policy "Public read/write profiles" on profiles
  for all using (true) with check (true);

drop policy if exists "Public read/write rooms" on rooms;
create policy "Public read/write rooms" on rooms
  for all using (true) with check (true);

drop policy if exists "Public read/write room_members" on room_members;
create policy "Public read/write room_members" on room_members
  for all using (true) with check (true);

drop policy if exists "Public read/write messages" on messages;
create policy "Public read/write messages" on messages
  for all using (true) with check (true);


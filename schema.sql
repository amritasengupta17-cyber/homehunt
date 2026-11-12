create extension if not exists pgcrypto;
create table if not exists users(id uuid primary key default gen_random_uuid(), token text unique not null, created_at timestamptz default now());
create table if not exists shortlists(
  id uuid primary key default gen_random_uuid(), user_id uuid not null references users(id) on delete cascade,
  name text not null, city text, budget text, requirements text,
  share_id text unique not null default encode(gen_random_bytes(8),'hex'), created_at timestamptz default now());
create table if not exists listings(
  id uuid primary key default gen_random_uuid(), shortlist_id uuid not null references shortlists(id) on delete cascade,
  address text, price text, beds text, baths text, area text, source_url text, photo_url text,
  pros text default '', cons text default '', score int default 0, status text default 'New', notes text default '',
  position int default 0, created_at timestamptz default now());
create table if not exists feedback(
  id uuid primary key default gen_random_uuid(), listing_id uuid not null references listings(id) on delete cascade,
  name text, vote int default 0, comment text, created_at timestamptz default now());
create index if not exists i_sl_user on shortlists(user_id);
create index if not exists i_l_sl on listings(shortlist_id, position);
create index if not exists i_f_l on feedback(listing_id);

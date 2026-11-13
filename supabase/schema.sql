-- ============================================================
-- খাLaS — Supabase schema
-- Run this once in Supabase Studio → SQL Editor → New query.
-- Safe to re-run (idempotent).
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Carts / roadside food spots
-- ------------------------------------------------------------
create table if not exists public.carts (
  id              text primary key,
  name            text not null,
  description     text not null default '',
  type            text not null default 'Food Cart',
  cuisines        text[] not null default '{}',
  lat             double precision not null,
  lng             double precision not null,
  address         text not null default '',
  phone           text not null default '',
  price           text not null default '৳',
  photos          text[] not null default '{}',
  status          text not null default 'open' check (status in ('open', 'closed')),
  rating          numeric(3,1) not null default 0,           -- legacy 0–10 map score
  review_count    integer not null default 0,
  hygiene_rating  numeric(2,1),                              -- 0–5 average
  delivery        text not null default 'none',
  has_booking     boolean not null default false,
  vendor_email    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists carts_status_idx on public.carts (status);
create index if not exists carts_vendor_idx on public.carts (vendor_email);

-- ------------------------------------------------------------
-- Reviews (1–5 stars + hygiene)
-- ------------------------------------------------------------
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  cart_id       text not null references public.carts(id) on delete cascade,
  author_email  text,
  author_name   text not null default 'Anonymous Foodie',
  overall       smallint not null check (overall between 1 and 5),
  hygiene       smallint not null check (hygiene between 1 and 5),
  comment       text not null default '',
  created_at    timestamptz not null default now()
);

create index if not exists reviews_cart_created_idx
  on public.reviews (cart_id, created_at desc);

-- Keep updated_at fresh on every edit / status toggle.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists carts_touch_updated_at on public.carts;
create trigger carts_touch_updated_at
  before update on public.carts
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.carts enable row level security;
alter table public.reviews enable row level security;

-- Public read for the map + review feed.
drop policy if exists "carts_public_read" on public.carts;
create policy "carts_public_read"
  on public.carts for select
  using (true);

-- Demo-friendly writes. This app currently uses lightweight email
-- accounts (localStorage), not Supabase Auth, so anonymous writes are
-- allowed for the free-tier demo. See the production notes below
-- before launching a real marketplace.
drop policy if exists "carts_public_insert" on public.carts;
create policy "carts_public_insert"
  on public.carts for insert
  with check (true);

drop policy if exists "carts_public_update" on public.carts;
create policy "carts_public_update"
  on public.carts for update
  using (true)
  with check (true);

drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read"
  on public.reviews for select
  using (true);

drop policy if exists "reviews_public_insert" on public.reviews;
create policy "reviews_public_insert"
  on public.reviews for insert
  with check (
    overall between 1 and 5 and
    hygiene between 1 and 5 and
    char_length(comment) <= 1000
  );

-- ------------------------------------------------------------
-- Realtime (live Open / Closed updates)
-- ------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.carts;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

-- ============================================================
-- PRODUCTION HARDENING (recommended before public launch)
-- ------------------------------------------------------------
-- 1. Enable Supabase Auth (magic links / OTP) instead of the local
--    email demo accounts.
-- 2. Replace the write policies above with ownership checks, e.g.:
--
--    create policy "vendor_updates_own_cart"
--      on public.carts for update
--      using (vendor_email = auth.jwt() ->> 'email')
--      with check (vendor_email = auth.jwt() ->> 'email');
--
--    create policy "authenticated_reviews"
--      on public.reviews for insert
--      to authenticated
--      with check (author_email = auth.jwt() ->> 'email');
--
-- 3. Add a rate-limit / moderation function or Edge Function for
--    cart submissions and reviews.
-- 4. Consider a `cart_photos` storage bucket for vendor uploads.
-- ============================================================

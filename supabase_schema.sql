-- ─────────────────────────────────────────
-- NESTLY — Full Schema
-- Run in Supabase SQL Editor
-- ─────────────────────────────────────────

-- Extensions
create extension if not exists "uuid-ossp";

-- ─── PROFILES ───────────────────────────
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  bio text,
  phone text,
  wallet_balance numeric(10,2) default 0,
  role text default 'user' check (role in ('user', 'vendor', 'admin')),
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── CATEGORIES ─────────────────────────
create table categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text not null unique,
  icon text,
  listing_count int default 0
);

alter table categories enable row level security;
create policy "Anyone can view categories" on categories for select using (true);
create policy "Admins can manage categories" on categories for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Seed categories
insert into categories (name, slug, icon) values
  ('Apartments', 'apartments', '🏠'),
  ('Eat & Drink', 'eat-and-drink', '🍽️'),
  ('Events', 'events', '🎉'),
  ('Services', 'services', '🛠️'),
  ('Wellness', 'wellness', '💆'),
  ('Fitness', 'fitness', '🏋️'),
  ('Cafés', 'cafes', '☕'),
  ('Arts', 'arts', '🎭');

-- ─── LISTINGS ───────────────────────────
create table listings (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  category_id uuid references categories(id),
  address text,
  city text,
  lat numeric(10,7),
  lng numeric(10,7),
  cover_image text,
  images text[] default '{}',
  tags text[] default '{}',
  is_featured boolean default false,
  open_hours jsonb,
  status text default 'active' check (status in ('active', 'inactive', 'pending')),
  price_range text,
  price_from numeric(10,2),
  avg_rating numeric(3,2) default 0,
  review_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table listings enable row level security;

create policy "Anyone can view active listings"
  on listings for select using (status = 'active');

create policy "Vendors can insert own listings"
  on listings for insert with check (auth.uid() = owner_id);

create policy "Vendors can update own listings"
  on listings for update using (auth.uid() = owner_id);

create policy "Vendors can delete own listings"
  on listings for delete using (auth.uid() = owner_id);

-- ─── REVIEWS ────────────────────────────
create table reviews (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references listings(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(listing_id, user_id)
);

alter table reviews enable row level security;

create policy "Anyone can view reviews" on reviews for select using (true);
create policy "Authenticated users can add reviews"
  on reviews for insert with check (auth.uid() = user_id);
create policy "Users can update own reviews"
  on reviews for update using (auth.uid() = user_id);
create policy "Users can delete own reviews"
  on reviews for delete using (auth.uid() = user_id);

-- Auto-update listing avg_rating
create or replace function update_listing_rating()
returns trigger as $$
begin
  update listings
  set
    avg_rating = (select avg(rating) from reviews where listing_id = coalesce(new.listing_id, old.listing_id)),
    review_count = (select count(*) from reviews where listing_id = coalesce(new.listing_id, old.listing_id))
  where id = coalesce(new.listing_id, old.listing_id);
  return new;
end;
$$ language plpgsql;

create trigger on_review_change
  after insert or update or delete on reviews
  for each row execute procedure update_listing_rating();

-- ─── BOOKMARKS ──────────────────────────
create table bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  listing_id uuid references listings(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);

alter table bookmarks enable row level security;

create policy "Users can view own bookmarks"
  on bookmarks for select using (auth.uid() = user_id);
create policy "Users can add bookmarks"
  on bookmarks for insert with check (auth.uid() = user_id);
create policy "Users can remove bookmarks"
  on bookmarks for delete using (auth.uid() = user_id);

-- ─── BOOKINGS ───────────────────────────
create table bookings (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references listings(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  owner_id uuid references profiles(id) not null,
  date date not null,
  time text,
  guests int default 1,
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  amount numeric(10,2) default 0,
  notes text,
  created_at timestamptz default now()
);

alter table bookings enable row level security;

create policy "Users can view own bookings"
  on bookings for select using (auth.uid() = user_id or auth.uid() = owner_id);
create policy "Authenticated users can create bookings"
  on bookings for insert with check (auth.uid() = user_id);
create policy "Owner or user can update booking"
  on bookings for update using (auth.uid() = owner_id or auth.uid() = user_id);

-- ─── CONVERSATIONS ───────────────────────
create table conversations (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references listings(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade not null,
  owner_id uuid references profiles(id) on delete cascade not null,
  last_message text,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(listing_id, user_id, owner_id)
);

alter table conversations enable row level security;

create policy "Participants can view conversations"
  on conversations for select using (auth.uid() = user_id or auth.uid() = owner_id);
create policy "Authenticated users can create conversations"
  on conversations for insert with check (auth.uid() = user_id);
create policy "Participants can update conversations"
  on conversations for update using (auth.uid() = user_id or auth.uid() = owner_id);

-- ─── MESSAGES ───────────────────────────
create table messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

alter table messages enable row level security;

create policy "Participants can view messages"
  on messages for select using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and (c.user_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

create policy "Participants can send messages"
  on messages for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from conversations c
      where c.id = conversation_id
      and (c.user_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

-- Enable realtime for messages
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table conversations;

-- ─── WALLET TRANSACTIONS ─────────────────
create table wallet_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  amount numeric(10,2) not null,
  type text not null check (type in ('credit', 'debit')),
  description text,
  created_at timestamptz default now()
);

alter table wallet_transactions enable row level security;

create policy "Users can view own transactions"
  on wallet_transactions for select using (auth.uid() = user_id);
create policy "System can insert transactions"
  on wallet_transactions for insert with check (auth.uid() = user_id);

-- ─── COUPONS ────────────────────────────
create table coupons (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references listings(id) on delete cascade,
  code text not null unique,
  discount numeric(5,2) not null,
  discount_type text default 'percent' check (discount_type in ('percent', 'fixed')),
  description text,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table coupons enable row level security;
create policy "Anyone can view active coupons"
  on coupons for select using (is_active = true);
create policy "Vendors can manage own coupons"
  on coupons for all using (
    exists (select 1 from listings l where l.id = listing_id and l.owner_id = auth.uid())
  );

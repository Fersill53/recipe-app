-- Run this in the Supabase SQL editor.
-- Adds tags to recipes, plus per-user favorites and personal notes/ratings.

alter table recipes add column if not exists tags text[] not null default '{}';

create table if not exists recipe_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  recipe_id uuid references recipes(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

alter table recipe_favorites enable row level security;

create policy "Users can view their own favorites"
  on recipe_favorites for select
  using (auth.uid() = user_id);

create policy "Users can add their own favorites"
  on recipe_favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their own favorites"
  on recipe_favorites for delete
  using (auth.uid() = user_id);

create table if not exists recipe_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  recipe_id uuid references recipes(id) on delete cascade not null,
  rating int check (rating between 1 and 5),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

alter table recipe_notes enable row level security;

create policy "Users can view their own recipe notes"
  on recipe_notes for select
  using (auth.uid() = user_id);

create policy "Users can add their own recipe notes"
  on recipe_notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own recipe notes"
  on recipe_notes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own recipe notes"
  on recipe_notes for delete
  using (auth.uid() = user_id);

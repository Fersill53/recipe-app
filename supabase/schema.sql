-- Run this in the Supabase SQL editor for your project.

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  ingredients text[] not null default '{}',
  instructions text not null,
  image_url text,
  servings int,
  prep_time_minutes int,
  cook_time_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table recipes enable row level security;

-- Anyone (including anonymous visitors) can read all recipes.
create policy "Recipes are viewable by everyone"
  on recipes for select
  using (true);

-- Only authenticated users can create recipes, and only as themselves.
create policy "Users can insert their own recipes"
  on recipes for insert
  with check (auth.uid() = user_id);

-- Only the owner can update or delete their recipe.
create policy "Users can update their own recipes"
  on recipes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own recipes"
  on recipes for delete
  using (auth.uid() = user_id);

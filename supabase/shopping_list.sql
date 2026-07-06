-- Run this in the Supabase SQL editor (in addition to schema.sql).

create table if not exists shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  is_checked boolean not null default false,
  created_at timestamptz not null default now()
);

alter table shopping_list_items enable row level security;

-- Each user can only see and manage their own shopping list.
create policy "Users can view their own shopping list items"
  on shopping_list_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own shopping list items"
  on shopping_list_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own shopping list items"
  on shopping_list_items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own shopping list items"
  on shopping_list_items for delete
  using (auth.uid() = user_id);

-- Run this in the Supabase SQL editor (in addition to schema.sql and shopping_list.sql).
-- Lets shopping list items be grouped into a card named after the recipe they came from.

alter table shopping_list_items add column if not exists group_name text;

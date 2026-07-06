-- Run this in the Supabase SQL editor (in addition to the earlier shopping list migrations).
-- Stores the recipe's image alongside its shopping list group so the card can show a picture.

alter table shopping_list_items add column if not exists group_image_url text;

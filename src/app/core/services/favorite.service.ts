import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private supabase = inject(SupabaseService);

  favoriteRecipeIds = signal<Set<string>>(new Set());

  async loadFavorites() {
    const { data, error } = await this.supabase.client
      .from('recipe_favorites')
      .select('recipe_id');
    if (!error) this.favoriteRecipeIds.set(new Set((data ?? []).map(f => f.recipe_id)));
  }

  isFavorite(recipeId: string): boolean {
    return this.favoriteRecipeIds().has(recipeId);
  }

  async toggleFavorite(recipeId: string): Promise<void> {
    if (this.isFavorite(recipeId)) {
      this.favoriteRecipeIds.update(ids => {
        const next = new Set(ids);
        next.delete(recipeId);
        return next;
      });
      await this.supabase.client
        .from('recipe_favorites')
        .delete()
        .eq('recipe_id', recipeId);
    } else {
      const userId = (await this.supabase.client.auth.getUser()).data.user?.id;
      this.favoriteRecipeIds.update(ids => new Set(ids).add(recipeId));
      await this.supabase.client
        .from('recipe_favorites')
        .insert({ recipe_id: recipeId, user_id: userId });
    }
  }
}

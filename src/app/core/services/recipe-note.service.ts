import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface RecipeNote {
  id?: string;
  user_id?: string;
  recipe_id: string;
  rating: number | null;
  note: string | null;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class RecipeNoteService {
  private supabase = inject(SupabaseService);

  async getNote(recipeId: string): Promise<RecipeNote | null> {
    const { data, error } = await this.supabase.client
      .from('recipe_notes')
      .select('*')
      .eq('recipe_id', recipeId)
      .maybeSingle();
    if (error) return null;
    return data;
  }

  async saveNote(recipeId: string, rating: number | null, note: string | null): Promise<RecipeNote | null> {
    const userId = (await this.supabase.client.auth.getUser()).data.user?.id;
    const { data, error } = await this.supabase.client
      .from('recipe_notes')
      .upsert(
        { recipe_id: recipeId, user_id: userId, rating, note, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,recipe_id' },
      )
      .select()
      .single();
    if (error) return null;
    return data;
  }
}

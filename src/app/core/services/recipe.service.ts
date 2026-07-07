import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Recipe {
  id?: string;
  user_id?: string;
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string;
  image_url?: string;
  servings?: number;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private supabase = inject(SupabaseService);

  recipes = signal<Recipe[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  async loadRecipes() {
    this.loading.set(true);
    this.error.set(null);
    const { data, error } = await this.supabase.client
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });
    this.loading.set(false);
    if (error) this.error.set(error.message);
    else this.recipes.set(data ?? []);
  }

  async getRecipe(id: string): Promise<Recipe | null> {
    const { data, error } = await this.supabase.client
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  }

  async createRecipe(recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>): Promise<Recipe | null> {
    const { data, error } = await this.supabase.client
      .from('recipes')
      .insert(recipe)
      .select()
      .single();
    if (error) { this.error.set(error.message); return null; }
    return data;
  }

  async updateRecipe(id: string, recipe: Partial<Recipe>): Promise<Recipe | null> {
    const { data, error } = await this.supabase.client
      .from('recipes')
      .update({ ...recipe, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) { this.error.set(error.message); return null; }
    return data;
  }

  async deleteRecipe(id: string): Promise<void> {
    await this.supabase.client
      .from('recipes')
      .delete()
      .eq('id', id);
  }

  async importFromUrl(url: string): Promise<{ recipe: Partial<Recipe> | null; error: string | null }> {
    const { data, error } = await this.supabase.client.functions.invoke('parse-recipe', {
      body: { url },
    });
    if (error) {
      const message = await this.extractFunctionError(error);
      return { recipe: null, error: message };
    }
    if (data?.error) return { recipe: null, error: data.error };
    return { recipe: data, error: null };
  }

  private async extractFunctionError(error: any): Promise<string> {
    const body = await error?.context?.json?.().catch(() => null);
    return body?.error ?? error?.message ?? 'Failed to import recipe from that URL.';
  }
}

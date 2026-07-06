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
}
